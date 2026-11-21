import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, HardHat, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Checkbox, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { CATEGORY_META, DemoBadge, PageHeader, StatusBadge } from "@/components/shared";
import { isOpenStatus, useStore } from "@/data/store";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/data/types";
import { cn, initials } from "@/lib/utils";
import { Fld } from "./Properties";

export function contractorStats(contractorId: string, requests: ReturnType<typeof useStore>["requests"], recurringReqIds: Set<string>) {
  const jobs = requests.filter((r) => r.contractorId === contractorId);
  const active = jobs.filter((r) => isOpenStatus(r.status));
  const done = jobs.filter((r) => r.resolvedAt);
  const callbacks = done.filter((r) => recurringReqIds.has(r.id)).length;
  const spend = jobs.reduce((s, r) => s + (r.cost ?? 0), 0);
  const avgDays = done.length ? done.reduce((s, r) => s + (new Date(r.resolvedAt!).getTime() - new Date(r.reportedAt).getTime()) / 86400000, 0) / done.length : 0;
  return { jobs, active, done, callbacks, spend, avgDays };
}

export default function Contractors() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const recurringReqIds = new Set(store.recurring.flatMap((r) => r.requests.slice(0, -1).map((x) => x.id)));

  const list = store.contractors.filter((c) => (cat === "all" || c.categories.includes(cat as IssueCategory)) && `${c.name} ${c.coverage} ${c.categories.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const activeJobs = store.requests.filter((r) => r.contractorId && isOpenStatus(r.status)).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));

  return (
    <>
      <PageHeader
        title="Contractors"
        description="Profiles, service categories, assigned jobs, service history and performance."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add contractor
          </Button>
        }
      />
      <div className="mb-5 rounded-lg border border-dashed bg-warm-50 px-4 py-3 text-sm text-navy-700">
        <strong>Demonstration records.</strong> The contractors below are generic sample profiles created for this demo. They do not represent real businesses, and contact details use reserved example domains and numbers.
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contractors…" className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All service categories</SelectItem>
            {ISSUE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => {
          const s = contractorStats(c.id, store.requests, recurringReqIds);
          return (
            <Link key={c.id} to={`/app/contractors/${c.id}`}>
              <Card className="h-full p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-900 font-display text-sm font-bold text-warm-100">{initials(c.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{c.name}</span>
                      {c.status === "On hold" && <Badge variant="warning">On hold</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.coverage}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.categories.map((k) => {
                        const M = CATEGORY_META[k];
                        return (
                          <span key={k} className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", M.color)}>
                            <M.icon className="h-3 w-3" /> {k}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <DemoBadge />
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 border-t pt-3 text-center">
                  <Stat label="Rating" value={<span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>} />
                  <Stat label="First fix" value={`${Math.round(c.firstTimeFixRate * 100)}%`} warn={c.firstTimeFixRate < 0.6} />
                  <Stat label="Active" value={s.active.length} />
                  <Stat label="Callbacks" value={s.callbacks} warn={s.callbacks >= 3} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-8">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">Job tracking</h3>
            <p className="text-sm text-muted-foreground">{activeJobs.length} active contractor jobs</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeJobs.slice(0, 15).map((r) => {
              const overdue = new Date(r.dueAt) < new Date("2026-11-21T09:00:00Z");
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/app/requests/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                    <div className="text-xs text-muted-foreground">{r.ref} · {store.properties.find((p) => p.id === r.propertyId)?.name}</div>
                  </TableCell>
                  <TableCell className="text-sm">{store.contractors.find((c) => c.id === r.contractorId)?.name}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className={cn("text-sm", overdue && "font-medium text-red-600")}>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select value={r.status} onValueChange={(s) => { store.setStatus(r.id, s as typeof r.status); toast.success(`${r.ref} → ${s}`); }}>
                      <SelectTrigger className="ml-auto h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{(["Assigned", "In Progress", "Resolved"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <AddContractorDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div>
      <div className={cn("text-sm font-semibold", warn && "text-amber-600")}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

const schema = z.object({
  name: z.string().min(2, "Name required"),
  contactName: z.string().min(2, "Contact required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Phone required"),
  coverage: z.string().min(2, "Coverage area required"),
  hourlyRate: z.coerce.number().min(0),
  categories: z.array(z.enum(ISSUE_CATEGORIES)).min(1, "Choose at least one service category"),
});
type Values = z.infer<typeof schema>;

function AddContractorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useStore();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { categories: [], hourlyRate: 60 } });
  const cats = watch("categories");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add contractor</DialogTitle>
          <DialogDescription>Performance metrics start empty and build up as jobs are completed.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={handleSubmit((v) => {
            store.addContractor({ ...v, rating: 0, avgResponseHours: 0, firstTimeFixRate: 0, status: "Active", joined: new Date().toISOString() });
            toast.success(`${v.name} added`);
            reset();
            onOpenChange(false);
          })}
        >
          <Fld label="Company name" error={errors.name?.message} className="sm:col-span-2"><Input {...register("name")} /></Fld>
          <Fld label="Contact name" error={errors.contactName?.message}><Input {...register("contactName")} /></Fld>
          <Fld label="Coverage area" error={errors.coverage?.message}><Input {...register("coverage")} /></Fld>
          <Fld label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Fld>
          <Fld label="Phone" error={errors.phone?.message}><Input {...register("phone")} /></Fld>
          <Fld label="Hourly rate (£)"><Input type="number" {...register("hourlyRate")} /></Fld>
          <div className="sm:col-span-2">
            <div className="mb-1.5 text-xs font-medium">Service categories</div>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={cats.includes(c)} onCheckedChange={(ch) => setValue("categories", ch ? [...cats, c] : cats.filter((x) => x !== c), { shouldValidate: true })} /> {c}
                </label>
              ))}
            </div>
            {errors.categories && <p className="mt-1 text-xs text-destructive">{errors.categories.message}</p>}
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit"><HardHat /> Add contractor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
