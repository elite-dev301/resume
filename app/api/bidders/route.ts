import Bidder from "@/lib/models/Bidder";
import dbConnectMongoose from "@/lib/mongodb";

export async function GET(request: Request) {
  await dbConnectMongoose();

  try {
    const items = await Bidder.find();
    return Response.json(items, { status: 200 });
  } catch (err) {
    return Response.json({ message: 'Error fetching bidders', err }, { status: 500 });
  }
}
