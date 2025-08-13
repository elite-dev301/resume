import dbConnectMongoose from "@/lib/mongodb";
import Profile, { IProfile } from "@/models/Profile";

export async function GET(request: Request) {
  await dbConnectMongoose();

  try {
    const profiles = await Profile.find({ active: true }).select({ name: 1 }).read('primary').lean().exec();
    return Response.json(profiles, {
      status: 200, headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err) {
    return Response.json({ message: 'Error fetching profiles', err }, { status: 500 });
  }
}
