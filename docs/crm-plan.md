# CRM plan — DwellMender

How demo requests and contact messages reach Ifeoma Eze, and how they are tracked. DwellMender is a proposed product; nothing here is live until the HubSpot settings below are filled in.

## Forms

Both forms live in `src/kit/LeadForms.tsx`; validation and payloads are in `src/kit/leads.ts`.

| Form | Where | HubSpot form (env) | Fields |
|---|---|---|---|
| Demo request | Home page, `#demo` | `VITE_HUBSPOT_FORM_GUID` | firstname, lastname, email, company, `company_size`, `organisation_type`, `primary_use_case`, `portfolio_detail`, message |
| Contact | `/contact` | `VITE_HUBSPOT_CONTACT_FORM_GUID` | firstname, lastname, email, company, `contact_topic`, `enquiry_message` |

Both use `VITE_HUBSPOT_PORTAL_ID`. Create the custom contact properties above in HubSpot (single-line text, or dropdowns with the options below) before connecting.

- **Company size:** 1–10, 11–50, 51–200, 201–1,000, 1,000+ people.
- **Organisation type:** Property manager, Residential accommodation operator, Commercial facilities team, Housing association, Other.
- **Primary use case:** Organising tenant complaints, Duplicate report detection, Recurring problem detection, Contractor briefs, Maintenance reporting, Other.
- **Contact topic:** Pilot programme, Pricing, Technical / AWS deployment, Data import and integrations, Partnership, Other.

## Until HubSpot is connected

Submitting opens the visitor's email app with a pre-filled message to **ifeoma@dwellmender.space**. Nothing is stored and no success is faked. The forms include a hidden honeypot field and a consent checkbox.

## Pipeline

Demo request → Qualified → Demo held → Pilot scoped → Pilot live → Customer. Contact messages are triaged by topic; pilot and pricing questions become demo requests.
