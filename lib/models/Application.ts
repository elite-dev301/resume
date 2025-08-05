// models/Application.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';
import { IJob } from './Job';  // Assuming you are referencing the Job model
import { IProfile } from './Profile';  // Assuming you are referencing the Profile model
import { IBidder } from './Bidder';

export interface IApplication extends Document {
  bidder_id: mongoose.Types.ObjectId | IBidder;
  job_id: mongoose.Types.ObjectId | IJob;
  profile_id: mongoose.Types.ObjectId | IProfile;
  created: Date;
  resume: string;
  new: Boolean;
};

const ApplicationSchema: Schema<IApplication> = new Schema({
  bidder_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bidder"
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  resume: {
    type: String,  // You can change this type based on how you store the resume (e.g., file URL, path, etc.)
    required: true
  },
  new: {
    type: Boolean,
    default: false
  }
});

const Application: Model<IApplication> = models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
export default Application;
