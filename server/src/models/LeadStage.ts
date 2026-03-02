import mongoose, { Document, Schema } from 'mongoose';

export interface ILeadStage extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  sequence: number;
  color?: string;
  is_default: boolean; // some stages like 'new', 'won', 'lost' might be system default and hard to delete
}

const leadStageSchema = new Schema<ILeadStage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true // Names should be unique
    },
    sequence: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: '#3B82F6' // default color
    },
    is_default: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure sequence is unique? Maybe we just allow duplicates or handle it in controller

export const LeadStage = mongoose.model<ILeadStage>('LeadStage', leadStageSchema);
