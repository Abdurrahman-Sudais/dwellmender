/**
 * Recurring-issue intelligence. In production this runs as a scheduled Lambda over
 * DynamoDB maintenance histories; here it runs client-side over demo data.
 */
import { daysBetween, DEMO_NOW } from "@/lib/utils";
import type { Building, Contractor, IssueCategory, MaintenanceRequest, Property, Unit } from "@/data/types";

export type RecurringPattern =
  | "Persistent water leak"
  | "Repeated plumbing complaint"
  | "Recurring electrical problem"
  | "Repeated equipment failure"
  | "Repeated roof damage"
  | "Recurring pest activity"
  | "Recurring structural defect"
  | "Repeated maintenance issue";

export interface RecurringIssue {
  id: string;
  propertyId: string;
  buildingId: string;
  unitId?: string;
  locationLabel: string;
  category: IssueCategory;
  pattern: RecurringPattern;
  requests: MaintenanceRequest[]; // oldest first
  complaintCount: number;
  repairDates: string[];
  contractorIds: string[];
  unsuccessfulRepairs: number;
  avgIntervalDays: number;
  firstReported: string;
  lastReported: string;
  openCount: number;
  totalSpend: number;
  riskScore: number;
  riskLevel: "Critical" | "High" | "Moderate";
}

const WINDOW_DAYS = 365;
const MIN_REPORTS = 3;
const REOPEN_WINDOW = 90;

function patternFor(category: IssueCategory, reqs: MaintenanceRequest[]): RecurringPattern {
  const text = reqs.map((r) => `${r.title} ${r.description}`).join(" ").toLowerCase();
  switch (category) {
    case "Plumbing":
      return /leak|drip|water coming|ingress/.test(text) ? "Persistent water leak" : "Repeated plumbing complaint";
    case "Electrical":
      return "Recurring electrical problem";
    case "HVAC":
    case "Appliances":
      return "Repeated equipment failure";
    case "Roofing":
      return "Repeated roof damage";
    case "Pest Control":
      return "Recurring pest activity";
    case "Structural":
      return "Recurring structural defect";
    default:
      return "Repeated maintenance issue";
  }
}

export function detectRecurringIssues(ctx: {
  requests: MaintenanceRequest[];
  units: Unit[];
  buildings: Building[];
  properties: Property[];
  contractors: Contractor[];
}): RecurringIssue[] {
  const now = DEMO_NOW.toISOString();
  const inWindow = ctx.requests.filter((r) => daysBetween(r.reportedAt, now) <= WINDOW_DAYS);

  // Union-find: link requests at the same location+category, and requests a manager grouped as duplicates.
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  inWindow.forEach((r) => parent.set(r.id, r.id));

  // A duplicate group spanning several units (or a communal area) is a building-level incident.
  const groupSpansBuilding = new Map<string, boolean>();
  for (const r of inWindow) {
    if (!r.groupId) continue;
    const members = inWindow.filter((x) => x.groupId === r.groupId);
    groupSpansBuilding.set(r.groupId, new Set(members.map((x) => x.unitId ?? "communal")).size > 1 || members.some((x) => !x.unitId));
  }

  const byKey = new Map<string, string>();
  const byGroup = new Map<string, string>();
  const link = (key: string, id: string) => {
    const k = byKey.get(key);
    if (k) union(id, k);
    else byKey.set(key, id);
  };
  for (const r of inWindow) {
    link(`${r.buildingId}|${r.unitId ?? "communal"}|${r.category}`, r.id);
    if (r.groupId) {
      const g = byGroup.get(r.groupId);
      if (g) union(r.id, g);
      else byGroup.set(r.groupId, r.id);
      if (groupSpansBuilding.get(r.groupId)) link(`${r.buildingId}|communal|${r.category}`, r.id);
    }
  }
  /** Approved duplicates describe one incident, so they count once towards recurrence. */
  const incidents = (list: MaintenanceRequest[]) => new Set(list.map((r) => r.groupId ?? r.id)).size;

  const clusters = new Map<string, MaintenanceRequest[]>();
  for (const r of inWindow) {
    const root = find(r.id);
    clusters.set(root, [...(clusters.get(root) ?? []), r]);
  }

  const issues: RecurringIssue[] = [];
  for (const [root, list] of clusters) {
    if (incidents(list) < MIN_REPORTS) continue;
    const reqs = [...list].sort((a, b) => +new Date(a.reportedAt) - +new Date(b.reportedAt));
    // dominant category / unit
    const catCount = new Map<IssueCategory, number>();
    reqs.forEach((r) => catCount.set(r.category, (catCount.get(r.category) ?? 0) + 1));
    const category = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const unitCount = new Map<string, number>();
    reqs.forEach((r) => unitCount.set(r.unitId ?? "communal", (unitCount.get(r.unitId ?? "communal") ?? 0) + 1));
    // communal history wins when present — the root cause is building-level
    const domUnit = unitCount.has("communal") && unitCount.get("communal")! >= 2 ? "communal" : [...unitCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const unit = ctx.units.find((u) => u.id === domUnit);
    const building = ctx.buildings.find((b) => b.id === reqs[0].buildingId);
    const communalLoc = reqs.find((r) => !r.unitId && r.location)?.location;

    const repairDates = reqs.filter((r) => r.resolvedAt).map((r) => r.resolvedAt!);
    let unsuccessful = 0;
    for (const r of reqs) {
      if (!r.resolvedAt) continue;
      const next = reqs.find((x) => new Date(x.reportedAt) > new Date(r.resolvedAt!));
      if (next && daysBetween(r.resolvedAt, next.reportedAt) <= REOPEN_WINDOW) unsuccessful++;
    }
    const intervals = reqs.slice(1).map((r, i) => daysBetween(reqs[i].reportedAt, r.reportedAt));
    const distinctIntervals = intervals.filter((d) => d > 0);
    const avgInterval = distinctIntervals.length ? Math.round(distinctIntervals.reduce((a, b) => a + b, 0) / distinctIntervals.length) : 0;
    const openCount = reqs.filter((r) => r.status !== "Resolved" && r.status !== "Closed").length;
    const totalSpend = reqs.reduce((s, r) => s + (r.cost ?? 0), 0);
    const last = reqs[reqs.length - 1].reportedAt;
    const recencyBoost = daysBetween(last, now) <= 14 ? 12 : daysBetween(last, now) <= 45 ? 6 : 0;
    const incidentCount = incidents(reqs);
    const riskScore = Math.min(100, incidentCount * 10 + unsuccessful * 12 + openCount * 6 + recencyBoost + Math.round(totalSpend / 150));

    issues.push({
      id: `rec-${root}`,
      propertyId: reqs[0].propertyId,
      buildingId: reqs[0].buildingId,
      unitId: unit?.id,
      locationLabel: `${building?.name ?? ""} · ${unit ? unit.label : communalLoc ?? "Communal area"}`,
      category,
      pattern: patternFor(category, reqs),
      requests: reqs,
      complaintCount: incidentCount,
      repairDates,
      contractorIds: [...new Set(reqs.map((r) => r.contractorId).filter(Boolean) as string[])],
      unsuccessfulRepairs: unsuccessful,
      avgIntervalDays: avgInterval,
      firstReported: reqs[0].reportedAt,
      lastReported: last,
      openCount,
      totalSpend,
      riskScore,
      riskLevel: riskScore >= 75 ? "Critical" : riskScore >= 50 ? "High" : "Moderate",
    });
  }
  return issues.sort((a, b) => b.riskScore - a.riskScore);
}
