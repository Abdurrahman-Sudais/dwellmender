/**
 * Demonstration data for DwellMender.
 *
 * Everything in this file is fictional. Contractors are demonstration records
 * (labelled "Demo" in the UI) and do not represent real businesses. Phone numbers
 * use the Ofcom drama range (01632 960xxx) and email addresses use example.com.
 */
import { isoDaysAgo } from "@/lib/utils";
import type {
  Building,
  Contractor,
  ContractorBrief,
  DuplicateSuggestion,
  IssueCategory,
  MaintenanceRequest,
  Photo,
  PhotoKind,
  Priority,
  Property,
  PropertyManager,
  RequestSource,
  RequestStatus,
  Tenant,
  Unit,
  UploadedDocument,
} from "./types";

/* ------------------------------------------------------------------ */
/* Seeded RNG so the demo is identical on every load                   */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261121);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */
export const managers: PropertyManager[] = [
  { id: "m-1", name: "Chidinma Okafor", email: "chidinma.okafor@demo-housing.example.com", phone: "01632 960 101", role: "Senior Property Manager" },
  { id: "m-2", name: "Daniel Whitmore", email: "daniel.whitmore@demo-housing.example.com", phone: "01632 960 102", role: "Property Manager" },
  { id: "m-3", name: "Priya Raman", email: "priya.raman@demo-housing.example.com", phone: "01632 960 103", role: "Facilities Manager" },
  { id: "m-4", name: "Tomasz Nowak", email: "tomasz.nowak@demo-housing.example.com", phone: "01632 960 104", role: "Property Manager" },
];

/* ------------------------------------------------------------------ */
/* Properties, buildings, units                                        */
/* ------------------------------------------------------------------ */
export const properties: Property[] = [
  {
    id: "p-harbour",
    name: "Harbourview Residences",
    address: "42 Quayside Road",
    city: "Leeds",
    postcode: "LS10 1QR",
    type: "Residential",
    managerId: "m-1",
    yearBuilt: 2009,
    accent: "from-navy-800 to-navy-600",
    notes: "Two-block apartment development. Block A bathrooms share a vertical riser on the B/C stack.",
  },
  {
    id: "p-elm",
    name: "Elmstead Court",
    address: "18 Elmstead Lane",
    city: "Manchester",
    postcode: "M14 6EL",
    type: "Student Accommodation",
    managerId: "m-2",
    yearBuilt: 1998,
    accent: "from-sage-700 to-sage-500",
    notes: "Purpose-built student halls. Building C runs on two communal boilers in the ground-floor plant room.",
  },
  {
    id: "p-king",
    name: "Kingsgate Business Centre",
    address: "7 Kingsgate Way",
    city: "Birmingham",
    postcode: "B3 2KG",
    type: "Commercial",
    managerId: "m-3",
    yearBuilt: 1987,
    accent: "from-slate-700 to-slate-500",
    notes: "Multi-let office building. Floor 2 east wing was refitted by an occupier in 2024.",
  },
  {
    id: "p-maple",
    name: "Maple Row Townhouses",
    address: "1–12 Maple Row",
    city: "Bristol",
    postcode: "BS5 9MR",
    type: "Residential",
    managerId: "m-4",
    yearBuilt: 1934,
    accent: "from-amber-600 to-amber-400",
    notes: "Victorian-style terrace with original timber roof structure on most houses.",
  },
  {
    id: "p-river",
    name: "Riverside Lofts",
    address: "90 Wharf Street",
    city: "Nottingham",
    postcode: "NG1 7RL",
    type: "Mixed Use",
    managerId: "m-1",
    yearBuilt: 1902,
    accent: "from-navy-700 to-sage-600",
    notes: "Converted warehouse: two ground-floor commercial units with loft apartments above.",
  },
  {
    id: "p-ash",
    name: "Ashdown House",
    address: "3 Ashdown Crescent",
    city: "Sheffield",
    postcode: "S10 3AH",
    type: "Supported Living",
    managerId: "m-2",
    yearBuilt: 1972,
    accent: "from-sage-800 to-navy-700",
    notes: "Nine self-contained flats with shared kitchen drainage stack.",
  },
];

export const buildings: Building[] = [
  { id: "b-ha", propertyId: "p-harbour", name: "Block A", floors: 6 },
  { id: "b-hb", propertyId: "p-harbour", name: "Block B", floors: 5 },
  { id: "b-ea", propertyId: "p-elm", name: "Building A", floors: 3 },
  { id: "b-eb", propertyId: "p-elm", name: "Building B", floors: 3 },
  { id: "b-ec", propertyId: "p-elm", name: "Building C", floors: 3 },
  { id: "b-km", propertyId: "p-king", name: "Main Building", floors: 4 },
  { id: "b-mr", propertyId: "p-maple", name: "The Terrace", floors: 3 },
  { id: "b-rl", propertyId: "p-river", name: "Warehouse Building", floors: 7 },
  { id: "b-ah", propertyId: "p-ash", name: "Main House", floors: 3 },
];

const units: Unit[] = [];
function addUnit(propertyId: string, buildingId: string, floor: number, label: string, type: string) {
  const id = `u-${buildingId.slice(2)}-${label.replace(/[^A-Za-z0-9]/g, "")}`;
  units.push({ id, propertyId, buildingId, floor, label, type });
  return id;
}
// Harbourview
for (let f = 1; f <= 6; f++) for (const l of ["A", "B", "C", "D"]) addUnit("p-harbour", "b-ha", f, `Flat ${f}${l}`, l === "A" || l === "D" ? "2-bed apartment" : "1-bed apartment");
for (let f = 1; f <= 5; f++) for (const n of [1, 2, 3]) addUnit("p-harbour", "b-hb", f, `Flat B${f}0${n}`, "2-bed apartment");
// Elmstead
for (const [bid, letter] of [["b-ea", "A"], ["b-eb", "B"], ["b-ec", "C"]] as const)
  for (let f = 1; f <= 3; f++) for (const r of ["01", "04", "05", "10"]) addUnit("p-elm", bid, f, `Room ${letter}-${f}${r}`, "En-suite study room");
// Kingsgate
for (let f = 1; f <= 4; f++) for (const s of [1, 2, 3, 4]) addUnit("p-king", "b-km", f, `Suite ${f}.0${s}`, "Office suite");
// Maple Row
for (let n = 1; n <= 12; n++) addUnit("p-maple", "b-mr", 0, `No. ${n}`, "3-bed townhouse");
// Riverside
addUnit("p-river", "b-rl", 0, "Unit G1", "Retail unit");
addUnit("p-river", "b-rl", 0, "Unit G2", "Café unit");
for (let f = 1; f <= 6; f++) for (const l of ["A", "B", "C"]) addUnit("p-river", "b-rl", f, `Loft ${f}${l}`, "Loft apartment");
// Ashdown
for (let n = 1; n <= 9; n++) addUnit("p-ash", "b-ah", Math.ceil(n / 3) - 1, `Flat ${n}`, "Studio flat");

