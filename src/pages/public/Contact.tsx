import { ContactForm } from "@/kit/LeadForms";
import { SITE } from "@/kit/site";

import { Clock, Mail, MessageSquare } from "lucide-react";

import { PageHero, Section } from "./marketing";

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the DwellMender team." text="Book a walkthrough, ask about pricing, or discuss how DwellMender fits your maintenance workflow." />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {[
              { icon: MessageSquare, t: "Product walkthrough", d: "A 30-minute tour using your portfolio size and workflows." },
              { icon: Mail, t: "Email", d: SITE.email },
              { icon: Clock, t: "Response time", d: "We reply within one working day." },
            ].map((c) => (
              <div key={c.t} className="flex gap-4 rounded-xl border bg-white p-5">
                <c.icon className="h-5 w-5 text-sage-600" />
                <div>
                  <div className="font-semibold text-navy-900">{c.t}</div>
                  <div className="text-sm text-navy-600">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-white p-7 shadow-card">
            <ContactForm bare />
          </div>
        </div>
      </Section>
    </>
  );
}

