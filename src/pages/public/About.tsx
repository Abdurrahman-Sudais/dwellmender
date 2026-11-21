import { Compass, Eye, HeartHandshake } from "lucide-react";
import { initials } from "@/lib/utils";
import { CTABand, PageHero, Section, SectionHeading } from "./marketing";

const FOUNDERS = [
  { name: "Ifeoma Eze", role: "Founder & CEO", bio: "Ifeoma leads DwellMender's vision and product direction, focused on giving property teams the joined-up maintenance history they've always needed." },
  { name: "Babatunde Salami", role: "Co-founder & CTO", bio: "Babatunde leads engineering and DwellMender's AWS-native AI platform, from document extraction to recurring-issue detection." },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About DwellMender"
        title="We help property teams find recurring problems sooner."
        text="Most maintenance software is built to close tickets. DwellMender is built to understand them — so the same problem doesn't keep coming back as a new complaint."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Our story"
            title="Born from a simple question: why does this keep happening?"
            text="Every property manager knows the flat with the leak that never quite gets fixed, the boiler that fails every winter, the circuit that trips every few months. The information to solve them usually exists — scattered across emails, job sheets and memories. DwellMender brings it together and puts it in front of the people making repair decisions."
          />
          <div className="grid gap-4">
            {[
              { icon: Eye, t: "See patterns", d: "Make recurring issues visible before they become expensive or unsafe." },
              { icon: Compass, t: "Guide decisions", d: "Give managers and contractors the context to fix root causes first time." },
              { icon: HeartHandshake, t: "Keep people in control", d: "AI that assists — with human approval on every consequential decision." },
            ].map((v) => (
              <div key={v.t} className="flex gap-4 rounded-xl border bg-white p-5 shadow-card">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sage-50 text-sage-700">
                  <v.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-navy-900">{v.t}</div>
                  <div className="text-sm text-navy-600">{v.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section className="bg-white">
        <SectionHeading center eyebrow="Leadership" title="Meet the founders" />
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {FOUNDERS.map((f, i) => (
            <div key={f.name} className="rounded-2xl border bg-warm-50 p-7 text-center">
              <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full font-display text-2xl font-bold text-white ${i ? "bg-sage-600" : "bg-navy-900"}`}>{initials(f.name)}</div>
              <h3 className="mt-4 text-xl font-bold text-navy-900">{f.name}</h3>
              <div className="text-sm font-medium text-sage-700">{f.role}</div>
              <p className="mt-3 text-sm leading-relaxed text-navy-600">{f.bio}</p>
            </div>
          ))}
        </div>
      </Section>
      <CTABand title="Let's build better maintenance histories together." text="Talk to the founding team about your portfolio, or start exploring the demo workspace today." />
    </>
  );
}
