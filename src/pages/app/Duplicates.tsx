import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, CheckCircle2, History, Link2, Loader2, Radar, ShieldCheck, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, Progress } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { AIBadge, CategoryLabel, EmptyState, PageHeader, PhotoTile, ScoreRing, StatusBadge } from "@/components/shared";
import { useLookups, useStore } from "@/data/store";
import type { DuplicateSuggestion, MaintenanceRequest } from "@/data/types";
import { scanForDuplicates } from "@/services/ai";
import { cn, formatDate } from "@/lib/utils";

export default function Duplicates() {
  const store = useStore();
  const [scanning, setScanning] = useState(false);
  const [confirm, setConfirm] = useState<{ s: DuplicateSuggestion; decision: "approved" | "rejected" } | null>(null);
  const pending = store.duplicates.filter((d) => d.status === "pending").sort((a, b) => b.score - a.score);
  const decided = store.duplicates.filter((d) => d.status !== "pending").sort((a, b) => +new Date(b.decidedAt ?? 0) - +new Date(a.decidedAt ?? 0));

  const scan = async () => {
    setScanning(true);
    const found = await scanForDuplicates(store, store.duplicates);
    setScanning(false);
    if (found.length) {
      store.addDuplicates(found);
      toast.success(`${found.length} new possible duplicate${found.length === 1 ? "" : "s"} found`);
    } else toast.info("Scan complete — no new likely duplicates among open requests");
  };

  return (
    <>
      <PageHeader
        title="Duplicate complaint detection"
        eyebrow={<AIBadge />}
        description="Reports that may describe the same underlying issue, compared across property, unit, wording, photos, dates and repair history."
        actions={
          <Button onClick={scan} disabled={scanning}>
            {scanning ? <Loader2 className="animate-spin" /> : <Radar />} {scanning ? "Scanning open requests…" : "Run duplicate scan"}
          </Button>
        }
      />
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-sage-200 bg-sage-50 p-4 text-sm text-sage-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <strong>Human approval required.</strong> DwellMender never merges maintenance records automatically. Approving a suggestion <em>links</em> the requests into a group — each original record, its history and its tenant contact are kept intact.
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Awaiting review ({pending.length})</TabsTrigger>
          <TabsTrigger value="decided">Decision history ({decided.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-5">
          {pending.length === 0 && <EmptyState icon={CheckCircle2} title="No duplicates awaiting review" description="Run a scan to check open requests against recent reports." />}
          {pending.map((s) => (
            <SuggestionCard key={s.id} s={s} onDecide={(decision) => setConfirm({ s, decision })} />
          ))}
        </TabsContent>
        <TabsContent value="decided">
          {decided.length === 0 ? (
            <EmptyState icon={History} title="No decisions yet" description="Approved and rejected suggestions will be logged here for audit." />
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {decided.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    {s.status === "approved" ? <CheckCircle2 className="h-5 w-5 text-sage-600" /> : <XCircle className="h-5 w-5 text-slate-400" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{s.suggestedGroupTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {[s.primaryId, ...s.matchIds].map((id) => store.requests.find((r) => r.id === id)?.ref).join(", ")} · {s.score}% match
                      </div>
                    </div>
                    <Badge variant={s.status === "approved" ? "success" : "secondary"}>{s.status === "approved" ? "Grouped" : "Rejected"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {s.decidedBy} · {s.decidedAt && formatDate(s.decidedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle>{confirm.decision === "approved" ? "Approve duplicate grouping?" : "Reject this suggestion?"}</DialogTitle>
                <DialogDescription>
                  {confirm.decision === "approved"
                    ? `${confirm.s.matchIds.length + 1} requests will be linked as "${confirm.s.suggestedGroupTitle}". No records are deleted or merged — you can still manage each request individually.`
                    : "The requests will stay separate and this pairing won't be suggested again."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
                <Button
                  variant={confirm.decision === "approved" ? "accent" : "destructive"}
                  onClick={() => {
                    store.decideDuplicate(confirm.s.id, confirm.decision);
                    toast.success(confirm.decision === "approved" ? "Requests linked as a duplicate group" : "Suggestion rejected");
                    setConfirm(null);
                  }}
                >
                  {confirm.decision === "approved" ? "Approve grouping" : "Reject suggestion"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SuggestionCard({ s, onDecide }: { s: DuplicateSuggestion; onDecide: (d: "approved" | "rejected") => void }) {
  const store = useStore();
  const reqs = [s.primaryId, ...s.matchIds].map((id) => store.requests.find((r) => r.id === id)).filter(Boolean) as MaintenanceRequest[];
  const L = useLookups();
  const property = L.property(reqs[0]?.propertyId);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center gap-4 space-y-0 border-b bg-warm-50/70">
        <ScoreRing score={s.score} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Suggested grouping</div>
          <div className="text-lg font-semibold text-navy-900">{s.suggestedGroupTitle}</div>
          <div className="text-xs text-muted-foreground">{property?.name} · {reqs.length} requests · detected {formatDate(s.createdAt)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onDecide("rejected")}>
            <X /> Reject
          </Button>
          <Button variant="accent" onClick={() => onDecide("approved")}>
            <Check /> Approve grouping
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 xl:grid-cols-[1fr_320px]">
        <div className={cn("grid gap-3", reqs.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {reqs.map((r, i) => (
            <div key={r.id} className={cn("rounded-lg border p-3", i === 0 && "border-navy-300 bg-navy-50/30")}>
              <div className="flex items-center justify-between gap-2">
                <Link to={`/app/requests/${r.id}`} className="font-mono text-xs font-medium text-navy-700 hover:underline">{r.ref}</Link>
                {i === 0 ? <Badge variant="info">Primary</Badge> : <StatusBadge status={r.status} />}
              </div>
              <div className="mt-1.5 text-sm font-semibold">{r.title}</div>
              <p className="mt-1 line-clamp-3 text-xs text-navy-600">{r.description}</p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <div>{L.location(r)}</div>
                <div>{formatDate(r.reportedAt)} · {r.source}</div>
                <div><CategoryLabel category={r.category} /></div>
                {r.tenantId && <div>Tenant: {L.tenant(r.tenantId)?.name}</div>}
              </div>
              {r.photos.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {r.photos.slice(0, 2).map((p) => <PhotoTile key={p.id} photo={p} showCaption={false} />)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Similarity signals</div>
            <div className="space-y-2">
              {s.signals.map((sig) => (
                <div key={sig.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{sig.label}</span>
                    <span className="tabular-nums text-muted-foreground">{Math.round(sig.score * 100)}%</span>
                  </div>
                  <Progress value={sig.score * 100} className="mt-1 h-1.5" indicatorClassName={sig.score >= 0.8 ? "bg-sage-600" : sig.score >= 0.5 ? "bg-amber-400" : "bg-slate-300"} />
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{sig.detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shared characteristics</div>
            <div className="flex flex-wrap gap-1.5">
              {s.sharedCharacteristics.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                  <Link2 className="h-3 w-3" /> {c}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="mb-0.5 flex items-center gap-1 font-semibold"><History className="h-3.5 w-3.5" /> Historical repair information</div>
            {s.historicalNote}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
