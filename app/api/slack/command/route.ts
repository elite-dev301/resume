import Application from "@/lib/models/Application";
import Bidder from "@/lib/models/Bidder";
import Job, { IJob } from "@/lib/models/Job";
import dbConnectMongoose from "@/lib/mongodb";

export async function POST(request: Request) {
  const textBody = await request.text(); // Raw body string
  const params = new URLSearchParams(textBody); // Parse as x-www-form-urlencoded

  const command = params.get("command"); // "/resume"
  const text = params.get("text"); // "report"

  if (command === "/resume" && text?.startsWith("report")) {
    await dbConnectMongoose();

    const dateText = text.split(" ")[1];

    let date = new Date();

    if (dateText) date = new Date(dateText);

    // Start of the day (midnight)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // End of the day (23:59:59.999)
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appsOnThatDay = await Application.find({
      created: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const report: Map<string, { found: number; apply: number }> = new Map();

    appsOnThatDay.forEach((item) => {
      if (!item.bidder_id) return;

      const bidderId = item.bidder_id.toString();

      let bid = report.get(bidderId);

      if (!bid) {
        report.set(bidderId, { found: 0, apply: 0 });
        bid = report.get(bidderId);
      }

      if (item.new) bid!.found++;
      else bid!.apply++;
    });

    const rows = Array.from(report.entries()).map(([bidderId, counts]) => ({
      bidderId,
      ...counts,
    }));

    // Sort by found desc, then apply desc
    rows.sort((a, b) => {
      if (b.found !== a.found) return b.found - a.found;
      return b.apply - a.apply;
    });

    const bidders = await Bidder.find();

    // Format each row as simple lines
    const lines = rows.map(
      (r, i) =>
        `${i + 1}. <@${
          bidders.find((e) => e.id === r.bidderId)!.slack_id
        }>: \`${r.found}\` found / \`${r.apply}\` applied`
    );

    const slackMessage = `📊 *Daily Resume Report (${date.toLocaleDateString(
      "en-US"
    )})*\n\n${lines.join("\n")}`;

    return Response.json(
      {
        response_type: "in_channel",
        text: slackMessage,
      },
      { status: 200 }
    );
  }

  return Response.json(
    {
      response_type: "ephemeral",
      text: `❓ Unknown subcommand. Try \`/resume report {date}\``,
    },
    { status: 200 }
  );
}
