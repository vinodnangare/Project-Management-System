import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  client?: mongoose.Types.ObjectId | null;
  lead?: mongoose.Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  meetingType: 'online' | 'offline';
  location?: string | null;
  meetingLink?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    description: {
      type: String,
      default: null,
      maxlength: 2000
    },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true
    },
    meetingType: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    location: {
      type: String,
      default: null,
      maxlength: 500
    },
    meetingLink: {
      type: String,
      default: null,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true
    },
    notes: {
      type: String,
      default: null,
      maxlength: 5000
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

// Compound indexes for optimized queries
meetingSchema.index({ startTime: 1, assignedTo: 1 });
meetingSchema.index({ assignedTo: 1, is_deleted: 1 });
meetingSchema.index({ client: 1, is_deleted: 1 });
meetingSchema.index({ lead: 1, is_deleted: 1 });
meetingSchema.index({ status: 1, is_deleted: 1 });
meetingSchema.index({ startTime: 1, endTime: 1, is_deleted: 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
export default Meeting;
