/**
 * Runtime configuration for AWS-backed services.
 *
 * The demo runs entirely in the browser with simulated AI. When the variables
 * below are provided (see .env.example and docs/AWS_ARCHITECTURE.md) the service
 * layer switches to calling the DwellMender API (API Gateway → Lambda), which in
 * turn calls Amazon Bedrock, Textract, S3, DynamoDB, SES and Cognito.
 */
export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION ?? "eu-west-2",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
  uploadBucket: import.meta.env.VITE_S3_UPLOAD_BUCKET ?? "",
  useSimulatedAI: (import.meta.env.VITE_USE_SIMULATED_AI ?? "true") !== "false" || !import.meta.env.VITE_API_BASE_URL,
};

export type IntegrationStatus = "Simulated" | "Configured" | "Not configured";

export interface AwsServiceInfo {
  key: string;
  name: string;
  purpose: string;
  usedFor: string[];
  status: IntegrationStatus;
  endpoint?: string;
}

export function getAwsServices(): AwsServiceInfo[] {
  const api = awsConfig.apiBaseUrl;
  const sim: IntegrationStatus = awsConfig.useSimulatedAI ? "Simulated" : "Configured";
  return [
    { key: "bedrock", name: "Amazon Bedrock", purpose: "Foundation-model inference", usedFor: ["Report classification", "Duplicate detection reasoning", "Repair-history summaries", "Contractor brief drafting"], status: sim, endpoint: api && `${api}/ai/*` },
    { key: "textract", name: "Amazon Textract", purpose: "Document text & form extraction", usedFor: ["Contractor job sheets", "Inspection reports", "Tenant letters", "Invoices"], status: sim, endpoint: api && `${api}/documents/extract` },
    { key: "s3", name: "Amazon S3", purpose: "Object storage", usedFor: ["Maintenance photographs", "Uploaded documents", "Exported reports"], status: awsConfig.uploadBucket ? "Configured" : "Simulated" },
    { key: "dynamodb", name: "Amazon DynamoDB", purpose: "Operational data store", usedFor: ["Properties, buildings & units", "Maintenance requests & histories", "Duplicate decisions & briefs"], status: api ? "Configured" : "Simulated" },
    { key: "lambda", name: "AWS Lambda", purpose: "Serverless processing", usedFor: ["Duplicate matching", "Recurring-issue detection", "Document processing pipeline", "Notifications"], status: api ? "Configured" : "Simulated" },
    { key: "cognito", name: "Amazon Cognito", purpose: "Authentication", usedFor: ["Manager sign-in & registration", "Organisation-scoped access", "MFA"], status: awsConfig.cognitoUserPoolId ? "Configured" : "Simulated" },
    { key: "ses", name: "Amazon SES", purpose: "Transactional email", usedFor: ["Contractor brief delivery", "Overdue alerts", "Tenant status updates"], status: api ? "Configured" : "Simulated" },
    { key: "cloudwatch", name: "Amazon CloudWatch", purpose: "Monitoring & logging", usedFor: ["Lambda metrics & alarms", "AI latency/cost dashboards", "Audit logging"], status: api ? "Configured" : "Not configured" },
  ];
}
