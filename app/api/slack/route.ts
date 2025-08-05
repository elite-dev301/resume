import Job, { IJob } from "@/lib/models/Job";
import dbConnectMongoose from "@/lib/mongodb";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.type === "url_verification") {
    return Response.json({ challenge: body.challenge });
  }

  if (body.type === "event_callback" && body.event.type === "message") {
    await dbConnectMongoose();

    const text = body.event.text;

    const match = text.match(/`job_id:\s*([0-9a-z]+)`/);

    if (match) {
      const jobId = match[1];
      const job: IJob | null = await Job.findById(jobId);

      if (job) {
        job.thread_ts = body.event.ts;
        await job.save();
      }
    }
  }

  return Response.json({ message: "Received Request" }, { status: 200 });
}
