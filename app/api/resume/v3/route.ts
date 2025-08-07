import Application, { IApplication } from "@/lib/models/Application";
import Bidder, { IBidder } from "@/lib/models/Bidder";
import Job from "@/lib/models/Job";
import dbConnectMongoose from "@/lib/mongodb";
import { convertHTMLtoPDF } from "@/lib/services/convertHTMLtoPDF";
import generateResumeV2 from "@/lib/services/generateResumeV2";
import Profile, { IProfile } from "@/models/Profile";
import { NextResponse } from "next/server";

export const maxDuration = 180;

export async function POST(request: Request) {
  const { id, jd, url, bidderId } = await request.json();

  await dbConnectMongoose();

  const profile: IProfile | null = await Profile.findById(id);

  if (profile === null) {
    return Response.json({ message: "Profile Not Found" }, { status: 404 });
  }

  const bidder: IBidder | null = await Bidder.findById(bidderId);

  if (bidder === null) {
    return Response.json({ message: "Bidder Not Found" }, { status: 404 });
  }

  let checkJob = await Job.findOne({ link: url });

  if (checkJob) {
    let application = await Application.findOne({
      job_id: checkJob._id,
      profile_id: profile._id,
    });

    if (application !== null) {
      console.log(`You've already applied to this job with ${profile.name}. Please find another one.`);
      return Response.json(
        {
          message: `You've already applied to this job with ${profile.name}. Please find another one.`,
        },
        { status: 400 }
      );
    }
  }

  const result = await generateResumeV2(profile, jd, url);

  if (result === null)
    return Response.json(
      { message: "Couldn't generate resume" },
      { status: 500 }
    );

  const { resume, job, html } = result;

  // Check if they applied to a same company job
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const pipeline = [
    {
      $match: {
        profile_id: profile._id,
        created: { $gte: oneWeekAgo },
      },
    },
    {
      $lookup: {
        from: "jobs", // MongoDB collection name (usually lowercase plural)
        localField: "job_id",
        foreignField: "_id",
        as: "job",
      },
    },
    {
      $unwind: "$job",
    },
    {
      $match: {
        "job.company": job.company,
        "job.title": job.title,
      },
    },
    { $limit: 1 }, // Only check if at least one match exists
    { $project: { _id: 1 } }, // Just need something minimal
  ];

  const [application] = await Application.aggregate(pipeline);

  if (application) {
    console.log("You have already applied to this job at this company in the last week.");
    return Response.json(
      { message: "You have already applied to this job at this company in the last week." },
      { status: 400 }
    );
  }

  if (
    job.background_check.toLowerCase().includes("public trust") ||
    job.background_check.toLowerCase().includes("clearance")
  ) {
    console.log("This job contains public trust or security clearance.");
    return Response.json(
      { message: "This job contains public trust or security clearance." },
      { status: 400 }
    );
  }

  try {
    const newJob = checkJob === null;

    if (checkJob === null) {
      checkJob = await new Job({ ...job, bidder_id: bidder._id }).save();
    }

    await new Application({
      job_id: checkJob._id,
      profile_id: profile._id,
      created: new Date(),
      resume: html,
      bidder_id: bidder._id,
      new: newJob,
    }).save();

    if (newJob) {
      await fetch(
        process.env.SLACK_URL as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `<!channel> \`job_id: ${checkJob._id}\`

<@${bidder.slack_id}> is applying for \`${checkJob.title}\` at \`${checkJob.company}\` as \`${profile.name}\`

:world_map: ${checkJob.location} | :heavy_dollar_sign: ${checkJob.salary} | :handshake: ${checkJob.contract_type}

${checkJob.link}
            `,
          }),
        }
      );
    } else {
      await fetch(
        process.env.SLACK_URL as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `<@${bidder.slack_id}> is applying now as \`${profile.name}\`. :medal:`,
            thread_ts: checkJob.thread_ts,
          }),
        }
      );
    }
  } catch (error) {
    console.error("Error saving job & profile:", error);
    return Response.json(
      { message: "Error saving job & profile" },
      { status: 500 }
    );
  }

  return new NextResponse(Buffer.from(resume), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Content-Disposition",
    },
  });
}
