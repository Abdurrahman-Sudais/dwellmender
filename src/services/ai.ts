/**
 * DwellMender AI service layer.
 *
 * Every function here has two implementations:
 *  - SIMULATED (default): deterministic, rule-based logic that runs in the browser
 *    so the demo works offline. All UI built on it is labelled "Simulated AI".
 *  - AWS: POSTs to the DwellMender API (API Gateway → Lambda), which calls
 *    Amazon Bedrock (classification, duplicate reasoning, summaries, briefs) and
 *    Amazon Textract (document extraction). Request/response shapes match the
 *    simulated functions exactly, so the UI does not change.
 */
import { awsConfig } from "./config";
import { daysBetween, formatDate, uid, DEMO_NOW } from "@/lib/utils";
import type {
  Building,
  BriefSection,
  Contractor,
  DuplicateSignal,
  DuplicateSuggestion,
  IssueCategory,
  MaintenanceRequest,
  Priority,
  Property,
  Unit,
  UploadedDocument,
} from "@/data/types";
import { ISSUE_CATEGORIES } from "@/data/types";

export const SIMULATED_MODEL_LABEL = "Simulated · Bedrock-ready";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${awsConfig.apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DwellMender API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Classification                                                      */
/* ------------------------------------------------------------------ */
const CATEGORY_KEYWORDS: Record<IssueCategory, [string, number][]> = {
  Plumbing: [["leak", 3], ["leaking", 3], ["water", 2], ["drip", 3], ["tap", 3], ["toilet", 3], ["cistern", 3], ["pipe", 3], ["drain", 3], ["blocked", 2], ["sink", 2], ["shower", 2], ["bath", 1], ["flood", 3], ["pressure", 1], ["sewage", 3], ["stack", 2]],
  Electrical: [["socket", 3], ["power", 3], ["electric", 3], ["light", 2], ["lights", 2], ["flicker", 3], ["flickering", 3], ["breaker", 3], ["rcd", 4], ["fuse", 3], ["tripping", 3], ["wiring", 3], ["sparking", 4], ["smoke alarm", 2], ["switch", 2]],
  Roofing: [["roof", 4], ["tile", 3], ["tiles", 3], ["gutter", 3], ["loft", 2], ["flashing", 3], ["chimney", 2], ["rain", 1], ["valley", 2], ["slate", 3]],
  HVAC: [["heating", 4], ["radiator", 4], ["boiler", 4], ["hot water", 3], ["thermostat", 3], ["air conditioning", 4], ["ac unit", 4], ["ventilation", 2], ["cold", 1], ["warm", 1]],
  Structural: [["crack", 3], ["subsidence", 4], ["wall", 1], ["foundation", 4], ["lintel", 4], ["rot", 2], ["rotting", 3], ["frame", 2], ["door sticking", 2], ["structural", 4]],
  "Pest Control": [["mice", 4], ["mouse", 4], ["rat", 4], ["rodent", 4], ["droppings", 4], ["wasp", 4], ["ants", 3], ["cockroach", 4], ["bed bugs", 4], ["scratching", 2], ["pest", 4]],
  Appliances: [["washing machine", 4], ["oven", 4], ["fridge", 4], ["freezer", 3], ["dishwasher", 4], ["hob", 3], ["microwave", 3], ["dryer", 3], ["appliance", 3]],
  "General Maintenance": [["door", 1], ["cupboard", 2], ["hinge", 2], ["paint", 2], ["flooring", 2], ["mould", 2], ["damp", 2], ["stain", 1], ["closer", 2], ["window", 1], ["lock", 1]],
};

const URGENT_TERMS = ["no heating", "no hot water", "flood", "sparking", "burning smell", "gas", "shock", "through the light", "through light", "collapsed", "sewage", "lockout"];
const HIGH_TERMS = ["leak", "leaking", "water coming", "power cut", "lost power", "no power", "droppings", "mice", "missing", "again", "still"];

export interface ClassificationResult {
  category: IssueCategory;
  confidence: number;
  priority: Priority;
  keywords: string[];
  alternatives: { category: IssueCategory; confidence: number }[];
  rationale: string;
  model: string;
}

function classifyLocally(text: string): ClassificationResult {
  const lower = ` ${text.toLowerCase()} `;
  const scores = ISSUE_CATEGORIES.map((cat) => {
    let s = 0;
    const hits: string[] = [];
    for (const [term, w] of CATEGORY_KEYWORDS[cat]) {
      if (lower.includes(term)) {
        s += w;
        hits.push(term);
      }
    }
    return { cat, s, hits };
  }).sort((a, b) => b.s - a.s);

  const total = scores.reduce((acc, x) => acc + x.s, 0);
  const top = scores[0];
  if (!top || top.s === 0) {
    return {
      category: "General Maintenance",
      confidence: 0.42,
      priority: "Medium",
      keywords: [],
      alternatives: [],
      rationale: "No strong category signals found. Defaulted to General Maintenance — please review.",
      model: SIMULATED_MODEL_LABEL,
    };
  }
  const share = top.s / total;
  const confidence = Math.min(0.98, 0.45 + share * 0.45 + Math.min(top.s, 10) * 0.012);
  const priority: Priority = URGENT_TERMS.some((t) => lower.includes(t)) ? "Urgent" : HIGH_TERMS.some((t) => lower.includes(t)) ? "High" : top.s >= 6 ? "Medium" : "Low";
  return {
    category: top.cat,
    confidence: Number(confidence.toFixed(2)),
    priority,
    keywords: top.hits.slice(0, 6),
    alternatives: scores
      .slice(1, 3)
      .filter((x) => x.s > 0)
      .map((x) => ({ category: x.cat, confidence: Number(((x.s / total) * 0.8).toFixed(2)) })),
    rationale: `Matched ${top.hits.length} ${top.cat.toLowerCase()} indicator${top.hits.length === 1 ? "" : "s"} (${top.hits.slice(0, 4).join(", ")}).${
      priority === "Urgent" ? " Language suggests a safety or habitability risk." : ""
    }`,
    model: SIMULATED_MODEL_LABEL,
  };
}

export async function classifyReport(text: string): Promise<ClassificationResult> {
  if (!awsConfig.useSimulatedAI) return callApi<ClassificationResult>("/ai/classify", { text });
  await sleep(650 + Math.random() * 500);
  return classifyLocally(text);
}
export const classifyReportSync = classifyLocally;

/* ------------------------------------------------------------------ */
/* Document extraction (Textract + Bedrock summarisation)              */
/* ------------------------------------------------------------------ */
export async function extractDocument(
  filename: string,
  kind: UploadedDocument["kind"],
  ctx: { properties: Property[] }
): Promise<NonNullable<UploadedDocument["extracted"]>> {
  if (!awsConfig.useSimulatedAI) return callApi("/documents/extract", { filename, kind });
  await sleep(1600 + Math.random() * 900);
  const name = filename.replace(/[_-]+/g, " ").replace(/\.\w+$/, "");
  const cls = classifyLocally(name + " " + kind);
  const property = ctx.properties.find((p) => name.toLowerCase().includes(p.name.split(" ")[0].toLowerCase()));
  const unitMatch = name.match(/(flat|room|suite|no|unit|loft)\s?([A-Z]?-?\d+[A-Z]?)/i);
  const category = cls.confidence > 0.5 ? cls.category : "General Maintenance";
  return {
    propertyGuess: property?.name,
    unitGuess: unitMatch ? `${unitMatch[1][0].toUpperCase()}${unitMatch[1].slice(1).toLowerCase()} ${unitMatch[2]}` : undefined,
    category,
    confidence: property ? Math.max(cls.confidence, 0.74) : Math.min(cls.confidence, 0.66),
    summary: `${kind} processed. Detected ${category.toLowerCase()} work${property ? ` at ${property.name}` : ""}. Review extracted fields before linking to a request.`,
    fields: [
      { label: kind === "Invoice" ? "Invoice date" : "Visit date", value: DEMO_NOW.toISOString().slice(0, 10), confidence: 0.93 },
      { label: "Property", value: property?.name ?? "Not detected", confidence: property ? 0.88 : 0.3 },
      { label: "Location", value: unitMatch ? unitMatch[0] : "Not detected", confidence: unitMatch ? 0.81 : 0.25 },
      { label: "Work category", value: category, confidence: cls.confidence },
      { label: kind === "Invoice" ? "Amount" : "Work carried out", value: kind === "Invoice" ? "£" + (180 + Math.round(Math.random() * 400)) : "See attached description", confidence: 0.7 },
      { label: "Follow-up required", value: "Unclear — please confirm", confidence: 0.55 },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Duplicate detection                                                 */
/* ------------------------------------------------------------------ */
const STOP = new Set("the a an and or is are was in on at of to my i it its has have been this that there with for from again our we be not no up very".split(" "));
function tokens(s: string) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/(ing|ed|s)$/, ""))
  );
}
function jaccard(a: Set<string>, b: Set<string>) {
  const inter = [...a].filter((x) => b.has(x));
  const union = new Set([...a, ...b]);
  return { score: union.size ? inter.length / union.size : 0, shared: inter };
}

