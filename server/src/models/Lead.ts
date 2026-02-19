import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  stage: 'new' | 'in_discussion' | 'quoted' | 'won' | 'lost';
  priority: 'high' | 'medium' | 'low';
  source: 'web' | 'referral' | 'campaign' | 'manual';
  owner_id?: mongoose.Types.ObjectId | null;
  created_by: mongoose.Types.ObjectId;
  notes?: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const leadSchema = new Schema<ILead>(
  {
    company_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    contact_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      default: null,
      maxlength: 20
    },
    stage: {
      type: String,
      enum: ['new', 'in_discussion', 'quoted', 'won', 'lost'],
      default: 'new',
      index: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true
    },
    source: {
      type: String,
      enum: ['web', 'referral', 'campaign', 'manual'],
      default: 'manual'
    },
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    notes: {
      type: String,
      default: null
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

leadSchema.index({ stage: 1, is_deleted: 1 });
leadSchema.index({ owner_id: 1, is_deleted: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
export default Lead;
