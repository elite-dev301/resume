import Bidder from "@/lib/models/Bidder";
import dbConnectMongoose from "@/lib/mongodb";

export async function GET(request: Request) {
  await dbConnectMongoose();

  try {
    const items = await Bidder.find();
    return Response.json(items, {
      status: 200, headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err) {
    return Response.json({ message: 'Error fetching bidders', err }, { status: 500 });
  }
}
