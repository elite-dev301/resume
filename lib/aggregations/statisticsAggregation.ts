import { ObjectId } from 'mongodb';

export const getApplicationStatistics = (
  profileIds: string[] | undefined,
  start_date: Date,
  end_date: Date,
  period: number
) => {

  const matchStage: any = {};

  matchStage['created'] = { $gte: start_date, $lt: end_date };
  
  if (profileIds && profileIds.length) matchStage['profile_id'] = { $in: profileIds.map(e => new ObjectId(e)) };
  
  return [
    {
      // Filter by multiple profile_ids and created date range
      $match: matchStage
    },
    {
      // Group by 10-minute intervals
      $group: {
        _id: {
          interval: {
            $toDate: {
              $subtract: [
                { $toLong: "$created" },
                { $mod: [{ $toLong: "$created" }, period] } // 10-minute interval
              ]
            }
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      // Sort by time intervals
      $sort: { "_id.interval": 1 }
    }
  ];
};
