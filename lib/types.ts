export type Urgency = "elective" | "urgent" | "very_urgent";
export type ConsultationStatus = "new" | "in_progress" | "closed";

export type PatientDraft = {
  name: string;
  location: "ICU" | "Medical ward" | "Surgical ward" | "OBGYN" | "Other" | "";
  locationOther?: string;
  notes: string;
};

export type AttachmentDraft = {
  file: File;
};

export type ConsultationDraft = {
  doctorPhone: string;
  urgency: Urgency | "";
  patients: PatientDraft[];
  attachments: File[];
};
