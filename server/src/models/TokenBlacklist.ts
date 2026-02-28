import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenBlacklist extends Document {
  _id: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  userId: mongoose.Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: ['logout', 'token_change', 'password_reset', 'admin_action'],
      default: 'logout'
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

// Auto-delete expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlacklist = mongoose.model<ITokenBlacklist>('TokenBlacklist', tokenBlacklistSchema);
export default TokenBlacklist;