/* Tenants */
const firstNames = ["Amara", "Oliver", "Sofia", "Kwame", "Hannah", "Yusuf", "Grace", "Liam", "Mei", "Samuel", "Aisha", "Callum", "Zara", "Ethan", "Nkechi", "Ruby", "Arjun", "Freya", "Tobi", "Isla", "Mateo", "Leah", "Femi", "Chloe", "Rohan", "Ella", "Kofi", "Niamh", "Hamza", "Poppy", "Ifeanyi", "Maya", "Jack", "Sana", "George", "Lola"];
const lastNames = ["Adeyemi", "Clarke", "Hughes", "Mensah", "Patel", "Brennan", "Okonkwo", "Walsh", "Chen", "Ibrahim", "Fraser", "Kowalski", "Bello", "Shah", "Murphy", "Evans", "Nwosu", "Ahmed", "Taylor", "Osei", "Rossi", "Kaur", "Doyle", "Bakare"];
const commercialOccupiers = ["Occupier: Design Studio (Demo)", "Occupier: Accountancy Practice (Demo)", "Occupier: Recruitment Agency (Demo)", "Occupier: Software Team (Demo)", "Occupier: Charity Office (Demo)", "Occupier: Architecture Practice (Demo)"];

export const tenants: Tenant[] = [];
units.forEach((u, i) => {
  // a handful of vacant units
  const storyUnits = ["Flat 4B", "Flat 4C", "Unit G2", "No. 11", "Room C-204", "Room C-310", "Room C-105", "Loft 1A", "Flat 1"];
  if (i % 9 === 5 && !storyUnits.includes(u.label)) return;
  const isCommercial = u.propertyId === "p-king" || u.type === "Retail unit" || u.type === "Café unit";
  const name = isCommercial
    ? u.type === "Café unit"
      ? "Occupier: Wharf Café (Demo)"
      : commercialOccupiers[i % commercialOccupiers.length]
    : `${firstNames[(i * 7) % firstNames.length]} ${lastNames[(i * 5) % lastNames.length]}`;
  const id = `t-${u.id.slice(2)}`;
  const handle = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  tenants.push({
    id,
    name,
    email: `${handle}@tenant.example.com`,
    phone: `07700 900${String(100 + (i % 900)).padStart(3, "0")}`,
    unitId: u.id,
    moveIn: isoDaysAgo(between(90, 1400)),
  });
  u.tenantId = id;
});
export { units };

const unitByLabel = (buildingId: string, label: string) => {
  const u = units.find((x) => x.buildingId === buildingId && x.label === label);
  if (!u) throw new Error(`Seed: unit ${label} not found in ${buildingId}`);
  return u;
};

/* ------------------------------------------------------------------ */
/* Contractors (demonstration records)                                */
/* ------------------------------------------------------------------ */
export const contractors: Contractor[] = [
  { id: "c-plumb-a", name: "Plumbing Partner A", categories: ["Plumbing"], contactName: "Demo Contact — Plumbing A", email: "plumbing-a@contractors.example.com", phone: "01632 960 201", coverage: "Yorkshire", rating: 3.6, avgResponseHours: 26, firstTimeFixRate: 0.58, hourlyRate: 62, status: "Active", joined: isoDaysAgo(900) },
  { id: "c-plumb-b", name: "Plumbing Partner B", categories: ["Plumbing", "HVAC"], contactName: "Demo Contact — Plumbing B", email: "plumbing-b@contractors.example.com", phone: "01632 960 202", coverage: "North of England", rating: 4.6, avgResponseHours: 9, firstTimeFixRate: 0.86, hourlyRate: 74, status: "Active", joined: isoDaysAgo(640) },
  { id: "c-drain", name: "Drainage Partner", categories: ["Plumbing"], contactName: "Demo Contact — Drainage", email: "drainage@contractors.example.com", phone: "01632 960 203", coverage: "National", rating: 4.1, avgResponseHours: 14, firstTimeFixRate: 0.71, hourlyRate: 68, status: "Active", joined: isoDaysAgo(720) },
  { id: "c-elec-a", name: "Electrical Partner A", categories: ["Electrical"], contactName: "Demo Contact — Electrical A", email: "electrical-a@contractors.example.com", phone: "01632 960 204", coverage: "Midlands", rating: 3.9, avgResponseHours: 18, firstTimeFixRate: 0.64, hourlyRate: 65, status: "Active", joined: isoDaysAgo(980) },
  { id: "c-elec-b", name: "Electrical Partner B", categories: ["Electrical", "Appliances"], contactName: "Demo Contact — Electrical B", email: "electrical-b@contractors.example.com", phone: "01632 960 205", coverage: "National", rating: 4.7, avgResponseHours: 11, firstTimeFixRate: 0.89, hourlyRate: 78, status: "Active", joined: isoDaysAgo(510) },
  { id: "c-hvac", name: "Heating & HVAC Partner", categories: ["HVAC"], contactName: "Demo Contact — HVAC", email: "hvac@contractors.example.com", phone: "01632 960 206", coverage: "North West", rating: 3.8, avgResponseHours: 7, firstTimeFixRate: 0.55, hourlyRate: 70, status: "Active", joined: isoDaysAgo(860) },
  { id: "c-roof", name: "Roofing Partner", categories: ["Roofing", "Structural"], contactName: "Demo Contact — Roofing", email: "roofing@contractors.example.com", phone: "01632 960 207", coverage: "South West", rating: 4.0, avgResponseHours: 30, firstTimeFixRate: 0.62, hourlyRate: 58, status: "Active", joined: isoDaysAgo(1100) },
  { id: "c-struct", name: "Structural Survey Partner", categories: ["Structural"], contactName: "Demo Contact — Structural", email: "structural@contractors.example.com", phone: "01632 960 208", coverage: "National", rating: 4.8, avgResponseHours: 48, firstTimeFixRate: 0.93, hourlyRate: 95, status: "Active", joined: isoDaysAgo(400) },
  { id: "c-pest", name: "Pest Control Partner", categories: ["Pest Control"], contactName: "Demo Contact — Pest Control", email: "pest@contractors.example.com", phone: "01632 960 209", coverage: "East Midlands", rating: 3.7, avgResponseHours: 22, firstTimeFixRate: 0.52, hourlyRate: 55, status: "Active", joined: isoDaysAgo(760) },
  { id: "c-appl", name: "Appliance Repair Partner", categories: ["Appliances"], contactName: "Demo Contact — Appliances", email: "appliances@contractors.example.com", phone: "01632 960 210", coverage: "National", rating: 4.3, avgResponseHours: 20, firstTimeFixRate: 0.8, hourlyRate: 60, status: "Active", joined: isoDaysAgo(580) },
  { id: "c-gen-a", name: "General Maintenance Partner A", categories: ["General Maintenance", "Structural"], contactName: "Demo Contact — General A", email: "general-a@contractors.example.com", phone: "01632 960 211", coverage: "North of England", rating: 4.2, avgResponseHours: 16, firstTimeFixRate: 0.78, hourlyRate: 45, status: "Active", joined: isoDaysAgo(1200) },
  { id: "c-gen-b", name: "General Maintenance Partner B", categories: ["General Maintenance", "Appliances"], contactName: "Demo Contact — General B", email: "general-b@contractors.example.com", phone: "01632 960 212", coverage: "South & Midlands", rating: 4.4, avgResponseHours: 19, firstTimeFixRate: 0.81, hourlyRate: 48, status: "On hold", joined: isoDaysAgo(300) },
];