export interface AIContext {
  requests: MaintenanceRequest[];
  properties: Property[];
  buildings: Building[];
  units: Unit[];
  contractors: Contractor[];
}

const isOpen = (r: MaintenanceRequest) => r.status !== "Resolved" && r.status !== "Closed";

export function scoreDuplicatePair(a: MaintenanceRequest, b: MaintenanceRequest, ctx: AIContext) {
  if (a.propertyId !== b.propertyId) return null;
  const ua = ctx.units.find((u) => u.id === a.unitId);
  const ub = ctx.units.find((u) => u.id === b.unitId);

  let unitScore = 0;
  let unitDetail = "Different buildings";
  if (a.buildingId === b.buildingId) {
    if (a.unitId && a.unitId === b.unitId) {
      unitScore = 1;
      unitDetail = `Same unit — ${ua?.label}`;
    } else if (!a.unitId || !b.unitId) {
      unitScore = 0.65;
      unitDetail = "Same building — one report is in a communal area";
    } else if (ua && ub && Math.abs(ua.floor - ub.floor) <= 1) {
      unitScore = 0.6;
      unitDetail = `Neighbouring units — ${ua.label} and ${ub.label}`;
    } else {
      unitScore = 0.45;
      unitDetail = "Same building, different floors";
    }
  }

  const desc = jaccard(tokens(a.title + " " + a.description), tokens(b.title + " " + b.description));
  const descScore = Math.min(1, desc.score * 2.2 + (a.category === b.category ? 0.25 : 0));

  const kindsA = new Set(a.photos.map((p) => p.kind));
  const sharedKinds = b.photos.filter((p) => kindsA.has(p.kind));
  const photoScore = a.photos.length && b.photos.length ? (sharedKinds.length ? 0.6 : 0.2) : 0;

  const gap = Math.abs(daysBetween(a.reportedAt, b.reportedAt));
  const dateScore = Math.max(0, 1 - gap / 30);

  const history = ctx.requests.filter(
    (r) => r.id !== a.id && r.id !== b.id && r.buildingId === a.buildingId && (r.unitId ?? "c") === (a.unitId ?? "c") && r.category === a.category && daysBetween(r.reportedAt, DEMO_NOW.toISOString()) < 365
  );
  const historyScore = Math.min(1, history.length / 4);

  const signals: DuplicateSignal[] = [
    { label: "Property", score: 1, detail: `Both at ${ctx.properties.find((p) => p.id === a.propertyId)?.name}` },
    { label: "Building & unit", score: unitScore, detail: unitDetail },
    { label: "Description", score: Number(descScore.toFixed(2)), detail: desc.shared.length ? `Shared terms: ${desc.shared.slice(0, 5).join(", ")}` : "Little overlapping wording" },
    { label: "Photographs", score: photoScore, detail: photoScore ? (sharedKinds.length ? `Both show ${sharedKinds[0].kind} damage` : "Photos attached but differ") : "Not enough photographs to compare" },
    { label: "Report dates", score: Number(dateScore.toFixed(2)), detail: gap === 0 ? "Reported the same day" : `Reported ${gap} day${gap === 1 ? "" : "s"} apart` },
    { label: "Maintenance history", score: historyScore, detail: history.length ? `${history.length} earlier ${a.category.toLowerCase()} report${history.length === 1 ? "" : "s"} at this location` : "No related history" },
  ];
  const score = Math.round((0.1 * 1 + 0.25 * unitScore + 0.3 * descScore + 0.1 * photoScore + 0.15 * dateScore + 0.1 * historyScore) * 100);
  const shared: string[] = [];
  if (unitScore === 1) shared.push("Same unit");
  else if (unitScore >= 0.6) shared.push("Same building / adjacent area");
  if (a.category === b.category) shared.push(`Same category (${a.category})`);
  if (gap <= 7) shared.push("Reported within a week");
  if (a.tenantId && a.tenantId === b.tenantId) shared.push("Same tenant");
  desc.shared.slice(0, 2).forEach((t) => shared.push(`Mentions "${t}"`));
  return { score, signals, shared, history };
}

