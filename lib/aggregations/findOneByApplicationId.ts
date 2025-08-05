import mongoose from 'mongoose';

export const findOneByApplicationId = (applicationId: string) => {
  return [
    // Match the specific application_id
    {
      $match: { _id: new mongoose.Types.ObjectId(applicationId) }
    },
    // Lookup to join with Profile
    {
      $lookup: {
        from: 'profiles', // Name of the Profile collection
        localField: 'profile_id',
        foreignField: '_id',
        as: 'profile'
      }
    },
    // Unwind the profile array (since $lookup returns an array)
    {
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true
      }
    },
    // Lookup to join with Job
    {
      $lookup: {
        from: 'jobs', // Name of the Job collection
        localField: 'job_id',
        foreignField: '_id',
        as: 'job'
      }
    },
    // Unwind the job array
    {
      $unwind: {
        path: '$job',
        preserveNullAndEmptyArrays: true
      }
    },
    // Lookup to join with Interview
    {
      $lookup: {
        from: 'interviews', // Name of the Interview collection
        localField: '_id',
        foreignField: 'application_id',
        as: 'interviews'
      }
    },
    // Lookup to join with Members to get member_name in interviews (no unwind)
    {
      $lookup: {
        from: "members",
        // Members collection to join for member name
        localField: "interviews.member_id",
        // The field in interviews where the member's ObjectId is stored
        foreignField: "_id",
        // The field in the Members collection
        as: "member_data" // The alias to store member data in interviews
      }
    },
    {
      $addFields: {
        interviews: {
          $map: {
            input: "$interviews",
            // Iterate over the interviews array
            as: "interview",
            // Alias for each interview element
            in: {
              $mergeObjects: [
                "$$interview",
                // Keep the original interview object
                {
                  member_name: {
                    $let: {
                      vars: {
                        member: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input:
                                  "$member_data",
                                as: "member",
                                cond: {
                                  $eq: [
                                    "$$member._id",
                                    "$$interview.member_id"
                                  ]
                                }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: "$$member.name" // Get the member name based on member_id
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    // Project the desired fields
    {
      $project: {
        profile: {
          name: 1,
          birthday: 1,
          location: 1,
          email: 1,
          phoneNumber: 1,
          otherPrompt: 1
        },
        job: {
          title: 1,
          company: 1,
          link: 1,
          salary: 1,
          location: 1,
          contract_type: 1,
          background_check: 1,
          content: 1
        },
        created: 1,
        resume: 1,
        interviews: {
          _id: 1,
          start_date: 1,
          end_date: 1,
          member_id: 1,
          link: 1,
          note: 1,
          member_name: 1 // Assuming member has name field
        }
      }
    }
  ];
};
