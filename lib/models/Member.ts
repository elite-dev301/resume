import mongoose, { Schema, Document, Model, models } from 'mongoose';
import bcrypt from 'bcrypt';
import { Role } from '@/types/member';

export interface IMember extends Document {
  name: string;
  password: string;
  userID: string;
  role: Role;
  comparePassword(candidatePassword: string): Promise<boolean>;
};

const MemberSchema: Schema<IMember> = new Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  userID: { type: String, required: true },
  role: { type: String, enum: Role, required: true }
});

// Hash the password before saving the document
MemberSchema.pre('save', async function (next) {
  const member = this as IMember;
  if (!member.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(member.password, salt);
  } catch (err) {
    console.log("Password update error", err);
  }

  next();
});

// Method to compare passwords
MemberSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Member: Model<IMember> = models.Member || mongoose.model<IMember>('Member', MemberSchema);
export default Member;