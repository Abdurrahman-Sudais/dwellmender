import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCopy, Eye, Loader2, Mail, PenLine, Printer, RefreshCw, Send, ShieldCheck, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { AIBadge, DemoBadge, EmptyState, PhotoTile, PriorityBadge, StatusBadge } from "@/components/shared";
import { useLookups, useStore } from "@/data/store";
import type { BriefSection, ContractorBrief, Photo } from "@/data/types";
import { generateBrief } from "@/services/ai";
import { formatDate, uid } from "@/lib/utils";

export default function BriefEditor() {
  const { requestId } = useParams();
  const store = useStore();
  const L = useLookups();
  const r = store.requests.find((x) => x.id === requestId);
  const existing = store.briefs.find((b) => b.requestId === requestId);
  const [draft, setDraft] = useState<ContractorBrief | null>(existing ?? null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"edit" | "preview">(existing && existing.status !== "Draft" ? "preview" : "edit");
  const [sendOpen, setSendOpen] = useState(false);

  useEffect(() => setDraft(existing ?? null), [existing]);

  if (!r) return <EmptyState icon={PenLine} title="Request not found" />;

  // Photos from this request and related history at the same location
  const relatedPhotos: (Photo & { ref: string })[] = store.requests
    .filter((x) => x.buildingId === r.buildingId && (x.unitId ?? "c") === (r.unitId ?? "c") && (x.category === r.category || (r.groupId && x.groupId === r.groupId)))
    // current request first, then most recent history
    .sort((a, b) => (a.id === r.id ? -1 : b.id === r.id ? 1 : +new Date(b.reportedAt) - +new Date(a.reportedAt)))
    .flatMap((x) => x.photos.map((p) => ({ ...p, ref: x.ref })));

  const generate = async () => {
    setLoading(true);
    const sections = await generateBrief(r, store);
    const now = new Date().toISOString();
    const b: ContractorBrief = {
      id: existing?.id ?? uid("brief"),
      requestId: r.id,
      contractorId: r.contractorId,
      sections,
      photoIds: relatedPhotos.slice(0, 6).map((p) => p.id),
      status: "Draft",
      generatedAt: now,
      updatedAt: now,
    };
    setDraft(b);
    store.saveBrief(b);
    setLoading(false);
    setView("edit");
    toast.success("Draft brief generated — review and edit before approving");
  };

  // Any edit sends the brief back to Draft so it must be re-approved before sharing.
  const update = (patch: Partial<ContractorBrief>) => draft && setDraft({ ...draft, ...patch, status: patch.status ?? "Draft", updatedAt: new Date().toISOString() });
  const setSection = (key: string, body: string) => draft && update({ sections: draft.sections.map((s) => (s.key === key ? { ...s, body } : s)) });
  const dirty = draft && existing && JSON.stringify(draft) !== JSON.stringify(existing);

  const save = () => {
    if (!draft) return;
    store.saveBrief(draft);
    toast.success("Brief saved");
  };
  const approve = () => {
    if (!draft) return;
    const b = { ...draft, status: "Approved" as const, approvedBy: store.user?.name, updatedAt: new Date().toISOString() };
    setDraft(b);
    store.saveBrief(b);
    setView("preview");
    toast.success("Brief approved — ready to share");
  };
  const plainText = (b: ContractorBrief) =>
    `CONTRACTOR BRIEF — ${r.ref}\n${r.title}\nContractor: ${L.contractor(b.contractorId)?.name ?? "TBC"}\n\n` + b.sections.map((s) => `${s.title.toUpperCase()}\n${s.body}`).join("\n\n") + `\n\nApproved by ${b.approvedBy ?? "—"} · Generated with DwellMender`;

  const contractor = L.contractor(draft?.contractorId);

  return (
    <>
      <Link to={`/app/requests/${r.id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="h-4 w-4" /> {r.ref}
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <AIBadge label="Simulated brief" />
            {draft && <Badge variant={draft.status === "Draft" ? "secondary" : draft.status === "Approved" ? "info" : "success"}>{draft.status}</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy-900">Contractor brief · {r.title}</h1>
          <p className="text-sm text-muted-foreground">
            {r.ref} · {L.property(r.propertyId)?.name} · {L.location(r)}
          </p>
        </div>
        {draft && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Regenerate
            </Button>
            {draft.status === "Draft" && (
              <>
                <Button variant="outline" onClick={save} disabled={!dirty}>Save draft</Button>
                <Button variant="accent" onClick={approve}>
                  <ShieldCheck /> Approve brief
                </Button>
              </>
            )}
            {draft.status !== "Draft" && (
              <Button onClick={() => setSendOpen(true)}>
                <Send /> {draft.status === "Shared" ? "Share again" : "Share with contractor"}
              </Button>
            )}
          </div>
        )}
      </div>

      {!draft ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-violet-50">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-violet-600" /> : <Wand2 className="h-6 w-6 text-violet-600" />}
            </span>
            <h2 className="mt-4 text-xl font-semibold">{loading ? "Compiling repair history…" : "Generate a contractor brief"}</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              DwellMender gathers the property and unit details, this complaint, previous related complaints, historical repairs, earlier contractor notes and relevant photographs — then suggests an inspection focus. You can edit everything before approving.
            </p>
            <Button className="mt-6" variant="accent" size="lg" onClick={generate} disabled={loading}>
              <Wand2 /> Generate brief
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <Tabs value={view} onValueChange={(v) => setView(v as "edit" | "preview")} className="mb-4 print:hidden">
              <TabsList>
                <TabsTrigger value="edit"><PenLine className="h-4 w-4" /> Edit</TabsTrigger>
                <TabsTrigger value="preview"><Eye className="h-4 w-4" /> Preview</TabsTrigger>
              </TabsList>
            </Tabs>
            {view === "edit" ? (
              <div className="space-y-4">
                {draft.status !== "Draft" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">Editing an approved brief returns it to Draft and requires re-approval.</div>
                )}
                {draft.sections.map((s) => (
                  <SectionEditor key={s.key} s={s} onChange={(body) => setSection(s.key, body)} />
                ))}
              </div>
            ) : (
              <BriefPreview brief={draft} photos={relatedPhotos.filter((p) => draft.photoIds.includes(p.id))} />
            )}
          </div>

          <div className="space-y-6 print:hidden">
            <Card>
              <CardHeader><CardTitle>Dispatch to</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={draft.contractorId ?? ""} onValueChange={(c) => update({ contractorId: c })}>
                  <SelectTrigger><SelectValue placeholder="Choose contractor" /></SelectTrigger>
                  <SelectContent>
                    {store.contractors.filter((c) => c.categories.includes(r.category)).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    {store.contractors.filter((c) => !c.categories.includes(r.category)).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} (other trade)</SelectItem>)}
                  </SelectContent>
                </Select>
                {contractor && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <DemoBadge />
                    <div>{contractor.email}</div>
                    <div>★ {contractor.rating.toFixed(1)} · {Math.round(contractor.firstTimeFixRate * 100)}% first-time fix</div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Relevant photographs</CardTitle>
                <CardDescription>{relatedPhotos.length} from this and related requests</CardDescription>
              </CardHeader>
              <CardContent>
                {relatedPhotos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No photographs on file.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {relatedPhotos.map((p) => (
                      <label key={p.id} className="relative cursor-pointer">
                        <PhotoTile photo={{ ...p, caption: `${p.ref} · ${p.caption}` }} />
                        <Checkbox
                          className="absolute right-1.5 top-1.5 bg-white"
                          checked={draft.photoIds.includes(p.id)}
                          onCheckedChange={(c) => update({ photoIds: c ? [...draft.photoIds, p.id] : draft.photoIds.filter((x) => x !== p.id) })}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Request</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2"><StatusBadge status={r.status} /><PriorityBadge priority={r.priority} /></div>
                <div className="text-xs text-muted-foreground">Generated {formatDate(draft.generatedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                {draft.approvedBy && draft.status !== "Draft" && (
                  <div className="flex items-center gap-1.5 text-xs text-sage-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approved by {draft.approvedBy}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share contractor brief</DialogTitle>
            <DialogDescription>
              {contractor ? `Send to ${contractor.name} (${contractor.email}).` : "Choose a contractor first to send by email."} In production, email is delivered via Amazon SES with photos as signed S3 links.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={async () => {
                await navigator.clipboard?.writeText(plainText(draft!)).catch(() => undefined);
                toast.success("Brief copied to clipboard");
              }}
            >
              <ClipboardCopy /> Copy as text
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => { setSendOpen(false); setView("preview"); setTimeout(() => window.print(), 150); }}>
              <Printer /> Print / save as PDF
            </Button>
          </div>
          <DialogFooter>
            <Button
              disabled={!contractor}
              onClick={() => {
                const b = { ...draft!, status: "Shared" as const, updatedAt: new Date().toISOString() };
                setDraft(b);
                store.saveBrief(b);
                if (r.contractorId !== b.contractorId && b.contractorId) store.assignContractor(r.id, b.contractorId);
                setSendOpen(false);
                toast.success(`Brief marked as shared with ${contractor?.name}`, { description: "Demo mode — no email was sent." });
              }}
            >
              <Mail /> Send via email (simulated)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectionEditor({ s, onChange }: { s: BriefSection; onChange: (b: string) => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{s.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea value={s.body} onChange={(e) => onChange(e.target.value)} rows={Math.min(12, Math.max(3, s.body.split("\n").length + 1))} className="font-[450] leading-relaxed" />
      </CardContent>
    </Card>
  );
}

function BriefPreview({ brief, photos }: { brief: ContractorBrief; photos: (Photo & { ref: string })[] }) {
  const L = useLookups();
  const r = L.request(brief.requestId)!;
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card print:border-0 print:shadow-none">
      <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
        <div>
          <div className="text-xs uppercase tracking-wider text-navy-200">Contractor brief</div>
          <div className="font-display text-lg font-bold">{r.ref} · {r.title}</div>
        </div>
        <div className="text-right text-xs text-navy-200">
          <div>For: {L.contractor(brief.contractorId)?.name ?? "TBC"}</div>
          <div>{formatDate(brief.updatedAt)}</div>
        </div>
      </div>
      <div className="space-y-5 p-6">
        {brief.sections.map((s) => (
          <section key={s.key}>
            <h3 className="border-b pb-1 text-xs font-bold uppercase tracking-wider text-sage-700">{s.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-800">{s.body}</p>
          </section>
        ))}
        {photos.length > 0 && (
          <section>
            <h3 className="border-b pb-1 text-xs font-bold uppercase tracking-wider text-sage-700">Relevant photographs</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.map((p) => <PhotoTile key={p.id} photo={{ ...p, caption: `${p.ref} · ${p.caption}` }} />)}
            </div>
          </section>
        )}
        <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span>{brief.status === "Draft" ? "DRAFT — not yet approved" : `Approved by ${brief.approvedBy}`}</span>
          <span>Generated with DwellMender · AI-assisted, manager reviewed</span>
        </div>
      </div>
    </div>
  );
}
