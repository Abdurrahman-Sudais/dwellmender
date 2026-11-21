/**
 * Client-side application store. Persists to localStorage so the demo survives reloads.
 * In production these mutations map 1:1 onto DwellMender API calls backed by DynamoDB.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as seed from "./seed";
import type {
  Building,
  Contractor,
  ContractorBrief,
  DemoUser,
  DuplicateSuggestion,
  MaintenanceRequest,
  Property,
  PropertyManager,
  RequestStatus,
  Tenant,
  TimelineEvent,
  Unit,
  UploadedDocument,
} from "./types";
import { uid, DEMO_NOW } from "@/lib/utils";
import { detectRecurringIssues, type RecurringIssue } from "@/services/recurring";

const STORAGE_KEY = "dwellmender-demo-v4";
const AUTH_KEY = "dwellmender-auth-v1";

export interface DataState {
  properties: Property[];
  buildings: Building[];
  units: Unit[];
  tenants: Tenant[];
  managers: PropertyManager[];
  contractors: Contractor[];
  requests: MaintenanceRequest[];
  duplicates: DuplicateSuggestion[];
  briefs: ContractorBrief[];
  documents: UploadedDocument[];
}

function seedState(): DataState {
  return structuredClone({
    properties: seed.properties,
    buildings: seed.buildings,
    units: seed.units,
    tenants: seed.tenants,
    managers: seed.managers,
    contractors: seed.contractors,
    requests: seed.requests,
    duplicates: seed.duplicateSuggestions,
    briefs: seed.briefs,
    documents: seed.documents,
  });
}

function load(): DataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DataState;
  } catch {
    /* ignore */
  }
  return seedState();
}

interface StoreApi extends DataState {
  user: DemoUser | null;
  recurring: RecurringIssue[];
  signIn: (user: DemoUser) => void;
  signOut: () => void;
  resetDemo: () => void;

  addProperty: (p: Omit<Property, "id">, buildings: { name: string; floors: number; unitsPerFloor: number }[]) => string;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  addBuilding: (b: Omit<Building, "id">, unitsPerFloor: number) => void;
  addUnit: (u: Omit<Unit, "id">) => string;
  addTenant: (t: Omit<Tenant, "id">) => void;
  addManager: (m: Omit<PropertyManager, "id">) => string;

  addRequest: (r: Omit<MaintenanceRequest, "id" | "ref" | "timeline">) => MaintenanceRequest;
  updateRequest: (id: string, patch: Partial<MaintenanceRequest>, event?: { text: string; type?: TimelineEvent["type"] }) => void;
  setStatus: (id: string, status: RequestStatus) => void;
  assignContractor: (id: string, contractorId: string) => void;

  addDuplicates: (d: DuplicateSuggestion[]) => void;
  decideDuplicate: (id: string, decision: "approved" | "rejected") => void;

  saveBrief: (b: ContractorBrief) => void;

  addContractor: (c: Omit<Contractor, "id">) => string;
  updateContractor: (id: string, patch: Partial<Contractor>) => void;

