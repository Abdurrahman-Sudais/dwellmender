# DwellMender — AWS architecture

The web app ships with a **simulated service layer** so it runs entirely in the browser. Every
simulated function in `src/services/` has the same request/response shape as the production
API, so switching to AWS is a configuration change, not a UI rewrite.

```
Browser (React SPA on S3 + CloudFront)
   │  Cognito JWT
   ▼
Amazon API Gateway (REST, Cognito authorizer)
   │
   ├── POST /ai/classify            → Lambda classify      → Amazon Bedrock
   ├── POST /ai/duplicates/scan     → Lambda duplicates    → DynamoDB + Bedrock (reasoning)
   ├── POST /ai/briefs              → Lambda briefs        → DynamoDB + Bedrock (summaries)
   ├── POST /documents/extract      → Lambda documents     → Textract → Bedrock
   ├── POST /uploads/presign        → Lambda presign       → S3 pre-signed PUT URL
   └── CRUD /properties /requests … → Lambda api           → DynamoDB

EventBridge (nightly)       → Lambda recurring   → DynamoDB (recurring-issue snapshots)
S3 ObjectCreated (docs/)    → Lambda documents   → Textract async → SNS → Lambda → Bedrock
DynamoDB Streams            → Lambda notify      → Amazon SES (assignments, overdue, briefs)
All Lambdas                 → Amazon CloudWatch  (logs, metrics, alarms, AI latency/cost)
```

## Services

| Service | Used for | Code touch-point |
| --- | --- | --- |
| **Amazon Bedrock** | Report classification, duplicate reasoning, repair-history summaries, contractor brief drafting | `src/services/ai.ts` → `classifyReport`, `scanForDuplicates`, `generateBrief` |
| **Amazon Textract** | Contractor job sheets, inspection reports, tenant letters, invoices (`AnalyzeDocument` FORMS + TABLES) | `src/services/ai.ts` → `extractDocument` |
| **Amazon S3** | Photographs and uploaded documents (`photos/{orgId}/{requestId}/…`, `docs/{orgId}/…`), pre-signed uploads | `RequestNew.tsx` photo upload, `Classification.tsx` documents |
| **Amazon DynamoDB** | Properties, buildings, units, tenants, requests, timelines, duplicate decisions, briefs | `src/data/store.tsx` (each mutation maps to one API call) |
| **AWS Lambda** | Matching, processing, recurring detection, notifications | `src/services/recurring.ts` is the reference implementation of the nightly job |
| **Amazon Cognito** | Manager sign-in / registration, MFA, org-scoped claims | `src/pages/public/Auth.tsx` |
| **Amazon SES** | Contractor brief delivery, overdue alerts, tenant status updates | `BriefEditor.tsx` share dialog, `Contact.tsx` |
| **Amazon CloudWatch** | Lambda metrics, alarms, AI acceptance-rate metric, audit logs | — |

## Suggested DynamoDB design (single table)

| Entity | PK | SK | GSI1 (PK / SK) |
| --- | --- | --- | --- |
| Property | `ORG#{orgId}` | `PROP#{propertyId}` | — |
| Building | `PROP#{propertyId}` | `BLD#{buildingId}` | — |
| Unit | `PROP#{propertyId}` | `UNIT#{buildingId}#{unitId}` | — |
| Request | `PROP#{propertyId}` | `REQ#{reportedAt}#{requestId}` | `LOC#{buildingId}#{unitId|communal}#{category}` / `reportedAt` |
| Timeline event | `REQ#{requestId}` | `EV#{at}#{eventId}` | — |
| Duplicate suggestion | `ORG#{orgId}` | `DUP#{status}#{createdAt}` | `REQ#{requestId}` / `DUP#…` |
| Brief | `REQ#{requestId}` | `BRIEF#{briefId}` | — |
| Contractor | `ORG#{orgId}` | `CON#{contractorId}` | `CON#{contractorId}` / `REQ#{reportedAt}` |

GSI1 on `LOC#…` gives the recurring-issue Lambda and brief generator a single query per location.

## Bedrock prompting notes

- **Classification** — return strict JSON matching `ClassificationResult` (`category`, `confidence`,
  `priority`, `keywords`, `alternatives`, `rationale`). Constrain `category` to the eight values in
  `ISSUE_CATEGORIES`.
- **Duplicates** — compute cheap signals in Lambda first (same property/building/unit, date gap,
  token overlap, history count). Only send candidate pairs above a threshold to Bedrock for the
  description comparison and the human-readable "shared characteristics".
- **Briefs** — pass the structured history (prior requests, repairs, contractor notes) and ask for
  the inspection-focus section only; the other sections are assembled deterministically.
- **Human in the loop** — the API never merges records or sends a brief without an explicit
  manager action. Approvals are stored with `decidedBy` / `approvedBy` for audit.

## Switching the frontend to AWS

1. Deploy the API (API Gateway + Lambdas) and a Cognito user pool.
2. Copy `.env.example` to `.env.local` and set:
   ```
   VITE_AWS_REGION=eu-west-2
   VITE_API_BASE_URL=https://xxxx.execute-api.eu-west-2.amazonaws.com/prod
   VITE_COGNITO_USER_POOL_ID=eu-west-2_xxxx
   VITE_COGNITO_CLIENT_ID=xxxx
   VITE_S3_UPLOAD_BUCKET=dwellmender-uploads-prod
   VITE_USE_SIMULATED_AI=false
   ```
3. `src/services/ai.ts` calls the API whenever `VITE_USE_SIMULATED_AI=false` and an API URL is set.
   Replace the demo sign-in in `Auth.tsx` with Amplify Auth / the Cognito SDK, and back
   `store.tsx` mutations with API calls.

Settings → **AWS integrations** in the app shows which services are simulated vs configured.
