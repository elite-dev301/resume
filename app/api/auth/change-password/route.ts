import Member from "@/lib/models/Member";
import dbConnectMongoose from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

  try {
    const data: { id: string, current: string, new: string } = await request.json();

    await dbConnectMongoose();

    const member = await Member.findById(data.id);
    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    if (!await member.comparePassword(data.current)) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    }

    member.password = data.new;
    await member.save();

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (err) {
    console.log(err);
    return NextResponse.error();
  }
}