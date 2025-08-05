// models/Job.ts
import mongoose, { Schema, Document, Model, models } from "mongoose";
import { IBidder } from "./Bidder";

export interface IJob extends Document {
  bidder_id: mongoose.Types.ObjectId | IBidder;
  link: string;
  title: string;
  company: string;
  content: string;
  created: Date;
  active: boolean;
  location: string;
  salary: string;
  contract_type: string;
  background_check: string;
  thread_ts: string;
}

const JobSchema: Schema<IJob> = new Schema({
  bidder_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bidder"
  },
  link: { type: String, unique: true, required: true },
  title: String,
  company: String,
  content: String,
  created: Date,
  active: Boolean,
  location: String,
  salary: String,
  contract_type: String,
  background_check: String,
  thread_ts: String
});

const Job: Model<IJob> = models.Job || mongoose.model<IJob>("Job", JobSchema);
export default Job;
