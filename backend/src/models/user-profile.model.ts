import { Schema, model } from 'mongoose';

const userProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    bio: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

export const UserProfileModel = model('UserProfile', userProfileSchema);