/* ------------------------------------------------------------------ */
/* Maintenance requests                                                */
/* ------------------------------------------------------------------ */
const DUE_DAYS: Record<Priority, number> = { Urgent: 1, High: 3, Medium: 7, Low: 14 };

interface Draft {
  key?: string;
  title: string;
  description: string;
  propertyId: string;
  buildingId: string;
  unitLabel?: string;
  location?: string;
  category: IssueCategory;
  priority: Priority;
  status: RequestStatus;
  source?: RequestSource;
  daysAgo: number;
  resolvedAfter?: number;
  contractorId?: string;
  cost?: number;
  notes?: string;
  photos?: [PhotoKind, string][];
  aiConfidence?: number;
  aiCategory?: IssueCategory;
  reviewed?: "pending" | "accepted" | "corrected";
}

const drafts: Draft[] = [
  /* ---- Story A: persistent bathroom leak, Harbourview Block A, Flat 4B ---- */
  { key: "A1", title: "Water dripping from bathroom ceiling", description: "Water is dripping from the bathroom ceiling above the bath, mostly in the evenings. There's a small puddle every morning.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4B", location: "Bathroom ceiling", category: "Plumbing", priority: "High", status: "Closed", daysAgo: 310, resolvedAfter: 8, contractorId: "c-plumb-a", cost: 240, notes: "Resealed around bath and shower screen. No visible leak after 10-minute water test.", photos: [["water", "Drip marks on bathroom ceiling"]] },
  { key: "A2", title: "Bathroom ceiling leak has come back", description: "The leak in the bathroom ceiling that was fixed in January is back. Same spot above the bath, slightly worse.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4B", location: "Bathroom ceiling", category: "Plumbing", priority: "High", status: "Closed", daysAgo: 228, resolvedAfter: 7, contractorId: "c-plumb-a", cost: 310, notes: "Replaced shower waste trap and seal. Possible source in flat above (5B) — access not arranged on the day.", photos: [["water", "Water pooling on bath edge"], ["mould", "Discolouration around light"]] },
  { key: "A3", title: "Brown stain spreading on bathroom ceiling", description: "There's a big brown stain on the bathroom ceiling that keeps getting bigger. Paint is starting to bubble.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4B", location: "Bathroom ceiling", category: "Plumbing", priority: "Medium", status: "Closed", daysAgo: 151, resolvedAfter: 11, contractorId: "c-gen-a", cost: 180, notes: "Applied stain block and repainted ceiling. Moisture meter reading elevated (28%) — recommend plumbing investigation.", photos: [["mould", "Bubbling paint on ceiling"]] },
  { key: "A4", title: "Water leaking through bathroom light fitting", description: "Water is coming through the ceiling light in the bathroom. I've switched the light off at the fuse box.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4B", location: "Bathroom ceiling light", category: "Plumbing", priority: "Urgent", status: "Resolved", daysAgo: 74, resolvedAfter: 4, contractorId: "c-plumb-b", cost: 420, notes: "Isolated lighting circuit. Found weeping compression joint on supply pipe in ceiling void serving Flat 5B. Tightened joint. Recommend full inspection of 5B shower enclosure and tray.", photos: [["water", "Water inside light fitting"], ["electrical", "Isolated bathroom light"]] },
  { key: "A5", title: "Water coming through bathroom ceiling again", description: "Water is coming through the bathroom ceiling again, around the light and above the bath. This is the fourth or fifth time this year. Ceiling looks soft.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4B", location: "Bathroom ceiling", category: "Plumbing", priority: "High", status: "Under Review", source: "Tenant portal", daysAgo: 6, photos: [["water", "Active drip near light fitting"], ["mould", "Sagging ceiling plaster"]], aiConfidence: 0.94, reviewed: "accepted" },
  { key: "A6", title: "Damp patch on wall next to bathroom", description: "A damp patch has appeared on my hallway wall, which backs onto the bathroom in the flat next door (4B). It feels wet to touch.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4C", location: "Hallway wall (shared with 4B)", category: "General Maintenance", priority: "Medium", status: "New", source: "Tenant portal", daysAgo: 4, photos: [["mould", "Damp patch on hallway wall"]], aiCategory: "Plumbing", aiConfidence: 0.71, reviewed: "pending" },
  { key: "A7", title: "Follow-up: ceiling still leaking", description: "Emailing to follow up on my report from last week — the bathroom ceiling is still leaking and now there's a crack forming.", propertyId: "p-harbour", buildingId: "b-ha", unitLabel: "Flat 4B", location: "Bathroom ceiling", category: "Plumbing", priority: "High", status: "New", source: "Email", daysAgo: 2, photos: [["crack", "Hairline crack across ceiling"]], aiConfidence: 0.91, reviewed: "pending" },

  /* ---- Story B: communal boiler failures, Elmstead Court Building C ---- */
  { key: "B1", title: "No heating or hot water in Building C", description: "Several students report no heating or hot water across Building C since this morning.", propertyId: "p-elm", buildingId: "b-ec", location: "Plant room — Boiler 2", category: "HVAC", priority: "Urgent", status: "Closed", source: "Phone", daysAgo: 168, resolvedAfter: 1, contractorId: "c-hvac", cost: 380, notes: "Reset boiler 2 after low-pressure lockout. Repressurised system to 1.5 bar.", photos: [["heating", "Boiler 2 lockout display"]] },
  { key: "B2", title: "Heating off across Building C", description: "Heating has gone off again across the whole of Building C.", propertyId: "p-elm", buildingId: "b-ec", location: "Plant room — Boiler 2", category: "HVAC", priority: "Urgent", status: "Closed", source: "Phone", daysAgo: 121, resolvedAfter: 2, contractorId: "c-hvac", cost: 290, notes: "Low-pressure lockout again. Topped up system. Advise checking for a system leak.", photos: [["heating", "Pressure gauge reading 0.3 bar"]] },
  { key: "B3", title: "Radiators cold throughout the building", description: "Radiators are cold on every floor of Building C.", propertyId: "p-elm", buildingId: "b-ec", location: "Plant room — Boiler 2", category: "HVAC", priority: "High", status: "Closed", source: "Inspection", daysAgo: 64, resolvedAfter: 3, contractorId: "c-hvac", cost: 640, notes: "Replaced expansion vessel on boiler 2. Pressure holding at handover.", photos: [["heating", "Replaced expansion vessel"]] },
  { key: "B4", title: "Boiler 2 lockout — no hot water", description: "Boiler 2 is showing a fault code and there's no hot water in Building C.", propertyId: "p-elm", buildingId: "b-ec", location: "Plant room — Boiler 2", category: "HVAC", priority: "Urgent", status: "Resolved", source: "Phone", daysAgo: 23, resolvedAfter: 2, contractorId: "c-hvac", cost: 210, notes: "Pressure dropped to 0.4 bar. Reset. Possible leak on flow pipework under ground-floor corridor — needs investigation.", photos: [["heating", "Fault code F22 on boiler panel"]] },
  { key: "B5", title: "No heating in my room", description: "My radiator has been cold since yesterday and the shower is only lukewarm.", propertyId: "p-elm", buildingId: "b-ec", unitLabel: "Room C-204", category: "HVAC", priority: "High", status: "New", source: "Tenant portal", daysAgo: 2, aiConfidence: 0.96, reviewed: "pending" },
  { key: "B6", title: "Radiator cold and no hot water", description: "There's no hot water in my en-suite and the radiator is completely cold.", propertyId: "p-elm", buildingId: "b-ec", unitLabel: "Room C-310", category: "HVAC", priority: "High", status: "New", source: "Tenant portal", daysAgo: 2, photos: [["heating", "Cold radiator, thermostat on max"]], aiConfidence: 0.93, reviewed: "pending" },
  { key: "B7", title: "Heating not working", description: "Heating isn't working in my room. Friends on other floors say the same.", propertyId: "p-elm", buildingId: "b-ec", unitLabel: "Room C-105", category: "General Maintenance", priority: "Medium", status: "New", source: "Tenant portal", daysAgo: 1, aiCategory: "HVAC", aiConfidence: 0.89, reviewed: "pending" },

  /* ---- Story C: tripping circuits, Kingsgate floor 2 east wing ---- */
  { key: "C1", title: "Breakers tripping — east wing floor 2", description: "The RCD keeps tripping in the east wing on floor 2, cutting power to desks.", propertyId: "p-king", buildingId: "b-km", location: "Floor 2 east wing distribution board", category: "Electrical", priority: "High", status: "Closed", source: "Email", daysAgo: 280, resolvedAfter: 1, contractorId: "c-elec-a", cost: 150, notes: "Reset RCD. Unable to replicate fault during visit." },
  { key: "C2", title: "Power lost to desks on level 2", description: "Power to the east side desks on level 2 dropped twice this morning.", propertyId: "p-king", buildingId: "b-km", location: "Floor 2 east wing distribution board", category: "Electrical", priority: "High", status: "Closed", source: "Email", daysAgo: 190, resolvedAfter: 2, contractorId: "c-elec-a", cost: 260, notes: "Found overloaded ring circuit. Moved two kitchen appliances to a separate circuit.", photos: [["electrical", "Distribution board circuit 7"]] },
  { key: "C3", title: "Repeated RCD trips on floor 2", description: "RCD tripped three times this week on floor 2 east wing.", propertyId: "p-king", buildingId: "b-km", location: "Floor 2 east wing distribution board", category: "Electrical", priority: "High", status: "Closed", source: "Inspection", daysAgo: 97, resolvedAfter: 2, contractorId: "c-elec-b", cost: 340, notes: "Insulation resistance test: low reading on circuit 7. Occupier fit-out floor sockets suspected — needs further testing with occupier access.", photos: [["electrical", "Test meter reading on circuit 7"]] },
  { key: "C4", title: "Lights flickering in meeting room 2.14", description: "Ceiling lights in meeting room 2.14 flicker and occasionally go off completely.", propertyId: "p-king", buildingId: "b-km", location: "Meeting room 2.14 (east wing)", category: "Electrical", priority: "Medium", status: "In Progress", source: "Tenant portal", daysAgo: 9, contractorId: "c-elec-a", aiConfidence: 0.88, reviewed: "accepted" },
  { key: "C5", title: "Power cut to east wing desks — again", description: "We've lost power to the east wing desks again on floor 2. This is becoming a regular issue for our team.", propertyId: "p-king", buildingId: "b-km", location: "Floor 2 east wing", category: "Electrical", priority: "High", status: "Assigned", source: "Email", daysAgo: 8, contractorId: "c-elec-a", aiConfidence: 0.95, reviewed: "accepted" },

  /* ---- Story D: roof, Maple Row No. 11 ---- */
  { key: "D1", title: "Slipped roof tiles after storm", description: "Several tiles have slipped on the back of the roof after last night's storm.", propertyId: "p-maple", buildingId: "b-mr", unitLabel: "No. 11", location: "Rear roof pitch", category: "Roofing", priority: "High", status: "Closed", source: "Phone", daysAgo: 330, resolvedAfter: 10, contractorId: "c-roof", cost: 450, notes: "Replaced 6 slipped tiles at rear pitch.", photos: [["roof", "Slipped tiles on rear pitch"]] },
  { key: "D2", title: "Roof tiles missing at the back", description: "I can see gaps where tiles are missing on the back roof.", propertyId: "p-maple", buildingId: "b-mr", unitLabel: "No. 11", location: "Rear roof pitch", category: "Roofing", priority: "High", status: "Closed", source: "Tenant portal", daysAgo: 205, resolvedAfter: 9, contractorId: "c-roof", cost: 380, notes: "Refixed 4 tiles. Battens appear degraded in places.", photos: [["roof", "Gap in tiles near valley"]] },
  { key: "D3", title: "Water coming into loft after heavy rain", description: "After heavy rain, water is dripping into the loft space and onto stored boxes.", propertyId: "p-maple", buildingId: "b-mr", unitLabel: "No. 11", location: "Loft — rear valley", category: "Roofing", priority: "Urgent", status: "Resolved", source: "Phone", daysAgo: 40, resolvedAfter: 7, contractorId: "c-roof", cost: 520, notes: "Temporary patch over rear valley. Recommend full rear pitch survey and batten replacement.", photos: [["water", "Wet timber in loft"], ["roof", "Temporary valley patch"]] },
  { key: "D4", title: "Damp patch on loft bedroom ceiling", description: "A damp patch has appeared on the ceiling of the loft bedroom near the back wall.", propertyId: "p-maple", buildingId: "b-mr", unitLabel: "No. 11", location: "Loft bedroom ceiling", category: "General Maintenance", priority: "Medium", status: "New", source: "Tenant portal", daysAgo: 5, photos: [["mould", "Damp patch near rear wall"]], aiCategory: "Roofing", aiConfidence: 0.67, reviewed: "pending" },

  /* ---- Story E: pests, Riverside Lofts café unit ---- */
  { key: "E1", title: "Mouse droppings in café kitchen", description: "Staff found mouse droppings behind the kitchen units.", propertyId: "p-river", buildingId: "b-rl", unitLabel: "Unit G2", location: "Café kitchen", category: "Pest Control", priority: "High", status: "Closed", source: "Email", daysAgo: 240, resolvedAfter: 6, contractorId: "c-pest", cost: 220, notes: "Bait stations placed. Advised deep clean.", photos: [["pest", "Droppings behind units"]] },
  { key: "E2", title: "Mice seen in storeroom", description: "Mice seen in the dry storeroom at closing time.", propertyId: "p-river", buildingId: "b-rl", unitLabel: "Unit G2", location: "Dry storeroom", category: "Pest Control", priority: "High", status: "Closed", source: "Phone", daysAgo: 150, resolvedAfter: 5, contractorId: "c-pest", cost: 260, notes: "Additional bait stations. Possible entry near rear service duct.", photos: [["pest", "Gnawed packaging"]] },
  { key: "E3", title: "Rodent activity returning in kitchen", description: "Signs of rodents again in the kitchen and storeroom.", propertyId: "p-river", buildingId: "b-rl", unitLabel: "Unit G2", location: "Café kitchen", category: "Pest Control", priority: "High", status: "Closed", source: "Email", daysAgo: 60, resolvedAfter: 4, contractorId: "c-pest", cost: 240, notes: "Entry point near rear service duct not sealed — building fabric repair needed (landlord responsibility).", photos: [["pest", "Gap around service duct"]] },
  { key: "E4", title: "Droppings found under sink", description: "Fresh droppings found under the sink in the café kitchen this morning.", propertyId: "p-river", buildingId: "b-rl", unitLabel: "Unit G2", location: "Café kitchen", category: "Pest Control", priority: "High", status: "Assigned", source: "Email", daysAgo: 12, contractorId: "c-pest", aiConfidence: 0.97, reviewed: "accepted", photos: [["pest", "Droppings under sink"]] },
  { key: "E5", title: "Scratching noises in the walls at night", description: "I keep hearing scratching inside the walls and under the floor at night, near the kitchen.", propertyId: "p-river", buildingId: "b-rl", unitLabel: "Loft 1A", location: "Kitchen wall / floor void", category: "General Maintenance", priority: "Low", status: "New", source: "Tenant portal", daysAgo: 10, aiCategory: "Pest Control", aiConfidence: 0.74, reviewed: "pending" },

  /* ---- Story F: blocked stack, Ashdown House ---- */
  { key: "F1", title: "Kitchen sink draining very slowly", description: "Kitchen sink is draining slowly and smells.", propertyId: "p-ash", buildingId: "b-ah", unitLabel: "Flat 1", location: "Kitchen drainage stack", category: "Plumbing", priority: "Medium", status: "Closed", source: "Phone", daysAgo: 200, resolvedAfter: 5, contractorId: "c-drain", cost: 160, notes: "Rodded kitchen branch. Heavy fat build-up in shared stack." },
  { key: "F2", title: "Sink backing up with dirty water", description: "Dirty water backs up into my sink when upstairs use their kitchen.", propertyId: "p-ash", buildingId: "b-ah", unitLabel: "Flat 1", location: "Kitchen drainage stack", category: "Plumbing", priority: "High", status: "Closed", source: "Phone", daysAgo: 110, resolvedAfter: 3, contractorId: "c-drain", cost: 210, notes: "Jetted stack from ground floor. Recommend CCTV survey of stack.", photos: [["water", "Water backing up in sink"]] },
  { key: "F3", title: "Blocked kitchen drain again", description: "Kitchen drain is blocked again and water is coming up through the sink.", propertyId: "p-ash", buildingId: "b-ah", unitLabel: "Flat 1", location: "Kitchen drainage stack", category: "Plumbing", priority: "High", status: "Resolved", source: "Phone", daysAgo: 35, resolvedAfter: 2, contractorId: "c-drain", cost: 190, notes: "Jetted again. CCTV survey still not commissioned.", photos: [["water", "Standing water in sink"]] },
];

