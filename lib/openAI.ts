import OpenAI from 'openai';

const OPENAI_KEY = process.env.OPENAI_KEY as string;

if (!OPENAI_KEY) {
  throw new Error('Please define the OPENAI_KEY environment variable inside .env.local');
}

const openai = new OpenAI({ apiKey: OPENAI_KEY });

async function GetAIResponse(prompt: string) {

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a resume-generation system.
I will provide:
My work experience: Company name, job title, employment period, and additional info
A job description (target job)
Based on these, generate the following:

1. Top Technologies
Identify and extract the top 5 most important technical skills/tools/technologies from the job description.
Use these top 5 skills consistently throughout the entire resume, especially in every role description.

2. Professional Summary
Write a professional summary focused on:
- My 10+ years of experience
- Team collaboration, delivery excellence, adaptability
- Match all focus areas directly to the provided job description
Do not include personal identifiers or names.
Bold important keywords using <b> tags.

3. Skills
Generate over 100 total technical skills extracted ONLY from the job description.
Organize them into the categories below.
List the skills in the same order they appear in the job description.
- Programming Languages (at least 10)
- Frameworks & Libraries (at least 15)
- Tools & Platforms (at least 25)
- Databases (at least 10)
- DevOps & CI/CD (at least 10)
- Other Skills (at least ${Math.floor(Math.random() * 20) + 5})

4. Certifications
List ${Math.floor(Math.random() * 3) + 3} technical certifications based on the job description.
Only include vendor-specific or engineering-focused examples (e.g., AWS, Kubernetes, GCP, Microsoft).
Exclude product, Scrum, or non-engineering certifications.

5. Work Experience
For each company I provide, format as below:

[Company Name]
Period [Start Date-End Date]
Role [Role Title]
Job Descriptions
- Start with one sentence that accurately describes what I did at that job (based on my real history).
- Then generate at least 20 bullet points using the following rules:
Each bullet must be long and detailed (25-35+ words).
Every single technical keyword (including programming languages, libraries, cloud services, DevOps tools, testing frameworks, infrastructure tools, databases, frontend/back-end tech, job-relevant methodologies, and APIs) must be wrapped in <b> tags — no exceptions.
Each sentence must include at least 3+ bolded technical keywords.
Reuse the top 5 most important job description skills in every sentence, where contextually appropriate.
Sentences should use complex structure, like conditional logic, multiple technical actions, or architecture outcomes.

6. Job Details
Extract from the job description:
- Job Title
- Company Name
- Remote (Output "Remote-[Location if mentioned]" or a physical location if not remote)
- Salary
- Contract Type (e.g., Full-time, Contract)
- Background Check (Only list if explicitly mentioned: Background Check, Drug Test, Fingerprint, or Security Clearance)
- Standardized Job Title (Generate standardized job title)

          Provide the output in the following format strictly:

### Top 5 main tech skills from the job description
List of the main tech skills by joint ","
          
          ### Professional Summary
          [Summary text here] (highlight keywords with <b> tag)

          ### Skills
          **Category** [List of skills by category by joint ,] like "**Languages** JavaScript,TypeScript" (don't highlight keywords)

          ### Certifications
          List of certifications by joint , like "Certification1,Certification2"
          
          ### Work Experience
          **[Company Name]**
          **Period** [Period]
          **Role** [Role Title]
          **Job Descriptions** [List of job descriptions by -]
          
          ### Job Details
          [Job Title]
          [Company Name]
          [Remote]
          [Salary]
          [Contract Type]
          [Background Check]
          [Standardized Job Title]`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 4096
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("Error generating resume components: ", error);
    return null;
  }
}

export type AIResponse = {
  professional_summary: string;
  skills: {
    programming_languages: string[];
    frameworks_libraries: string[];
    tools_platforms: string[];
    databases: string[];
    devops_ci_cd: string[];
    other_skills: string[];
    category_names: string[];
  };
  work_experience: {
    company_name: string;
    period: string;
    role: string;
    projects: {
      project_name: string;
      description: string;
      company: string;
      industry: string;
      technologies_used: string[];
      responsibility: string[];
    }[];
  }[];
  certifications: string[];
  job_details: {
    job_title: string;
    company_name: string;
    remote: string; // "yes" or "no"
    salary: string; // optional
    location: string;
    contract_type: string; // optional
    background_check: string[]; // optional
    standardized_job_title: string; // optional
  };
}

export async function GetAIStructuredResponse(prompt: string) {
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: `
          I will provide you with my work experience including company name, job title, employment period, additional info, and the target job description.
          Based on the work experience and the target job description, generate the following:
          
          1. **Professional Summary**: A professional summary that highlights the overall experience, personality, and team collaboration—without including any personal identifiers or names. Match the industry and focus areas directly to the job description provided. I have over 10 years of experience.
          2. **Skills**: Create a categorized list with more than 100 technical skills from my work experience and the target job description.
          3. **Certifications**: Generate certifications specifically relevant for software engineers based on the target job description provided. Focus only on technical certifications (exclude those for Scrum Master, Product Owner, or other non-engineering roles). Include vendor-specific certifications (e.g., AWS, Microsoft, Google Cloud, Kubernetes, etc.) that match the job description requirements.
          4. **Work Experience**: Detailed descriptions of the candidate's work experience.
          
          ### Important Notes:
          The Skills list must include all technologies, tools, frameworks, and methodologies mentioned in the Target Job Description. Do not skip any. Blend these with my real experience to generate a complete and realistic list.
          - Use common and simple names (e.g., use <b>Angular</b> instead of <b>Angular (v12+)</b>, <b>Spring Boot</b> instead of <b>Spring Boot 3.1</b>, etc.).
          - Do not include version numbers, extra descriptors, or overly formal terms unless absolutely necessary.
          
          Please generate the Skills list first, and then use that list to create all project technologies.

          For every project: (Generate 4 projects for each company and my 1 real project)
          - Generate 5 responsibilities.
          - Use only technologies/tools from the generated Skills list when generating projects.
          - However, prioritize and emphasize technologies that were originally mentioned in the Target Job Description when selecting which skills to use. These should appear more frequently across project technologies and responsibilities.
          - Ensure all tools/technologies in the "technologies_used" field come from the Skills list, but the selection should strongly reflect the job description focus areas.
          - Each project must include at least 10 technologies/tools from the Skills list, and they must be varied and relevant.
          - Generate a long, detailed role descriptions. Include multiple technologies, tools, frameworks, achievements, and responsibilities in each sentence. Use professional language and emphasize skills applied, problems solved, and business outcomes achieved. Make each sentence rich with keywords and longer than 25 words.
          ###
        `,
      },
      {
        role: "user",
        content: prompt
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generate_candidate_profile",
        schema: {
          type: "object",
          properties: {
            professional_summary: {
              type: "string",
              description: `Highlight keywords by <b> tag.`,
            },
            skills: {
              type: "object",
              description:
                "Please ensure that you have all of the skills from the target job description to the skills list",
              properties: {
                programming_languages: {
                  type: "array",
                  description: "more than 10 skills",
                  items: { type: "string" },
                },
                frameworks_libraries: {
                  type: "array",
                  description: "more than 15 skills",
                  items: { type: "string" },
                },
                tools_platforms: {
                  type: "array",
                  description: "more than 25 skills",
                  items: { type: "string" },
                },
                databases: {
                  type: "array",
                  description: "more than 10 skills",
                  items: { type: "string" },
                },
                devops_ci_cd: {
                  type: "array",
                  description: "more than 10 skills",
                  items: { type: "string" },
                },
                other_skills: {
                  type: "array",
                  description: `more than ${
                    Math.floor(Math.random() * 20) + 5
                  } skills`,
                  items: { type: "string" },
                },
                category_names: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Change those category names [programming_languages, frameworks_libraries, tools_platforms, databases, devops_ci_cd, other_skills] to same meaning other names.",
                },
              },
              required: [
                "programming_languages",
                "frameworks_libraries",
                "tools_platforms",
                "databases",
                "devops_ci_cd",
                "other_skills",
                "category_names",
              ],
              additionalProperties: false,
            },
            work_experience: {
              type: "array",
              description: `Tailored my work experience based on the target job description.`,
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  period: { type: "string" },
                  role: { type: "string" },
                  projects: {
                    type: "array",
                    description: `I gave you one real project on my work experience. Please generate 4 more projects for each company based on the target job description. So total 5 projects.`,
                    items: {
                      type: "object",
                      description: `For each item in technologies_used, make sure it is mentioned and highlighted with <b> at least once across the items in responsibility. Do not skip any technology or tool.`,
                      properties: {
                        project_name: { type: "string" },
                        description: {
                          type: "string",
                        },
                        company: { type: "string" },
                        industry: { type: "string" },
                        technologies_used: {
                          type: "array",
                          items: { type: "string" },
                          description: `Generate more than 10 technologies/tools used in the project.`,
                        },
                        responsibility: {
                          type: "array",
                          description: `Generate 5 responsibilities for this project.`,
                          items: { type: "string" },
                        },
                      },
                      required: [
                        "project_name",
                        "description",
                        "responsibility",
                        "company",
                        "industry",
                        "technologies_used",
                      ],
                      additionalProperties: false,
                    },
                  }
                },
                required: ["company_name", "period", "projects", "role"],
                additionalProperties: false,
              },
            },            
            certifications: {
              type: "array",
              description: `Generate ${
                Math.floor(Math.random() * 3) + 3
              } certifications`,
              items: { type: "string" },
            },
            job_details: {
              type: "object",
              properties: {
                job_title: { type: "string" },
                company_name: { type: "string" },
                remote: { type: "string" },
                salary: { type: "string" },
                contract_type: { type: "string" },
                location: { type: "string" },
                background_check: {
                  type: "array",
                  items: { type: "string" },
                },
                standardized_job_title: { type: "string" }
              },
              required: [
                "job_title",
                "company_name",
                "remote",
                "salary",
                "location",
                "contract_type",
                "background_check",
                "standardized_job_title"
              ],
              additionalProperties: false,
              description: `Generate job details based on the target job description. Include the following fields:
                - job_title
                - company_name
                - remote (yes/no)
                - salary (if available)
                - location (if available)
                - contract_type (full-time, part-time, etc.)
                - background_check (list of checks required)
                - standardized_job_title`,
            },
          },
          required: [
            "professional_summary",
            "skills",
            "certifications",
            "work_experience",
            "job_details",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text) as AIResponse;
}

export default GetAIResponse;