/** Scan open requests for likely duplicates not already suggested. Never merges anything. */
export async function scanForDuplicates(ctx: AIContext, existing: DuplicateSuggestion[]): Promise<DuplicateSuggestion[]> {
  if (!awsConfig.useSimulatedAI) return callApi("/ai/duplicates/scan", { since: DEMO_NOW.toISOString() });
  await sleep(1400);
  const seen = new Set(existing.flatMap((s) => [s.primaryId, ...s.matchIds].sort().join("|")));
  const pairSeen = new Set(existing.map((s) => [s.primaryId, ...s.matchIds].sort().join("|")));
  const open = ctx.requests.filter(isOpen).filter((r) => !r.groupId);
  const recent = ctx.requests.filter((r) => daysBetween(r.reportedAt, DEMO_NOW.toISOString()) <= 45);
  const out: DuplicateSuggestion[] = [];
  for (const a of open) {
    for (const b of recent) {
      if (a.id === b.id) continue;
      const key = [a.id, b.id].sort().join("|");
      if (pairSeen.has(key) || seen.has(key)) continue;
      if (existing.some((s) => [s.primaryId, ...s.matchIds].includes(a.id) && [s.primaryId, ...s.matchIds].includes(b.id))) continue;
      const res = scoreDuplicatePair(a, b, ctx);
      if (!res || res.score < 62) continue;
      pairSeen.add(key);
      const unit = ctx.units.find((u) => u.id === a.unitId);
      out.push({
        id: uid("dup"),
        primaryId: new Date(a.reportedAt) > new Date(b.reportedAt) ? a.id : b.id,
        matchIds: [new Date(a.reportedAt) > new Date(b.reportedAt) ? b.id : a.id],
        score: res.score,
        signals: res.signals,
        sharedCharacteristics: res.shared,
        historicalNote: res.history.length
          ? `${res.history.length} related ${a.category.toLowerCase()} request(s) in the last 12 months. Most recent: ${formatDate(res.history[res.history.length - 1].reportedAt)}.`
          : "No related maintenance history at this location.",
        suggestedGroupTitle: `${unit?.label ?? "Communal"} — ${a.category.toLowerCase()} issue`,
        status: "pending",
        createdAt: DEMO_NOW.toISOString(),
      });
    }
  }
  return out.sort((x, y) => y.score - x.score).slice(0, 5);
}

