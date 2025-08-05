import { getApplicationStatistics } from "@/lib/aggregations/statisticsAggregation";
import dbConnectMongoose from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const db = await dbConnectMongoose();

  try {
    
    const { searchParams } = new URL(req.url);

    const start_date = new Date(searchParams.get("start_date") as string);
    const end_date = new Date(searchParams.get("end_date") as string);
    const period = parseInt(searchParams.get("period") as string) || 10 * 60 * 1000; // 10 mins
    const profiles = searchParams.get("profiles")?.split(",");

    const aggregationResult = await db.connection.collection("applications").aggregate(
      getApplicationStatistics(profiles, start_date, end_date, period)
    ).toArray();

    return NextResponse.json(aggregationResult);
  } catch (err) {
    return NextResponse.json({ message: "Internal Server Error", err }, { status: 500 });
  }
}
