import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertOctagon, ArrowRight, Building, ClipboardList, Clock, Copy, HardHat, Repeat, Sparkles, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { AIBadge, CATEGORY_META, CategoryIcon, PageHeader, PriorityBadge, StatCard, StatusBadge } from "@/components/shared";
import { FilterBar, useRequestFilters } from "@/components/filters";
import { isOpenStatus, isOverdue, useLookups, useStore } from "@/data/store";
import { ISSUE_CATEGORIES } from "@/data/types";
import { daysAgo, daysBetween, DEMO_NOW, formatDate } from "@/lib/utils";

export default function Dashboard() {
  const store = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const { filters, set, reset, apply } = useRequestFilters();

  const filtered = useMemo(() => apply(store.requests), [apply, store.requests]);
  // Open/overdue counts ignore the date range so older open items aren't hidden
  const openScope = useMemo(
    () => store.requests.filter((r) => isOpenStatus(r.status) && (filters.property === "all" || r.propertyId === filters.property) && (filters.building === "all" || r.buildingId === filters.building) && (filters.category === "all" || r.category === filters.category) && (filters.priority === "all" || r.priority === filters.priority)),
    [store.requests, filters]
  );

  const overdue = openScope.filter(isOverdue);
  const pendingDupes = store.duplicates.filter((d) => d.status === "pending" && (filters.property === "all" || L.request(d.primaryId)?.propertyId === filters.property));
  const recurring = store.recurring.filter((r) => (filters.property === "all" || r.propertyId === filters.property) && (filters.building === "all" || r.buildingId === filters.building) && (filters.category === "all" || r.category === filters.category));
  const inProgress = openScope.filter((r) => r.contractorId && (r.status === "Assigned" || r.status === "In Progress"));
  const resolved = filtered.filter((r) => r.resolvedAt);
  const avgRes = resolved.length ? resolved.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / resolved.length : 0;
  const propCount = filters.property === "all" ? store.properties.length : 1;
  const unitCount = store.units.filter((u) => filters.property === "all" || u.propertyId === filters.property).length;

  // weekly trend (last 12 weeks), independent of range filter
  const trend = useMemo(() => {
    const scoped = store.requests.filter((r) => (filters.property === "all" || r.propertyId === filters.property) && (filters.building === "all" || r.buildingId === filters.building) && (filters.category === "all" || r.category === filters.category) && (filters.priority === "all" || r.priority === filters.priority));
    return Array.from({ length: 12 }, (_, i) => {
      const start = 7 * (11 - i) + 7;
      const end = 7 * (11 - i);
      const wk = scoped.filter((r) => daysAgo(r.reportedAt) < start && daysAgo(r.reportedAt) >= end);
      const d = new Date(DEMO_NOW);
      d.setDate(d.getDate() - end);
      return { week: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), reported: wk.length, repeat: wk.filter((r) => store.recurring.some((x) => x.requests.some((y) => y.id === r.id))).length };
    });
  }, [store.requests, store.recurring, filters]);

  const byCategory = ISSUE_CATEGORIES.map((c) => ({ name: c, value: filtered.filter((r) => r.category === c).length, color: CATEGORY_META[c].chart })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);

  const activity = useMemo(
    () =>
      filtered
        .flatMap((r) => r.timeline.map((e) => ({ ...e, request: r })))
        .sort((a, b) => +new Date(b.at) - +new Date(a.at))
        .slice(0, 8),
    [filtered]
  );

  return (
    <>
      <PageHeader
        title={`Good morning, ${store.user?.name.split(" ")[0]}`}
        description={`Here's what's happening across ${propCount} propert${propCount === 1 ? "y" : "ies"} and ${unitCount} units · ${formatDate(DEMO_NOW.toISOString(), { weekday: "long", day: "numeric", month: "long" })}`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/app/reports">View reports</Link>
          </Button>
        }
      />
      <div className="mb-5">
        <FilterBar filters={filters} set={set} reset={reset} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total properties" value={propCount} icon={Building} hint={`${unitCount} units under management`} onClick={() => navigate("/app/properties")} />
        <StatCard label="Open maintenance requests" value={openScope.length} icon={ClipboardList} tone="sky" hint={`${openScope.filter((r) => r.status === "New").length} new, awaiting triage`} onClick={() => navigate("/app/requests?status=open")} />
        <StatCard label="Overdue requests" value={overdue.length} icon={Clock} tone="red" hint="Past priority due date" onClick={() => navigate("/app/requests?overdue=1")} />
        <StatCard label="Potential duplicates" value={pendingDupes.length} icon={Copy} tone="violet" hint="Awaiting manager review" onClick={() => navigate("/app/duplicates")} />
        <StatCard label="Recurring issues detected" value={recurring.length} icon={Repeat} tone="amber" hint={`${recurring.filter((r) => r.riskLevel === "Critical").length} critical`} onClick={() => navigate("/app/recurring")} />
        <StatCard label="Contractor jobs in progress" value={inProgress.length} icon={HardHat} tone="sage" hint={`${new Set(inProgress.map((r) => r.contractorId)).size} contractors active`} onClick={() => navigate("/app/contractors")} />
        <StatCard label="Average resolution time" value={`${avgRes.toFixed(1)} days`} icon={Timer} tone="navy" hint={`${resolved.length} resolved in period`} />
        <StatCard label="Requests in period" value={filtered.length} icon={Sparkles} tone="violet" hint={`${filtered.filter((r) => r.ai?.reviewed === "pending").length} classifications to confirm`} onClick={() => navigate("/app/classification")} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Maintenance volume</CardTitle>
              <CardDescription>Requests reported per week · repeat-location reports highlighted</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#26406c" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#26406c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0a43a" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#e0a43a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1d4" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "#e8e1d4" }} />
                <Area type="monotone" dataKey="reported" name="All reports" stroke="#26406c" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="repeat" name="Repeat-location reports" stroke="#c98623" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By issue type</CardTitle>
            <CardDescription>{filtered.length} requests in selected period</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f3eee5" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" name="Requests" radius={[0, 4, 4, 0]} barSize={14}>
                  {byCategory.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-amber-500" /> Highest-risk recurring issues
              </CardTitle>
              <CardDescription className="mt-1">Locations where the same problem keeps coming back</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/recurring">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recurring.slice(0, 4).map((r) => (
              <Link key={r.id} to={`/app/recurring?focus=${r.id}`} className="flex items-center gap-3 rounded-lg border p-3 transition hover:border-amber-300 hover:bg-amber-50/40">
                <CategoryIcon category={r.category} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {r.pattern} · {L.property(r.propertyId)?.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.locationLabel} · {r.complaintCount} reports · {r.unsuccessfulRepairs} repair{r.unsuccessfulRepairs === 1 ? "" : "s"} didn't hold
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.riskLevel === "Critical" ? "bg-red-100 text-red-700" : r.riskLevel === "High" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{r.riskLevel}</span>
              </Link>
            ))}
            {recurring.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No recurring issues for this filter.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" /> Overdue
            </CardTitle>
            <span className="text-xs text-muted-foreground">{overdue.length} total</span>
          </CardHeader>
          <CardContent className="space-y-1">
            {overdue
              .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
              .slice(0, 6)
              .map((r) => (
                <Link key={r.id} to={`/app/requests/${r.id}`} className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-secondary">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.ref} · {L.property(r.propertyId)?.name}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <PriorityBadge priority={r.priority} />
                    <div className="mt-0.5 text-[11px] font-medium text-red-600">{daysAgo(r.dueAt)}d late</div>
                  </div>
                </Link>
              ))}
            {overdue.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing overdue 🎉</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent maintenance activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-warm-300 pl-5">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card ${a.type === "ai" ? "bg-violet-500" : a.type === "duplicate" ? "bg-violet-400" : a.type === "assigned" ? "bg-amber-400" : a.type === "status" ? "bg-sage-500" : "bg-navy-400"}`} />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <Link to={`/app/requests/${a.request.id}`} className="text-sm font-medium hover:underline">
                      {a.request.ref} · {a.request.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDate(a.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.text} — <span className="font-medium">{a.actor}</span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Duplicate review queue</CardTitle>
            <AIBadge />
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingDupes.slice(0, 4).map((d) => {
              const p = L.request(d.primaryId);
              return (
                <Link key={d.id} to="/app/duplicates" className="block rounded-lg border p-3 hover:bg-secondary/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-700">{d.score}% match</span>
                    <span className="text-[11px] text-muted-foreground">{d.matchIds.length + 1} requests</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-medium">{d.suggestedGroupTitle}</div>
                  <div className="truncate text-xs text-muted-foreground">{p && L.property(p.propertyId)?.name}</div>
                </Link>
              );
            })}
            {pendingDupes.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No duplicates awaiting review.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Newest requests</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/requests">
              All requests <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y">
          {[...filtered]
            .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt))
            .slice(0, 6)
            .map((r) => (
              <Link key={r.id} to={`/app/requests/${r.id}`} className="flex items-center gap-3 py-2.5 hover:bg-warm-50">
                <CategoryIcon category={r.category} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.ref} · {L.property(r.propertyId)?.name} · {L.location(r)}
                  </div>
                </div>
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} className="hidden sm:inline-flex" />
              </Link>
            ))}
        </CardContent>
      </Card>
    </>
  );
}
