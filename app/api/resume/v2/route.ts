import Application, { IApplication } from "@/lib/models/Application";
import Job from "@/lib/models/Job";
import dbConnectMongoose from "@/lib/mongodb";
import { convertHTMLtoPDF } from "@/lib/services/convertHTMLtoPDF";
import generateResumeV2 from "@/lib/services/generateResumeV2";
import Profile, { IProfile } from "@/models/Profile";
import { NextResponse } from "next/server";

export const maxDuration = 180;

export async function POST(request: Request) {

  const { id, jd, url } = await request.json();

  await dbConnectMongoose();

  const profile: IProfile | null = await Profile.findById(id);

  if (profile === null) {
    return Response.json({ message: 'Profile Not Found' }, { status: 404 });
  }

  let checkJob = await Job.findOne({ link: url });

  if (checkJob) {
    let application = await Application.findOne({ job_id: checkJob._id, profile_id: profile._id });

    if (application !== null) {
      try {
        const pdfBuffer = await convertHTMLtoPDF(application.resume);

        return new NextResponse(Buffer.from(pdfBuffer), {
          status: 200, headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=resume.pdf',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Content-Disposition',
          }
        });
      } catch (error) {
        return Response.json({ message: 'Error while converting HTML to PDF' }, { status: 500 });
      }
    }
  }

  const result = await generateResumeV2(profile, jd, url);

  if (result === null) return Response.json({ message: 'Couldn\'t generate resume' }, { status: 500 });

  const { resume, job, html } = result;

  try {
    if (checkJob === null) {
      checkJob = await new Job(job).save();
    }

    await new Application({
      job_id: checkJob._id,
      profile_id: profile._id,
      created: new Date(),
      resume: html
    }).save();


  } catch (error) {
    console.error("Error saving job & profile:", error);
    return Response.json({ message: 'Error saving job & profile' }, { status: 500 });
  }

  return new NextResponse(Buffer.from(resume), {
    status: 200, headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=resume.pdf',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Disposition',
    }
  });
}
