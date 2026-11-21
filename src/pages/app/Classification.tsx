import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, CheckCheck, Cloud, FileSearch, FileUp, Loader2, ScanText, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { AIBadge, CATEGORY_META, CategoryLabel, ConfidenceBar, EmptyState, PageHeader, PriorityBadge } from "@/components/shared";
import { useLookups, useStore } from "@/data/store";
import { ISSUE_CATEGORIES, type IssueCategory, type UploadedDocument } from "@/data/types";
import { classifyReport, extractDocument, type ClassificationResult } from "@/services/ai";
import { formatDate, uid } from "@/lib/utils";

export default function Classification() {
  const store = useStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "queue";
  const pending = store.requests.filter((r) => r.ai?.reviewed === "pending");
  const processingDocs = store.documents.filter((d) => d.status !== "Reviewed").length;

  return (
    <>
      <PageHeader
        title="AI report classification"
        eyebrow={<AIBadge label="Simulated AI · Bedrock & Textract ready" />}
        description="Reports and uploaded documents are organised into maintenance categories automatically. Every suggestion is reviewed by a manager before it's final."
      />
      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t })}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="queue">Review queue {pending.length > 0 && <span className="rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">{pending.length}</span>}</TabsTrigger>
          <TabsTrigger value="documents">Document extraction {processingDocs > 0 && <span className="rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">{processingDocs}</span>}</TabsTrigger>
          <TabsTrigger value="playground">Try the classifier</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy & corrections</TabsTrigger>
        </TabsList>
        <TabsContent value="queue"><ReviewQueue /></TabsContent>
        <TabsContent value="documents"><Documents /></TabsContent>
        <TabsContent value="playground"><Playground /></TabsContent>
        <TabsContent value="accuracy"><Accuracy /></TabsContent>
      </Tabs>
    </>
  );
}