  addDocument: (d: UploadedDocument) => void;
  updateDocument: (id: string, patch: Partial<UploadedDocument>) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(load);
  const [user, setUser] = useState<DemoUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? (JSON.parse(raw) as DemoUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable — demo still works in memory */
    }
  }, [data]);

  const actor = user?.name ?? "Property manager";
  const ev = useCallback(
    (text: string, type: TimelineEvent["type"] = "note"): TimelineEvent => ({ id: uid("ev"), at: new Date().toISOString(), type, text, actor }),
    [actor]
  );

  const recurring = useMemo(() => detectRecurringIssues(data), [data]);

  const api = useMemo<StoreApi>(() => {
    const patch = (fn: (d: DataState) => DataState) => setData((d) => fn(d));
    const genUnits = (propertyId: string, buildingId: string, floors: number, perFloor: number, prefix: string): Unit[] => {
      const out: Unit[] = [];
      for (let f = 1; f <= floors; f++)
        for (let n = 1; n <= perFloor; n++) out.push({ id: uid("u"), propertyId, buildingId, floor: f, label: `${prefix}${f}${String.fromCharCode(64 + n)}`, type: "Unit" });
      return out;
    };

    return {
      ...data,
      user,
      recurring,
      signIn: (u) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(u));
        setUser(u);
      },
      signOut: () => {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
      },
      resetDemo: () => setData(seedState()),

      addProperty: (p, blds) => {
        const id = uid("p");
        patch((d) => {
          const newBuildings: Building[] = blds.map((b) => ({ id: uid("b"), propertyId: id, name: b.name, floors: b.floors }));
          const newUnits = newBuildings.flatMap((b, i) => genUnits(id, b.id, b.floors, blds[i].unitsPerFloor, "Unit "));
          return { ...d, properties: [...d.properties, { ...p, id }], buildings: [...d.buildings, ...newBuildings], units: [...d.units, ...newUnits] };
        });
        return id;
      },
      updateProperty: (id, p) => patch((d) => ({ ...d, properties: d.properties.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      addBuilding: (b, perFloor) =>
        patch((d) => {
          const id = uid("b");
          return { ...d, buildings: [...d.buildings, { ...b, id }], units: [...d.units, ...genUnits(b.propertyId, id, b.floors, perFloor, "Unit ")] };
        }),
      addUnit: (u) => {
        const id = uid("u");
        patch((d) => ({ ...d, units: [...d.units, { ...u, id }] }));
        return id;
      },
      addTenant: (t) =>
        patch((d) => {
          const id = uid("t");
          return { ...d, tenants: [...d.tenants, { ...t, id }], units: d.units.map((u) => (u.id === t.unitId ? { ...u, tenantId: id } : u)) };
        }),
      addManager: (m) => {
        const id = uid("m");
        patch((d) => ({ ...d, managers: [...d.managers, { ...m, id }] }));
        return id;
      },

      addRequest: (r) => {
        const maxRef = Math.max(...data.requests.map((x) => Number(x.ref.split("-")[1])), 1000);
        const full: MaintenanceRequest = {
          ...r,
          id: uid("r"),
          ref: `MR-${maxRef + 1}`,
          timeline: [
            ev(`Request logged via ${r.source}`, "created"),
            ...(r.ai ? [{ ...ev(`Classified as ${r.ai.suggestedCategory} (${Math.round(r.ai.confidence * 100)}% confidence)`, "ai"), actor: "DwellMender AI (simulated)" }] : []),
          ],
        };
        patch((d) => ({ ...d, requests: [...d.requests, full] }));
        return full;
      },
      updateRequest: (id, p, event) =>
        patch((d) => ({
          ...d,
          requests: d.requests.map((x) => (x.id === id ? { ...x, ...p, timeline: event ? [...x.timeline, ev(event.text, event.type)] : x.timeline } : x)),
        })),
      setStatus: (id, status) =>
        patch((d) => ({
          ...d,
          requests: d.requests.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status,
                  resolvedAt: status === "Resolved" || status === "Closed" ? x.resolvedAt ?? DEMO_NOW.toISOString() : undefined,
                  timeline: [...x.timeline, ev(`Status changed to ${status}`, "status")],
                }
              : x
          ),
        })),
      assignContractor: (id, contractorId) =>
        patch((d) => {
          const c = d.contractors.find((x) => x.id === contractorId);
          return {
            ...d,
            requests: d.requests.map((x) =>
              x.id === id
                ? {
                    ...x,
                    contractorId,
                    status: x.status === "New" || x.status === "Under Review" ? "Assigned" : x.status,
                    timeline: [...x.timeline, ev(`Assigned to ${c?.name}`, "assigned")],
                  }
                : x
            ),
          };
        }),

      addDuplicates: (list) => patch((d) => ({ ...d, duplicates: [...list, ...d.duplicates] })),
      decideDuplicate: (id, decision) =>
        patch((d) => {
          const s = d.duplicates.find((x) => x.id === id);
          if (!s) return d;
          const ids = [s.primaryId, ...s.matchIds];
          // Approval links requests into a group; records are never deleted or merged.
          const existingGroup = d.requests.find((r) => ids.includes(r.id) && r.groupId)?.groupId;
          const groupId = existingGroup ?? uid("grp");
          return {
            ...d,
            duplicates: d.duplicates.map((x) => (x.id === id ? { ...x, status: decision, decidedAt: new Date().toISOString(), decidedBy: actor } : x)),
            requests:
              decision === "approved"
                ? d.requests.map((r) =>
                    ids.includes(r.id)
                      ? { ...r, groupId, timeline: [...r.timeline, ev(`Linked as duplicate group "${s.suggestedGroupTitle}" (approved by ${actor})`, "duplicate")] }
                      : r
                  )
                : d.requests.map((r) => (r.id === s.primaryId ? { ...r, timeline: [...r.timeline, ev(`Duplicate suggestion rejected by ${actor}`, "duplicate")] } : r)),
          };
        }),

      saveBrief: (b) =>
        patch((d) => {
          const exists = d.briefs.some((x) => x.id === b.id);
          const prev = d.briefs.find((x) => x.id === b.id);
          const statusChanged = !prev || prev.status !== b.status;
          return {
            ...d,
            briefs: exists ? d.briefs.map((x) => (x.id === b.id ? b : x)) : [...d.briefs, b],
            requests: statusChanged
              ? d.requests.map((r) => (r.id === b.requestId ? { ...r, timeline: [...r.timeline, ev(`Contractor brief ${b.status.toLowerCase()}`, "brief")] } : r))
              : d.requests,
          };
        }),

      addContractor: (c) => {
        const id = uid("c");
        patch((d) => ({ ...d, contractors: [...d.contractors, { ...c, id }] }));
        return id;
      },
      updateContractor: (id, p) => patch((d) => ({ ...d, contractors: d.contractors.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

      addDocument: (doc) => patch((d) => ({ ...d, documents: [doc, ...d.documents] })),
      updateDocument: (id, p) => patch((d) => ({ ...d, documents: d.documents.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    };
  }, [data, user, recurring, ev, actor]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Convenience lookups */
export function useLookups() {
  const s = useStore();
  return useMemo(() => {
    const prop = new Map(s.properties.map((p) => [p.id, p]));
    const bld = new Map(s.buildings.map((b) => [b.id, b]));
    const unit = new Map(s.units.map((u) => [u.id, u]));
    const tenant = new Map(s.tenants.map((t) => [t.id, t]));
    const contractor = new Map(s.contractors.map((c) => [c.id, c]));
    const manager = new Map(s.managers.map((m) => [m.id, m]));
    const request = new Map(s.requests.map((r) => [r.id, r]));
    return {
      property: (id?: string) => (id ? prop.get(id) : undefined),
      building: (id?: string) => (id ? bld.get(id) : undefined),
      unit: (id?: string) => (id ? unit.get(id) : undefined),
      tenant: (id?: string) => (id ? tenant.get(id) : undefined),
      contractor: (id?: string) => (id ? contractor.get(id) : undefined),
      manager: (id?: string) => (id ? manager.get(id) : undefined),
      request: (id?: string) => (id ? request.get(id) : undefined),
      location: (r: Pick<MaintenanceRequest, "buildingId" | "unitId" | "location">) => {
        const b = bld.get(r.buildingId)?.name ?? "";
        const u = r.unitId ? unit.get(r.unitId)?.label : r.location ?? "Communal area";
        return `${b} · ${u}`;
      },
    };
  }, [s.properties, s.buildings, s.units, s.tenants, s.contractors, s.managers, s.requests]);
}

export const isOpenStatus = (s: RequestStatus) => s !== "Resolved" && s !== "Closed";
export const isOverdue = (r: MaintenanceRequest) => isOpenStatus(r.status) && new Date(r.dueAt) < DEMO_NOW;