/* Background (non-story) requests for realistic volume and analytics */
const templates: Record<IssueCategory, { title: string; description: string; photo?: PhotoKind; cost: [number, number] }[]> = {
  Plumbing: [
    { title: "Dripping kitchen tap", description: "The kitchen tap drips constantly even when fully closed.", photo: "water", cost: [60, 140] },
    { title: "Toilet cistern keeps running", description: "Toilet cistern refills constantly and makes a hissing noise.", photo: "water", cost: [80, 160] },
    { title: "Low water pressure in shower", description: "Shower pressure has dropped significantly over the past week.", cost: [90, 220] },
    { title: "Leak under bathroom sink", description: "Small leak from the pipe under the bathroom basin.", photo: "water", cost: [70, 180] },
  ],
  Electrical: [
    { title: "Socket not working in bedroom", description: "Double socket in the bedroom has stopped working.", photo: "electrical", cost: [70, 150] },
    { title: "Extractor fan not working", description: "Bathroom extractor fan doesn't turn on.", cost: [90, 200] },
    { title: "Corridor lights out", description: "Lights in the corridor outside the flat are out.", photo: "electrical", cost: [60, 130] },
    { title: "Smoke alarm chirping", description: "Hard-wired smoke alarm chirps every few minutes.", cost: [50, 110] },
  ],
  Roofing: [
    { title: "Gutter overflowing", description: "Gutter overflows during rain, water running down the wall.", photo: "roof", cost: [120, 300] },
    { title: "Loose flashing near chimney", description: "Flashing near the chimney appears loose after high winds.", photo: "roof", cost: [200, 480] },
  ],
  HVAC: [
    { title: "Radiator not heating up", description: "One radiator stays cold while others are warm.", photo: "heating", cost: [80, 190] },
    { title: "Air conditioning unit noisy", description: "AC unit makes a loud rattling noise when running.", cost: [150, 350] },
    { title: "Thermostat unresponsive", description: "Wall thermostat display is blank and heating won't adjust.", cost: [90, 210] },
  ],
  Structural: [
    { title: "Crack in hallway plaster", description: "A crack has appeared in the plaster in the hallway above the door frame.", photo: "crack", cost: [150, 420] },
    { title: "Window frame rotting", description: "Timber window frame is soft and rotting at the bottom corner.", cost: [220, 600] },
    { title: "Front door sticking", description: "Front door sticks in the frame and is hard to lock.", cost: [80, 200] },
  ],
  "Pest Control": [
    { title: "Wasps nest near window", description: "There's a wasps nest under the eaves next to the bedroom window.", photo: "pest", cost: [80, 140] },
    { title: "Ants in kitchen", description: "Lines of ants coming in near the back door.", photo: "pest", cost: [70, 130] },
  ],
  Appliances: [
    { title: "Washing machine not draining", description: "Washing machine stops mid-cycle with water left in the drum.", photo: "appliance", cost: [80, 220] },
    { title: "Oven not heating", description: "Oven turns on but doesn't get hot.", photo: "appliance", cost: [90, 260] },
    { title: "Fridge freezer warm", description: "Fridge is not keeping food cold.", photo: "appliance", cost: [100, 280] },
  ],
  "General Maintenance": [
    { title: "Kitchen cupboard door hanging off", description: "Hinge on the kitchen cupboard door has broken.", cost: [40, 90] },
    { title: "Communal entrance door closer broken", description: "Entrance door slams shut — closer arm appears broken.", cost: [90, 210] },
    { title: "Mould on bedroom wall", description: "Black mould appearing on the outside wall in the bedroom.", photo: "mould", cost: [120, 320] },
    { title: "Flooring lifting in hallway", description: "Laminate flooring is lifting near the front door.", cost: [100, 260] },
  ],
};

