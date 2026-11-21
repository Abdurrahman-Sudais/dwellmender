import { Link } from "react-router-dom";
import { ArrowRight, Building2, ClipboardCheck, Copy, FileText, GraduationCap, Hospital, Layers, PoundSterling, Repeat, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTABand, ProductPreview, Section, SectionHeading, WORKFLOW } from "./marketing";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
        <div className="container relative grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr] [&>*]:min-w-0">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white/70 px-3 py-1 text-xs font-medium text-sage-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-500" /> Maintenance intelligence for property teams
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.07] text-navy-900 sm:text-5xl lg:text-[3.4rem]">
              Stop Treating the Same Property Problem as a New Complaint.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-600">
              DwellMender connects tenant reports, contractor records, and maintenance histories to help property managers identify recurring issues and make better repair decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  Start free trial <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Explore the live demo</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-600">
              {["No card required", "Human approval on every AI suggestion", "Built on AWS"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sage-600" /> {t}
                </span>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* Problem strip */}
      <section className="border-y border-warm-300/70 bg-white">
        <div className="container grid gap-8 py-10 md:grid-cols-3">
          {[
            { v: "6 signals", t: "compared for every possible duplicate — property, unit, wording, photos, dates and repair history." },
            { v: "8 categories", t: "from plumbing to pest control, suggested automatically and confirmed by your team." },
            { v: "0 auto-merges", t: "— DwellMender never combines maintenance records without a manager's approval." },
          ].map((s) => (
            <div key={s.v}>
              <div className="font-display text-3xl font-bold text-navy-900">{s.v}</div>
              <p className="mt-1 text-sm text-navy-600">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <Section>
        <SectionHeading eyebrow="Why DwellMender" title="Every complaint, connected to everything that came before it." text="Maintenance teams don't lack data — they lack the connection between this week's report and last year's repair. DwellMender builds that connection automatically." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Sparkles, title: "AI report classification", text: "Free-text complaints and uploaded job sheets are organised into eight maintenance categories with a confidence score." },
            { icon: Copy, title: "Duplicate complaint detection", text: "Compares location, wording, photos, dates and history to flag reports describing the same issue." },
            { icon: Repeat, title: "Recurring issue intelligence", text: "Ranks locations by recurrence, unsuccessful repairs and spend so you fix root causes first." },
            { icon: FileText, title: "Contractor briefs", text: "One click produces a structured brief with prior complaints, repairs, notes and photos." },
            { icon: Timer, title: "Faster resolution", text: "Track overdue jobs, contractor response times and average resolution by property." },
            { icon: PoundSterling, title: "Spend visibility", text: "See what repeated repairs actually cost, and where a permanent fix pays for itself." },
          ].map((b) => (
            <div key={b.title} className="rounded-xl border bg-white p-6 shadow-card transition hover:shadow-lift">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-900 text-warm-100">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{b.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Workflow */}
      <Section className="bg-navy-950 text-white">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-sage-300">The workflow</div>
            <h2 className="text-3xl font-bold md:text-4xl">From scattered reports to a confident repair decision.</h2>
            <p className="mt-4 text-navy-200">Six steps, each with a human in control. AI does the sorting and the remembering; your team makes the calls.</p>
            <Button className="mt-8" variant="amber" asChild>
              <Link to="/how-it-works">
                See how it works <ArrowRight />
              </Link>
            </Button>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {WORKFLOW.map((w, i) => (
              <li key={w.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-500/20 font-display text-sm font-bold text-sage-200">{i + 1}</span>
                  <h3 className="font-semibold">{w.title}</h3>
                </div>
                <p className="mt-2 text-sm text-navy-200">{w.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Story */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flat 4B · Bathroom ceiling</div>
            <ol className="relative mt-5 space-y-5 border-l-2 border-warm-300 pl-6">
              {[
                ["Jan", "Leak reported — bath resealed", "Repaired"],
                ["Apr", "Leak returns — waste trap replaced", "Repaired"],
                ["Jun", "Ceiling stain — redecorated", "Repaired"],
                ["Sep", "Water through light — joint tightened", "Repaired"],
                ["Nov", "Leak again — DwellMender flags 5th recurrence", "Flagged"],
              ].map(([m, t, s]) => (
                <li key={t} className="relative">
                  <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${s === "Flagged" ? "bg-amber-400" : "bg-sage-500"}`} />
                  <div className="text-xs font-semibold text-muted-foreground">{m}</div>
                  <div className="text-sm font-medium text-navy-900">{t}</div>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Suggested inspection focus:</strong> trace source in Flat 5B shower enclosure — recommended by the September engineer, never actioned.
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="A familiar story" title="Four repairs. Four contractors' notes. One root cause nobody connected." text="Without a joined-up history, each report looks new. DwellMender spots the pattern, surfaces the note that mattered, and gives the next contractor everything they need to fix it properly." />
            <ul className="mt-6 space-y-3 text-navy-700">
              {["Repeat reports automatically linked to the same location", "Unsuccessful repairs highlighted with dates and costs", "Contractor brief generated with the full history"].map((t) => (
                <li key={t} className="flex gap-2">
                  <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Segments */}
      <Section className="bg-white">
        <SectionHeading center eyebrow="Built for" title="Teams responsible for the buildings people live and work in" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, t: "Property managers", d: "Residential lettings & build-to-rent" },
            { icon: GraduationCap, t: "Accommodation operators", d: "Student halls & co-living" },
            { icon: Layers, t: "Facilities teams", d: "Offices, retail & mixed use" },
            { icon: Hospital, t: "Supported living", d: "Housing associations & care providers" },
          ].map((s) => (
            <Link to="/solutions" key={s.t} className="rounded-xl border bg-warm-50 p-5 transition hover:border-sage-300 hover:bg-white">
              <s.icon className="h-6 w-6 text-sage-600" />
              <div className="mt-3 font-semibold text-navy-900">{s.t}</div>
              <div className="text-sm text-navy-600">{s.d}</div>
            </Link>
          ))}
        </div>
      </Section>

      <CTABand />
    </>
  );
}
