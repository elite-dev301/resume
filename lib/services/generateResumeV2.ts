import { WorkExperience, Skills } from "@/types/resume";
import { IProfile } from "../models/Profile";
import GetAIResponse from "../openAI";
import { IJob } from "../models/Job";
import { convertHTMLtoPDF } from "./convertHTMLtoPDF";

function getPrompt(profile: IProfile, jd: string) {
  const prompt = `
**Work Experience**:
${profile.experience}
${profile.otherPrompt}

**Target Job Description**:
${jd}
`;

  return prompt;
}

// Function to extract the summary
const extractSummary = (text: string): string | null => {
  const summaryMatch = text.match(/### Professional Summary([\s\S]*?)\n###/);
  return summaryMatch ? summaryMatch[1].trim() : null;
};

// Function to extract work experience details
const extractWorkExperience = (text: string): WorkExperience[] => {
  const experienceMatch = text.match(/### Work Experience([\s\S]*?)\n###/);

  if (!experienceMatch) return [];

  const experience = experienceMatch[1].trim();

  const workExpMatches = [
    ...Array.from(
      experience.matchAll(
        /\*\*([^\*]+)\*\*[\s]*\n\*\*Period\*\*([^\*]+)\n\*\*Role\*\*([^\*]+)\n\*\*Job Descriptions\*\*[\s]*\n([^\*]+)(?=\*\*|$)/g
      )
    ),
  ];

  return workExpMatches.map((match) => ({
    company: match[1].trim(),
    period: match[2].trim(),
    role: match[3].trim(),
    jobDescriptions: match[4]
      .trim()
      .split("- ")
      .map((desc) => desc.trim())
      .filter((desc) => desc),
  }));
};

// Function to extract categorized skills
const extractSkills = (text: string): Skills[] => {
  const skillsMatch = text.match(/### Skills([\s\S]*?)\n###/);

  if (!skillsMatch) return [];

  const skill = skillsMatch[1].trim();

  const skillMatches = [
    ...Array.from(skill.matchAll(/\*\*([^\*]+)\*\*([^\*]+)/g)),
  ];
  return skillMatches.map((match) => ({
    category: match[1].trim(),
    skills: match[2]
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill),
  }));
};

const extractCertifications = (text: string): string[] => {
  const certificationsMatch = text.match(/### Certifications([\s\S]*?)\n###/);

  if (!certificationsMatch) return [];

  const certifications = certificationsMatch[1].trim();

  return certifications
    .split(",")
    .map((certification) => certification.trim())
    .filter((certification) => certification);
};

// Function to extract the job details
const extractJobDetails = (text: string): string => {
  const jobDetailMatch = text.match(/### Job Details([\s\S]*?)$/);
  return jobDetailMatch ? jobDetailMatch[1].trim() : "";
};

function b64DecodeUnicode(str: string) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
}

function removeLastComma(str: string) {
  return str.replace(/,\s*$/, "");
}

async function getAIResponse(profile: IProfile, jd: string) {
  const resp = await GetAIResponse(getPrompt(profile, jd));

  if (resp === null) {
    console.log("AI RESP is NULL");
    return null;
  }

  return resp;
}

function generateResumeHTML(profile: IProfile, resp: string) {
  const { summary, experience, skills, certifications } = {
    summary: extractSummary(resp),
    experience: extractWorkExperience(resp),
    skills: extractSkills(resp),
    certifications: extractCertifications(resp),
  };

  if (summary === null || experience.length === 0 || skills.length === 0) {
    console.log(summary, experience.length, skills.length, resp);
    return null;
  }

  const [
    title,
    company,
    location,
    salary,
    contract_type,
    background_check,
    standardized_job_title,
  ] = extractJobDetails(resp)
    .replaceAll("[blank]", "")
    .split("\n")
    .map((str) => str.trim());

  console.log("Standardized", standardized_job_title);

  let job_title = standardized_job_title.includes(':') ? standardized_job_title.split(':')[1].trim() : standardized_job_title;
  job_title = job_title.includes('Standardized Job Title ') ? job_title.split('Standardized Job Title ')[1].trim() : job_title;

  const html = profile.mainHTML;
  const experienceHTML = profile.experienceHTML;
  const categoryHTML = profile.categoryHTML;
  const skillHTML = profile.skillHTML;
  const certificationHTML = profile.certificationHTML;

  return html
    .replaceAll("{Name}", profile.name)
    .replaceAll("{Email}", profile.email)
    .replaceAll("{Phone}", profile.phoneNumber)
    .replaceAll("{LinkedIn}", profile.linkedin)
    .replaceAll("{Location}", profile.location)
    .replaceAll("{Degree}", profile.degree)
    .replace("{Summary}", summary)
    .replace(
      "{Skills}",
      skills
        .map((skill) =>
          categoryHTML
            .replace("{Category}", skill.category)
            .replace(
              "{Skill-List}",
              removeLastComma(
                skill.skills
                  .map((s) => skillHTML.replace("{Skill}", s))
                  .join("")
              )
            )
        )
        .join("")
    )
    .replace(
      "{Certifications}",
      removeLastComma(
        certifications
          .map((cert) => certificationHTML.replace("{Certification}", cert))
          .join("")
      )
    )
    .replace(
      "{Experiences}",
      experience
        .map((exp, idx) =>
          experienceHTML
            .replace("{Company}", exp.company)
            .replace("{Role}", idx === 0 ? job_title : exp.role)
            .replace("{Period}", exp.period)
            .replace(
              "{Job-Descriptions}",
              exp.jobDescriptions.map((jd) => `<li>${jd}</li>`).join("")
            )
        )
        .join("")
    );
}

async function getJobDetails(jd: string, url: string, resp: string) {
  const [title, company, location, salary, contract_type, background_check] =
    extractJobDetails(resp)
      .replaceAll("[blank]", "")
      .split("\n")
      .map((str) => str.trim());

  return {
    title,
    company,
    location,
    salary,
    contract_type,
    background_check,
    link: url,
    content: jd,
    active: true,
    created: new Date(),
  } as IJob;
}

async function generateResumeV2(profile: IProfile, jd: string, url: string) {
  const resp = await getAIResponse(profile, jd);

  if (resp === null) return null;

  const html = await generateResumeHTML(profile, resp);

  if (html === null) {
    return null;
  }

  const pdfBuffer = await convertHTMLtoPDF(html);
  const job = await getJobDetails(jd, url, resp);

  return { resume: pdfBuffer, job, html };
}

export default generateResumeV2;