function ReviewQueue() {
  const store = useStore();
  const L = useLookups();
  const pending = store.requests.filter((r) => r.ai?.reviewed === "pending").sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
  const highConf = pending.filter((r) => r.ai!.confidence >= 0.9 && r.ai!.suggestedCategory === r.category);

  const accept = (id: string) => {
    const r = store.requests.find((x) => x.id === id)!;
    store.updateRequest(id, { category: r.ai!.suggestedCategory, ai: { ...r.ai!, reviewed: "accepted" } }, { text: `AI classification accepted (${r.ai!.suggestedCategory})`, type: "ai" });
  };
  const correct = (id: string, c: IssueCategory) => {
    const r = store.requests.find((x) => x.id === id)!;
    store.updateRequest(id, { category: c, ai: { ...r.ai!, reviewed: c === r.ai!.suggestedCategory ? "accepted" : "corrected" } }, { text: `Category corrected to ${c} (AI suggested ${r.ai!.suggestedCategory})`, type: "ai" });
    toast.success(`${r.ref} set to ${c}`);
  };

  if (pending.length === 0) return <EmptyState icon={CheckCheck} title="Review queue is clear" description="All AI classifications have been reviewed. New reports will appear here automatically." />;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{pending.length} classifications awaiting review</CardTitle>
          <CardDescription className="mt-1">Rows where the AI disagrees with the category entered at intake are highlighted.</CardDescription>
        </div>
        <Button variant="outline" size="sm" disabled={!highConf.length} onClick={() => { highConf.forEach((r) => accept(r.id)); toast.success(`Accepted ${highConf.length} high-confidence classifications`); }}>
          <CheckCheck /> Accept all ≥90% that match ({highConf.length})
        </Button>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead>Entered as</TableHead>
            <TableHead>AI suggestion</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Signals</TableHead>
            <TableHead className="text-right">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pending.map((r) => {
            const mismatch = r.ai!.suggestedCategory !== r.category;
            return (
              <TableRow key={r.id} className={mismatch ? "bg-amber-50/50" : undefined}>
                <TableCell className="max-w-[280px]">
                  <Link to={`/app/requests/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                  <div className="truncate text-xs text-muted-foreground">{r.ref} · {L.property(r.propertyId)?.name} · {L.location(r)}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-navy-600">{r.description}</div>
                </TableCell>
                <TableCell><CategoryLabel category={r.category} /></TableCell>
                <TableCell>
                  <CategoryLabel category={r.ai!.suggestedCategory} />
                  {mismatch && <div className="text-[10px] font-semibold text-amber-700">Differs from intake</div>}
                  <div className="mt-1"><PriorityBadge priority={r.ai!.suggestedPriority} /></div>
                </TableCell>
                <TableCell><ConfidenceBar value={r.ai!.confidence} /></TableCell>
                <TableCell>
                  <div className="flex max-w-[160px] flex-wrap gap-1">{r.ai!.keywords.map((k) => <span key={k} className="rounded bg-violet-50 px-1 text-[10px] text-violet-700">{k}</span>)}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="accent" onClick={() => { accept(r.id); toast.success(`${r.ref} accepted as ${r.ai!.suggestedCategory}`); }}>
                      <Check /> Accept
                    </Button>
                    <Select onValueChange={(c) => correct(r.id, c as IssueCategory)}>
                      <SelectTrigger className="h-8 w-[118px] text-xs"><SelectValue placeholder="Correct…" /></SelectTrigger>
                      <SelectContent>{ISSUE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function Documents() {
  const store = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<UploadedDocument["kind"]>("Contractor report");
  const [selected, setSelected] = useState<string | null>(store.documents[0]?.id ?? null);
  const doc = store.documents.find((d) => d.id === selected);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const id = uid("doc");
      store.addDocument({ id, filename: f.name, kind, uploadedAt: new Date().toISOString(), size: `${Math.max(1, Math.round(f.size / 1024))} KB`, status: "Processing" });
      setSelected(id);
      extractDocument(f.name, kind, store).then((ex) => {
        store.updateDocument(id, { status: "Extracted", extracted: ex });
        toast.success(`Extracted ${f.name}`, { description: `${ex.category} · ${Math.round(ex.confidence * 100)}% confidence` });
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <Select value={kind} onValueChange={(k) => setKind(k as UploadedDocument["kind"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Contractor report", "Inspection report", "Tenant letter", "Invoice"] as const).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
            <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center rounded-lg border-2 border-dashed bg-warm-50 px-4 py-8 text-center hover:border-sage-400">
              <FileUp className="h-7 w-7 text-sage-600" />
              <div className="mt-2 text-sm font-semibold">Upload documents</div>
              <div className="text-xs text-muted-foreground">PDF, JPG, PNG · multiple allowed</div>
            </button>
            <input ref={fileRef} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Uploaded documents</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-2 pt-0">
            {store.documents.map((d) => (
              <button key={d.id} onClick={() => setSelected(d.id)} className={`flex w-full items-start gap-2 rounded-md p-2 text-left text-sm hover:bg-secondary ${selected === d.id ? "bg-secondary" : ""}`}>
                {d.status === "Processing" ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-violet-600" /> : <ScanText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{d.filename}</div>
                  <div className="text-xs text-muted-foreground">{d.kind} · {formatDate(d.uploadedAt)}</div>
                </div>
                <Badge variant={d.status === "Reviewed" ? "success" : d.status === "Extracted" ? "ai" : "secondary"}>{d.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        {!doc ? (
          <CardContent className="p-8"><EmptyState icon={FileSearch} title="Select a document" /></CardContent>
        ) : doc.status === "Processing" ? (
          <CardContent className="flex flex-col items-center gap-3 p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <div className="font-semibold">Extracting {doc.filename}</div>
            <div className="max-w-sm text-sm text-muted-foreground">Textract is reading text, tables and form fields; Bedrock is summarising and classifying the work described.</div>
            <AIBadge label="Simulated" />
          </CardContent>
        ) : (
          <>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle>{doc.filename}</CardTitle>
                <CardDescription className="mt-1">{doc.kind} · {doc.size} · uploaded {formatDate(doc.uploadedAt)}</CardDescription>
              </div>
              <AIBadge label="Simulated extraction" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Info label="Detected property" value={doc.extracted?.propertyGuess ?? "Not detected"} />
                <Info label="Detected location" value={doc.extracted?.unitGuess ?? "Not detected"} />
                <div className="rounded-lg border bg-warm-50 p-3">
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="mt-1 flex items-center justify-between"><CategoryLabel category={doc.extracted!.category} /><ConfidenceBar value={doc.extracted!.confidence} /></div>
                </div>
              </div>
              <div className="rounded-lg border-l-4 border-violet-400 bg-violet-50/60 p-3 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">AI summary</div>
                <p className="mt-1 text-navy-800">{doc.extracted?.summary}</p>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Extracted fields</div>
                <div className="divide-y rounded-lg border">
                  {doc.extracted?.fields.map((f) => (
                    <div key={f.label} className="grid grid-cols-[160px_1fr_auto] items-center gap-3 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className={f.confidence < 0.6 ? "text-amber-700" : ""}>{f.value}</span>
                      <ConfidenceBar value={f.confidence} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Fields below 60% confidence are highlighted for manual checking.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                {doc.linkedRequestId ? (
                  <Button variant="outline" asChild><Link to={`/app/requests/${doc.linkedRequestId}`}>Linked to {L.request(doc.linkedRequestId)?.ref}</Link></Button>
                ) : (
                  <Select onValueChange={(rid) => { store.updateDocument(doc.id, { linkedRequestId: rid }); store.updateRequest(rid, {}, { text: `Document linked: ${doc.filename}`, type: "note" }); toast.success("Document linked to request"); }}>
                    <SelectTrigger className="w-[260px]"><SelectValue placeholder="Link to existing request…" /></SelectTrigger>
                    <SelectContent>
                      {store.requests
                        .filter((r) => !doc.extracted?.propertyGuess || L.property(r.propertyId)?.name === doc.extracted.propertyGuess)
                        .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt))
                        .slice(0, 25)
                        .map((r) => <SelectItem key={r.id} value={r.id}>{r.ref} · {r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" onClick={() => navigate("/app/requests/new")}>Create new request</Button>
                {doc.status !== "Reviewed" && (
                  <Button variant="accent" onClick={() => { store.updateDocument(doc.id, { status: "Reviewed" }); toast.success("Extraction marked as reviewed"); }}>
                    <Check /> Mark reviewed
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-warm-50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

const SAMPLES = [
  "There's water dripping through the kitchen ceiling from the flat above, it's getting worse.",
  "No heating or hot water since last night, radiators stone cold.",
  "Found mouse droppings behind the fridge and under the sink.",
  "Lights keep flickering in the hallway and the RCD tripped twice today.",
  "Several roof tiles slipped after the storm, can see daylight in the loft.",
];

function Playground() {
  const [text, setText] = useState(SAMPLES[0]);
  const [res, setRes] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    setRes(await classifyReport(text));
    setLoading(false);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Report text</CardTitle>
          <CardDescription>Paste any tenant complaint or contractor note.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((s, i) => (
              <button key={i} onClick={() => setText(s)} className="rounded-full border bg-warm-50 px-2.5 py-1 text-xs hover:bg-secondary">Sample {i + 1}</button>
            ))}
          </div>
          <Button onClick={run} disabled={loading || text.trim().length < 5}>
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} Classify
          </Button>
        </CardContent>
      </Card>
      <Card className="border-violet-200">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /> Result</CardTitle>
          <AIBadge />
        </CardHeader>
        <CardContent>
          {!res ? (
            <p className="text-sm text-muted-foreground">Run the classifier to see the suggested category, priority and reasoning.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-warm-100 p-3">
                <CategoryLabel category={res.category} />
                <ConfidenceBar value={res.confidence} />
              </div>
              <div className="text-sm">Suggested priority: <PriorityBadge priority={res.priority} /></div>
              <p className="text-sm text-navy-700">{res.rationale}</p>
              {res.alternatives.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alternatives</div>
                  {res.alternatives.map((a) => (
                    <div key={a.category} className="flex items-center justify-between text-sm"><CategoryLabel category={a.category} /><ConfidenceBar value={a.confidence} /></div>
                  ))}
                </div>
              )}
              <pre className="overflow-auto rounded-md bg-navy-950 p-3 text-[11px] text-navy-100">{JSON.stringify(res, null, 2)}</pre>
              <p className="text-xs text-muted-foreground">The same JSON contract is returned by the <code>/ai/classify</code> Lambda when connected to Amazon Bedrock.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Accuracy() {
  const { requests } = useStore();
  const reviewed = requests.filter((r) => r.ai && r.ai.reviewed !== "pending");
  const accepted = reviewed.filter((r) => r.ai!.reviewed === "accepted").length;
  const corrected = reviewed.length - accepted;
  const byCat = useMemo(
    () =>
      ISSUE_CATEGORIES.map((c) => {
        const rs = reviewed.filter((r) => r.ai!.suggestedCategory === c);
        const acc = rs.filter((r) => r.ai!.reviewed === "accepted").length;
        return { name: c, accepted: acc, corrected: rs.length - acc, color: CATEGORY_META[c].chart };
      }).filter((x) => x.accepted + x.corrected > 0),
    [reviewed]
  );
  const corrections = reviewed.filter((r) => r.ai!.reviewed === "corrected").slice(0, 8);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Acceptance rate</CardTitle><CardDescription>Manager decisions on AI suggestions</CardDescription></CardHeader>
        <CardContent>
          <div className="font-display text-5xl font-bold text-sage-700">{reviewed.length ? Math.round((accepted / reviewed.length) * 100) : 0}%</div>
          <div className="mt-2 text-sm text-muted-foreground">{accepted} accepted · {corrected} corrected · {reviewed.length} reviewed</div>
          <div className="mt-6 rounded-lg border bg-warm-50 p-3 text-xs text-navy-700">
            <Cloud className="mb-1 h-4 w-4 text-amber-500" />
            In production, corrections are written to DynamoDB and exported for Bedrock prompt and evaluation tuning. CloudWatch tracks acceptance rate as a model-quality metric.
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Decisions by suggested category</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCat} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="accepted" stackId="a" fill="#567f62" name="Accepted" />
              <Bar dataKey="corrected" stackId="a" fill="#e0a43a" name="Corrected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle>Recent corrections</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {corrections.length === 0 && <p className="text-sm text-muted-foreground">No corrections yet.</p>}
          {corrections.map((r) => (
            <Link key={r.id} to={`/app/requests/${r.id}`} className="flex flex-wrap items-center gap-3 py-2 text-sm hover:bg-warm-50">
              <span className="font-mono text-xs text-muted-foreground">{r.ref}</span>
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              <span className="text-xs">AI: <strong>{r.ai!.suggestedCategory}</strong> → Manager: <strong>{r.category}</strong></span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
