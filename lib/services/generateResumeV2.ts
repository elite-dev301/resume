import { IProfile } from "../models/Profile";
import { AIResponse, GetAIStructuredResponse } from "../openAI";
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

<<<<<<< HEAD
=======
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


>>>>>>> 73981892a5ff763e7527f30c3268d3e7f6475978
function removeLastComma(str: string) {
  return str.replace(/,\s*$/, "");
}

async function getAIResponse(profile: IProfile, jd: string) {
  const resp = await GetAIStructuredResponse(getPrompt(profile, jd));

  if (resp === null) {
    console.log("AI RESP is NULL");
    return null;
  }

  return resp;
}

function generateResumeHTML(profile: IProfile, resp: AIResponse) {
  const { summary, experience, skills, certifications } = {
    summary: resp.professional_summary,
    experience: resp.work_experience,
    skills: resp.skills,
    certifications: resp.certifications,
  };

  if (!summary || experience.length === 0) {
    console.log(summary, experience.length, resp);
    return null;
  }

  const html = profile.mainHTML;
  const experienceHTML = profile.experienceHTML;
  const categoryHTML = profile.categoryHTML;
  const skillHTML = profile.skillHTML;
  const certificationHTML = profile.certificationHTML;

  const skillsArray = [
    skills.programming_languages,
    skills.frameworks_libraries,
    skills.tools_platforms,
    skills.devops_ci_cd,
    skills.other_skills,
  ];

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
      skills.category_names.slice(0, 5)
        .map((category, index) =>
          categoryHTML
            .replace("{Category}", category)
            .replace(
              "{Skill-List}",
              removeLastComma(
                skillsArray[index]
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
            .replace("{Company}", exp.company_name)
            .replace("{Role}", idx === 0 ? resp.job_details.standardized_job_title : exp.role)
            .replace("{Period}", exp.period)
            .replace(
              "{Job-Descriptions}",
              exp.projects
                .flatMap((project) => project.responsibility)
                .map((jd) => `<li>${jd}</li>`)
                .join("")
            )
        )
        .join("")
    );
}

async function getJobDetails(jd: string, url: string, resp: AIResponse) {
  return {
    title: resp.job_details.job_title,
    company: resp.job_details.company_name,
    location: resp.job_details.remote,
    salary: resp.job_details.salary,
    contract_type: resp.job_details.contract_type,
    background_check: resp.job_details.background_check.join(", "),
    link: url,
    content: jd,
    active: true,
    created: new Date(),
  } as IJob;
}

async function generateResumeV2(profile: IProfile, jd: string, url: string) {
  const resp = await getAIResponse(profile, jd);

  if (resp === null) return null;

  const html = generateResumeHTML(profile, resp);

  if (html === null) {
    return null;
  }

  const pdfBuffer = await convertHTMLtoPDF(html);
  const job = await getJobDetails(jd, url, resp);

  return { resume: pdfBuffer, job, html };
}

export default generateResumeV2;
