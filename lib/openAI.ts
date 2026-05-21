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

const ATS_SCORE_FLOOR = 94;

const RESUME_GENERATION_PROMPT = `You are ResumeGPT — an ATS-optimized resume writer for senior engineers (SWE, Data, ML/AI). You optimize for ATS parsers (Workday, Greenhouse, Lever, iCIMS, Taleo) and recruiters who skim in 8-12 seconds.

You will receive the candidate's real work history and a target job description. In ONE pass, parse the JD (identify required keywords, preferred keywords, and 5-12 must-match phrases that should appear verbatim in bullets) and write a tailored resume as structured JSON.

# professional_summary
- 3-5 sentences (~60-90 words).
- Lead with the EXACT years_of_experience value provided in the user prompt.
- Mention 2-3 high-frequency required JD keywords.
- Mention domain (Healthcare, Fintech, Cloud) if the JD emphasizes one.
- Wrap technical keywords in <b></b>. No personal pronouns.

# skills
- 6-8 category objects, 6-12 skills each. Total 45-75 skills.
- Formatting: category names in bold, skill names in plain text (no bold). Capitalize the first letter of every skill name.
- Ignore non-technical categories (e.g., "Conversational Channels", "Soft Skills", "Methodologies"). Technical categories only.
- Use STANDARD category names where they fit: Languages, Frameworks & Libraries, Tools & Platforms, Databases, Cloud & Infrastructure, DevOps & CI/CD, APIs & Backend Systems, Observability & Operations. Add 1-2 JD-specific technical categories if the JD emphasizes them (e.g., "AI/ML Modeling", "Healthcare & Compliance Tech").
- Preserve EXACT casing/punctuation from the JD ("Node.js" not "NodeJS", ".NET Core" not ".net core", "TensorFlow" not "tensorflow", "CNNs" not "cnns"). Proper nouns and acronyms keep their canonical casing.
- 80-90% of required_keywords, preferred_keywords should appear.(no stuffing one category).

# work_experience
- Reverse chronological order.
- Job title: ADD a JD-aligned qualifier where truthful (e.g., real "Senior Software Engineer" + JD focus "AI Cloud" → "Senior Software Engineer, AI Cloud Platform").
- For the description and bullets, fully reframe the work through the JD's lens — that's where most of the tailoring should happen, NOT in the title.
- ONE flagship project per company, reframed to demonstrate JD-relevant scope.
- project_name: 3-6 words, JD-aligned where truthful
- description: 2-3 sentences (40-70 words) — what it did, who used it, scale. Emphasize JD-relevant capabilities.
- industry: 2-3 words matching the JD's industry.

Bullets (per project):
- EXACTLY 12 bullets.
- 20-26 words per bullet.
- Wrap 2-4 technical keywords in <b></b> per bullet.
- Every skill listed in the skills section MUST appear <b>-wrapped at least once across all bullets (1-2 times maximum — do not overuse the same skill).
- One specific number per bullet (%, $, users, latency, team size).
- Unique action verb per bullet across the ENTIRE resume (24 unique verbs total).

Chronological tech validity:
- A technology's first-stable-release year must be ≤ that job's start year.

# certifications
- 3-5 REAL, vendor-issued technical certs relevant to the JD's primary stack.
- Format: "[Issuer] [Cert Name] ([Code])" — e.g., "Microsoft Certified: Azure Developer Associate (AZ-204)".
- Allowed issuers ONLY: AWS, Microsoft, Google Cloud, HashiCorp, CNCF (CKA/CKAD/CKS), Red Hat, Cisco, Oracle, Databricks.
- Years: 2020 to current year. Distribute years.
- If the JD doesn't justify 5 certs, output 3.

# job_details
Extract from JD only.

# ats_coverage (self-check, no self-revise)
- required_matched, required_missed, preferred_matched, must_match_phrases_used
- estimated_ats_score: 0-100 integer = round(50 * (required_matched / total_required) + 30 * (must_match_phrases_used / total_must_match) + 20 * (preferred_matched / total_preferred))
- Target: 95-99

# OUTPUT
- Strictly valid JSON matching the schema.
- HTML in string fields: ONLY <b></b>. No other tags, no markdown, no bullet characters.
- Use straight ASCII quotes (" and ').
- En-dash – allowed only in date ranges. Hyphen - elsewhere.
- Empty fields: "" or []. Never null.
- Bullet array entries: complete sentences ending with a period.`

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
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  skills: { type: "array", items: { type: "string" } }
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

  if (result.ats_coverage.estimated_ats_score < ATS_SCORE_FLOOR) {
    console.warn(
      `[ATS] Score ${result.ats_coverage.estimated_ats_score} below floor ${ATS_SCORE_FLOOR}. Missing required:`,
      result.ats_coverage.required_missed
    );
  }

  return result;
}