import { Interview } from "./interview";
import { Job } from "./job";
import { Profile } from "./profile";

type JobDetails = Omit<Job, "_id" | "created" | "applied_count" | "interview_count" | "unique_interview_profile_count">;

export interface Application {
  _id: string;
  job_id: string;
  profile_id: string;
  created: string;
  interview_count: number;
  resume: string;
  profile_name: string;
  job: JobDetails;
  interview_date: Date;
}

export interface ApplicationById {
  _id: string;
  created: Date;
  profile: Profile;
  job: JobDetails;
  resume: string;
  interviews: Interview[];
}