/** Quick check used on the "new request" form to warn about possible duplicates before saving. */
export function findPossibleDuplicates(draft: MaintenanceRequest, ctx: AIContext) {
  return ctx.requests
    .filter((r) => r.id !== draft.id && (isOpen(r) || daysBetween(r.reportedAt, DEMO_NOW.toISOString()) < 60))
    .map((r) => ({ request: r, res: scoreDuplicatePair(draft, r, ctx) }))
    .filter((x): x is { request: MaintenanceRequest; res: NonNullable<ReturnType<typeof scoreDuplicatePair>> } => !!x.res && x.res.score >= 55)
    .sort((a, b) => b.res.score - a.res.score)
    .slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Contractor brief generation                                         */
/* ------------------------------------------------------------------ */
const INSPECTION_FOCUS: Record<IssueCategory, string[]> = {
  Plumbing: ["Trace the water source before repairing visible damage — check fixtures, seals and supply/waste pipework in the unit above.", "Pressure-test supply pipework in the ceiling void.", "Take moisture readings and photograph before/after."],
  Electrical: ["Carry out insulation resistance testing on affected circuits.", "Inspect recent alterations or fit-out wiring.", "Confirm RCD operation and load balancing; record readings."],
  Roofing: ["Survey the full pitch and valley rather than spot-repairing individual tiles.", "Check battens and underlay condition.", "Photograph roof from ground and loft side."],
  HVAC: ["Investigate root cause of repeated pressure loss — check expansion vessel, PRV and pipework for leaks.", "Record system pressure on arrival and departure.", "Recommend monitoring if fault is intermittent."],
  Structural: ["Measure and record crack widths; check for movement since last visit.", "Assess whether further structural survey is needed.", "Photograph with scale reference."],
  "Pest Control": ["Identify and seal entry points — previous treatments addressed symptoms only.", "Check adjoining units and service ducts.", "Record bait take and activity levels."],
  Appliances: ["Check model/serial against previous repairs.", "Assess whether repair or replacement is more economical.", "Test full cycle before leaving."],
  "General Maintenance": ["Confirm whether an underlying defect (e.g. leak or damp source) is causing the symptom.", "Photograph before and after.", "Note any follow-up work required."],
};

export async function generateBrief(request: MaintenanceRequest, ctx: AIContext): Promise<BriefSection[]> {
  if (!awsConfig.useSimulatedAI) return callApi("/ai/briefs", { requestId: request.id });
  await sleep(1500 + Math.random() * 700);

  const property = ctx.properties.find((p) => p.id === request.propertyId);
  const building = ctx.buildings.find((b) => b.id === request.buildingId);
  const unit = ctx.units.find((u) => u.id === request.unitId);
  const related = ctx.requests
    .filter(
      (r) =>
        r.id !== request.id &&
        r.propertyId === request.propertyId &&
        r.buildingId === request.buildingId &&
        (r.category === request.category || (r.groupId && r.groupId === request.groupId)) &&
        ((r.unitId ?? "c") === (request.unitId ?? "c") || (r.groupId && r.groupId === request.groupId)) &&
        new Date(r.reportedAt) < new Date(request.reportedAt)
    )
    .sort((a, b) => +new Date(a.reportedAt) - +new Date(b.reportedAt));
  const repaired = related.filter((r) => r.resolvedAt);
  const contractorName = (id?: string) => ctx.contractors.find((c) => c.id === id)?.name ?? "Unassigned";
  const focus = [...INSPECTION_FOCUS[request.category]];
  if (repaired.length >= 2) focus.unshift(`This is the ${ordinal(related.length + 1)} report here — previous ${repaired.length} repairs did not prevent recurrence. Prioritise a permanent fix over a like-for-like repair.`);
  const lastNote = [...repaired].reverse().find((r) => r.contractorNotes);
  if (lastNote?.contractorNotes && /recommend|suspect|possible|needs/i.test(lastNote.contractorNotes)) {
    focus.splice(1, 0, `Follow up the last contractor's recommendation: "${lastNote.contractorNotes.match(/[^.]*(recommend|suspect|possible|needs)[^.]*\./i)?.[0].trim() ?? lastNote.contractorNotes}"`);
  }

  return [
    {
      key: "property",
      title: "Property & location",
      body: `${property?.name}, ${property?.address}, ${property?.city} ${property?.postcode}.\n${building?.name}${unit ? `, ${unit.label} (floor ${unit.floor})` : " — communal area"}${request.location ? ` · ${request.location}` : ""}.\nProperty type: ${property?.type}. Built ${property?.yearBuilt}.${property?.notes ? `\nSite note: ${property.notes}` : ""}`,
    },
    {
      key: "complaint",
      title: "Current complaint",
      body: `${request.ref} — ${request.title} (${request.priority} priority, reported ${formatDate(request.reportedAt)}).\n"${request.description}"`,
    },
    {
      key: "previous",
      title: "Previous related complaints",
      body: related.length
        ? related.map((r) => `• ${formatDate(r.reportedAt)} — ${r.ref}: ${r.title} (${r.status})`).join("\n")
        : "No previous related complaints at this location in DwellMender records.",
    },
    {
      key: "repairs",
      title: "Historical repairs",
      body: repaired.length
        ? repaired.map((r) => `• ${formatDate(r.resolvedAt!)} — ${contractorName(r.contractorId)}${r.cost ? ` · £${r.cost}` : ""}`).join("\n") +
          `\nTotal spent on related repairs: £${repaired.reduce((s, r) => s + (r.cost ?? 0), 0).toLocaleString("en-GB")}.`
        : "No completed repairs on record for this issue.",
    },
    {
      key: "notes",
      title: "Previous contractor notes",
      body: repaired.filter((r) => r.contractorNotes).length
        ? repaired
            .filter((r) => r.contractorNotes)
            .map((r) => `• ${formatDate(r.resolvedAt!)} (${contractorName(r.contractorId)}): "${r.contractorNotes}"`)
            .join("\n")
        : "No contractor notes recorded.",
    },
    {
      key: "focus",
      title: "Suggested inspection focus",
      body: focus.map((f, i) => `${i + 1}. ${f}`).join("\n"),
    },
    {
      key: "access",
      title: "Access & contact",
      body: unit?.tenantId ? "Tenant contact details are shared with the assigned contractor once this brief is approved. Please arrange access at least 24 hours in advance unless urgent." : "Communal area — collect keys from site management. Notify affected occupiers before isolating services.",
    },
  ];
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
