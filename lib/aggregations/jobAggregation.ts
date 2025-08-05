export const getJobListingsAggregation = (
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc",
  filters: Record<string, any>
) => {
  const skip = page * limit;

  const matchStage: any = {};

  // Apply dynamic filters
  Object.keys(filters).forEach((field) => {
    if (filters[field]) {
      matchStage[field] = { $regex: filters[field], $options: "i" }; // Case-insensitive search
    }
  });

  return [
    { $match: matchStage }, // Apply dynamic filters
    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "job_id",
        as: "applications",
      },
    },
    {
      $lookup: {
        from: "interviews",
        let: { jobId: "$_id" },
        pipeline: [
          {
            $lookup: {
              from: "applications",
              localField: "application_id",
              foreignField: "_id",
              as: "application_data",
            },
          },
          {
            $unwind: "$application_data",
          },
          {
            $match: {
              $expr: { $eq: ["$application_data.job_id", "$$jobId"] },
            },
          },
          {
            $project: {
              _id: 1,
              profile_id: "$application_data.profile_id",
            },
          },
        ],
        as: "interviews",
      },
    },
    {
      $addFields: {
        applied_count: { $size: "$applications" },
        interview_count: { $size: "$interviews" },
        unique_interview_profile_count: {
          $size: { $setUnion: "$interviews.profile_id" }
        }
      }
    },
    {
      $project: {
        applications: 0, // Exclude applied_data array from the result
        interviews: 0 // Exclude interview_data array from the result
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
