// models/User.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';

export interface IProfile extends Document {
  name: string;
  email: string;
  phoneNumber: string;
  categoryHTML: string;
  skillHTML: string;
  certificationHTML: string;
  experienceHTML: string;
  mainHTML: string;
  experience: string;
  otherPrompt: string;
  active: boolean;
  birthday: Date;
  location: string;
  linkedin: string;
  degree: string;
};

const ProfileSchema: Schema<IProfile> = new Schema({
  name: String,
  email: String,
  phoneNumber: String,
  categoryHTML: String,
  skillHTML: String,
  certificationHTML: String,
  experienceHTML: String,
  mainHTML: String,
  experience: String,
  otherPrompt: String,
  active: Boolean,
  birthday: Date,
  location: String,
  linkedin: String,
  degree: String
});

const Profile: Model<IProfile> = models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
export default Profile;
