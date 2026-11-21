import { Building2, Check, GraduationCap, Hospital, Layers } from "lucide-react";
import { CTABand, PageHero, Section } from "./marketing";

const SOLUTIONS = [
  {
    id: "residential",
    icon: Building2,
    title: "Residential property managers",
    lead: "Lettings agents, build-to-rent operators and block managers.",
    pains: ["The same leak reported by three tenants on three floors", "Contractors arriving without knowing what was done last time", "Landlords asking why the bill keeps coming back"],
    outcomes: ["Neighbouring-unit duplicates grouped for one investigation", "Contractor briefs that include every previous repair", "Recurring-issue evidence for landlord conversations"],
  },
  {
    id: "student",
    icon: GraduationCap,
    title: "Student & residential accommodation operators",
    lead: "Purpose-built student halls, co-living and serviced accommodation.",
    pains: ["Dozens of identical reports when communal heating fails", "High tenant turnover means history walks out the door", "Peak-term volume overwhelms small teams"],
    outcomes: ["Mass-report events collapsed into a single incident", "History tied to the room, not the resident", "AI triage so teams focus on urgent work"],
  },
  {
    id: "commercial",
    icon: Layers,
    title: "Commercial facilities teams",
    lead: "Multi-let offices, retail parks and mixed-use estates.",
    pains: ["Intermittent faults that never get to root cause", "Occupier fit-outs that complicate building systems", "SLA pressure from demanding occupiers"],
    outcomes: ["Pattern detection across intermittent faults", "Zone-level history (floor, wing, plant room)", "Resolution time and contractor performance reporting"],
  },
  {
    id: "supported",
    icon: Hospital,
    title: "Supported living & housing associations",
    lead: "Housing providers with vulnerable residents and regulatory duties.",
    pains: ["Damp and mould complaints that must be acted on quickly", "Proving that repairs were effective", "Residents who may not report repeat issues"],
    outcomes: ["Damp, leak and mould recurrences flagged early", "Clear resolution history for audit", "Proactive identification of persistent problems"],
  },
];

export default function Solutions() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="One maintenance intelligence layer, tuned to the buildings you run."
        text="Whether you manage apartments, student halls, offices or supported housing, the pattern is the same: problems recur when history isn't connected."
      />
      <Section>
        <div className="space-y-8">
          {SOLUTIONS.map((s, i) => (
            <div key={s.id} id={s.id} className="scroll-mt-24 grid gap-6 rounded-2xl border bg-white p-6 shadow-card md:p-8 lg:grid-cols-[1fr_1fr_1fr]">
              <div>
                <span className={`grid h-11 w-11 place-items-center rounded-lg ${i % 2 ? "bg-sage-600" : "bg-navy-900"} text-white`}>
                  <s.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-2xl font-bold text-navy-900">{s.title}</h2>
                <p className="mt-2 text-navy-600">{s.lead}</p>
              </div>
              <div className="rounded-xl bg-amber-50/70 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">The challenge</div>
                <ul className="mt-3 space-y-2.5 text-sm text-navy-800">
                  {s.pains.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-sage-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-sage-700">With DwellMender</div>
                <ul className="mt-3 space-y-2.5 text-sm text-navy-800">
                  {s.outcomes.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <CTABand />
    </>
  );
}
