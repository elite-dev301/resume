import { getInterviewAggregation } from "@/lib/aggregations/interviewAggregation";
import Interview, { IInterview } from "@/lib/models/Interview";
import dbConnectMongoose from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: Request) {

  try {
    const interview: IInterview = await request.json();

    await dbConnectMongoose();

    if (interview._id as string === '') {
      delete interview._id; // Remove _id if it's empty to avoid conflicts
      const newInterview = await new Interview(interview).save(); // Create new interview
      return Response.json(newInterview, { status: 201 });
    } else {
      // Update existing interview if _id is provided
      const updatedInterview = await Interview.findByIdAndUpdate(
        interview._id,
        interview,
        { new: true } // Return the updated interview
      );

      if (!updatedInterview) {
        return NextResponse.error(); // Interview not found
      }

      return Response.json(updatedInterview, { status: 200 });
    }
  } catch (err) {
    console.log(err);
    return NextResponse.error();
  }
}

export async function GET(req: NextRequest) {
  const db = await dbConnectMongoose();

  try {
    
    const { searchParams } = new URL(req.url);

    const member = searchParams.get("member"); // Default
    const date = searchParams.get("date");

    const aggregationResult = await db.connection.collection("interviews").aggregate(
      getInterviewAggregation(date, member)
    ).toArray();

    return NextResponse.json(aggregationResult);
  } catch (err) {
    return NextResponse.json({ message: "Internal Server Error", err }, { status: 500 });
  }
}
