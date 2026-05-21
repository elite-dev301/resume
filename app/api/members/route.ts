import Member from "@/lib/models/Member";
import dbConnectMongoose from "@/lib/mongodb";

export async function GET(request: Request) {
  await dbConnectMongoose();

  try {
    const members = await Member.find().select({ name: 1 }).read('primary').lean().exec();
    return Response.json(members, {
      status: 200, headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err) {
    return Response.json({ message: 'Error fetching members', err }, { status: 500 });
  }
}
