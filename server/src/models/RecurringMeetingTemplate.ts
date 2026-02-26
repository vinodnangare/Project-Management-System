import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringMeetingTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  client?: mongoose.Types.ObjectId | null;
  lead?: mongoose.Types.ObjectId | null;
  // Time stored as HH:mm format (e.g., "09:00")
  startTime: string;
  endTime: string;
  // Duration in minutes
  duration: number;
  meetingType: 'online' | 'offline';
  location?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
  recurrence: 'daily' | 'weekly' | 'monthly';
  // For weekly: 0-6 (Sunday=0, Monday=1, etc.)
  dayOfWeek?: number | null;
  // For monthly: 1-31 (day of month)
  dayOfMonth?: number | null;
  // When the recurrence ends (optional - null means indefinite)
  endDate?: Date | null;
  // Last date a meeting was generated
  lastGeneratedDate: Date;
  // Is this template active?
  isActive: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const recurringMeetingTemplateSchema = new Schema<IRecurringMeetingTemplate>(
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
      default: null
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
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
    notes: {
      type: String,
      default: null,
      maxlength: 5000
    },
    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      index: true
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    lastGeneratedDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound indexes
recurringMeetingTemplateSchema.index({ isActive: 1, is_deleted: 1, recurrence: 1 });
recurringMeetingTemplateSchema.index({ createdBy: 1, is_deleted: 1 });

export const RecurringMeetingTemplate = mongoose.model<IRecurringMeetingTemplate>(
  'RecurringMeetingTemplate', 
  recurringMeetingTemplateSchema
);

export default RecurringMeetingTemplate;
