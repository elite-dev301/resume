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
- 12–14 concise tailored lines (use \\n between lines)
- Lead with years matching JD seniority; wrap keywords in <b></b>; no personal pronouns

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
For EACH company (reverse chronological):
- Align most recent role title with JD where truthful
- One flagship project per company; MINIMUM 14 bullets in responsibility
- Each bullet: unique action verb, 20+ words, 2–4 <b> keywords, one metric, active voice, ends with period
- technologies_used: 8–12 tools also present in skills

## certifications
3–5 vendor-specific certs relevant to the JD. No Scrum/PMP/ITIL.

## job_details
Extract from JD only — never invent.

## ats_coverage
Self-verify: required_matched, required_missed (must be empty for ATS-100), preferred_matched, must_match_phrases_used, estimated_ats_score (0–100).
If score < 95, revise before returning.

# OUTPUT RULES
- Strictly valid JSON matching the schema.
- HTML: only <b></b> tags. No markdown, hyperlinks, or bullet characters in strings.
- Empty fields: "" or [], never null.`;

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
