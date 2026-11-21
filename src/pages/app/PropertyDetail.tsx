import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, ClipboardList, Mail, MapPin, Phone, Plus, PoundSterling, Repeat, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { CategoryIcon, CategoryLabel, EmptyState, PriorityBadge, StatCard, StatusBadge } from "@/components/shared";
import { isOpenStatus, useLookups, useStore } from "@/data/store";
import { cn, daysBetween, formatCurrency, formatDate, initials } from "@/lib/utils";
import { Fld, PropertySkyline } from "./Properties";

export default function PropertyDetail() {
  const { id } = useParams();
  const store = useStore();
  const L = useLookups();
  const p = store.properties.find((x) => x.id === id);
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "building" | "unit" | "tenant">(null);

  const data = useMemo(() => {
    if (!p) return null;
    const buildings = store.buildings.filter((b) => b.propertyId === p.id);
    const units = store.units.filter((u) => u.propertyId === p.id);
    const reqs = store.requests.filter((r) => r.propertyId === p.id).sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
    const tenants = store.tenants.filter((t) => units.some((u) => u.id === t.unitId));
    const recurring = store.recurring.filter((r) => r.propertyId === p.id);
    return { buildings, units, reqs, tenants, recurring };
  }, [p, store]);

  if (!p || !data) return <EmptyState icon={Building2} title="Property not found" action={<Button asChild><Link to="/app/properties">Back to properties</Link></Button>} />;

  const manager = L.manager(p.managerId);
  const open = data.reqs.filter((r) => isOpenStatus(r.status));
  const resolved = data.reqs.filter((r) => r.resolvedAt);
  const spend = data.reqs.reduce((s, r) => s + (r.cost ?? 0), 0);
  const avgRes = resolved.length ? resolved.reduce((s, r) => s + daysBetween(r.reportedAt, r.resolvedAt!), 0) / resolved.length : 0;
  const history = unitFilter ? data.reqs.filter((r) => (r.unitId ?? `communal-${r.buildingId}`) === unitFilter) : data.reqs;

  return (
    <>
      <Link to="/app/properties" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Properties
      </Link>
      <div className={`relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br ${p.accent} p-6 text-white`}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <PropertySkyline type={p.type} />
        <div className="relative">
          <Badge className="border-white/20 bg-white/15 text-white">{p.type}</Badge>
          <h1 className="mt-2 text-3xl font-bold">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {p.address}, {p.city} {p.postcode}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Built {p.yearBuilt}
            </span>
          </div>
          {p.notes && <p className="mt-3 max-w-2xl text-sm text-white/85">{p.notes}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Buildings / units" value={`${data.buildings.length} / ${data.units.length}`} icon={Building2} />
        <StatCard label="Tenants" value={data.tenants.length} icon={Users} tone="sage" hint={`${Math.round((data.tenants.length / Math.max(data.units.length, 1)) * 100)}% occupancy`} />
        <StatCard label="Open requests" value={open.length} icon={ClipboardList} tone="sky" />
        <StatCard label="Recurring issues" value={data.recurring.length} icon={Repeat} tone="amber" />
        <StatCard label="Maintenance spend" value={formatCurrency(spend)} icon={PoundSterling} tone="navy" hint={`Avg resolution ${avgRes.toFixed(1)} days`} />
      </div>

      <Tabs defaultValue="history" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="history">Maintenance history</TabsTrigger>
          <TabsTrigger value="structure">Buildings & units</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="recurring">
            Historical problems {data.recurring.length > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-navy-950">{data.recurring.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Maintenance timeline</CardTitle>
                  <CardDescription className="mt-1">{unitFilter ? `Filtered to ${unitFilter.startsWith("communal") ? "communal areas" : L.unit(unitFilter)?.label}` : `All ${data.reqs.length} requests at this property`}</CardDescription>
                </div>
                {unitFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setUnitFilter(null)}>
                    Clear filter
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-1 border-l-2 border-warm-300 pl-5">
                  {history.map((r) => (
                    <li key={r.id} className="relative">
                      <span className={cn("absolute -left-[27px] top-4 h-3 w-3 rounded-full ring-4 ring-card", isOpenStatus(r.status) ? "bg-amber-400" : "bg-sage-500")} />
                      <Link to={`/app/requests/${r.id}`} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-warm-100">
                        <CategoryIcon category={r.category} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{r.title}</span>
                            <StatusBadge status={r.status} />
                            {r.groupId && <Badge variant="ai">Grouped</Badge>}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {r.ref} · {formatDate(r.reportedAt)} · {L.location(r)}
                            {r.contractorId && ` · ${L.contractor(r.contractorId)?.name}`}
                            {r.cost ? ` · ${formatCurrency(r.cost)}` : ""}
                          </div>
                          {r.contractorNotes && <div className="mt-1 text-xs italic text-navy-600">"{r.contractorNotes}"</div>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property manager</CardTitle>
                </CardHeader>
                <CardContent>
                  {manager && (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials(manager.name)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-semibold">{manager.name}</div>
                        <div className="text-xs text-muted-foreground">{manager.role}</div>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> {manager.email}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {manager.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <Select value={p.managerId} onValueChange={(v) => { store.updateProperty(p.id, { managerId: v }); toast.success("Manager updated"); }}>
                    <SelectTrigger className="mt-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {store.managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} — {m.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Requests by category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(
                    data.reqs.reduce<Record<string, number>>((acc, r) => {
                      acc[r.category] = (acc[r.category] ?? 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([c, n]) => (
                      <div key={c} className="flex items-center justify-between text-sm">
                        <CategoryLabel category={c as never} />
                        <span className="font-medium tabular-nums">{n}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="structure">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialog("building")}>
              <Plus /> Add building
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("unit")}>
              <Plus /> Add unit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("tenant")}>
              <UserPlus /> Add tenant
            </Button>
          </div>
          <div className="space-y-5">
            {data.buildings.map((b) => {
              const bUnits = data.units.filter((u) => u.buildingId === b.id);
              const floors = [...new Set(bUnits.map((u) => u.floor))].sort((a, c) => c - a);
              const communalOpen = data.reqs.filter((r) => r.buildingId === b.id && !r.unitId && isOpenStatus(r.status)).length;
              return (
                <Card key={b.id}>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>{b.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {b.floors} floor{b.floors === 1 ? "" : "s"} · {bUnits.length} units
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setUnitFilter(`communal-${b.id}`)}>
                      Communal areas {communalOpen > 0 && <Badge variant="warning">{communalOpen} open</Badge>}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {floors.map((f) => (
                      <div key={f} className="flex items-start gap-3">
                        <div className="w-16 shrink-0 pt-2 text-xs font-medium text-muted-foreground">{f === 0 ? "Ground" : `Floor ${f}`}</div>
                        <div className="flex flex-1 flex-wrap gap-2">
                          {bUnits
                            .filter((u) => u.floor === f)
                            .map((u) => {
                              const uReqs = data.reqs.filter((r) => r.unitId === u.id);
                              const uOpen = uReqs.filter((r) => isOpenStatus(r.status)).length;
                              const isRec = data.recurring.some((r) => r.unitId === u.id);
                              const t = L.tenant(u.tenantId);
                              return (
                                <button
                                  key={u.id}
                                  onClick={() => setUnitFilter(u.id)}
                                  title={`${u.label} · ${u.type}${t ? ` · ${t.name}` : " · Vacant"}`}
                                  className={cn(
                                    "min-w-[96px] rounded-md border px-2.5 py-1.5 text-left text-xs transition hover:border-navy-400",
                                    isRec ? "border-amber-300 bg-amber-50" : uOpen ? "border-sky-200 bg-sky-50" : "bg-warm-50",
                                    !t && "border-dashed opacity-70"
                                  )}
                                >
                                  <div className="font-semibold">{u.label}</div>
                                  <div className="truncate text-[10px] text-muted-foreground">{t ? t.name.replace("Occupier: ", "") : "Vacant"}</div>
                                  <div className="mt-0.5 flex gap-1">
                                    {uReqs.length > 0 && <span className="text-[10px] text-muted-foreground">{uReqs.length} req</span>}
                                    {isRec && <Repeat className="h-3 w-3 text-amber-600" />}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-amber-300 bg-amber-50" /> Recurring issue</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-sky-200 bg-sky-50" /> Open request</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed" /> Vacant</span>
          </div>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Moved in</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tenants.map((t) => {
                  const u = L.unit(t.unitId)!;
                  const n = data.reqs.filter((r) => r.tenantId === t.id).length;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        {L.building(u.buildingId)?.name} · {u.label}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.email}
                        <br />
                        {t.phone}
                      </TableCell>
                      <TableCell>{formatDate(t.moveIn)}</TableCell>
                      <TableCell className="text-right tabular-nums">{n}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          {data.recurring.length === 0 ? (
            <EmptyState icon={Repeat} title="No recurring problems detected" description="DwellMender flags a location when 3+ related requests occur within 12 months." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.recurring.map((r) => (
                <Card key={r.id} className="border-amber-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={r.category} />
                      <div>
                        <CardTitle>{r.pattern}</CardTitle>
                        <CardDescription>{r.locationLabel}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded bg-warm-100 p-2"><div className="font-display text-lg font-bold">{r.complaintCount}</div>reports</div>
                      <div className="rounded bg-warm-100 p-2"><div className="font-display text-lg font-bold text-amber-600">{r.unsuccessfulRepairs}</div>failed repairs</div>
                      <div className="rounded bg-warm-100 p-2"><div className="font-display text-lg font-bold">{formatCurrency(r.totalSpend)}</div>spent</div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {r.requests.slice(-4).map((x) => (
                        <Link key={x.id} to={`/app/requests/${x.id}`} className="flex items-center justify-between gap-2 text-xs hover:underline">
                          <span className="truncate">{formatDate(x.reportedAt)} · {x.title}</span>
                          <PriorityBadge priority={x.priority} />
                        </Link>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                      <Link to={`/app/recurring?focus=${r.id}`}>Open in recurring issues</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <StructureDialog kind={dialog} onClose={() => setDialog(null)} propertyId={p.id} />
    </>
  );
}

const bSchema = z.object({ name: z.string().min(1, "Required"), floors: z.coerce.number().int().min(1).max(60), unitsPerFloor: z.coerce.number().int().min(1).max(40) });
const uSchema = z.object({ buildingId: z.string().min(1, "Choose a building"), label: z.string().min(1, "Required"), floor: z.coerce.number().int().min(0).max(60), type: z.string().min(1, "Required") });
const tSchema = z.object({ unitId: z.string().min(1, "Choose a unit"), name: z.string().min(2, "Required"), email: z.string().email("Valid email required"), phone: z.string().min(6, "Required") });

function StructureDialog({ kind, onClose, propertyId }: { kind: null | "building" | "unit" | "tenant"; onClose: () => void; propertyId: string }) {
  const store = useStore();
  const buildings = store.buildings.filter((b) => b.propertyId === propertyId);
  const vacant = store.units.filter((u) => u.propertyId === propertyId && !u.tenantId);
  const bForm = useForm<z.infer<typeof bSchema>>({ resolver: zodResolver(bSchema), defaultValues: { name: "", floors: 3, unitsPerFloor: 4 } });
  const uForm = useForm<z.infer<typeof uSchema>>({ resolver: zodResolver(uSchema), defaultValues: { buildingId: buildings[0]?.id, label: "", floor: 1, type: "Apartment" } });
  const tForm = useForm<z.infer<typeof tSchema>>({ resolver: zodResolver(tSchema), defaultValues: { unitId: "" } });

  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "building" ? "Add building" : kind === "unit" ? "Add unit" : "Add tenant"}</DialogTitle>
        </DialogHeader>
        {kind === "building" && (
          <form
            className="grid gap-3"
            onSubmit={bForm.handleSubmit((v) => {
              store.addBuilding({ propertyId, name: v.name, floors: v.floors }, v.unitsPerFloor);
              toast.success(`${v.name} added`);
              bForm.reset();
              onClose();
            })}
          >
            <Fld label="Building name" error={bForm.formState.errors.name?.message}><Input {...bForm.register("name")} /></Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Floors"><Input type="number" {...bForm.register("floors")} /></Fld>
              <Fld label="Units per floor"><Input type="number" {...bForm.register("unitsPerFloor")} /></Fld>
            </div>
            <DialogFooter><Button type="submit">Add building</Button></DialogFooter>
          </form>
        )}
        {kind === "unit" && (
          <form
            className="grid gap-3"
            onSubmit={uForm.handleSubmit((v) => {
              store.addUnit({ propertyId, ...v });
              toast.success(`${v.label} added`);
              uForm.reset();
              onClose();
            })}
          >
            <Fld label="Building" error={uForm.formState.errors.buildingId?.message}>
              <Select defaultValue={buildings[0]?.id} onValueChange={(v) => uForm.setValue("buildingId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Unit label" error={uForm.formState.errors.label?.message}><Input placeholder="Flat 7A" {...uForm.register("label")} /></Fld>
              <Fld label="Floor"><Input type="number" {...uForm.register("floor")} /></Fld>
            </div>
            <Fld label="Unit type"><Input {...uForm.register("type")} /></Fld>
            <DialogFooter><Button type="submit">Add unit</Button></DialogFooter>
          </form>
        )}
        {kind === "tenant" && (
          <form
            className="grid gap-3"
            onSubmit={tForm.handleSubmit((v) => {
              store.addTenant({ ...v, moveIn: new Date().toISOString() });
              toast.success(`${v.name} added as tenant`);
              tForm.reset();
              onClose();
            })}
          >
            <Fld label="Vacant unit" error={tForm.formState.errors.unitId?.message}>
              <Select onValueChange={(v) => tForm.setValue("unitId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder={vacant.length ? "Select a vacant unit" : "No vacant units"} /></SelectTrigger>
                <SelectContent>{vacant.map((u) => <SelectItem key={u.id} value={u.id}>{store.buildings.find((b) => b.id === u.buildingId)?.name} · {u.label}</SelectItem>)}</SelectContent>
              </Select>
            </Fld>
            <Fld label="Full name" error={tForm.formState.errors.name?.message}><Input {...tForm.register("name")} /></Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Email" error={tForm.formState.errors.email?.message}><Input type="email" {...tForm.register("email")} /></Fld>
              <Fld label="Phone" error={tForm.formState.errors.phone?.message}><Input {...tForm.register("phone")} /></Fld>
            </div>
            <DialogFooter><Button type="submit">Add tenant</Button></DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
