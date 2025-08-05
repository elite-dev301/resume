import Application from "@/lib/models/Application";
import dbConnectMongoose from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { application_id: string } }) {
  await dbConnectMongoose();

  try {
    const result = await Application.findById(params.application_id);
    return new NextResponse(result?.resume, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (err) {
    return NextResponse.json({ message: "Internal Server Error", err }, { status: 500 });
  }
}