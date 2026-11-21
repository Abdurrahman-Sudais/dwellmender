import { Link } from "react-router-dom";
import { FileText, Repeat, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { AIBadge, CategoryIcon, EmptyState, PageHeader, PriorityBadge, StatusBadge } from "@/components/shared";
import { isOpenStatus, useLookups, useStore } from "@/data/store";
import { formatDate } from "@/lib/utils";

export default function Briefs() {
  const store = useStore();
  const L = useLookups();
  const recurringIds = new Set(store.recurring.flatMap((r) => r.requests.map((x) => x.id)));
  const briefed = new Set(store.briefs.map((b) => b.requestId));
  const ready = store.requests
    .filter((r) => isOpenStatus(r.status) && !briefed.has(r.id))
    .map((r) => ({ r, rec: recurringIds.has(r.id) }))
    .sort((a, b) => Number(b.rec) - Number(a.rec) || +new Date(b.r.reportedAt) - +new Date(a.r.reportedAt))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Contractor briefs"
        eyebrow={<AIBadge label="Simulated brief generation" />}
        description="Structured, history-aware briefs generated before dispatch. Managers edit and approve every brief before it's shared with a contractor."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Briefs</CardTitle>
          </CardHeader>
          {store.briefs.length === 0 ? (
            <CardContent>
              <EmptyState icon={FileText} title="No briefs yet" description="Generate one from any open request." />
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...store.briefs]
                  .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
                  .map((b) => {
                    const r = L.request(b.requestId);
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{r?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {r?.ref} · {r && L.property(r.propertyId)?.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{L.contractor(b.contractorId)?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === "Draft" ? "secondary" : b.status === "Approved" ? "info" : "success"}>
                            {b.status === "Shared" && <Send className="h-3 w-3" />} {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(b.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/app/briefs/${b.requestId}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready for a brief</CardTitle>
            <CardDescription>Open requests without a brief — recurring locations first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ready.map(({ r, rec }) => (
              <Link key={r.id} to={`/app/briefs/${r.id}`} className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-secondary">
                <CategoryIcon category={r.category} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{r.title}</span>
                    {rec && <Repeat className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.ref} · {L.property(r.propertyId)?.name}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} className="text-[10px]" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
