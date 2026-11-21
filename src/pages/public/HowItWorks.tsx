import { ArrowDown, Cloud, UserCheck } from "lucide-react";
import { CTABand, PageHero, Section, SectionHeading, WORKFLOW } from "./marketing";

const DETAIL = [
  "Set up properties with buildings, floors and units. Assign managers and record tenants so every future report has a precise location.",
  "Requests arrive from the tenant portal, email, phone, inspections or as uploaded documents. Photos are stored securely and attached to the request.",
  "The AI layer reads each description and suggests one of eight categories plus a priority, with a confidence score. Managers accept or correct with one click.",
  "New reports are compared against open and recent requests using six signals. Likely duplicates appear with a similarity score and shared characteristics for approval.",
  "Requests at the same location and category — or linked by approved duplicates — are analysed for recurrence frequency, unsuccessful repairs and spend.",
  "Before dispatch, generate a contractor brief containing the history, previous notes, photos and a suggested inspection focus. Edit, approve and share.",
];

export default function HowItWorks() {
  return (
    <>
      <PageHero eyebrow="How it works" title="Register → capture → classify → de-duplicate → detect → brief." text="A six-step workflow that turns scattered complaints into a structured maintenance history — with people approving every decision that matters." />
      <Section>
        <div className="mx-auto max-w-3xl">
          {WORKFLOW.map((w, i) => (
            <div key={w.title}>
              <div className="flex gap-5 rounded-2xl border bg-white p-6 shadow-card">
                <div className="flex flex-col items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-warm-100">
                    <w.icon className="h-5 w-5" />
                  </span>
                  <span className="mt-2 font-display text-xs font-bold text-muted-foreground">STEP {i + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-navy-900">{w.title}</h3>
                  <p className="mt-2 leading-relaxed text-navy-600">{DETAIL[i]}</p>
                </div>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div className="flex justify-center py-2 text-warm-300">
                  <ArrowDown className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
      <Section className="bg-white">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-2xl border bg-sage-50 p-8">
            <UserCheck className="h-7 w-7 text-sage-700" />
            <SectionHeading title="Human-in-the-loop by design" text="DwellMender suggests; your team decides. No classification is final until reviewed, no records are ever merged automatically, and no brief reaches a contractor without approval." />
          </div>
          <div className="rounded-2xl border bg-navy-950 p-8 text-white">
            <Cloud className="h-7 w-7 text-amber-400" />
            <h2 className="mt-2 text-3xl font-bold">AWS-native processing</h2>
            <p className="mt-4 text-navy-200">
              Uploads land in Amazon S3 and trigger AWS Lambda. Amazon Textract extracts document text; Amazon Bedrock classifies, compares and summarises. Results are stored in Amazon DynamoDB, notifications go out through Amazon SES, and everything is monitored in Amazon CloudWatch.
            </p>
          </div>
        </div>
      </Section>
      <CTABand />
    </>
  );
}