const photoCaptions: Record<PhotoKind, string> = {
  water: "Water damage close-up",
  crack: "Crack in plaster",
  electrical: "Faulty fitting",
  roof: "Roof exterior",
  pest: "Evidence of pest activity",
  appliance: "Appliance fault",
  mould: "Mould growth",
  heating: "Heating system",
  general: "General view",
};

const categoryWeights: IssueCategory[] = [
  "Plumbing", "Plumbing", "Plumbing", "Electrical", "Electrical", "HVAC", "HVAC", "General Maintenance", "General Maintenance", "General Maintenance", "Appliances", "Appliances", "Structural", "Roofing", "Pest Control",
];

const backgroundUnits = units.filter((u) => !(["Flat 4B", "No. 11", "Unit G2"].includes(u.label) || (u.propertyId === "p-ash" && u.label === "Flat 1")));
for (let i = 0; i < 150; i++) {
  const category = pick(categoryWeights);
  const tpl = pick(templates[category]);
  // pick a unit across the whole portfolio so larger properties get proportionally more requests
  const unit = pick(backgroundUnits);
  const property = properties.find((p) => p.id === unit.propertyId)!;
  // skew towards recent months for a busy-looking dashboard
  const daysAgo = Math.floor(Math.pow(rand(), 1.25) * 520);
  const priority: Priority = pick(["Low", "Medium", "Medium", "Medium", "High", "High", "Urgent"] as const);
  let status: RequestStatus;
  if (daysAgo > 45) status = rand() < 0.75 ? "Closed" : "Resolved";
  else if (daysAgo > 14) status = pick(["Resolved", "Resolved", "Closed", "In Progress", "Assigned"] as const);
  else status = pick(["New", "Under Review", "Assigned", "In Progress", "In Progress", "Resolved"] as const);
  const contractor = contractors.find((c) => c.categories[0] === category) ?? contractors.find((c) => c.categories.includes(category));
  const resolvedAfter = { Urgent: between(1, 3), High: between(2, 7), Medium: between(4, 14), Low: between(7, 25) }[priority];
  const done = status === "Resolved" || status === "Closed";
  drafts.push({
    title: tpl.title,
    description: tpl.description,
    propertyId: property.id,
    buildingId: unit.buildingId,
    unitLabel: unit.label,
    category,
    priority,
    status,
    source: pick(["Tenant portal", "Tenant portal", "Tenant portal", "Email", "Phone", "Inspection"] as const),
    daysAgo,
    resolvedAfter: done ? Math.min(resolvedAfter, Math.max(daysAgo, 1)) : undefined,
    contractorId: status === "New" || status === "Under Review" ? undefined : contractor?.id,
    cost: done ? between(tpl.cost[0], tpl.cost[1]) : undefined,
    notes: done ? "Repair completed and tested. Tenant confirmed issue resolved." : undefined,
    photos: tpl.photo && rand() < 0.6 ? [[tpl.photo, photoCaptions[tpl.photo]]] : undefined,
    aiConfidence: 0.78 + rand() * 0.2,
    reviewed: daysAgo > 10 ? (rand() < 0.88 ? "accepted" : "corrected") : "pending",
  });
}

