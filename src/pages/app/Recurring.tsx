import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { AlertTriangle, ArrowRight, CalendarClock, FileText, HardHat, PoundSterling, Repeat, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { AIBadge, CATEGORY_META, CategoryIcon, CategoryLabel, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/shared";
import { useLookups, useStore } from "@/data/store";
import type { RecurringIssue, RecurringPattern } from "@/services/recurring";
import { cn, daysAgo, formatCurrency, formatDate } from "@/lib/utils";

const PATTERNS: RecurringPattern[] = ["Persistent water leak", "Repeated plumbing complaint", "Recurring electrical problem", "Repeated equipment failure", "Repeated roof damage", "Recurring pest activity", "Recurring structural defect", "Repeated maintenance issue"];
const RISK_STYLE = { Critical: "bg-red-100 text-red-700 border-red-200", High: "bg-amber-100 text-amber-800 border-amber-200", Moderate: "bg-slate-100 text-slate-600 border-slate-200" };

export default function Recurring() {
  const store = useStore();
  const L = useLookups();
  const [params, setParams] = useSearchParams();
  const [property, setProperty] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [onlyFailed, setOnlyFailed] = useState(false);

  const list = useMemo(
    () => store.recurring.filter((r) => (property === "all" || r.propertyId === property) && (pattern === "all" || r.pattern === pattern) && (!onlyFailed || r.unsuccessfulRepairs > 0)),
    [store.recurring, property, pattern, onlyFailed]
  );
  const focusId = params.get("focus") ?? list[0]?.id;
  const focus = store.recurring.find((r) => r.id === focusId) ?? list[0];

  useEffect(() => {
    if (params.get("focus")) document.getElementById(params.get("focus")!)?.scrollIntoView({ block: "nearest" });
  }, [params]);

  // properties ranked by recurring burden
  const propertyRank = useMemo(() => {
    const m = new Map<string, { issues: number; reports: number; failed: number; spend: number }>();
    store.recurring.forEach((r) => {
      const e = m.get(r.propertyId) ?? { issues: 0, reports: 0, failed: 0, spend: 0 };
      e.issues++;
      e.reports += r.complaintCount;
      e.failed += r.unsuccessfulRepairs;
      e.spend += r.totalSpend;
      m.set(r.propertyId, e);
    });
    return [...m.entries()].sort((a, b) => b[1].reports + b[1].failed * 2 - (a[1].reports + a[1].failed * 2));
  }, [store.recurring]);

  const totals = {
    issues: store.recurring.length,
    reports: store.recurring.reduce((s, r) => s + r.complaintCount, 0),
    failed: store.recurring.reduce((s, r) => s + r.unsuccessfulRepairs, 0),
    spend: store.recurring.reduce((s, r) => s + r.totalSpend, 0),
  };

  return (
    <>
      <PageHeader
        title="Recurring issue intelligence"
        eyebrow={<AIBadge label="Simulated pattern detection" />}
        description="Locations where 3+ related requests occurred in the last 12 months — ranked by recurrence, unsuccessful repairs, open work and spend."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Recurring issues" value={totals.issues} icon={Repeat} tone="amber" hint={`${store.recurring.filter((r) => r.riskLevel === "Critical").length} critical`} />
        <StatCard label="Related complaints" value={totals.reports} icon={AlertTriangle} tone="red" hint="Across recurring locations" />
        <StatCard label="Repairs that didn't hold" value={totals.failed} icon={Wrench} tone="violet" hint="Same issue reported within 90 days" />
        <StatCard label="Spent on repeat repairs" value={formatCurrency(totals.spend)} icon={PoundSterling} tone="navy" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recurrence map</CardTitle>
            <CardDescription>Each bubble is a recurring location — further right means more complaints, higher means more failed repairs, bigger means more spend.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: -10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d4" />
                <XAxis type="number" dataKey="x" name="Complaints" tick={{ fontSize: 11 }} allowDecimals={false} domain={[2, "dataMax + 1"]} label={{ value: "Complaints", position: "insideBottom", offset: -4, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Failed repairs" tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, "dataMax + 1"]} />
                <ZAxis type="number" dataKey="z" range={[80, 600]} name="Spend" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ payload }) => {
                    const d = payload?.[0]?.payload as (RecurringIssue & { x: number }) | undefined;
                    if (!d) return null;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-lift">
                        <div className="font-semibold">{d.pattern}</div>
                        <div>{L.property(d.propertyId)?.name} · {d.locationLabel}</div>
                        <div>{d.complaintCount} complaints · {d.unsuccessfulRepairs} failed · {formatCurrency(d.totalSpend)}</div>
                      </div>
                    );
                  }}
                />
                {Object.keys(CATEGORY_META).map((cat) => (
                  <Scatter
                    key={cat}
                    data={list.filter((r) => r.category === cat).map((r) => ({ ...r, x: r.complaintCount, y: r.unsuccessfulRepairs, z: r.totalSpend + 100 }))}
                    fill={CATEGORY_META[cat as keyof typeof CATEGORY_META].chart}
                    fillOpacity={0.75}
                    onClick={(d) => setParams({ focus: (d as unknown as RecurringIssue).id })}
                    className="cursor-pointer"
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Properties to prioritise</CardTitle>
            <CardDescription>Ranked by recurring complaints and failed repairs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {propertyRank.map(([pid, e], i) => (
              <button key={pid} onClick={() => setProperty(pid)} className={cn("flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition hover:bg-secondary", property === pid && "border-navy-400 bg-secondary")}>
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-red-100 text-red-700" : i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{L.property(pid)?.name}</div>
                  <div className="text-xs text-muted-foreground">{e.issues} issue{e.issues === 1 ? "" : "s"} · {e.reports} reports · {e.failed} failed repairs</div>
                </div>
                <span className="text-xs font-medium tabular-nums">{formatCurrency(e.spend)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Select value={property} onValueChange={setProperty}>
          <SelectTrigger className="w-[210px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {store.properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={pattern} onValueChange={setPattern}>
          <SelectTrigger className="w-[230px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All patterns</SelectItem>
            {PATTERNS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={() => setOnlyFailed((x) => !x)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", onlyFailed ? "border-amber-400 bg-amber-100 text-amber-800" : "bg-card")}>
          Repairs that appear unsuccessful
        </button>
      </div>

      {list.length === 0 ? (
        <div className="mt-4"><EmptyState icon={Repeat} title="No recurring issues match" description="Try clearing the filters." /></div>
      ) : (
        <div className="mt-4 grid gap-6 xl:grid-cols-[400px_1fr]">
          <div className="space-y-2">
            {list.map((r) => (
              <button
                id={r.id}
                key={r.id}
                onClick={() => setParams({ focus: r.id })}
                className={cn("w-full rounded-lg border bg-card p-3 text-left shadow-card transition hover:border-amber-300", focus?.id === r.id && "border-amber-400 ring-2 ring-amber-200")}
              >
                <div className="flex items-start gap-3">
                  <CategoryIcon category={r.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{r.pattern}</span>
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", RISK_STYLE[r.riskLevel])}>{r.riskLevel}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{L.property(r.propertyId)?.name} · {r.locationLabel}</div>
                    <div className="mt-2 flex gap-0.5">
                      {r.requests.map((q) => (
                        <span key={q.id} title={`${q.ref} · ${formatDate(q.reportedAt)}`} className={cn("h-1.5 flex-1 rounded-full", q.status === "Resolved" || q.status === "Closed" ? "bg-sage-400" : "bg-amber-400")} />
                      ))}
                    </div>
                    <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
                      <span>{r.complaintCount} reports</span>
                      <span>{r.unsuccessfulRepairs} failed repairs</span>
                      <span>every ~{r.avgIntervalDays}d</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {focus && <IssueDetail issue={focus} />}
        </div>
      )}
    </>
  );
}

function IssueDetail({ issue }: { issue: RecurringIssue }) {
  const L = useLookups();
  const navigate = useNavigate();
  const property = L.property(issue.propertyId)!;
  const latestOpen = [...issue.requests].reverse().find((r) => r.status !== "Resolved" && r.status !== "Closed");
  const target = latestOpen ?? issue.requests[issue.requests.length - 1];

  return (
    <Card className="self-start">
      <CardHeader className="border-b bg-warm-50/70">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", RISK_STYLE[issue.riskLevel])}>{issue.riskLevel} · risk {issue.riskScore}</span>
              {issue.unsuccessfulRepairs >= 2 && <Badge variant="warning">Repairs appear unsuccessful</Badge>}
            </div>
            <h2 className="mt-2 text-xl font-bold text-navy-900">{issue.pattern}</h2>
            <div className="text-sm text-muted-foreground">
              <Link to={`/app/properties/${property.id}`} className="hover:underline">{property.name}</Link> · {issue.locationLabel}
            </div>
          </div>
          <Button variant="accent" onClick={() => navigate(`/app/briefs/${target.id}`)}>
            <FileText /> Prepare contractor brief
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini icon={Repeat} label="Previous complaints" value={issue.complaintCount - 1} />
          <Mini icon={CalendarClock} label="Recurrence" value={`~${issue.avgIntervalDays} days`} />
          <Mini icon={HardHat} label="Contractors involved" value={issue.contractorIds.length} />
          <Mini icon={PoundSterling} label="Total spend" value={formatCurrency(issue.totalSpend)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issue category</div>
            <div className="mt-1"><CategoryLabel category={issue.category} /></div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous repair dates</div>
            <div className="mt-1">{issue.repairDates.length ? issue.repairDates.map((d) => formatDate(d, { day: "numeric", month: "short" })).join(" · ") : "None completed"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contractors</div>
            <div className="mt-1">{issue.contractorIds.map((c) => L.contractor(c)?.name).join(", ") || "None assigned"}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resolution history</div>
          <ol className="relative space-y-4 border-l-2 border-warm-300 pl-5">
            {issue.requests.map((r, i) => {
              const next = issue.requests[i + 1];
              const failed = r.resolvedAt && next && new Date(next.reportedAt) > new Date(r.resolvedAt) && daysAgo(r.resolvedAt) - daysAgo(next.reportedAt) <= 90;
              return (
                <li key={r.id} className="relative">
                  <span className={cn("absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-card", r.status === "Resolved" || r.status === "Closed" ? (failed ? "bg-amber-400" : "bg-sage-500") : "bg-red-500")} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/app/requests/${r.id}`} className="text-sm font-medium hover:underline">{r.title}</Link>
                    <StatusBadge status={r.status} />
                    {failed && <Badge variant="warning">Recurred {daysAgo(r.resolvedAt!) - daysAgo(next.reportedAt)}d after repair</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.ref} · reported {formatDate(r.reportedAt)}
                    {r.resolvedAt && ` · repaired ${formatDate(r.resolvedAt)}`}
                    {r.contractorId && ` · ${L.contractor(r.contractorId)?.name}`}
                    {r.cost ? ` · ${formatCurrency(r.cost)}` : ""}
                    {r.unitId && r.unitId !== issue.unitId && ` · ${L.unit(r.unitId)?.label}`}
                  </div>
                  {r.contractorNotes && <div className="mt-1 rounded bg-warm-100 px-2 py-1 text-xs italic text-navy-700">"{r.contractorNotes}"</div>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" /> Suggested next step <AIBadge className="ml-1" /></div>
          <p className="mt-1 text-amber-900">
            {issue.unsuccessfulRepairs >= 2
              ? `${issue.unsuccessfulRepairs} repairs here didn't prevent recurrence. Commission a root-cause investigation rather than another like-for-like repair, and include all ${issue.complaintCount} reports in the contractor brief.`
              : `Monitor closely — ${issue.complaintCount} related reports in 12 months. Include the full history in the next contractor brief.`}
          </p>
          <Button size="sm" variant="link" className="mt-1 h-auto p-0 text-amber-800" asChild>
            <Link to={`/app/requests/${target.id}`}>Open latest request {target.ref} <ArrowRight /></Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Repeat; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-warm-50 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="mt-1 font-display text-lg font-bold text-navy-900">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
