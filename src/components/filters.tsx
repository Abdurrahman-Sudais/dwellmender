import { useMemo, useState } from "react";
import { FilterX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { useStore } from "@/data/store";
import { ISSUE_CATEGORIES, PRIORITIES, STATUSES, type MaintenanceRequest } from "@/data/types";
import { daysAgo } from "@/lib/utils";

export interface Filters {
  property: string;
  building: string;
  category: string;
  priority: string;
  status: string;
  range: string; // days or "all"
}
export const ALL = "all";
export const defaultFilters: Filters = { property: ALL, building: ALL, category: ALL, priority: ALL, status: ALL, range: "90" };

export function useRequestFilters(initial: Partial<Filters> = {}) {
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters, ...initial });
  const set = (k: keyof Filters, v: string) => setFilters((f) => ({ ...f, [k]: v, ...(k === "property" ? { building: ALL } : {}) }));
  const reset = () => setFilters({ ...defaultFilters, ...initial });
  const apply = useMemo(
    () => (list: MaintenanceRequest[]) =>
      list.filter(
        (r) =>
          (filters.property === ALL || r.propertyId === filters.property) &&
          (filters.building === ALL || r.buildingId === filters.building) &&
          (filters.category === ALL || r.category === filters.category) &&
          (filters.priority === ALL || r.priority === filters.priority) &&
          (filters.status === ALL || r.status === filters.status || (filters.status === "open" && r.status !== "Resolved" && r.status !== "Closed")) &&
          (filters.range === ALL || daysAgo(r.reportedAt) <= Number(filters.range))
      ),
    [filters]
  );
  return { filters, set, reset, apply };
}

function F({ value, onChange, placeholder, options, width = "w-[160px]" }: { value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][]; width?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${width} bg-card`} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterBar({
  filters,
  set,
  reset,
  show = ["property", "building", "category", "priority", "range"],
}: {
  filters: Filters;
  set: (k: keyof Filters, v: string) => void;
  reset: () => void;
  show?: (keyof Filters)[];
}) {
  const { properties, buildings } = useStore();
  const blds = buildings.filter((b) => filters.property === ALL || b.propertyId === filters.property);
  const dirty = (Object.keys(filters) as (keyof Filters)[]).some((k) => filters[k] !== defaultFilters[k]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {show.includes("property") && <F value={filters.property} onChange={(v) => set("property", v)} placeholder="All properties" options={properties.map((p) => [p.id, p.name])} width="w-[190px]" />}
      {show.includes("building") && (
        <F
          value={filters.building}
          onChange={(v) => set("building", v)}
          placeholder="All buildings"
          options={blds.map((b) => [b.id, filters.property === ALL ? `${properties.find((p) => p.id === b.propertyId)?.name.split(" ")[0]} · ${b.name}` : b.name])}
        />
      )}
      {show.includes("category") && <F value={filters.category} onChange={(v) => set("category", v)} placeholder="All issue types" options={ISSUE_CATEGORIES.map((c) => [c, c])} />}
      {show.includes("priority") && <F value={filters.priority} onChange={(v) => set("priority", v)} placeholder="All priorities" options={PRIORITIES.map((c) => [c, c])} width="w-[140px]" />}
      {show.includes("status") && <F value={filters.status} onChange={(v) => set("status", v)} placeholder="All statuses" options={[["open", "Open (any)"], ...STATUSES.map((c) => [c, c] as [string, string])]} width="w-[150px]" />}
      {show.includes("range") && (
        <Select value={filters.range} onValueChange={(v) => set("range", v)}>
          <SelectTrigger className="w-[150px] bg-card" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
            <SelectItem value={ALL}>All time</SelectItem>
          </SelectContent>
        </Select>
      )}
      {dirty && (
        <Button variant="ghost" size="sm" onClick={reset}>
          <FilterX /> Reset
        </Button>
      )}
    </div>
  );
}
