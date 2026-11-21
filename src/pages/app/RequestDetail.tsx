import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, Check, ClipboardList, Copy, FileText, HardHat, Mail, MessageSquarePlus, Phone, Repeat, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator, Textarea } from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { AIBadge, CategoryIcon, CategoryLabel, ConfidenceBar, DemoBadge, EmptyState, PhotoTile, PriorityBadge, StatusBadge } from "@/components/shared";
import { isOverdue, useLookups, useStore } from "@/data/store";
import { ISSUE_CATEGORIES, PRIORITIES, STATUSES, type IssueCategory, type Priority, type RequestStatus } from "@/data/types";
import { cn, daysAgo, formatCurrency, formatDate } from "@/lib/utils";

export default function RequestDetail() {
  const { id } = useParams();
  const store = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const r = store.requests.find((x) => x.id === id);
  if (!r) return <EmptyState icon={ClipboardList} title="Request not found" action={<Button asChild><Link to="/app/requests">Back to requests</Link></Button>} />;

  const property = L.property(r.propertyId)!;
  const tenant = L.tenant(r.tenantId);
  const contractor = L.contractor(r.contractorId);
  const recurring = store.recurring.find((x) => x.requests.some((y) => y.id === r.id));
  const dupes = store.duplicates.filter((d) => d.status === "pending" && [d.primaryId, ...d.matchIds].includes(r.id));
  const grouped = r.groupId ? store.requests.filter((x) => x.groupId === r.groupId && x.id !== r.id) : [];
  const brief = store.briefs.find((b) => b.requestId === r.id);
  const candidates = store.contractors.filter((c) => c.categories.includes(r.category));
  const history = store.requests
    .filter((x) => x.id !== r.id && x.buildingId === r.buildingId && (x.unitId ?? "c") === (r.unitId ?? "c"))
    .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));

  return (
    <>
      <Link to="/app/requests" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Requests
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <CategoryIcon category={r.category} className="h-12 w-12" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono font-medium text-navy-700">{r.ref}</span>
              <StatusBadge status={r.status} />
              <PriorityBadge priority={r.priority} />
              {isOverdue(r) && <Badge variant="danger">Overdue {daysAgo(r.dueAt)}d</Badge>}
              {recurring && <Badge variant="warning"><Repeat className="h-3 w-3" /> Recurring location</Badge>}
              {r.groupId && <Badge variant="ai">Duplicate group</Badge>}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{r.title}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              <Link to={`/app/properties/${property.id}`} className="hover:underline">{property.name}</Link> · {L.location(r)}
              {r.location && r.unitId ? ` · ${r.location}` : ""}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => navigate(`/app/briefs/${r.id}`)}>
            <FileText /> {brief ? "Open contractor brief" : "Generate contractor brief"}
          </Button>
        </div>
      </div>

      {(recurring || dupes.length > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {recurring && (
            <Link to={`/app/recurring?focus=${recurring.id}`} className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 hover:bg-amber-100/70">
              <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <div className="font-semibold text-amber-900">{recurring.pattern} — {recurring.complaintCount} reports in 12 months</div>
                <div className="text-amber-800">
                  {recurring.unsuccessfulRepairs} previous repair{recurring.unsuccessfulRepairs === 1 ? "" : "s"} didn't hold · {formatCurrency(recurring.totalSpend)} spent so far. Consider a root-cause investigation.
                </div>
              </div>
            </Link>
          )}
          {dupes.length > 0 && (
            <Link to="/app/duplicates" className="flex gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4 hover:bg-violet-100/70">
              <Copy className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div className="text-sm">
                <div className="font-semibold text-violet-900">{dupes.length} possible duplicate suggestion{dupes.length === 1 ? "" : "s"} ({Math.max(...dupes.map((d) => d.score))}% top match)</div>
                <div className="text-violet-800">Review and approve or reject — records are never merged automatically.</div>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-navy-800">{r.description}</p>
              {r.photos.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {r.photos.map((p) => <PhotoTile key={p.id} photo={p} />)}
                </div>
              )}
              {r.contractorNotes && (
                <div className="mt-5 rounded-lg border-l-4 border-sage-500 bg-sage-50 p-3 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sage-700">Contractor notes</div>
                  <p className="mt-1 text-navy-800">{r.contractorNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {r.ai && (
            <Card className="border-violet-200">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /> AI classification</CardTitle>
                <AIBadge />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>Suggested: <CategoryLabel category={r.ai.suggestedCategory} /></div>
                  <ConfidenceBar value={r.ai.confidence} />
                  <div>
                    Review:{" "}
                    {r.ai.reviewed === "pending" ? <Badge variant="ai">Awaiting review</Badge> : r.ai.reviewed === "accepted" ? <Badge variant="success">Accepted</Badge> : <Badge variant="warning">Corrected by manager</Badge>}
                  </div>
                </div>
                {r.ai.keywords.length > 0 && <div className="flex flex-wrap gap-1">{r.ai.keywords.map((k) => <span key={k} className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700">{k}</span>)}</div>}
                {r.ai.reviewed === "pending" && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md bg-warm-100 p-3">
                    <Button size="sm" variant="accent" onClick={() => { store.updateRequest(r.id, { category: r.ai!.suggestedCategory, ai: { ...r.ai!, reviewed: "accepted" } }, { text: `AI classification accepted (${r.ai!.suggestedCategory})`, type: "ai" }); toast.success("Classification accepted"); }}>
                      <Check /> Accept {r.ai.suggestedCategory}
                    </Button>
                    <span className="text-xs text-muted-foreground">or correct to</span>
                    <Select onValueChange={(c) => { store.updateRequest(r.id, { category: c as IssueCategory, ai: { ...r.ai!, reviewed: c === r.ai!.suggestedCategory ? "accepted" : "corrected" } }, { text: `Category corrected to ${c}`, type: "ai" }); toast.success(`Category set to ${c}`); }}>
                      <SelectTrigger className="h-8 w-[190px]"><SelectValue placeholder="Choose category" /></SelectTrigger>
                      <SelectContent>{ISSUE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l-2 border-warm-300 pl-5">
                {[...r.timeline].reverse().map((e) => (
                  <li key={e.id} className="relative">
                    <span className={cn("absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-card", e.type === "ai" || e.type === "duplicate" ? "bg-violet-500" : e.type === "assigned" ? "bg-amber-400" : e.type === "status" ? "bg-sage-500" : e.type === "brief" ? "bg-sky-500" : "bg-navy-400")} />
                    <div className="text-sm">{e.text}</div>
                    <div className="text-xs text-muted-foreground">{e.actor} · {formatDate(e.at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex gap-2">
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" />
                <Button variant="outline" disabled={!note.trim()} onClick={() => { store.updateRequest(r.id, {}, { text: note.trim(), type: "note" }); setNote(""); toast.success("Note added"); }}>
                  <MessageSquarePlus />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>History at this location</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No other requests recorded at {L.location(r)}.</p>
              ) : (
                <div className="divide-y">
                  {history.slice(0, 10).map((h) => (
                    <Link key={h.id} to={`/app/requests/${h.id}`} className="flex items-center gap-3 py-2.5 hover:bg-warm-50">
                      <CategoryIcon category={h.category} className="h-7 w-7" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{h.title}</div>
                        <div className="text-xs text-muted-foreground">{h.ref} · {formatDate(h.reportedAt)}{h.contractorId ? ` · ${L.contractor(h.contractorId)?.name}` : ""}</div>
                      </div>
                      <StatusBadge status={h.status} />
                    </Link>
                  ))}
                </div>
              )}
              {grouped.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Linked in duplicate group</div>
                  {grouped.map((g) => (
                    <Link key={g.id} to={`/app/requests/${g.id}`} className="mt-2 block text-sm hover:underline">{g.ref} · {g.title} ({L.location(g)})</Link>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Manage request</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SideField label="Status">
                <Select value={r.status} onValueChange={(s) => { store.setStatus(r.id, s as RequestStatus); toast.success(`Status: ${s}`); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </SideField>
              <SideField label="Priority">
                <Select value={r.priority} onValueChange={(p) => store.updateRequest(r.id, { priority: p as Priority }, { text: `Priority changed to ${p}`, type: "status" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </SideField>
              <SideField label="Category">
                <Select value={r.category} onValueChange={(c) => store.updateRequest(r.id, { category: c as IssueCategory, ai: r.ai ? { ...r.ai, reviewed: c === r.ai.suggestedCategory ? "accepted" : "corrected" } : undefined }, { text: `Category changed to ${c}`, type: "note" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISSUE_CATEGORIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </SideField>
              <SideField label="Assigned contractor">
                <Select value={r.contractorId ?? ""} onValueChange={(c) => { store.assignContractor(r.id, c); toast.success(`Assigned to ${L.contractor(c)?.name}`); }}>
                  <SelectTrigger><SelectValue placeholder="Assign contractor" /></SelectTrigger>
                  <SelectContent>
                    {candidates.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · ★{c.rating.toFixed(1)}</SelectItem>)}
                    {store.contractors.filter((c) => !candidates.includes(c)).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} (other trade)</SelectItem>)}
                  </SelectContent>
                </Select>
              </SideField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Calendar} label="Reported" value={`${formatDate(r.reportedAt)} via ${r.source}`} />
              <Row icon={Calendar} label="Due" value={formatDate(r.dueAt)} warn={isOverdue(r)} />
              {r.resolvedAt && <Row icon={Check} label="Resolved" value={formatDate(r.resolvedAt)} />}
              <Row icon={Building2} label="Location" value={`${property.name} · ${L.location(r)}`} />
              {r.cost !== undefined && <Row icon={ClipboardList} label="Cost" value={formatCurrency(r.cost)} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tenant</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {tenant ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium"><User className="h-4 w-4 text-muted-foreground" /> {tenant.name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {tenant.email}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {tenant.phone}</div>
                </div>
              ) : (
                <p className="text-muted-foreground">{r.unitId ? "No tenant on record." : "Communal area — no tenant."}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Contractor</CardTitle>
              {contractor && <DemoBadge />}
            </CardHeader>
            <CardContent className="text-sm">
              {contractor ? (
                <div className="space-y-1.5">
                  <Link to={`/app/contractors/${contractor.id}`} className="flex items-center gap-2 font-medium hover:underline"><HardHat className="h-4 w-4 text-muted-foreground" /> {contractor.name}</Link>
                  <div className="text-muted-foreground">{contractor.email} · {contractor.phone}</div>
                  <div className="text-xs text-muted-foreground">★ {contractor.rating.toFixed(1)} · {Math.round(contractor.firstTimeFixRate * 100)}% first-time fix · ~{contractor.avgResponseHours}h response</div>
                  {brief && <div className="pt-2"><Badge variant={brief.status === "Draft" ? "secondary" : "success"}>Brief {brief.status.toLowerCase()}</Badge></div>}
                </div>
              ) : (
                <p className="text-muted-foreground">Not yet assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function SideField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
function Row({ icon: Icon, label, value, warn }: { icon: typeof Calendar; label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn(warn && "font-medium text-red-600")}>{value}</div>
      </div>
    </div>
  );
}
