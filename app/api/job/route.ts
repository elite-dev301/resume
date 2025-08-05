import { getJobListingsAggregation } from "@/lib/aggregations/jobAggregation";
import dbConnectMongoose from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const db = await dbConnectMongoose();

  try {
    
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") as string) || 0; // Default page 0
    const limit = parseInt(searchParams.get("limit") as string) || 10; // Default limit 10
    const sortBy = (searchParams.get("sortBy") as string) || "created"; // Default sorting field
    const sortOrder = (searchParams.get("sortOrder") as string) === "asc" ? "asc" : "desc"; // Default: descending

    // Extract filters dynamically (excluding known params)
    const knownParams = ["page", "limit", "sortBy", "sortOrder"];
    const filters: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (!knownParams.includes(key)) {
        filters[key] = value;
      }
    });

    const aggregationResult = await db.connection.collection("jobs").aggregate(
      getJobListingsAggregation(page, limit, sortBy, sortOrder, filters)
    ).toArray();

    const totalItems = aggregationResult[0].totalCount.length > 0 ? aggregationResult[0].totalCount[0].count : 0;
    const jobs = aggregationResult[0].paginatedResults;

    return NextResponse.json({
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data: jobs
    });
  } catch (err) {
    return NextResponse.json({ message: "Internal Server Error", err }, { status: 500 });
  }
}
