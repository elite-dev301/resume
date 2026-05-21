import OpenAI from 'openai';

const OPENAI_KEY = process.env.OPENAI_KEY as string;

if (!OPENAI_KEY) {
  throw new Error('Please define the OPENAI_KEY environment variable inside .env.local');
}

const openai = new OpenAI({ apiKey: OPENAI_KEY });

export type SkillCategory = {
  category: string;
  skills: string[];
};

export type AIResponse = {
  professional_summary: string;
  skills: SkillCategory[];
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
    remote: string;
    salary: string;
    location: string;
    contract_type: string;
    background_check: string[];
    standardized_job_title: string;
  };
  ats_coverage: {
    required_matched: string[];
    required_missed: string[];
    preferred_matched: string[];
    must_match_phrases_used: string[];
    estimated_ats_score: number;
  };
};

const RESUME_GENERATION_PROMPT = `You are ResumeGPT — a premier ATS-optimized resume writer for senior software engineers, data engineers, data scientists, and AI/ML engineers. You optimize for ATS parsers (Workday, Greenhouse, Lever, iCIMS, Taleo) and recruiters who skim in 8–12 seconds.

You will receive the candidate's real work history and a target job description. In ONE pass, analyze the JD and write a tailored resume as structured JSON.

# STEP 1 — ANALYZE THE JOB DESCRIPTION (inline)

From the JD, identify:
- Primary tech stack and tools
- Target industry and company focus
- REQUIRED qualifications (Required, Must have, Qualifications, Technical Experience, or first 30% of JD)
- PREFERRED qualifications (Preferred, Nice to have, Bonus, Optional)
- 5–12 must-match phrases (2–5 words) that MUST appear verbatim in bullets
- Domain and seniority signals

# STEP 2 — ATS KEYWORD RULES

1. REQUIRED coverage: 100% of required hard-skill keywords in skills AND bullets.
2. PREFERRED coverage: 60–80%.
3. Must-match phrases: each verbatim in at least one bullet.
4. High-frequency JD terms: in summary, skills, and 2+ bullets.
5. Bold ~80% of job-relevant tech using only <b></b> tags.
6. Chronological tech validity per job dates.

# STEP 3 — CONTENT RULES

## professional_summary
- 3-5 sentences total (~60-90 words, 4-6 lines maximum).
- Use plain prose with sentences separated by periods (NOT \n line breaks).
- Lead with the EXACT years_of_experience value provided in the user prompt — do not invent or estimate.
- Mention 2-3 high-frequency required keywords from the JD inventory.
- Mention domain experience if relevant (Healthcare, Fintech, Cloud, etc.).
- Close with one line on leadership/team scale/mentoring.
- Wrap every meaningful technical keyword in <b></b>.
- NO personal pronouns, NO filler phrases 


## skills (dynamic KEY SKILLS — tailored to THIS job description)
Return an array of 5–7 category objects. Each object:
- category: a JD-specific label (e.g. "AI/ML Modeling", "MLOps Tools", "Data Engineering Platforms", "Cloud & Infrastructure") — NOT generic labels like "Programming Languages"
- skills: 6–9 skills for that category; wrap ~80% of job-relevant skills in <b></b>

Rules:
- Category names and groupings MUST reflect the target role's stack (a data-engineering JD gets pipeline/warehouse categories; an ML JD gets modeling/deployment categories)
- 100% of required JD keywords distributed across all categories
- 60–80% of preferred keywords
- Every skill in bullets should also appear somewhere in this skills array

## work_experience

- Reverse chronological. Use candidate's REAL job title verbatim (background checks verify it).
- ONE flagship project per company.
- description: 2-3 sentences (40-70 words) — what it did, who used it, scale.
- technologies_used: 8-12 tools, all also in skills list.

# Bullets (per project)
- EXACTLY 6 bullets.
- 17-26 words per bullet.
- 2-4 <b>-wrapped keywords per bullet (never more than 4).
- One specific number per bullet (%, $, users, latency, team size).
- Unique action verb per bullet across the ENTIRE resume (18 unique verbs total).
- Banned verbs: "Worked on", "Responsible for", "Involved in", "Helped with", "Participated in".
- Active voice. Ends with a period. No semicolons.
- Structure: Action → Tech → Outcome.

# Chronological tech validity
- Tech's release year must be ≤ job's start year.
- No .NET 8 (2023) at a 2021 job. No React 18 (2022) at a 2020 job. No Kubernetes (2014) at a 2012 job.

## certifications
3-5 REAL, vendor-issued technical certs relevant to JD's primary tech stack.
- Format: "[Issuer] [Cert Name] ([Code])" — e.g., "Microsoft Certified: Azure Developer Associate (AZ-204)"
- Use only certs that actually exist. Reject invented certs (e.g., no "AWS Certified .NET 8 Specialist").
- Years: 2020 onwards, ≤ current year. Distribute years (not all in same year).
- Allowed issuers: AWS, Microsoft, Google Cloud, HashiCorp, Kubernetes (CNCF: CKA/CKAD/CKS), Red Hat, Cisco, Oracle, Databricks.
- BANNED: Scrum (CSM/PSM), PMP, ITIL, Six Sigma, Product Owner, vendor-neutral "general IT" certs.
- If JD has no clear cert match, output 3 (not 5). Quality over count.

## job_details
Extract from JD only — never invent.

# ats_coverage (self-check)
After writing the resume, fill these by checking your output against the JD inventory:
- required_matched: required_keywords that appear anywhere in the resume.
- required_missed: required_keywords that don't appear (target: empty).
- preferred_matched: preferred_keywords used (target: 75-90%).
- must_match_phrases_used: phrases from must_match_phrases that appear verbatim in bullets (target: 100%).
- estimated_ats_score: 0-100 integer = round(
    50 * (required_matched / total_required)
  + 30 * (must_match_phrases_used / total_must_match)
  + 20 * (preferred_matched / total_preferred)
  )
Target 92-98. Below 90 = under-tailored, may be auto-rejected by modern ATS.
Return your honest score; do not self-revise.

# OUTPUT RULES

- Strictly valid JSON matching the schema. No trailing commas, no comments.
- HTML inside string fields: ONLY <b>...</b> tags. No <strong>, <em>, <i>, <a>, <span>, <br>.
- No markdown syntax anywhere in strings: no **, __, ##, backticks, [text](url), or - leading dashes.
- No bullet characters in strings: no •, ▸, ►, –leading, *leading.
- Use only straight ASCII quotes: " and '. No curly quotes " " ' '.
- En-dash – is allowed only in date ranges ("Mar 2021 – Present"). Use hyphen - elsewhere.
- No non-breaking spaces, no zero-width characters, no trailing whitespace.
- Empty fields: "" or [], never null or undefined.
- All bullet array entries are complete sentences ending with a period.`

