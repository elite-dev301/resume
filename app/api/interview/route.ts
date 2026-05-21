import { getInterviewAggregation } from "@/lib/aggregations/interviewAggregation";
import Interview from "@/lib/models/Interview";
import dbConnectMongoose from "@/lib/mongodb";
import { Interview as InterviewPayload } from "@/types/interview";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: Request) {

  try {
    const interview: InterviewPayload = await request.json();

    await dbConnectMongoose();

    if (!interview._id) {
      const { _id, member_name, step, ...interviewData } = interview;
      const newInterview = await new Interview(interviewData).save();
      return Response.json(newInterview, { status: 201 });
    } else {
      const { _id, member_name, step, ...interviewData } = interview;
      const updatedInterview = await Interview.findByIdAndUpdate(
        _id,
        interviewData,
        { new: true }
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