drafts.sort((a, b) => b.daysAgo - a.daysAgo);

const systemActor = "DwellMender AI (simulated)";
/** What the (simulated) model wrongly suggested for requests a manager later corrected. */
const ALT_CATEGORY: Record<IssueCategory, IssueCategory> = {
  Plumbing: "General Maintenance",
  Electrical: "Appliances",
  HVAC: "Plumbing",
  "General Maintenance": "Structural",
  Appliances: "Electrical",
  Structural: "General Maintenance",
  Roofing: "Structural",
  "Pest Control": "General Maintenance",
};
const keyToId: Record<string, string> = {};

export const requests: MaintenanceRequest[] = drafts.map((d, i) => {
  const id = `r-${1001 + i}`;
  if (d.key) keyToId[d.key] = id;
  const reportedAt = isoDaysAgo(d.daysAgo, 8 + (i % 9));
  const unit = d.unitLabel ? unitByLabel(d.buildingId, d.unitLabel) : undefined;
  const due = new Date(reportedAt);
  due.setUTCDate(due.getUTCDate() + DUE_DAYS[d.priority]);
  const resolvedAt = d.resolvedAfter !== undefined ? isoDaysAgo(Math.max(d.daysAgo - d.resolvedAfter, 0), 15) : undefined;
  const photos: Photo[] = (d.photos ?? []).map(([kind, caption], j) => ({ id: `${id}-ph${j}`, kind, caption }));
  const confidence = d.aiConfidence ?? 0.9;
  const contractor = contractors.find((c) => c.id === d.contractorId);
  const timeline: MaintenanceRequest["timeline"] = [
    { id: `${id}-e1`, at: reportedAt, type: "created", text: `Request logged via ${d.source ?? "Tenant portal"}`, actor: d.source === "Inspection" ? "Inspector" : "Tenant" },
    { id: `${id}-e2`, at: reportedAt, type: "ai", text: `Classified as ${d.aiCategory ?? d.category} (${Math.round(confidence * 100)}% confidence)`, actor: systemActor },
  ];
  if (contractor) timeline.push({ id: `${id}-e3`, at: isoDaysAgo(Math.max(d.daysAgo - 1, 0), 10), type: "assigned", text: `Assigned to ${contractor.name}`, actor: "Property manager" });
  if (d.status === "In Progress") timeline.push({ id: `${id}-e4`, at: isoDaysAgo(Math.max(d.daysAgo - 2, 0), 11), type: "status", text: "Contractor on site — work in progress", actor: contractor?.name ?? "Contractor" });
  if (resolvedAt) timeline.push({ id: `${id}-e5`, at: resolvedAt, type: "status", text: d.notes ? `Resolved — ${d.notes}` : "Marked resolved", actor: contractor?.name ?? "Contractor" });
  if (d.status === "Closed" && resolvedAt) timeline.push({ id: `${id}-e6`, at: resolvedAt, type: "status", text: "Closed after tenant confirmation", actor: "Property manager" });

  return {
    id,
    ref: `MR-${1001 + i}`,
    title: d.title,
    description: d.description,
    propertyId: d.propertyId,
    buildingId: d.buildingId,
    unitId: unit?.id,
    location: d.location,
    category: d.category,
    priority: d.priority,
    status: d.status,
    source: d.source ?? "Tenant portal",
    reportedAt,
    resolvedAt,
    dueAt: due.toISOString(),
    tenantId: unit?.tenantId,
    contractorId: d.contractorId,
    photos,
    cost: d.cost,
    contractorNotes: d.notes,
    ai: {
      suggestedCategory: d.aiCategory ?? (d.reviewed === "corrected" ? ALT_CATEGORY[d.category] : d.category),
      confidence,
      suggestedPriority: d.priority,
      keywords: extractKeywordsForSeed(d.title + " " + d.description),
      reviewed: d.reviewed ?? "accepted",
      model: "anthropic.claude (Bedrock) — simulated",
    },
    timeline,
  };
});

