export interface Interview {
  _id: string;
  start_date: Date;
  end_date: Date;
  member_id: string;
  member_name: string;
  application_id: string;
  link: string;
  note: string;
  step?: number;
}

export interface DashboardInterview {
  _id: string;
  start_date: string;
  end_date: string;
  link: string;
  note: string;
  interview_count: number;
  job_details: {
    company: string;
    content: string;
    link: string;
    salary: string;
    title: string
  };
  member_details: {
    name: string;
  };
  profile_details: {
    name: string;
  };
  application_data: {
    _id: string;
    resume: string;
  };
}