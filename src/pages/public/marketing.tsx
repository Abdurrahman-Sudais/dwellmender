import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, Droplets, FileText, Repeat, Sparkles, Thermometer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("py-16 md:py-24", className)}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, text, center = false }: { eyebrow?: string; title: ReactNode; text?: ReactNode; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">{eyebrow}</div>}
      <h2 className="text-3xl font-bold text-navy-900 md:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-[17px] leading-relaxed text-navy-600">{text}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: ReactNode; text: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-warm-300/70">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="container relative py-16 md:py-20">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">{eyebrow}</div>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] text-navy-900 md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-600">{text}</p>
        {children}
      </div>
    </section>
  );
}

export function CTABand({ title = "See your recurring problems before your tenants do.", text = "Start with the demo workspace — it's preloaded with six properties and a year of maintenance history." }: { title?: string; text?: string }) {
  return (
    <Section className="py-16 md:py-20">
      <div className="relative overflow-hidden rounded-2xl bg-navy-900 px-8 py-12 md:px-14">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sage-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
            <p className="mt-3 text-navy-200">{text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="amber" asChild>
              <Link to="/register">
                Start free trial <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
              <Link to="/contact">Book a walkthrough</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** Static, illustrative product preview used on marketing pages. */
export function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sage-200/50 via-transparent to-amber-200/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-warm-300 bg-white shadow-lift">
        <div className="flex items-center gap-1.5 border-b bg-warm-100 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage-300" />
          <span className="ml-3 text-[11px] text-muted-foreground">app.dwellmender.com / recurring-issues</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { l: "Open requests", v: "38", c: "text-navy-900" },
            { l: "Possible duplicates", v: "6", c: "text-violet-700" },
            { l: "Recurring issues", v: "7", c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-warm-50 p-3">
              <div className="text-[11px] text-muted-foreground">{s.l}</div>
              <div className={cn("font-display text-2xl font-bold", s.c)}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2 px-4 pb-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-sky-100 text-sky-700">
                <Droplets className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-navy-900">Persistent water leak · Flat 4B</span>
                  <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">Critical</span>
                </div>
                <div className="mt-0.5 text-xs text-navy-600">6 reports in 10 months · 4 repairs didn't hold · 3 contractors</div>
                <div className="mt-2 flex gap-1">
                  {[1, 1, 1, 1, 1, 1].map((x, i) => (
                    <span key={i} className={cn("h-1.5 flex-1 rounded-full", x ? "bg-amber-400" : "bg-amber-100")} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {[
            { icon: Thermometer, t: "Repeated equipment failure · Building C boiler", m: "4 lockouts in 6 months · 3 repairs didn't hold", tone: "bg-rose-100 text-rose-700" },
            { icon: Zap, t: "Recurring electrical problem · Floor 2 east wing", m: "5 reports · circuit 7 flagged twice", tone: "bg-amber-100 text-amber-700" },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-3 rounded-lg border p-3">
              <span className={cn("grid h-8 w-8 place-items-center rounded-md", r.tone)}>
                <r.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-navy-900">{r.t}</div>
                <div className="text-xs text-navy-600">{r.m}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* floating cards */}
      <div className="absolute -bottom-10 -left-8 hidden w-60 rounded-xl border bg-white p-3 shadow-lift md:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
          <Copy className="h-3.5 w-3.5" /> Possible duplicate · 93% match
        </div>
        <div className="mt-1.5 text-xs text-navy-700">"Follow-up: ceiling still leaking" looks like last week's report from the same tenant.</div>
        <div className="mt-2 flex gap-1.5">
          <span className="rounded bg-sage-600 px-2 py-0.5 text-[10px] font-semibold text-white">Approve</span>
          <span className="rounded border px-2 py-0.5 text-[10px] font-semibold">Reject</span>
        </div>
      </div>
      <div className="absolute -right-6 -top-6 hidden w-56 rounded-xl border bg-white p-3 shadow-lift md:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-sage-700">
          <FileText className="h-3.5 w-3.5" /> Contractor brief ready
        </div>
        <div className="mt-1.5 text-xs text-navy-700">Includes 4 past repairs and the last engineer's note about Flat 5B.</div>
      </div>
    </div>
  );
}

export const WORKFLOW = [
  { icon: CheckCircle2, title: "Register properties", text: "Add properties, buildings, floors, units and tenants — or import them from a spreadsheet." },
  { icon: FileText, title: "Capture requests", text: "Log requests from the tenant portal, email, phone, inspections or uploaded contractor reports." },
  { icon: Sparkles, title: "Classify complaints", text: "AI suggests a category and priority. Managers confirm or correct every suggestion." },
  { icon: Copy, title: "Identify duplicates", text: "Reports describing the same underlying issue are flagged for review — never merged automatically." },
  { icon: Repeat, title: "Detect recurring issues", text: "See which locations keep coming back, which repairs didn't hold and what it's costing." },
  { icon: AlertTriangle, title: "Prepare contractor briefs", text: "Send contractors a structured history before dispatch so the first visit targets the root cause." },
];