function extractKeywordsForSeed(text: string) {
  const vocab = ["leak", "water", "ceiling", "drip", "stain", "damp", "heating", "radiator", "boiler", "hot water", "power", "rcd", "breaker", "lights", "flicker", "roof", "tiles", "loft", "rain", "mice", "droppings", "rodent", "scratching", "drain", "blocked", "sink", "socket", "mould", "crack", "tap", "toilet"];
  const lower = text.toLowerCase();
  return vocab.filter((v) => lower.includes(v)).slice(0, 5);
}

export const storyRequestIds = keyToId;

/* ------------------------------------------------------------------ */
/* Duplicate suggestions (pending human review)                        */
/* ------------------------------------------------------------------ */
const k = (key: string) => keyToId[key];

export const duplicateSuggestions: DuplicateSuggestion[] = [
  {
    id: "dup-1",
    primaryId: k("A5"),
    matchIds: [k("A7")],
    score: 93,
    signals: [
      { label: "Property", score: 1, detail: "Both at Harbourview Residences" },
      { label: "Building & unit", score: 1, detail: "Same unit — Block A, Flat 4B" },
      { label: "Description", score: 0.88, detail: "Shared terms: bathroom ceiling, leaking, water" },
      { label: "Photographs", score: 0.62, detail: "Both show the same ceiling area; new crack visible in later photo" },
      { label: "Report dates", score: 0.95, detail: "Reported 4 days apart" },
      { label: "Maintenance history", score: 0.9, detail: "4 previous leak reports at this location" },
    ],
    sharedCharacteristics: ["Same tenant", "Same unit and room", "Active water ingress", "Follow-up language (\"still leaking\")"],
    historicalNote: "Flat 4B has had 4 related repairs in 10 months (resealing, waste trap, redecoration, joint tightening). Last contractor noted source likely in Flat 5B.",
    suggestedGroupTitle: "Flat 4B bathroom ceiling leak (ongoing)",
    status: "pending",
    createdAt: isoDaysAgo(2, 10),
  },
  {
    id: "dup-2",
    primaryId: k("A5"),
    matchIds: [k("A6")],
    score: 81,
    signals: [
      { label: "Property", score: 1, detail: "Both at Harbourview Residences" },
      { label: "Building & unit", score: 0.7, detail: "Adjacent units — Flat 4B and Flat 4C share a wall" },
      { label: "Description", score: 0.66, detail: "Shared terms: damp, bathroom, wet; 4C report names 4B explicitly" },
      { label: "Photographs", score: 0.55, detail: "Moisture staining patterns are similar" },
      { label: "Report dates", score: 0.93, detail: "Reported 2 days apart" },
      { label: "Maintenance history", score: 0.85, detail: "Active leak history in neighbouring unit" },
    ],
    sharedCharacteristics: ["Adjacent units on same floor", "Moisture affecting shared wall", "Tenant references Flat 4B bathroom"],
    historicalNote: "No previous issues logged for Flat 4C. Neighbouring 4B leak has recurred 4 times.",
    suggestedGroupTitle: "Flat 4B bathroom ceiling leak (ongoing)",
    status: "pending",
    createdAt: isoDaysAgo(3, 14),
  },
  {
    id: "dup-3",
    primaryId: k("B5"),
    matchIds: [k("B6"), k("B7")],
    score: 94,
    signals: [
      { label: "Property", score: 1, detail: "All at Elmstead Court" },
      { label: "Building & unit", score: 0.8, detail: "Same building (C), three different floors — consistent with communal plant" },
      { label: "Description", score: 0.9, detail: "Shared terms: heating, radiator cold, no hot water" },
      { label: "Photographs", score: 0.4, detail: "Only one report includes a photo" },
      { label: "Report dates", score: 1, detail: "All reported within 24 hours" },
      { label: "Maintenance history", score: 0.95, detail: "Boiler 2 has locked out 4 times in 6 months" },
    ],
    sharedCharacteristics: ["Same building, multiple floors", "Loss of heating and hot water", "Reported within 24 hours", "Communal boiler serves all units"],
    historicalNote: "Building C plant room: 4 boiler lockouts in 168 days. Last visit flagged a possible leak on flow pipework under the ground-floor corridor.",
    suggestedGroupTitle: "Building C heating outage — Boiler 2",
    status: "pending",
    createdAt: isoDaysAgo(1, 9),
  },
  {
    id: "dup-4",
    primaryId: k("C5"),
    matchIds: [k("C4")],
    score: 78,
    signals: [
      { label: "Property", score: 1, detail: "Both at Kingsgate Business Centre" },
      { label: "Building & unit", score: 0.75, detail: "Floor 2 east wing — same distribution board" },
      { label: "Description", score: 0.58, detail: "Different symptoms (flicker vs power loss), same electrical zone" },
      { label: "Photographs", score: 0, detail: "No photographs attached" },
      { label: "Report dates", score: 0.95, detail: "Reported 1 day apart" },
      { label: "Maintenance history", score: 0.88, detail: "3 previous RCD/circuit faults in this zone" },
    ],
    sharedCharacteristics: ["Same floor and wing", "Electrical supply interruption", "Same contractor already assigned"],
    historicalNote: "Circuit 7 showed low insulation resistance in August. Further testing with occupier access was recommended and not completed.",
    suggestedGroupTitle: "Floor 2 east wing circuit faults",
    status: "pending",
    createdAt: isoDaysAgo(7, 16),
  },
  {
    id: "dup-5",
    primaryId: k("D4"),
    matchIds: [k("D3")],
    score: 72,
    signals: [
      { label: "Property", score: 1, detail: "Both at Maple Row Townhouses" },
      { label: "Building & unit", score: 1, detail: "Same house — No. 11" },
      { label: "Description", score: 0.52, detail: "Shared terms: damp, rear, loft; different wording" },
      { label: "Photographs", score: 0.48, detail: "Water staining near rear wall in both" },
      { label: "Report dates", score: 0.7, detail: "35 days apart, after resolution of earlier request" },
      { label: "Maintenance history", score: 0.92, detail: "3 roof repairs in 11 months; temporary patch only" },
    ],
    sharedCharacteristics: ["Same house", "Rear of property under the roof valley", "Earlier repair was temporary"],
    historicalNote: "Roofing contractor recommended a full rear-pitch survey and batten replacement 33 days ago. Not yet commissioned.",
    suggestedGroupTitle: "No. 11 rear roof water ingress",
    status: "pending",
    createdAt: isoDaysAgo(4, 11),
  },
  {
    id: "dup-6",
    primaryId: k("E5"),
    matchIds: [k("E4")],
    score: 64,
    signals: [
      { label: "Property", score: 1, detail: "Both at Riverside Lofts" },
      { label: "Building & unit", score: 0.5, detail: "Loft 1A is directly above café Unit G2" },
      { label: "Description", score: 0.35, detail: "Indirect match: scratching noises vs droppings" },
      { label: "Photographs", score: 0, detail: "Loft 1A report has no photo" },
      { label: "Report dates", score: 0.9, detail: "Reported 2 days apart" },
      { label: "Maintenance history", score: 0.8, detail: "Unit G2 has 3 previous rodent treatments" },
    ],
    sharedCharacteristics: ["Vertically adjacent units", "Possible rodent activity", "Unsealed service duct noted in history"],
    historicalNote: "Pest contractor flagged an unsealed rear service duct 60 days ago — building fabric repair outstanding.",
    suggestedGroupTitle: "Riverside rodent activity — rear service duct",
    status: "pending",
    createdAt: isoDaysAgo(9, 12),
  },
];

