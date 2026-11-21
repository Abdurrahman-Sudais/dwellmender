import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { CATEGORY_META, PageHeader } from "@/components/shared";
import { isOpenStatus, useLookups, useStore } from "@/data/store";
import { ISSUE_CATEGORIES, STATUSES } from "@/data/types";
import { daysAgo, daysBetween, DEMO_NOW, formatCurrency, formatDate } from "@/lib/utils";
import { downloadCSV, downloadPDF } from "@/lib/export";

const PERIODS = [
  ["90", "Last 90 days"],
  ["180", "Last 6 months"],
  ["365", "Last 12 months"],
  ["all", "All time"],
] as const;

export default function Reports() {
  const store = useStore();
  const L = useLookups();
  const [property, setProperty] = useState("all");
  const [period, setPeriod] = useState("365");

  const reqs = useMemo(
    () => store.requests.filter((r) => (property === "all" || r.propertyId === property) && (period === "all" || daysAgo(r.reportedAt) <= Number(period))),
    [store.requests, property, period]
  );
  const recurring = store.recurring.filter((r) => property === "all" || r.propertyId === property);

  const byCategory = ISSUE_CATEGORIES.map((c) => {
    const rs = reqs.filter((r) => r.category === c);
    const res = rs.filter((r) => r.resolvedAt);
    return {
      name: c,
      requests: rs.length,
      spend: rs.reduce((s, r) => s + (r.cost ?? 0), 0),
      avgDays: res.length ? Number((res.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / res.length).toFixed(1)) : 0,
      color: CATEGORY_META[c].chart,
    };
  }).filter((x) => x.requests > 0);

  const byProperty = store.properties
    .filter((p) => property === "all" || p.id === property)
    .map((p) => {
      const rs = reqs.filter((r) => r.propertyId === p.id);
      const res = rs.filter((r) => r.resolvedAt);
      const rec = recurring.filter((r) => r.propertyId === p.id);
      return {
        name: p.name.split(" ")[0],
        full: p.name,
        requests: rs.length,
        recurringIssues: rec.length,
        recurringReports: rec.reduce((s, r) => s + r.complaintCount, 0),
        failed: rec.reduce((s, r) => s + r.unsuccessfulRepairs, 0),
        avgDays: res.length ? Number((res.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / res.length).toFixed(1)) : 0,
        spend: rs.reduce((s, r) => s + (r.cost ?? 0), 0),
        open: rs.filter((r) => isOpenStatus(r.status)).length,
      };
    });

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(DEMO_NOW);
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    const inMonth = reqs.filter((r) => {
      const x = new Date(r.reportedAt);
      return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
    });
    const resolvedIn = reqs.filter((r) => r.resolvedAt && new Date(r.resolvedAt).getFullYear() === d.getFullYear() && new Date(r.resolvedAt).getMonth() === d.getMonth());
    return {
      month: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      spend: resolvedIn.reduce((s, r) => s + (r.cost ?? 0), 0),
      requests: inMonth.length,
      avgDays: resolvedIn.length ? Number((resolvedIn.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / resolvedIn.length).toFixed(1)) : null,
    };
  });

  const recurringReqIds = new Set(recurring.flatMap((r) => r.requests.slice(0, -1).map((x) => x.id)));
  const contractorPerf = store.contractors
    .map((c) => {
      const jobs = reqs.filter((r) => r.contractorId === c.id);
      const done = jobs.filter((r) => r.resolvedAt);
      return {
        id: c.id,
        name: c.name,
        jobs: jobs.length,
        completed: done.length,
        avgDays: done.length ? Number((done.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / done.length).toFixed(1)) : 0,
        onTime: done.length ? Math.round((done.filter((r) => new Date(r.resolvedAt!) <= new Date(r.dueAt)).length / done.length) * 100) : 0,
        callbacks: done.filter((r) => recurringReqIds.has(r.id)).length,
        spend: jobs.reduce((s, r) => s + (r.cost ?? 0), 0),
        rating: c.rating,
      };
    })
    .filter((c) => c.jobs > 0)
    .sort((a, b) => b.jobs - a.jobs);

  const open = reqs.filter((r) => isOpenStatus(r.status));
  const outstandingByStatus = STATUSES.filter((s) => s !== "Resolved" && s !== "Closed").map((s) => ({ name: s, value: open.filter((r) => r.status === s).length }));
  const ageBuckets = [
    ["0–7 days", 0, 7],
    ["8–14 days", 8, 14],
    ["15–30 days", 15, 30],
    ["31+ days", 31, 9999],
  ].map(([label, lo, hi]) => ({ name: label as string, value: open.filter((r) => daysAgo(r.reportedAt) >= (lo as number) && daysAgo(r.reportedAt) <= (hi as number)).length }));

  const repeatIncidents = recurring
    .flatMap((iss) =>
      iss.requests
        .filter((r, i) => r.resolvedAt && iss.requests[i + 1] && daysBetween(r.resolvedAt, iss.requests[i + 1].reportedAt) <= 90 && daysBetween(r.resolvedAt, iss.requests[i + 1].reportedAt) >= 0)
        .map((r) => {
          const next = iss.requests[iss.requests.indexOf(r) + 1];
          return { r, next, iss, gap: daysBetween(r.resolvedAt!, next.reportedAt) };
        })
    )
    .sort((a, b) => +new Date(b.next.reportedAt) - +new Date(a.next.reportedAt));

  const totals = {
    requests: reqs.length,
    spend: reqs.reduce((s, r) => s + (r.cost ?? 0), 0),
    avg: (() => {
      const res = reqs.filter((r) => r.resolvedAt);
      return res.length ? res.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / res.length : 0;
    })(),
    open: open.length,
  };
  const scopeLabel = `${property === "all" ? "All properties" : L.property(property)?.name} · ${PERIODS.find((p) => p[0] === period)?.[1]}`;

  const exportPdf = () => {
    downloadPDF(
      "dwellmender-maintenance-report.pdf",
      "Maintenance Intelligence Report",
      `${scopeLabel} · generated ${formatDate(DEMO_NOW.toISOString())}`,
      [
        { title: "Maintenance requests by category", head: ["Category", "Requests", "Avg resolution (days)", "Spend"], body: byCategory.map((c) => [c.name, c.requests, c.avgDays, formatCurrency(c.spend)]) },
        { title: "Recurring problems by property", head: ["Property", "Recurring issues", "Related reports", "Failed repairs", "Open"], body: byProperty.map((p) => [p.full, p.recurringIssues, p.recurringReports, p.failed, p.open]) },
        { title: "Average resolution time by property", head: ["Property", "Requests", "Avg days", "Spend"], body: byProperty.map((p) => [p.full, p.requests, p.avgDays, formatCurrency(p.spend)]) },
        { title: "Contractor performance", subtitle: "Demonstration contractor records", head: ["Contractor", "Jobs", "Completed", "Avg days", "On time %", "Callbacks", "Spend"], body: contractorPerf.map((c) => [c.name, c.jobs, c.completed, c.avgDays, `${c.onTime}%`, c.callbacks, formatCurrency(c.spend)]) },
        { title: "Maintenance spending by month", head: ["Month", "Requests", "Spend"], body: months.map((m) => [m.month, m.requests, formatCurrency(m.spend)]) },
        { title: "Outstanding requests", head: ["Reference", "Title", "Property", "Status", "Priority", "Age (days)"], body: open.sort((a, b) => daysAgo(b.reportedAt) - daysAgo(a.reportedAt)).map((r) => [r.ref, r.title, L.property(r.propertyId)?.name ?? "", r.status, r.priority, daysAgo(r.reportedAt)]) },
        { title: "Repeated repair incidents", subtitle: "Issue reported again within 90 days of a completed repair", head: ["Repair", "Repaired", "Contractor", "Recurred", "Gap (days)", "Location"], body: repeatIncidents.map((x) => [x.r.ref, formatDate(x.r.resolvedAt!), L.contractor(x.r.contractorId)?.name ?? "", x.next.ref, x.gap, `${L.property(x.iss.propertyId)?.name} · ${x.iss.locationLabel}`]) },
      ],
      [
        ["Requests", String(totals.requests)],
        ["Open", String(totals.open)],
        ["Avg resolution", `${totals.avg.toFixed(1)} days`],
        ["Spend", formatCurrency(totals.spend)],
      ]
    );
    toast.success("PDF report downloaded");
  };

  const csv = (name: string, rows: Record<string, string | number>[]) => {
    downloadCSV(`dwellmender-${name}.csv`, rows);
    toast.success(`${name}.csv downloaded`);
  };

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description={scopeLabel}
        actions={
          <>
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger className="w-[200px] bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All properties</SelectItem>
                {store.properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px] bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><FileSpreadsheet /> CSV</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => csv("requests-by-category", byCategory.map((c) => ({ Category: c.name, Requests: c.requests, "Avg resolution days": c.avgDays, Spend: c.spend })))}>Requests by category</DropdownMenuItem>
                <DropdownMenuItem onClick={() => csv("recurring-by-property", byProperty.map((p) => ({ Property: p.full, "Recurring issues": p.recurringIssues, "Related reports": p.recurringReports, "Failed repairs": p.failed })))}>Recurring problems by property</DropdownMenuItem>
                <DropdownMenuItem onClick={() => csv("resolution-time", byProperty.map((p) => ({ Property: p.full, Requests: p.requests, "Avg resolution days": p.avgDays })))}>Average resolution time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => csv("contractor-performance", contractorPerf.map((c) => ({ Contractor: c.name, Jobs: c.jobs, Completed: c.completed, "Avg days": c.avgDays, "On time %": c.onTime, Callbacks: c.callbacks, Spend: c.spend })))}>Contractor performance</DropdownMenuItem>
                <DropdownMenuItem onClick={() => csv("spending-by-month", months.map((m) => ({ Month: m.month, Requests: m.requests, Spend: m.spend })))}>Maintenance spending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => csv("outstanding-requests", open.map((r) => ({ Reference: r.ref, Title: r.title, Property: L.property(r.propertyId)?.name ?? "", Status: r.status, Priority: r.priority, "Age days": daysAgo(r.reportedAt) })))}>Outstanding requests</DropdownMenuItem>
                <DropdownMenuItem onClick={() => csv("repeat-repairs", repeatIncidents.map((x) => ({ Repair: x.r.ref, Repaired: x.r.resolvedAt!.slice(0, 10), Contractor: L.contractor(x.r.contractorId)?.name ?? "", Recurred: x.next.ref, "Gap days": x.gap })))}>Repeated repair incidents</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={exportPdf}><FileDown /> Export PDF</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Requests", totals.requests],
          ["Outstanding", totals.open],
          ["Avg resolution", `${totals.avg.toFixed(1)} days`],
          ["Maintenance spend", formatCurrency(totals.spend)],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-4">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="mt-1 font-display text-2xl font-bold text-navy-900">{v}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Maintenance requests by category" desc="Volume in period">
          <BarChart data={byCategory} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1d4" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="requests" radius={[4, 4, 0, 0]}>{byCategory.map((c) => <Cell key={c.name} fill={c.color} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="Recurring problems by property" desc="Related reports at recurring locations vs. repairs that didn't hold">
          <BarChart data={byProperty} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1d4" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="recurringReports" name="Recurring reports" fill="#e0a43a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" name="Failed repairs" fill="#c95a6a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Average resolution time" desc="Days from report to resolution, by month resolved">
          <LineChart data={months} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1d4" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="avgDays" name="Avg days" stroke="#43654d" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ChartCard>
        <ChartCard title="Maintenance spending" desc="Cost of completed work by month">
          <BarChart data={months} margin={{ left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1d4" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="spend" name="Spend" fill="#26406c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding requests</CardTitle>
            <CardDescription>{open.length} open · by status and age</CardDescription>
          </CardHeader>
          <CardContent className="grid h-60 grid-cols-2 gap-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outstandingByStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {outstandingByStatus.map((_, i) => <Cell key={i} fill={["#26406c", "#7c3aed", "#e0a43a", "#3b82c4"][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageBuckets} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" name="Requests" radius={[0, 4, 4, 0]} barSize={16}>{ageBuckets.map((_, i) => <Cell key={i} fill={["#97b9a0", "#e0a43a", "#c98623", "#c95a6a"][i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[...byCategory].sort((a, b) => b.spend - a.spend).map((c) => {
              const max = Math.max(...byCategory.map((x) => x.spend), 1);
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-xs"><span>{c.name}</span><span className="font-medium tabular-nums">{formatCurrency(c.spend)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-secondary"><div className="h-2 rounded-full" style={{ width: `${(c.spend / max) * 100}%`, background: c.color }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contractor performance</CardTitle>
          <CardDescription>Demonstration contractor records · callbacks = completed repairs where the issue was reported again</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contractor</TableHead>
              <TableHead className="text-right">Jobs</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Avg days</TableHead>
              <TableHead className="text-right">On time</TableHead>
              <TableHead className="text-right">Callbacks</TableHead>
              <TableHead className="text-right">Spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contractorPerf.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-right tabular-nums">{c.jobs}</TableCell>
                <TableCell className="text-right tabular-nums">{c.completed}</TableCell>
                <TableCell className="text-right tabular-nums">{c.avgDays}</TableCell>
                <TableCell className="text-right tabular-nums">{c.onTime}%</TableCell>
                <TableCell className={`text-right tabular-nums ${c.callbacks >= 3 ? "font-semibold text-amber-700" : ""}`}>{c.callbacks}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(c.spend)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Repeated repair incidents</CardTitle>
            <CardDescription className="mt-1">Same issue reported again within 90 days of a completed repair</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => csv("repeat-repairs", repeatIncidents.map((x) => ({ Repair: x.r.ref, Repaired: x.r.resolvedAt!.slice(0, 10), Contractor: L.contractor(x.r.contractorId)?.name ?? "", Recurred: x.next.ref, "Gap days": x.gap })))}>
            <Download /> CSV
          </Button>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Repair</TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead>Recurred as</TableHead>
              <TableHead className="text-right">Days later</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repeatIncidents.map((x) => (
              <TableRow key={x.r.id}>
                <TableCell>
                  <div className="font-medium">{L.property(x.iss.propertyId)?.name}</div>
                  <div className="text-xs text-muted-foreground">{x.iss.locationLabel}</div>
                </TableCell>
                <TableCell className="text-sm">{x.r.ref} · {formatDate(x.r.resolvedAt!)}<div className="text-xs text-muted-foreground">{x.r.title}</div></TableCell>
                <TableCell className="text-sm">{L.contractor(x.r.contractorId)?.name}</TableCell>
                <TableCell className="text-sm">{x.next.ref} · {formatDate(x.next.reportedAt)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-amber-700">{x.gap}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function ChartCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="h-60">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
