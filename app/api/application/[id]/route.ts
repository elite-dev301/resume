import { findOneByApplicationId } from "@/lib/aggregations/findOneByApplicationId";
import dbConnectMongoose from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const db = await dbConnectMongoose();

    try {
        const aggregationResult = await db.connection.collection("applications").aggregate(
            findOneByApplicationId(params.id)
        ).toArray();

        return NextResponse.json(aggregationResult[0]);
    } catch (err) {
        return NextResponse.json({ message: "Internal Server Error", err }, { status: 500 });
    }
}
