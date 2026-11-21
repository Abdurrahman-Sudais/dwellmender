export type PropertyType = "Residential" | "Student Accommodation" | "Commercial" | "Mixed Use" | "Supported Living";

export const ISSUE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Roofing",
  "HVAC",
  "Structural",
  "Pest Control",
  "Appliances",
  "General Maintenance",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["New", "Under Review", "Assigned", "In Progress", "Resolved", "Closed"] as const;
export type RequestStatus = (typeof STATUSES)[number];

export type RequestSource = "Tenant portal" | "Email" | "Phone" | "Inspection" | "Document upload";

export type PhotoKind = "water" | "crack" | "electrical" | "roof" | "pest" | "appliance" | "mould" | "heating" | "general";

export interface Photo {
  id: string;
  caption: string;
  kind: PhotoKind;
  /** Data URL for photos uploaded in the demo. In production this is an S3 object key. */
  url?: string;
}

export interface PropertyManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Building {
  id: string;
  propertyId: string;
  name: string;
  floors: number;
}

export interface Unit {
  id: string;
  propertyId: string;
  buildingId: string;
  floor: number;
  label: string;
  type: string;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  moveIn: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  type: PropertyType;
  managerId: string;
  yearBuilt: number;
  accent: string; // tailwind gradient classes for the card header
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  type: "created" | "status" | "assigned" | "note" | "ai" | "duplicate" | "brief" | "photo";
  text: string;
  actor: string;
}

export interface MaintenanceRequest {
  id: string;
  ref: string;
  title: string;
  description: string;
  propertyId: string;
  buildingId: string;
  unitId?: string; // undefined = communal area
  location?: string; // free text e.g. "Plant room", "Bathroom ceiling"
  category: IssueCategory;
  priority: Priority;
  status: RequestStatus;
  source: RequestSource;
  reportedAt: string;
  resolvedAt?: string;
  dueAt: string;
  tenantId?: string;
  contractorId?: string;
  photos: Photo[];
  cost?: number;
  contractorNotes?: string;
  ai?: {
    suggestedCategory: IssueCategory;
    confidence: number;
    suggestedPriority: Priority;
    keywords: string[];
    reviewed: "pending" | "accepted" | "corrected";
    model: string;
  };
  groupId?: string; // set once a manager approves a duplicate grouping
  timeline: TimelineEvent[];
}

export interface Contractor {
  id: string;
  name: string;
  categories: IssueCategory[];
  contactName: string;
  email: string;
  phone: string;
  coverage: string;
  rating: number;
  avgResponseHours: number;
  firstTimeFixRate: number; // 0..1
  hourlyRate: number;
  status: "Active" | "On hold";
  joined: string;
}

export interface DuplicateSignal {
  label: "Property" | "Building & unit" | "Description" | "Photographs" | "Report dates" | "Maintenance history";
  score: number; // 0..1
  detail: string;
}

export interface DuplicateSuggestion {
  id: string;
  primaryId: string;
  matchIds: string[];
  score: number; // 0..100
  signals: DuplicateSignal[];
  sharedCharacteristics: string[];
  historicalNote: string;
  suggestedGroupTitle: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface BriefSection {
  key: string;
  title: string;
  body: string;
}

export interface ContractorBrief {
  id: string;
  requestId: string;
  contractorId?: string;
  sections: BriefSection[];
  photoIds: string[];
  status: "Draft" | "Approved" | "Shared";
  generatedAt: string;
  updatedAt: string;
  approvedBy?: string;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  kind: "Contractor report" | "Tenant letter" | "Inspection report" | "Invoice";
  uploadedAt: string;
  size: string;
  status: "Processing" | "Extracted" | "Reviewed";
  extracted?: {
    propertyGuess?: string;
    unitGuess?: string;
    category: IssueCategory;
    confidence: number;
    summary: string;
    fields: { label: string; value: string; confidence: number }[];
  };
  linkedRequestId?: string;
}

export interface DemoUser {
  name: string;
  email: string;
  organisation: string;
  role: string;
}
