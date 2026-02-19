import mongoose, { Schema, Document, Types } from "mongoose";

export enum LeadStage {
  NEW = "new",
  IN_DISCUSSION = "in_discussion",
  QUOTED = "quoted",
  WON = "won",
  LOST = "lost"
}

export interface ILead extends Document {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;

  stage: LeadStage;
  priority: "high" | "medium" | "low";
  source: "web" | "referral" | "campaign" | "manual";

  owner_id?: Types.ObjectId | null;
  created_by: Types.ObjectId;

  notes?: string | null;
  is_deleted: boolean;

  created_at: Date;
  updated_at: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    company_name: { type: String, required: true, index: true },
    contact_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },

    stage: { type: String, enum: Object.values(LeadStage), default: LeadStage.NEW, index: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium", index: true },
    source: { type: String, enum: ["web", "referral", "campaign", "manual"], default: "manual", index: true },

    owner_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },

    notes: { type: String, default: null },
    is_deleted: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

/* Prevent duplicate active company names */
LeadSchema.index(
  { company_name: 1, is_deleted: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } }
);

export default mongoose.model<ILead>("Lead", LeadSchema);
