export interface Job {
  _id: string;
  link: string;
  title: string;
  company: string;
  content: string;
  salary: string;
  contract_type: string;
  background_check: string;
  location: string;
  created: string;
  applied_count: number;
  interview_count: number;
  unique_interview_profile_count: number;
}