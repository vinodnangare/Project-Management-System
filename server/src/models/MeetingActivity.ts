import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingActivity extends Document {
  _id: mongoose.Types.ObjectId;
  meeting_id: mongoose.Types.ObjectId;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  performed_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const meetingActivitySchema = new Schema<IMeetingActivity>(
  {
    meeting_id: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    old_value: {
      type: String,
      default: null
    },
    new_value: {
      type: String,
      default: null
    },
    performed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

meetingActivitySchema.index({ meeting_id: 1, created_at: -1 });

export const MeetingActivity = mongoose.model<IMeetingActivity>('MeetingActivity', meetingActivitySchema);
export default MeetingActivity;
