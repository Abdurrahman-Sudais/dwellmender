// Site facts used by the marketing kit (forms, AWS section, progress, motion). A proposed product:
// AWS services and integrations are planned until implemented and verified.
type Stage = readonly [string, readonly string[], string];
type Pair = readonly [string, string];
type Stat = readonly [number, string, string?, string?];
export type Site = {
  name: string; email: string; founder: string;
  orgLabel: string; orgTypes: readonly string[]; useCases: readonly string[]; topics: readonly string[];
  detailLabel: string; detailProp: string; detailPlaceholder: string;
  demoTitle: string; demoIntro: string;
  progress: readonly (readonly [string, string, string])[];
  cycle: readonly string[]; marquee: readonly string[]; stats: readonly Stat[];
  aws: { why: string; stages: readonly Stage[]; across: readonly Pair[]; services: readonly Pair[] };
};

export const SITE: Site = {
  name: "DwellMender", email: "ifeoma@dwellmender.space", founder: "Ifeoma Eze",
  orgLabel: "Organisation type", orgTypes: ["Property manager", "Residential accommodation operator", "Commercial facilities team", "Housing association", "Other"],
  useCases: ["Organising tenant complaints", "Duplicate report detection", "Recurring problem detection", "Contractor briefs", "Maintenance reporting", "Other"],
  topics: ["Pilot programme", "Pricing", "Technical / AWS deployment", "Data import and integrations", "Partnership", "Other"],
  detailLabel: "Portfolio and request volume", detailProp: "portfolio_detail", detailPlaceholder: "e.g. 12 buildings · ~400 units · ~150 requests a month",
  demoTitle: "See your maintenance history, connected.", demoIntro: "DwellMender is a proposed product in its building stage. A demo walks through intake and classification, duplicate detection, recurring-problem detection and contractor briefs on fictional properties.",
  progress: [["2026", "Company founded", "By Ifeoma Eze, to help property teams find recurring problems sooner."], ["Done", "Maintenance method defined", "Every complaint linked to its history; duplicates and recurring issues suggested, people decide."], ["Done", "Working product demo", "Requests, classification, duplicates, recurring problems, contractor briefs and reports on fictional data."], ["Done", "AWS reference architecture", "Document extraction, classification, recurring-issue detection, storage and APIs designed."], ["Next", "First pilots", "One portfolio's request history imported, with property managers approving every suggestion."]],
  cycle: ["property managers", "accommodation operators", "facilities teams"],
  marquee: ["Property managers", "Residential accommodation", "Commercial facilities", "Tenant complaints", "Duplicate reports", "Recurring problems", "Root causes", "Contractor briefs", "Repair history", "Classification", "Reports", "People decide"],
  stats: [[6, "fictional properties in the demo"], [31, "maintenance requests with linked histories"], [6, "suggested duplicate reports to review"], [6, "workflow steps, each with a person in control"]],
  aws: {
    why: "DwellMender organises tenant complaints, photos, documents and repair histories for property managers, accommodation operators and facilities teams. It must extract information from messy reports, connect related issues over time and keep tenant data secure. Designing on AWS lets it use managed document extraction and AI classification behind an authenticated API, with storage that scales with each portfolio.",
    stages: [["Intake", ["Amazon API Gateway", "Amazon S3"], "Requests, photos and documents arrive through the API and are stored securely."], ["Extract", ["Amazon Textract"], "Text and fields are extracted from uploaded documents and forms."], ["Classify & connect", ["Amazon Bedrock"], "Requests are categorised, duplicates suggested and recurring problems linked for review."], ["Process", ["AWS Lambda"], "Workflows assign, schedule and prepare contractor briefs with relevant repair history."], ["Records", ["Amazon DynamoDB"], "Properties, units, requests, contractors and decisions are stored as structured records."]],
    across: [["Amazon Cognito", "handles sign-in and roles"], ["AWS Lambda", "runs processing workflows"], ["AWS KMS", "encrypts tenant data"], ["Amazon CloudWatch", "monitors services"]],
    services: [["Amazon Bedrock", "Classifies requests and suggests duplicates and recurring problems."], ["Amazon Textract", "Extracts text and fields from uploaded documents."], ["Amazon S3", "Stores photos and documents."], ["Amazon DynamoDB", "Stores properties, requests, contractors and decisions."], ["AWS Lambda", "Runs workflows and prepares contractor briefs."], ["Amazon API Gateway", "Provides the application API."], ["Amazon Cognito", "Authenticates users and enforces roles."], ["AWS KMS", "Encrypts tenant data."], ["Amazon CloudWatch", "Monitors services."]],
  },
};