/* ------------------------------------------------------------------ */
/* Contractor briefs                                                   */
/* ------------------------------------------------------------------ */
export const briefs: ContractorBrief[] = [
  {
    id: "brief-1",
    requestId: k("C5"),
    contractorId: "c-elec-a",
    status: "Shared",
    generatedAt: isoDaysAgo(7, 13),
    updatedAt: isoDaysAgo(7, 15),
    approvedBy: "Priya Raman",
    photoIds: [],
    sections: [
      { key: "property", title: "Property & location", body: "Kingsgate Business Centre, 7 Kingsgate Way, Birmingham B3 2KG. Main Building, Floor 2 east wing. Occupied office floor — access via reception, 08:00–18:00." },
      { key: "complaint", title: "Current complaint", body: "Occupier reports loss of power to east wing desks on Floor 2 (MR raised 8 days ago). Related report of flickering lights in meeting room 2.14." },
      { key: "previous", title: "Previous related complaints", body: "3 prior reports in the last 9 months: RCD tripping (280 days ago), power loss to desks (190 days ago), repeated RCD trips (97 days ago)." },
      { key: "repairs", title: "Historical repairs", body: "• RCD reset, fault not replicated.\n• Kitchen appliances moved to separate circuit.\n• Insulation resistance test — low reading on circuit 7." },
      { key: "notes", title: "Previous contractor notes", body: "\"Occupier fit-out floor sockets suspected — needs further testing with occupier access.\"" },
      { key: "focus", title: "Suggested inspection focus", body: "1. Full insulation resistance testing of circuit 7 with occupier floor boxes exposed.\n2. Inspect fit-out floor socket wiring installed in 2024.\n3. Check lighting circuit for meeting room 2.14 shares neutral with circuit 7.\n4. Provide written findings and a permanent-fix recommendation." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Uploaded documents (Textract extraction queue)                      */
/* ------------------------------------------------------------------ */
export const documents: UploadedDocument[] = [
  {
    id: "doc-1",
    filename: "PlumbingPartnerB_JobSheet_Harbourview_4B.pdf",
    kind: "Contractor report",
    uploadedAt: isoDaysAgo(70, 16),
    size: "412 KB",
    status: "Reviewed",
    linkedRequestId: k("A4"),
    extracted: {
      propertyGuess: "Harbourview Residences",
      unitGuess: "Block A, Flat 4B",
      category: "Plumbing",
      confidence: 0.92,
      summary: "Leak traced to a weeping compression joint on the supply pipe serving Flat 5B. Joint tightened. Full inspection of 5B shower enclosure recommended.",
      fields: [
        { label: "Job date", value: isoDaysAgo(71).slice(0, 10), confidence: 0.98 },
        { label: "Engineer", value: "Demo Engineer (Plumbing B)", confidence: 0.95 },
        { label: "Work carried out", value: "Isolated lighting; tightened compression joint in ceiling void", confidence: 0.91 },
        { label: "Parts used", value: "None", confidence: 0.86 },
        { label: "Labour (hrs)", value: "3.5", confidence: 0.94 },
        { label: "Follow-up required", value: "Yes — inspect Flat 5B shower tray", confidence: 0.89 },
      ],
    },
  },
  {
    id: "doc-2",
    filename: "Elmstead_C_Boiler2_Service_Report.pdf",
    kind: "Contractor report",
    uploadedAt: isoDaysAgo(21, 11),
    size: "1.2 MB",
    status: "Extracted",
    linkedRequestId: k("B4"),
    extracted: {
      propertyGuess: "Elmstead Court",
      unitGuess: "Building C — Plant room",
      category: "HVAC",
      confidence: 0.95,
      summary: "Boiler 2 low-pressure lockout (0.4 bar). System reset. Suspected leak on flow pipework under ground-floor corridor requires investigation.",
      fields: [
        { label: "Visit date", value: isoDaysAgo(22).slice(0, 10), confidence: 0.97 },
        { label: "Appliance", value: "Communal boiler 2", confidence: 0.93 },
        { label: "Fault code", value: "F22 — low water pressure", confidence: 0.9 },
        { label: "Pressure on arrival", value: "0.4 bar", confidence: 0.88 },
        { label: "Recommendation", value: "Trace and repair system leak; consider pressure-loss monitoring", confidence: 0.84 },
      ],
    },
  },
  {
    id: "doc-3",
    filename: "Inspection_MapleRow_Roof_Survey.pdf",
    kind: "Inspection report",
    uploadedAt: isoDaysAgo(32, 10),
    size: "2.4 MB",
    status: "Extracted",
    extracted: {
      propertyGuess: "Maple Row Townhouses",
      unitGuess: "No. 11",
      category: "Roofing",
      confidence: 0.81,
      summary: "Rear pitch battens degraded; temporary valley patch in place. Recommends full rear-pitch re-roof within 6 months.",
      fields: [
        { label: "Inspection date", value: isoDaysAgo(33).slice(0, 10), confidence: 0.96 },
        { label: "Area", value: "Rear pitch and valley", confidence: 0.87 },
        { label: "Condition", value: "Poor — batten decay, tile slippage", confidence: 0.79 },
        { label: "Estimated cost", value: "£4,800 – £6,200", confidence: 0.72 },
      ],
    },
  },
];
