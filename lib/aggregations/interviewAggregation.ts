import { ObjectId } from 'mongodb';

export const getInterviewAggregation = (
  date: string | null, memberId: string | null
) => {
  return [
    {
      // Step 1: Match today's interviews and filter by member_id
      $match: {
        $expr: {
          $eq: [
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$start_date"
              }
            },
            date
          ]
        },
        member_id: memberId ? new ObjectId(memberId) : { $exists: true }
      }
    },
    {
      // Step 2: Lookup `members` collection to get the member's name
      $lookup: {
        from: "members",
        localField: "member_id",
        foreignField: "_id",
        as: "member_details"
      }
    },
    {
      // Step 3: Unwind `member_details` to get member name directly
      $unwind: "$member_details"
    },
    {
      // Step 8: Lookup `applications` collection to get the application resume
      $lookup: {
        from: "applications",
        localField: "application_id",
        foreignField: "_id",
        as: "application_data"
      }
    },
    {
      // Step 9: Unwind `application_details` to get resume link
      $unwind: "$application_data"
    },
    {
      $addFields: {
        profile_id: "$application_data.profile_id",
        // Add profile_id from application_data to the root document
        job_id: "$application_data.job_id"
      }
    },
    {
      // Step 4: Lookup `profiles` collection to get the profile's name
      $lookup: {
        from: "profiles",
        localField: "profile_id",
        foreignField: "_id",
        as: "profile_details"
      }
    },
    {
      // Step 5: Unwind `profile_details` to get profile name directly
      $unwind: "$profile_details"
    },
    {
      // Step 6: Lookup `jobs` collection to get job details
      $lookup: {
        from: "jobs",
        localField: "job_id",
        foreignField: "_id",
        as: "job_details"
      }
    },
    {
      // Step 7: Unwind `job_details` to get job title, company, and salary
      $unwind: "$job_details"
    },
    {
      $lookup: {
        from: "interviews",
        // Self-lookup on the same interviews collection to count interviews for the current application
        localField: "application_id",
        // Use the current application's ID
        foreignField: "application_id",
        // Match by application_id
        as: "current_interviews" // The field to store matched interviews
      }
    },
    {
      $addFields: {
        interview_count: {
          $size: "$current_interviews"
        } // Count the number of interviews for the current application
      }
    },
    {
      // Step 11: Project the final desired fields
      $project: {
        start_date: 1,
        end_date: 1,
        link: 1,
        note: 1,
        "member_details.name": 1,
        "profile_details.name": 1,
        "job_details.title": 1,
        "job_details.company": 1,
        "job_details.link": 1,
        "job_details.salary": 1,
        "job_details.content": 1,
        "application_data.resume": 1,
        "application_data._id": 1,
        interview_count: 1
      }
    },
    {
      $sort: {
        start_date: 1
      }
    }
  ];
};
