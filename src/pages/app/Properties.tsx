import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, ClipboardList, MapPin, Plus, Repeat, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { EmptyState, PageHeader } from "@/components/shared";
import { isOpenStatus, useStore } from "@/data/store";
import type { PropertyType } from "@/data/types";

const TYPES: PropertyType[] = ["Residential", "Student Accommodation", "Commercial", "Mixed Use", "Supported Living"];

export default function Properties() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);

  const list = store.properties.filter((p) => (type === "all" || p.type === type) && `${p.name} ${p.address} ${p.city} ${p.postcode}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Properties"
        description="Register and manage properties, buildings, units, tenants and responsible managers."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Register property
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, address, postcode…" className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All property types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Building2} title="No properties match" description="Try a different search, or register a new property." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const blds = store.buildings.filter((b) => b.propertyId === p.id);
            const units = store.units.filter((u) => u.propertyId === p.id);
            const occupied = units.filter((u) => u.tenantId).length;
            const reqs = store.requests.filter((r) => r.propertyId === p.id);
            const open = reqs.filter((r) => isOpenStatus(r.status)).length;
            const rec = store.recurring.filter((r) => r.propertyId === p.id);
            const manager = store.managers.find((m) => m.id === p.managerId);
            return (
              <Link key={p.id} to={`/app/properties/${p.id}`}>
                <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className={`relative h-28 bg-gradient-to-br ${p.accent}`}>
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    <PropertySkyline type={p.type} />
                    <Badge className="absolute left-3 top-3 border-white/20 bg-white/15 text-white backdrop-blur">{p.type}</Badge>
                    {rec.length > 0 && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-navy-950">
                        <Repeat className="h-3 w-3" /> {rec.length} recurring
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-navy-900 group-hover:underline">{p.name}</h3>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.address}, {p.city} {p.postcode}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <Metric label="Buildings" value={blds.length} />
                      <Metric label="Units" value={units.length} />
                      <Metric label="Open requests" value={open} warn={open > 5} />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {Math.round((occupied / Math.max(units.length, 1)) * 100)}% occupied
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> {manager?.name}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <RegisterPropertyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function Metric({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-md bg-warm-100 px-2 py-1.5">
      <div className={`font-display text-lg font-bold ${warn ? "text-amber-600" : "text-navy-900"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export function PropertySkyline({ type }: { type: PropertyType }) {
  const shapes =
    type === "Commercial"
      ? [[10, 60], [28, 80], [16, 50]]
      : type === "Student Accommodation"
        ? [[22, 50], [22, 56], [22, 44]]
        : type === "Residential"
          ? [[18, 42], [24, 66], [18, 52], [14, 34]]
          : [[20, 54], [26, 40], [16, 62]];
  let x = 52;
  return (
    <svg className="absolute bottom-0 right-4 h-full w-40 opacity-30" viewBox="0 0 160 100" preserveAspectRatio="xMaxYMax meet" aria-hidden>
      {shapes.map(([w, h], i) => {
        const el = (
          <g key={i}>
            <rect x={x} y={100 - h} width={w} height={h} fill="white" />
            {Array.from({ length: Math.floor(h / 12) }).map((_, j) => (
              <rect key={j} x={x + 4} y={100 - h + 6 + j * 12} width={w - 8} height={4} fill="currentColor" className="text-navy-900" opacity={0.5} />
            ))}
          </g>
        );
        x += w + 4;
        return el;
      })}
    </svg>
  );
}

const schema = z.object({
  name: z.string().min(2, "Property name is required"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(3, "Postcode is required"),
  type: z.enum(["Residential", "Student Accommodation", "Commercial", "Mixed Use", "Supported Living"]),
  managerId: z.string().min(1, "Choose a manager"),
  yearBuilt: z.coerce.number().int().min(1700).max(2030),
  notes: z.string().optional(),
  buildings: z
    .array(z.object({ name: z.string().min(1, "Name required"), floors: z.coerce.number().int().min(1).max(60), unitsPerFloor: z.coerce.number().int().min(1).max(40) }))
    .min(1, "Add at least one building"),
});
type Values = z.infer<typeof schema>;

function RegisterPropertyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useStore();
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { type: "Residential", managerId: store.managers[0]?.id, yearBuilt: 2005, buildings: [{ name: "Main Building", floors: 3, unitsPerFloor: 4 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "buildings" });
  const accents = ["from-navy-800 to-navy-600", "from-sage-700 to-sage-500", "from-amber-600 to-amber-400", "from-slate-700 to-slate-500"];

  const onSubmit = (v: Values) => {
    const id = store.addProperty(
      { name: v.name, address: v.address, city: v.city, postcode: v.postcode, type: v.type, managerId: v.managerId, yearBuilt: v.yearBuilt, notes: v.notes, accent: accents[store.properties.length % accents.length] },
      v.buildings
    );
    toast.success(`${v.name} registered with ${v.buildings.reduce((s, b) => s + b.floors * b.unitsPerFloor, 0)} units`);
    reset();
    onOpenChange(false);
    navigate(`/app/properties/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register a property</DialogTitle>
          <DialogDescription>Units are generated per building and floor — you can rename them and add tenants afterwards.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Fld label="Property name" error={errors.name?.message} className="sm:col-span-2">
            <Input {...register("name")} placeholder="e.g. Canal Wharf Apartments" />
          </Fld>
          <Fld label="Street address" error={errors.address?.message} className="sm:col-span-2">
            <Input {...register("address")} />
          </Fld>
          <Fld label="City" error={errors.city?.message}>
            <Input {...register("city")} />
          </Fld>
          <Fld label="Postcode" error={errors.postcode?.message}>
            <Input {...register("postcode")} />
          </Fld>
          <Fld label="Property type">
            <Select defaultValue="Residential" onValueChange={(v) => setValue("type", v as PropertyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Property manager" error={errors.managerId?.message}>
            <Select defaultValue={store.managers[0]?.id} onValueChange={(v) => setValue("managerId", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {store.managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Year built" error={errors.yearBuilt?.message}>
            <Input type="number" {...register("yearBuilt")} />
          </Fld>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <Label>Buildings</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ name: `Block ${String.fromCharCode(65 + fields.length)}`, floors: 3, unitsPerFloor: 4 })}>
                <Plus /> Add building
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-[1fr_90px_110px_auto] items-end gap-2 rounded-md border bg-warm-50 p-2">
                  <Fld label="Name" error={errors.buildings?.[i]?.name?.message}>
                    <Input {...register(`buildings.${i}.name`)} />
                  </Fld>
                  <Fld label="Floors">
                    <Input type="number" {...register(`buildings.${i}.floors`)} />
                  </Fld>
                  <Fld label="Units / floor">
                    <Input type="number" {...register(`buildings.${i}.unitsPerFloor`)} />
                  </Fld>
                  <Button type="button" variant="ghost" size="icon" disabled={fields.length === 1} onClick={() => remove(i)} aria-label="Remove building">
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Fld label="Notes (optional)" className="sm:col-span-2">
            <Textarea rows={2} {...register("notes")} placeholder="Access arrangements, building systems, known issues…" />
          </Fld>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Register property</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Fld({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium">{label}</span>
        {children}
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
