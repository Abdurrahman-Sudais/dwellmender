import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, ArrowLeft, Camera, Copy, FileUp, Loader2, PenLine, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { AIBadge, CategoryLabel, ConfidenceBar, PageHeader, PhotoTile, ScoreRing, StatusBadge } from "@/components/shared";
import { useLookups, useStore } from "@/data/store";
import { ISSUE_CATEGORIES, PRIORITIES, type IssueCategory, type MaintenanceRequest, type Photo, type Priority, type RequestSource } from "@/data/types";
import { classifyReport, extractDocument, findPossibleDuplicates, type ClassificationResult } from "@/services/ai";
import { DEMO_NOW, formatDate, uid } from "@/lib/utils";

const COMMUNAL = "__communal";
const SOURCES: RequestSource[] = ["Tenant portal", "Email", "Phone", "Inspection", "Document upload"];

const schema = z
  .object({
    title: z.string().min(4, "Give the request a short title"),
    description: z.string().min(10, "Describe the issue (10+ characters)"),
    propertyId: z.string().min(1, "Select a property"),
    buildingId: z.string().min(1, "Select a building"),
    unitId: z.string().min(1, "Select a unit or communal area"),
    location: z.string().optional(),
    category: z.enum(ISSUE_CATEGORIES),
    priority: z.enum(PRIORITIES),
    reportedAt: z.string().min(1, "Date required"),
    source: z.enum(["Tenant portal", "Email", "Phone", "Inspection", "Document upload"]),
    contractorId: z.string().optional(),
  })
  .refine((v) => v.unitId !== COMMUNAL || (v.location && v.location.length > 2), { message: "Describe the communal location", path: ["location"] });
type Values = z.infer<typeof schema>;

