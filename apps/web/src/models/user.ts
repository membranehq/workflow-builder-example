import mongoose from 'mongoose'

export interface IUser {
  authUserId: string | null
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    authUserId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
