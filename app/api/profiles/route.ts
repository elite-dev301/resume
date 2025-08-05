import dbConnectMongoose from "@/lib/mongodb";
import Profile, { IProfile } from "@/models/Profile";

export async function GET(request: Request) {
  await dbConnectMongoose();

  try {
    const profiles = await Profile.find({active: true}).select({ name: 1 });
    return Response.json(profiles, { status: 200 });
  } catch (err) {
    return Response.json({ message: 'Error fetching profiles', err }, { status: 500 });
  }
}
