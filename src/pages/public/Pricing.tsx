import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { CTABand, PageHero, Section } from "./marketing";

const PLANS = [
  {
    name: "Starter",
    monthly: 149,
    units: "Up to 150 units",
    desc: "For small portfolios getting maintenance history under control.",
    features: ["Property, unit & tenant records", "Maintenance request management", "AI classification (1,000 reports/mo)", "Duplicate detection", "CSV export", "Email support"],
  },
  {
    name: "Professional",
    monthly: 449,
    units: "Up to 1,000 units",
    desc: "For growing teams that want recurring-issue intelligence and contractor briefs.",
    features: ["Everything in Starter", "Recurring issue intelligence", "Contractor brief generator", "Document extraction (500 pages/mo)", "Contractor performance analytics", "PDF & CSV reports", "Priority support"],
    featured: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    units: "Unlimited units",
    desc: "For large operators needing SSO, data residency and integrations.",
    features: ["Everything in Professional", "SSO via Amazon Cognito federation", "Dedicated AWS region & data residency", "Custom Bedrock model configuration", "API & webhook integrations", "Dedicated success manager"],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple pricing that scales with your portfolio." text="Every plan includes unlimited users. Pricing is illustrative for a proposed product; start with a demo on fictional data.">
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border bg-white px-4 py-2 text-sm">
          <span className={cn(!annual && "font-semibold text-navy-900")}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual billing" />
          <span className={cn(annual && "font-semibold text-navy-900")}>
            Annual <span className="ml-1 rounded-full bg-sage-100 px-2 py-0.5 text-xs text-sage-700">Save 15%</span>
          </span>
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={cn("relative flex flex-col rounded-2xl border bg-white p-7 shadow-card", p.featured && "border-navy-900 ring-2 ring-navy-900")}>
              {p.featured && <span className="absolute -top-3 left-7 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-navy-950">Most popular</span>}
              <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
              <p className="mt-1 text-sm text-navy-600">{p.desc}</p>
              <div className="mt-6">
                {p.monthly ? (
                  <>
                    <span className="font-display text-4xl font-bold text-navy-900">£{annual ? Math.round(p.monthly * 0.85) : p.monthly}</span>
                    <span className="text-navy-600"> / month</span>
                  </>
                ) : (
                  <span className="font-display text-4xl font-bold text-navy-900">Custom</span>
                )}
                <div className="mt-1 text-sm text-muted-foreground">
                  {p.units}
                  {p.monthly && annual ? " · billed annually" : ""}
                </div>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-navy-700">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8" variant={p.featured ? "default" : "outline"} asChild>
                <Link to={p.monthly ? "/#demo" : "/contact"}>{p.monthly ? "Request a demo" : "Talk to sales"}</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-navy-900">Frequently asked questions</h2>
          <div className="mt-6 divide-y rounded-xl border bg-white">
            {[
              ["Is the AI making decisions on its own?", "No. DwellMender suggests classifications, duplicate groupings and briefs. A manager approves every one, and records are never merged automatically."],
              ["What counts as a unit?", "Any lettable or occupiable space — an apartment, student room, office suite, retail unit or house."],
              ["Can we import our existing data?", "Yes. Properties, units, tenants and historical requests can be imported from CSV, and contractor documents can be bulk-uploaded for extraction."],
              ["Where is our data stored?", "On AWS in your chosen region (UK by default). Photos and documents are stored in Amazon S3 and records in Amazon DynamoDB, encrypted at rest."],
            ].map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-navy-900 marker:hidden">
                  <span className="flex items-center justify-between">
                    {q}
                    <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-navy-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>
      <CTABand />
    </>
  );
}