const DUE: Record<Priority, number> = { Urgent: 1, High: 3, Medium: 7, Low: 14 };

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const scale = Math.min(1, 800 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function RequestNew() {
  const store = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ai, setAi] = useState<ClassificationResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplied, setAiApplied] = useState<"accepted" | "corrected" | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedFrom, setExtractedFrom] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", propertyId: "", buildingId: "", unitId: "", category: "General Maintenance", priority: "Medium", reportedAt: DEMO_NOW.toISOString().slice(0, 10), source: "Tenant portal", contractorId: "" },
  });

  const v = watch();
  const buildings = store.buildings.filter((b) => b.propertyId === v.propertyId);
  const units = store.units.filter((u) => u.buildingId === v.buildingId);
  const unit = v.unitId && v.unitId !== COMMUNAL ? L.unit(v.unitId) : undefined;
  const tenant = L.tenant(unit?.tenantId);
  const contractors = store.contractors.filter((c) => c.status === "Active" && c.categories.includes(v.category));

  // Live duplicate check against existing requests
  const dupes = useMemo(() => {
    if (!v.propertyId || !v.buildingId || (v.title + v.description).length < 12) return [];
    const draft: MaintenanceRequest = {
      id: "draft",
      ref: "draft",
      title: v.title,
      description: v.description,
      propertyId: v.propertyId,
      buildingId: v.buildingId,
      unitId: v.unitId && v.unitId !== COMMUNAL ? v.unitId : undefined,
      category: v.category,
      priority: v.priority,
      status: "New",
      source: v.source,
      reportedAt: new Date(v.reportedAt || DEMO_NOW).toISOString(),
      dueAt: "",
      photos,
      timeline: [],
    };
    return findPossibleDuplicates(draft, store);
  }, [v.title, v.description, v.propertyId, v.buildingId, v.unitId, v.category, v.reportedAt, photos, store, v.priority, v.source]);

  // Debounced AI classification
  const text = `${v.title} ${v.description}`.trim();
  useEffect(() => {
    if (text.length < 15) return;
    let cancelled = false;
    setAiLoading(true);
    const t = setTimeout(async () => {
      const res = await classifyReport(text);
      if (!cancelled) {
        setAi(res);
        setAiLoading(false);
        setAiApplied(null);
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text]);

  const applyAi = () => {
    if (!ai) return;
    setValue("category", ai.category);
    setValue("priority", ai.priority);
    setAiApplied("accepted");
    toast.success(`Applied AI suggestion: ${ai.category}, ${ai.priority}`);
  };

  const onPhotos = async (files: FileList | null) => {
    if (!files) return;
    const next: Photo[] = [];
    for (const f of Array.from(files).slice(0, 6 - photos.length)) {
      try {
        next.push({ id: uid("ph"), caption: f.name.replace(/\.\w+$/, ""), kind: "general", url: await compressImage(f) });
      } catch {
        toast.error(`Couldn't read ${f.name}`);
      }
    }
    setPhotos((p) => [...p, ...next]);
  };

  const onDocument = async (file: File | undefined) => {
    if (!file) return;
    setExtracting(true);
    const ex = await extractDocument(file.name, "Contractor report", store);
    const prop = store.properties.find((p) => p.name === ex.propertyGuess);
    if (prop) {
      setValue("propertyId", prop.id);
      const b = store.buildings.find((x) => x.propertyId === prop.id);
      if (b) setValue("buildingId", b.id);
    }
    setValue("title", `${ex.category} issue from uploaded report`);
    setValue("description", ex.summary);
    setValue("category", ex.category);
    setValue("source", "Document upload");
    store.addDocument({ id: uid("doc"), filename: file.name, kind: "Contractor report", uploadedAt: new Date().toISOString(), size: `${Math.max(1, Math.round(file.size / 1024))} KB`, status: "Extracted", extracted: ex });
    setExtracting(false);
    setExtractedFrom(file.name);
    setMode("manual");
    toast.success("Report extracted — review the pre-filled fields");
  };

  const onSubmit = (val: Values) => {
    const reportedAt = new Date(val.reportedAt + "T09:00:00Z").toISOString();
    const due = new Date(reportedAt);
    due.setUTCDate(due.getUTCDate() + DUE[val.priority]);
    // Only record a manager decision when they actually made one; otherwise leave it in the review queue.
    const reviewed: "pending" | "accepted" | "corrected" = !ai ? "pending" : val.category === ai.category ? "accepted" : aiApplied === "corrected" ? "corrected" : "pending";
    const created = store.addRequest({
      title: val.title,
      description: val.description,
      propertyId: val.propertyId,
      buildingId: val.buildingId,
      unitId: val.unitId === COMMUNAL ? undefined : val.unitId,
      location: val.location || undefined,
      category: val.category,
      priority: val.priority,
      status: val.contractorId ? "Assigned" : "New",
      source: val.source,
      reportedAt,
      dueAt: due.toISOString(),
      tenantId: unit?.tenantId,
      contractorId: val.contractorId || undefined,
      photos,
      ai: ai ? { suggestedCategory: ai.category, confidence: ai.confidence, suggestedPriority: ai.priority, keywords: ai.keywords, reviewed, model: ai.model } : undefined,
    });
    toast.success(`${created.ref} created`, { description: dupes.length ? "Possible duplicates were found — run a duplicate scan to review them." : undefined });
    navigate(`/app/requests/${created.id}`);
  };

  return (
    <>
      <Link to="/app/requests" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Requests
      </Link>
      <PageHeader title="New maintenance request" description="Log a request manually or extract one from an uploaded contractor report or tenant letter." />

      <Tabs value={mode} onValueChange={(m) => setMode(m as "manual" | "upload")} className="mb-5">
        <TabsList>
          <TabsTrigger value="manual">
            <PenLine className="h-4 w-4" /> Enter manually
          </TabsTrigger>
          <TabsTrigger value="upload">
            <FileUp className="h-4 w-4" /> From uploaded report
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "upload" ? (
        <Card>
          <CardContent className="p-8">
            <button
              type="button"
              onClick={() => docRef.current?.click()}
              disabled={extracting}
              className="flex w-full flex-col items-center rounded-xl border-2 border-dashed bg-warm-50 px-6 py-14 text-center transition hover:border-sage-400 hover:bg-sage-50/40"
            >
              {extracting ? <Loader2 className="h-10 w-10 animate-spin text-sage-600" /> : <FileUp className="h-10 w-10 text-sage-600" />}
              <div className="mt-3 font-semibold">{extracting ? "Extracting text and fields…" : "Upload a contractor report, inspection report or tenant letter"}</div>
              <div className="mt-1 max-w-md text-sm text-muted-foreground">PDF, image or Word document. Text and key fields are extracted (Amazon Textract), then summarised and classified (Amazon Bedrock).</div>
              <AIBadge className="mt-4" label="Simulated extraction" />
              <div className="mt-2 text-[11px] text-muted-foreground">Tip: include the property name in the filename, e.g. “Harbourview_Flat_4B_jobsheet.pdf”</div>
            </button>
            <input ref={docRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => onDocument(e.target.files?.[0])} />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {extractedFrom && (
              <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                <Sparkles className="h-4 w-4" /> Pre-filled from <strong>{extractedFrom}</strong>. Check every field before saving.
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Issue details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Field label="Request title" error={errors.title?.message}>
                  <Input {...register("title")} placeholder="e.g. Water leaking from bathroom ceiling" />
                </Field>
                <Field label="Description" error={errors.description?.message}>
                  <Textarea rows={4} {...register("description")} placeholder="What's happening, where, since when, and anything already tried…" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Issue category">
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(x) => { field.onChange(x); if (ai && x !== ai.category) setAiApplied("corrected"); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ISSUE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Priority">
                    <Controller
                      control={control}
                      name="priority"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PRIORITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Date reported" error={errors.reportedAt?.message}>
                    <Input type="date" {...register("reportedAt")} />
                  </Field>
                </div>
                <Field label="Reported via">
                  <Controller
                    control={control}
                    name="source"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="sm:w-[220px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & tenant</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Field label="Property" error={errors.propertyId?.message}>
                  <Controller
                    control={control}
                    name="propertyId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(x) => { field.onChange(x); setValue("buildingId", ""); setValue("unitId", ""); }}>
                        <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                        <SelectContent>{store.properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Building" error={errors.buildingId?.message}>
                  <Controller
                    control={control}
                    name="buildingId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(x) => { field.onChange(x); setValue("unitId", ""); }} disabled={!v.propertyId}>
                        <SelectTrigger><SelectValue placeholder="Select building" /></SelectTrigger>
                        <SelectContent>{buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Unit" error={errors.unitId?.message}>
                  <Controller
                    control={control}
                    name="unitId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!v.buildingId}>
                        <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={COMMUNAL}>Communal area</SelectItem>
                          {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label={v.unitId === COMMUNAL ? "Communal location" : "Room / location within unit (optional)"} error={errors.location?.message} className="sm:col-span-3">
                  <Input {...register("location")} placeholder={v.unitId === COMMUNAL ? "e.g. Plant room, stairwell B, roof" : "e.g. Bathroom ceiling"} />
                </Field>
                <div className="rounded-lg border bg-warm-50 p-3 text-sm sm:col-span-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenant details</div>
                  {tenant ? (
                    <div className="mt-1">
                      <span className="font-medium">{tenant.name}</span> · {tenant.email} · {tenant.phone}
                    </div>
                  ) : (
                    <div className="mt-1 text-muted-foreground">{v.unitId === COMMUNAL ? "Communal area — no tenant attached." : unit ? "Unit is vacant." : "Select a unit to attach tenant details automatically."}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Photographs</CardTitle>
                <CardDescription>Up to 6 photos. Stored in Amazon S3 in production; kept in your browser in this demo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {photos.map((p) => (
                    <div key={p.id} className="relative">
                      <PhotoTile photo={p} showCaption={false} />
                      <button type="button" onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))} className="absolute right-1 top-1 rounded-full bg-navy-900/70 p-0.5 text-white" aria-label="Remove photo">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-[4/3] place-items-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-sage-400 hover:text-sage-700">
                      <Camera className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" hidden multiple accept="image/*" onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <Field label={`Assign contractor (optional) — showing ${v.category} specialists`}>
                  <Controller
                    control={control}
                    name="contractorId"
                    render={({ field }) => (
                      <Select value={field.value || "none"} onValueChange={(x) => field.onChange(x === "none" ? "" : x)}>
                        <SelectTrigger className="sm:w-[320px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Assign later</SelectItem>
                          {contractors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · ★ {c.rating.toFixed(1)} · {Math.round(c.firstTimeFixRate * 100)}% first-time fix</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <p className="mt-2 text-xs text-muted-foreground">Status will be set to {v.contractorId ? <StatusBadge status="Assigned" /> : <StatusBadge status="New" />}. Tip: generate a contractor brief before dispatch.</p>
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <Card className="border-violet-200">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-violet-600" /> AI classification</CardTitle>
                <AIBadge />
              </CardHeader>
              <CardContent>
                {text.length < 15 ? (
                  <p className="text-sm text-muted-foreground">Start typing a title and description — DwellMender will suggest a category and priority.</p>
                ) : aiLoading || !ai ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analysing report…</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <CategoryLabel category={ai.category} />
                      <ConfidenceBar value={ai.confidence} />
                    </div>
                    <div className="text-sm">Suggested priority: <strong>{ai.priority}</strong></div>
                    <p className="text-xs text-muted-foreground">{ai.rationale}</p>
                    {ai.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">{ai.keywords.map((k) => <span key={k} className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700">{k}</span>)}</div>
                    )}
                    {ai.alternatives.length > 0 && <div className="text-xs text-muted-foreground">Alternatives: {ai.alternatives.map((a) => `${a.category} (${Math.round(a.confidence * 100)}%)`).join(", ")}</div>}
                    {aiApplied === "accepted" && v.category === ai.category ? (
                      <div className="rounded-md bg-sage-50 px-3 py-2 text-xs font-medium text-sage-700">✓ Suggestion applied — you can still change it.</div>
                    ) : aiApplied === "corrected" ? (
                      <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">You've overridden the AI category — this correction will be recorded.</div>
                    ) : (
                      <Button type="button" size="sm" variant="outline" className="w-full" onClick={applyAi}>Apply suggestion</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={dupes.length ? "border-amber-300" : ""}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><Copy className="h-4 w-4 text-amber-600" /> Possible duplicates</CardTitle>
              </CardHeader>
              <CardContent>
                {dupes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{v.propertyId ? "No similar open or recent requests found." : "Choose a location to check for similar requests."}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> This may describe an issue already reported. You can still save it — nothing is merged without approval.
                    </div>
                    {dupes.map(({ request: r, res }) => (
                      <Link key={r.id} to={`/app/requests/${r.id}`} target="_blank" className="flex items-center gap-3 rounded-md border p-2 hover:bg-secondary">
                        <ScoreRing score={res.score} size={44} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{r.title}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.ref} · {L.location(r)} · {formatDate(r.reportedAt)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>Create request</Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium">{label}</span>
        {children}
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export type { IssueCategory };