export async function GetAIStructuredResponse(prompt: string): Promise<AIResponse> {
  const response = await openai.responses.create({
    model: "gpt-5.2",
    input: [
      { role: "system", content: RESUME_GENERATION_PROMPT },
      { role: "user", content: prompt }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generate_tailored_resume",
        schema: {
          type: "object",
          properties: {
            professional_summary: { type: "string" },
            skills: {
              type: "array",
              description: "5-7 JD-tailored skill categories, each with a label and 6-9 skills",
              items: {
                type: "object",
                properties: {
                  category: { type: "string", description: "JD-specific category label" },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "6-9 skills for this category"
                  }
                },
                required: ["category", "skills"],
                additionalProperties: false
              }
            },
            work_experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  period: { type: "string" },
                  role: { type: "string" },
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        project_name: { type: "string" },
                        description: { type: "string" },
                        company: { type: "string" },
                        industry: { type: "string" },
                        technologies_used: { type: "array", items: { type: "string" } },
                        responsibility: { type: "array", items: { type: "string" } }
                      },
                      required: ["project_name", "description", "company", "industry", "technologies_used", "responsibility"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["company_name", "period", "role", "projects"],
                additionalProperties: false
              }
            },
            certifications: { type: "array", items: { type: "string" } },
            job_details: {
              type: "object",
              properties: {
                job_title: { type: "string" },
                company_name: { type: "string" },
                remote: { type: "string" },
                salary: { type: "string" },
                location: { type: "string" },
                contract_type: { type: "string" },
                background_check: { type: "array", items: { type: "string" } },
                standardized_job_title: { type: "string" }
              },
              required: ["job_title", "company_name", "remote", "salary", "location", "contract_type", "background_check", "standardized_job_title"],
              additionalProperties: false
            },
            ats_coverage: {
              type: "object",
              properties: {
                required_matched: { type: "array", items: { type: "string" } },
                required_missed: { type: "array", items: { type: "string" } },
                preferred_matched: { type: "array", items: { type: "string" } },
                must_match_phrases_used: { type: "array", items: { type: "string" } },
                estimated_ats_score: { type: "number" }
              },
              required: ["required_matched", "required_missed", "preferred_matched", "must_match_phrases_used", "estimated_ats_score"],
              additionalProperties: false
            }
          },
          required: ["professional_summary", "skills", "work_experience", "certifications", "job_details", "ats_coverage"],
          additionalProperties: false
        },
        strict: true
      }
    },
    temperature: 0.35,
    max_output_tokens: 12000
  });

  const result = JSON.parse(response.output_text) as AIResponse;

  if (result.ats_coverage.estimated_ats_score < 95 && result.ats_coverage.required_missed.length > 0) {
    console.warn(
      `[ATS] Score ${result.ats_coverage.estimated_ats_score}; missing required keywords:`,
      result.ats_coverage.required_missed
    );
  }

  return result;
}
