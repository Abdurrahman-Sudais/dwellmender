import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Clock, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/overlays";
import { PageHero, Section } from "./marketing";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid work email"),
  company: z.string().min(2, "Company is required"),
  portfolio: z.string().min(1, "Select a portfolio size"),
  message: z.string().min(10, "Tell us a little more (10+ characters)"),
});
type FormValues = z.infer<typeof schema>;

export default function Contact() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { portfolio: "" } });

  const onSubmit = async () => {
    // In production this posts to an API Gateway endpoint that forwards via Amazon SES.
    await new Promise((r) => setTimeout(r, 700));
    setSent(true);
  };

  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the DwellMender team." text="Book a walkthrough, ask about pricing, or discuss how DwellMender fits your maintenance workflow." />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {[
              { icon: MessageSquare, t: "Product walkthrough", d: "A 30-minute tour using your portfolio size and workflows." },
              { icon: Mail, t: "Email", d: "hello@dwellmender.example" },
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
            {sent ? (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-sage-600" />
                <h2 className="mt-4 text-2xl font-bold text-navy-900">Thanks — message received.</h2>
                <p className="mt-2 max-w-sm text-navy-600">This is a demo form, so nothing was sent. In production, your message is delivered to our team via Amazon SES.</p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
                <Field label="Full name" error={errors.name?.message}>
                  <Input {...register("name")} placeholder="Your name" />
                </Field>
                <Field label="Work email" error={errors.email?.message}>
                  <Input type="email" {...register("email")} placeholder="you@company.com" />
                </Field>
                <Field label="Company" error={errors.company?.message}>
                  <Input {...register("company")} placeholder="Company name" />
                </Field>
                <Field label="Portfolio size" error={errors.portfolio?.message}>
                  <Select onValueChange={(v) => setValue("portfolio", v, { shouldValidate: true })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select units" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Under 150 units", "150–1,000 units", "1,000–5,000 units", "5,000+ units"].map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="How can we help?" error={errors.message?.message}>
                    <Textarea rows={5} {...register("message")} placeholder="Tell us about your properties and maintenance challenges…" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Sending…" : "Send message"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
