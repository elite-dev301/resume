import { ObjectId } from 'mongodb';

export const getApplicationAggregation = (
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc",
  filters: Record<string, any>,
  start_date: Date | null,
  end_date: Date
) => {
  const skip = page * limit;

  const matchStage: any = {};

  // Apply dynamic filters
  Object.keys(filters).forEach((field) => {
    if (filters[field]) {
      switch (field) {
        case 'profile_id':
          matchStage[field] = new ObjectId(filters[field]);
          break;
        case 'interview_count':
          matchStage['interview_count'] = { $gt: 0 }
          break;
        default:
          matchStage[field] = { $regex: filters[field], $options: "i" };
          break;
      }
    }
  });

  if (start_date != null) {
    matchStage['created'] = { $gte: start_date, $lt: end_date };
  }

  return [
    {
      $lookup: {
        from: "jobs", // Job collection name
        localField: "job_id", // Application's job_id
        foreignField: "_id", // Job's _id
        as: "job_data"
      }
    },
    {
      $unwind: "$job_data" // Flatten job_data array to get job fields
    },
    {
      $lookup: {
        from: "profiles", // Profile collection name
        localField: "profile_id", // Application's profile_id
        foreignField: "_id", // Profile's _id
        as: "profile_data"
      }
    },
    {
      $unwind: "$profile_data" // Flatten profile_data array to get profile fields
    },
    {
      // Lookup Interview count for matching job_id and profile_id
      $lookup: {
        from: "interviews",
        localField: "_id",
        foreignField: "application_id",
        as: "interview_data"
      }
    },
    {
      $addFields: {
        job: "$job_data", // Add job data to the result
        profile_name: "$profile_data.name", // Extract name from profile
        resume: "$resume", // Extract resume
        created: "$created", // Add created field from application,
        interview_count: { $size: "$interview_data" }
      }
    },
    {
      $addFields: {
        interview_date: {
          $max: "$interview_data.start_date"
        }
      }
    },
    { $match: matchStage }, // Apply dynamic filters
    {
      $project: {
        job_data: 0, // Exclude job_data array from the result
        profile_data: 0, // Exclude profile_data array from the result
        "job._id": 0, // Exclude job _id from the job details
        "job.created": 0, // Exclude job created field,
        interview_data: 0
      }
    },
    {
      $facet: {
        totalCount: [{ $count: "count" }], // Get total count
        paginatedResults: [
          { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } }, // Dynamic sorting
          { $skip: skip }, // Pagination - skip documents
          { $limit: limit } // Pagination - limit results
        ]
      }
    }
  ];
};
