// models/Interview.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';
import { IMember } from './Member';
import { IApplication } from './Application';

export interface IInterview extends Document {
  member_id: mongoose.Types.ObjectId | IMember;
  application_id: mongoose.Types.ObjectId | IApplication;
  start_date: Date;
  end_date: Date;
  link: string;
  note: string;
};

const InterviewSchema: Schema<IInterview> = new Schema({
  member_id: { type: mongoose.Types.ObjectId, ref: 'Member', required: true },
  application_id: { type: mongoose.Types.ObjectId, ref: 'Application', required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  link: String,
  note: String
});

const Interview: Model<IInterview> = models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
export default Interview;
