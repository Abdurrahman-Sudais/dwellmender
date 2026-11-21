import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Clock, HardHat, Mail, MapPin, Phone, PoundSterling, Repeat, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { CATEGORY_META, CategoryLabel, DemoBadge, EmptyState, StatCard, StatusBadge } from "@/components/shared";
import { useLookups, useStore } from "@/data/store";
import { cn, DEMO_NOW, formatCurrency, formatDate, initials } from "@/lib/utils";
import { contractorStats } from "./Contractors";

export default function ContractorDetail() {
  const { id } = useParams();
  const store = useStore();
  const L = useLookups();
  const c = store.contractors.find((x) => x.id === id);
  if (!c) return <EmptyState icon={HardHat} title="Contractor not found" action={<Button asChild><Link to="/app/contractors">Back</Link></Button>} />;

  const recurringReqIds = new Set(store.recurring.flatMap((r) => r.requests.slice(0, -1).map((x) => x.id)));
  const s = contractorStats(c.id, store.requests, recurringReqIds);
  const jobs = [...s.jobs].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
  const involvedIn = store.recurring.filter((r) => r.contractorIds.includes(c.id));

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(DEMO_NOW);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const inMonth = s.jobs.filter((r) => {
      const x = new Date(r.reportedAt);
      return `${x.getFullYear()}-${x.getMonth()}` === key;
    });
    return { month: d.toLocaleDateString("en-GB", { month: "short" }), jobs: inMonth.length, spend: inMonth.reduce((t, r) => t + (r.cost ?? 0), 0) };
  });

  return (
    <>
      <Link to="/app/contractors" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Contractors
      </Link>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card md:flex-row md:items-center">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-navy-900 font-display text-xl font-bold text-warm-100">{initials(c.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">{c.name}</h1>
            <DemoBadge />
            <Badge variant={c.status === "Active" ? "success" : "warning"}>{c.status}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><HardHat className="h-4 w-4" /> {c.contactName}</span>
            <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {c.email}</span>
            <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {c.phone}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {c.coverage}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {c.categories.map((k) => {
              const M = CATEGORY_META[k];
              return <span key={k} className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", M.color)}><M.icon className="h-3 w-3" /> {k}</span>;
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Active
          <Switch checked={c.status === "Active"} onCheckedChange={(v) => { store.updateContractor(c.id, { status: v ? "Active" : "On hold" }); toast.success(`${c.name} ${v ? "activated" : "put on hold"}`); }} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Rating" value={<span className="inline-flex items-center gap-1"><Star className="h-5 w-5 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>} icon={Star} tone="amber" />
        <StatCard label="Jobs (all time)" value={s.jobs.length} icon={Wrench} hint={`${s.active.length} active`} />
        <StatCard label="Avg time to resolve" value={`${s.avgDays.toFixed(1)}d`} icon={Clock} tone="sky" hint={`~${c.avgResponseHours}h first response`} />
        <StatCard label="Callbacks on recurring issues" value={s.callbacks} icon={Repeat} tone={s.callbacks >= 3 ? "red" : "violet"} hint="Repairs later reported again" />
        <StatCard label="Total billed" value={formatCurrency(s.spend)} icon={PoundSterling} tone="sage" hint={`£${c.hourlyRate}/hr`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Jobs per month</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1d4" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => (n === "spend" ? formatCurrency(v) : v)} />
                <Bar dataKey="jobs" fill="#26406c" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Performance record</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Perf label="First-time fix rate" value={c.firstTimeFixRate} />
            <Perf label="On-time completion" value={s.done.length ? s.done.filter((r) => new Date(r.resolvedAt!) <= new Date(r.dueAt)).length / s.done.length : 0} />
            <Perf label="Repairs without callback" value={s.done.length ? 1 - s.callbacks / s.done.length : 0} />
            {involvedIn.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Involved in <strong>{involvedIn.length}</strong> recurring issue{involvedIn.length === 1 ? "" : "s"}:{" "}
                {involvedIn.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && ", "}
                    <Link to={`/app/recurring?focus=${r.id}`} className="underline">{L.property(r.propertyId)?.name.split(" ")[0]} · {r.locationLabel.split(" · ")[1]}</Link>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Assigned jobs & service history</CardTitle>
          <CardDescription>{jobs.length} jobs</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link to={`/app/requests/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                  <div className="text-xs text-muted-foreground">{r.ref} · {L.property(r.propertyId)?.name} · {L.location(r)}</div>
                  {recurringReqIds.has(r.id) && <Badge variant="warning" className="mt-1">Issue recurred after this repair</Badge>}
                </TableCell>
                <TableCell><CategoryLabel category={r.category} /></TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-sm">{formatDate(r.reportedAt)}</TableCell>
                <TableCell className="text-sm">{r.resolvedAt ? formatDate(r.resolvedAt) : "—"}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{r.cost ? formatCurrency(r.cost) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Perf({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between text-xs"><span>{label}</span><span className="font-semibold tabular-nums">{pct}%</span></div>
      <Progress value={pct} className="mt-1" indicatorClassName={pct >= 80 ? "bg-sage-600" : pct >= 60 ? "bg-amber-400" : "bg-red-400"} />
    </div>
  );
}
