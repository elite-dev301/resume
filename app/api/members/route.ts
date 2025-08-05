import Member from "@/lib/models/Member";
import dbConnectMongoose from "@/lib/mongodb";

export async function GET(request: Request) {
  await dbConnectMongoose();

  try {
    const members = await Member.find();
    return Response.json(members, { status: 200 });
  } catch (err) {
    return Response.json({ message: 'Error fetching members', err }, { status: 500 });
  }
}
