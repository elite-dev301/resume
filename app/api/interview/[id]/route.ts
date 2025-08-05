import Interview from "@/lib/models/Interview";
import dbConnectMongoose from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await dbConnectMongoose();

  try {
    const result = await Interview.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ message: "Removed" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Internal Server Error", err }, { status: 500 });
  }
}