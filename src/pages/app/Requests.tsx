import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpDown, ClipboardList, Copy, Download, Image as ImageIcon, Plus, Repeat, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { CategoryLabel, EmptyState, PageHeader, PriorityBadge, StatusBadge } from "@/components/shared";
import { FilterBar, useRequestFilters } from "@/components/filters";
import { isOverdue, useLookups, useStore } from "@/data/store";
import { PRIORITIES, STATUSES } from "@/data/types";
import { cn, daysAgo, formatDate } from "@/lib/utils";
import { downloadCSV } from "@/lib/export";

type SortKey = "reportedAt" | "priority" | "status";

export default function Requests() {
  const store = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const overdueOnly = params.get("overdue") === "1";
  const { filters, set, reset, apply } = useRequestFilters({ range: "all", status: params.get("status") ?? "all" });
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "reportedAt", dir: -1 });

  const recurringIds = useMemo(() => new Set(store.recurring.flatMap((r) => r.requests.map((x) => x.id))), [store.recurring]);
  const dupIds = useMemo(() => new Set(store.duplicates.filter((d) => d.status === "pending").flatMap((d) => [d.primaryId, ...d.matchIds])), [store.duplicates]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apply(store.requests)
      .filter((r) => !overdueOnly || isOverdue(r))
      .filter((r) => {
        if (!needle) return true;
        const hay = `${r.ref} ${r.title} ${r.description} ${L.property(r.propertyId)?.name} ${L.location(r)} ${L.tenant(r.tenantId)?.name ?? ""}`.toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (sort.key === "reportedAt") return sort.dir * (+new Date(a.reportedAt) - +new Date(b.reportedAt));
        if (sort.key === "priority") return sort.dir * (PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));
        return sort.dir * (STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
      });
  }, [apply, store.requests, q, sort, overdueOnly, L]);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));

  const exportCsv = () =>
    downloadCSV(
      "dwellmender-requests.csv",
      rows.map((r) => ({
        Reference: r.ref,
        Title: r.title,
        Property: L.property(r.propertyId)?.name ?? "",
        Location: L.location(r),
        Category: r.category,
        Priority: r.priority,
        Status: r.status,
        Reported: r.reportedAt.slice(0, 10),
        Resolved: r.resolvedAt?.slice(0, 10) ?? "",
        Contractor: L.contractor(r.contractorId)?.name ?? "",
        Cost: r.cost ?? "",
      }))
    );

  return (
    <>
      <PageHeader
        title="Maintenance requests"
        description="Every report from every channel, with AI classification, duplicate and recurrence signals."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/classification?tab=documents">
                <Upload /> Upload report
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/requests/new">
                <Plus /> New request
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", "open", ...STATUSES] as const).map((s) => {
          const n = s === "all" ? store.requests.length : s === "open" ? store.requests.filter((r) => r.status !== "Resolved" && r.status !== "Closed").length : store.requests.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => set("status", s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", filters.status === s ? "border-navy-900 bg-navy-900 text-white" : "bg-card hover:bg-secondary")}
            >
              {s === "all" ? "All" : s === "open" ? "Open" : s} <span className="ml-1 opacity-60">{n}</span>
            </button>
          );
        })}
        {overdueOnly && (
          <button onClick={() => setParams({})} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Overdue only ✕
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, title, tenant, unit…" className="pl-9" />
        </div>
        <FilterBar filters={filters} set={set} reset={reset} />
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={ClipboardList} title="No requests match these filters" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">Request</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-1" onClick={() => toggleSort("priority")}>
                    Priority <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
                    Status <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-1" onClick={() => toggleSort("reportedAt")}>
                    Reported <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 200).map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/app/requests/${r.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{r.title}</span>
                      {r.photos.length > 0 && <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                      {recurringIds.has(r.id) && (
                        <Badge variant="warning" className="px-1.5">
                          <Repeat className="h-3 w-3" /> Recurring
                        </Badge>
                      )}
                      {dupIds.has(r.id) && (
                        <Badge variant="ai" className="px-1.5">
                          <Copy className="h-3 w-3" /> Possible duplicate
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {r.ref} · {L.property(r.propertyId)?.name} · {L.location(r)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryLabel category={r.category} />
                    {r.ai?.reviewed === "pending" && <div className="text-[10px] font-medium text-violet-600">AI suggestion pending</div>}
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={r.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                    {isOverdue(r) && <div className="mt-0.5 text-[10px] font-semibold text-red-600">Overdue {daysAgo(r.dueAt)}d</div>}
                  </TableCell>
                  <TableCell className="text-sm">{L.contractor(r.contractorId)?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(r.reportedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          Showing {Math.min(rows.length, 200)} of {rows.length} requests
        </div>
      </Card>
    </>
  );
}
