import { BarChart3, Building, Check, ClipboardList, Cloud, Copy, FileText, HardHat, Lock, Repeat, ScanText, Sparkles } from "lucide-react";
import { CTABand, PageHero, Section, SectionHeading } from "./marketing";

const FEATURES = [
  {
    icon: Building,
    title: "Property & portfolio management",
    text: "Model your portfolio the way it's actually built: properties, buildings, floors, units, tenants and responsible managers.",
    points: ["Individual property profiles with full maintenance history", "Unit-level timelines and tenant records", "Manager assignment and contact details"],
  },
  {
    icon: ClipboardList,
    title: "Maintenance request management",
    text: "Capture requests from every channel with consistent fields, photographs and a clear status workflow.",
    points: ["New → Under Review → Assigned → In Progress → Resolved → Closed", "Priority-based due dates and overdue tracking", "Photo attachments and tenant details"],
  },
  {
    icon: Sparkles,
    title: "AI report classification",
    text: "Every report is organised into Plumbing, Electrical, Roofing, HVAC, Structural, Pest Control, Appliances or General Maintenance.",
    points: ["Confidence scores and alternative suggestions", "One-click accept or correct", "Corrections feed back into model evaluation"],
  },
  {
    icon: ScanText,
    title: "Document extraction",
    text: "Upload contractor job sheets, inspection reports, tenant letters and invoices. Key fields are extracted for review.",
    points: ["Dates, engineers, work done, parts and follow-ups", "Field-level confidence", "Link extracted documents to requests"],
  },
  {
    icon: Copy,
    title: "Duplicate complaint detection",
    text: "Spot reports that describe the same underlying problem — even across neighbouring units or different wording.",
    points: ["Six-signal similarity score", "Shared characteristics and repair history", "Approve or reject — never auto-merged"],
  },
  {
    icon: Repeat,
    title: "Recurring issue intelligence",
    text: "A dedicated dashboard for repeat leaks, electrical faults, equipment failures, roof damage and repairs that didn't hold.",
    points: ["Risk-ranked locations", "Recurrence frequency and unsuccessful repairs", "Contractors involved and total spend"],
  },
  {
    icon: FileText,
    title: "Contractor brief generator",
    text: "Before dispatch, generate a structured brief with the current complaint, history, previous notes, photos and inspection focus.",
    points: ["Fully editable by managers", "Approval before sharing", "Copy, print or email via Amazon SES"],
  },
  {
    icon: HardHat,
    title: "Contractor management",
    text: "Profiles, service categories, assigned jobs, service history and performance in one place.",
    points: ["First-time-fix rate and response time", "Callback tracking on recurring issues", "Assignment from any request"],
  },
  {
    icon: BarChart3,
    title: "Reports & analytics",
    text: "Category trends, recurring problems by property, resolution times, contractor performance, spending and outstanding work.",
    points: ["Filter by property and period", "PDF and CSV export", "Repeat-repair incident reporting"],
  },
];

export default function Features() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything a maintenance team needs to stop solving the same problem twice."
        text="DwellMender combines classic maintenance management with an intelligence layer that remembers every report, repair and contractor note."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col rounded-xl border bg-white p-6 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-sage-50 text-sage-700">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{f.text}</p>
              <ul className="mt-4 space-y-2 border-t pt-4 text-sm text-navy-700">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="security" className="bg-white">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Security & infrastructure"
            title="Designed for AWS from day one."
            text="DwellMender's architecture uses managed AWS services for AI, storage, data, authentication and monitoring — so your maintenance data stays in your chosen region with enterprise-grade controls."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Amazon Bedrock", "Classification, duplicate reasoning & summaries"],
              ["Amazon Textract", "Contractor document extraction"],
              ["Amazon S3", "Photographs & uploaded documents"],
              ["Amazon DynamoDB", "Properties & maintenance histories"],
              ["AWS Lambda", "Matching, processing & notifications"],
              ["Amazon Cognito", "Authentication & MFA"],
              ["Amazon SES", "Email notifications"],
              ["Amazon CloudWatch", "Monitoring & alerting"],
            ].map(([n, d]) => (
              <div key={n} className="flex gap-3 rounded-lg border bg-warm-50 p-4">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <div className="text-sm font-semibold text-navy-900">{n}</div>
                  <div className="text-xs text-navy-600">{d}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-3 rounded-lg border border-sage-200 bg-sage-50 p-4 sm:col-span-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-sage-700" />
              <p className="text-sm text-sage-800">AI never takes irreversible actions. Classifications, duplicate groupings and contractor briefs all require a manager's review.</p>
            </div>
          </div>
        </div>
      </Section>
      <CTABand />
    </>
  );
}
