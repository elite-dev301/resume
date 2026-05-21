import OpenAI from 'openai';

const OPENAI_KEY = process.env.OPENAI_KEY as string;

if (!OPENAI_KEY) {
  throw new Error('Please define the OPENAI_KEY environment variable inside .env.local');
}

const openai = new OpenAI({ apiKey: OPENAI_KEY });

// ============================================================
// STEP 1: JD KEYWORD EXTRACTION
// ============================================================

export type JDAnalysis = {
  required_keywords: { keyword: string; frequency: number; category: string }[];
  preferred_keywords: { keyword: string; frequency: number; category: string }[];
  domain_keywords: string[];           // industry/domain like "Healthcare", "Fintech"
  seniority_signals: string[];          // "Senior", "Lead", "Staff", "15+ years"
  hard_skills_count: number;
  must_match_phrases: string[];         // exact strings that MUST appear verbatim
};

const JD_ANALYSIS_PROMPT = `You are an ATS keyword extraction expert. You analyze job descriptions the same way Workday, Greenhouse, Lever, and iCIMS do: by tokenizing into matchable keywords and weighting by frequency and section context.

Your output is a structured keyword inventory used to score resume matches.

# EXTRACTION RULES

1. EXACT-STRING PRESERVATION
Preserve casing, punctuation, and version numbers exactly as written in the JD.
- "Node.js" stays "Node.js" (not "NodeJS")
- ".NET 8" stays ".NET 8" (not ".net 8" or "dotnet 8")
- "CI/CD" stays "CI/CD" (not "CICD" or "continuous integration")
- "AWS Bedrock" stays "AWS Bedrock" (not "Amazon Bedrock")

2. REQUIRED vs PREFERRED CLASSIFICATION
- REQUIRED: keywords from sections labeled "Required", "Must have", "Qualifications", "Technical Experience", or in the JD's first 30% of body
- PREFERRED: keywords from "Preferred", "Nice to have", "Bonus", or "Optional" sections
- If unclear, default to REQUIRED

3. FREQUENCY COUNT
Count how many times each keyword literally appears in the JD. Higher frequency = higher ATS weight.

4. CATEGORIZATION
Assign each keyword to one of: 'language', 'framework', 'tool', 'platform', 'cloud', 'database', 'devops', 'ai_ml', 'methodology', 'domain', 'soft_skill'.

5. MUST-MATCH PHRASES
Identify 5-12 short phrases (2-5 words) that are clearly core to the role and MUST appear verbatim in the resume bullets to score 100%. Examples: "Infrastructure-as-Code", "incident remediation workflows", "CI/CD pipelines", "security-first design".

6. DOMAIN & SENIORITY
Extract industry/domain hints ("Healthcare", "Fintech", "Cloud") and seniority signals ("Senior", "10+ years", "Tech Lead").

Return STRICT JSON.`;

export async function ExtractJDKeywords(jobDescription: string): Promise<JDAnalysis> {
  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      { role: "system", content: JD_ANALYSIS_PROMPT },
      { role: "user", content: `Job Description:\n\n${jobDescription}` }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "extract_jd_keywords",
        schema: {
          type: "object",
          properties: {
            required_keywords: {
              type: "array",
              description: "Keywords from required/qualifications/technical-experience sections. Sorted by frequency descending.",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string", description: "Exact casing/punctuation from JD" },
                  frequency: { type: "number", description: "Literal occurrence count in JD" },
                  category: { type: "string", description: "language|framework|tool|platform|cloud|database|devops|ai_ml|methodology|domain|soft_skill" }
                },
                required: ["keyword", "frequency", "category"],
                additionalProperties: false
              }
            },
            preferred_keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  frequency: { type: "number" },
                  category: { type: "string" }
                },
                required: ["keyword", "frequency", "category"],
                additionalProperties: false
              }
            },
            domain_keywords: {
              type: "array",
              items: { type: "string" },
              description: "Industry/domain (Healthcare, Fintech, etc.)"
            },
            seniority_signals: {
              type: "array",
              items: { type: "string" },
              description: "Seniority indicators (Senior, 10+ years, Tech Lead)"
            },
            hard_skills_count: {
              type: "number",
              description: "Total unique hard-skill keywords across required+preferred"
            },
            must_match_phrases: {
              type: "array",
              items: { type: "string" },
              description: "5-12 short phrases that MUST appear verbatim in bullets"
            }
          },
          required: [
            "required_keywords",
            "preferred_keywords",
            "domain_keywords",
            "seniority_signals",
            "hard_skills_count",
            "must_match_phrases"
          ],
          additionalProperties: false
        },
        strict: true
      }
    },
    temperature: 0.1, // very low — extraction must be deterministic
    max_output_tokens: 2048
  });

  return JSON.parse(response.output_text) as JDAnalysis;
}

// ============================================================
// STEP 2: RESUME GENERATION WITH KEYWORD INVENTORY
// ============================================================

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

const RESUME_GENERATION_PROMPT = `You are an elite resume writer optimizing for two readers: (1) ATS keyword-matching engines (Workday, Greenhouse, Lever, iCIMS, Taleo) and (2) senior engineering recruiters who skim resumes in 8-12 seconds.

You will receive:
- The candidate's real work history (companies, roles, periods, real project anchors)
- A target job description (raw text)
- A pre-extracted JD KEYWORD INVENTORY (required keywords, preferred keywords, must-match phrases)

Your job: produce a resume that hits 95-100% ATS keyword coverage AND reads as a real senior engineer's resume.

# THE ATS-100 KEYWORD RULES

1. REQUIRED-KEYWORD COVERAGE TARGET: 100%
Every keyword in the inventory's required_keywords list MUST appear in the resume — either in skills OR in bullets, ideally both. Missing a required keyword drops the ATS score below 90%.

2. MUST-MATCH PHRASES IN BULLETS
Every phrase in must_match_phrases MUST appear verbatim in at least one bullet (not just skills section). ATS systems weight phrases-in-context higher than skills-list mentions.

3. PREFERRED-KEYWORD COVERAGE TARGET: 60-80%
Cover 60-80% of preferred_keywords. Covering 100% looks like keyword stuffing.

4. SKILLS SECTION DUAL ROLE
Skills section serves two purposes:
- ATS direct keyword match
- Recruiter quick scan
Required keywords MUST appear in BOTH the skills section AND in at least one bullet point. Skills mentioned only in skills section get ~50% ATS weight.

5. EXACT-STRING MATCHING
Use the inventory's exact casing/punctuation. If inventory says "Node.js", do not write "NodeJS". If inventory says "AWS Bedrock", do not write "Amazon Bedrock". If inventory says "CI/CD", do not write "continuous integration".

6. KEYWORD FREQUENCY WEIGHTING
Higher-frequency keywords (frequency >= 2 in the JD) should appear in:
- Professional Summary (mention 2-3 of these)
- At least 2 different bullets across the work experience
- Skills section

7. SYNONYM PAIRING
For each ambiguous tech, include both the JD's exact form AND the common variant somewhere on the resume. Example: if JD says "CI/CD", include "CI/CD" in skills, but you can use "CI/CD pipelines" in bullets. NEVER substitute "continuous integration" for "CI/CD".

8. CHRONOLOGICAL TECH VALIDITY
Match technologies to dates. AWS Bedrock (released 2023) cannot appear at jobs ending in 2020. Kubernetes (released 2014) cannot appear at jobs from 2012. Validator rule: tech first-stable-release year must be <= job start year.

# BULLET WRITING RULES (UNCHANGED FROM GOOD PRACTICE)

- 18-26 words per bullet
- Start with strong action verb (Designed, Built, Led, Architected, Shipped, Migrated, Cut, Scaled, Owned, Drove, Engineered, Automated)
- 2-4 <b>-wrapped technical keywords per bullet — never more than 4
- At least one specific number per bullet (%, $, user count, latency, team size)
- No two bullets start with the same verb (across all bullets in the resume)
- No filler ("responsible for", "worked on", "involved in", "tasked with", "helped with")
- Active voice only
- Each bullet ends with a period

# OUTPUT STRUCTURE

## professional_summary
- 3-5 sentences (60-90 words total)
- Lead with years of experience matching the JD's seniority requirement
- Name 2-3 high-frequency required keywords from the inventory
- Mention domain experience if relevant (Healthcare, Fintech, Cloud)
- Close with leadership/team scale
- Wrap every keyword in <b></b>
- NO personal pronouns

## skills (categorized)
Total 40-65 skills.
- programming_languages: 5-8
- frameworks_libraries: 8-15
- tools_platforms: 8-15
- databases: 4-8
- devops_ci_cd: 4-10
- other_skills: 4-10
Rule: 100% of required_keywords MUST appear distributed across these categories. 60-80% of preferred_keywords should appear.
category_names: 6 display names matching the 6 categories in order.

## work_experience
For each company the candidate provides:
- One detailed flagship project (not 5)
- project_name: 3-6 words
- description: 2-3 sentences, 40-70 words
- industry: 1-3 words
- technologies_used: 8-12 tools, all also in skills list
- responsibility: EXACTLY 6 bullets per project

## certifications
3-5 vendor-specific technical certifications relevant to the JD's stack. Only real cert codes from AWS, Azure, GCP, Kubernetes, HashiCorp, Microsoft, Red Hat, Cisco. No Scrum/PMP/ITIL.

## job_details
Extract from JD only — never invent.

## ats_coverage (NEW — VERIFICATION STEP)
After writing the resume, verify your own work:
- required_matched: list every required_keyword that appears in your resume
- required_missed: list any required_keyword you couldn't fit (must be empty for ATS-100)
- preferred_matched: list preferred_keywords you included
- must_match_phrases_used: list each must_match_phrase that appears verbatim in your bullets
- estimated_ats_score: 0-100 (formula: 60*(req_matched/req_total) + 20*(phrases_used/phrases_total) + 20*(pref_matched/pref_total))

If estimated_ats_score < 95, GO BACK and add the missing keywords/phrases before returning.

# OUTPUT RULES

- Return strictly valid JSON.
- All HTML must use only <b></b> tags.
- No markdown, no backticks, no bullet characters in strings.
- Empty fields use "" or [], never null.`;

export async function GetAIStructuredResponse(prompt: string): Promise<AIResponse> {
  // STEP 1: Extract JD keyword inventory (one fast deterministic call)
  // The prompt is expected to include "Job Description: ..." and "My work experience: ..."
  const jdSection = extractJDFromPrompt(prompt);
  const inventory = await ExtractJDKeywords(jdSection);

  // STEP 2: Generate resume with the inventory in context
  const augmentedPrompt = `
${prompt}

# JD KEYWORD INVENTORY (pre-extracted for ATS scoring)

Required Keywords (must achieve 100% coverage):
${JSON.stringify(inventory.required_keywords, null, 2)}

Preferred Keywords (60-80% coverage target):
${JSON.stringify(inventory.preferred_keywords, null, 2)}

Must-Match Phrases (each MUST appear verbatim in at least one bullet):
${JSON.stringify(inventory.must_match_phrases, null, 2)}

Domain: ${inventory.domain_keywords.join(", ")}
Seniority Signals: ${inventory.seniority_signals.join(", ")}
`.trim();

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      { role: "system", content: RESUME_GENERATION_PROMPT },
      { role: "user", content: augmentedPrompt }
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
              type: "object",
              properties: {
                programming_languages: { type: "array", items: { type: "string" } },
                frameworks_libraries: { type: "array", items: { type: "string" } },
                tools_platforms: { type: "array", items: { type: "string" } },
                databases: { type: "array", items: { type: "string" } },
                devops_ci_cd: { type: "array", items: { type: "string" } },
                other_skills: { type: "array", items: { type: "string" } },
                category_names: { type: "array", items: { type: "string" } }
              },
              required: [
                "programming_languages","frameworks_libraries","tools_platforms",
                "databases","devops_ci_cd","other_skills","category_names"
              ],
              additionalProperties: false
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
                      required: ["project_name","description","company","industry","technologies_used","responsibility"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["company_name","period","role","projects"],
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
              required: ["job_title","company_name","remote","salary","location","contract_type","background_check","standardized_job_title"],
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
              required: ["required_matched","required_missed","preferred_matched","must_match_phrases_used","estimated_ats_score"],
              additionalProperties: false
            }
          },
          required: ["professional_summary","skills","work_experience","certifications","job_details","ats_coverage"],
          additionalProperties: false
        },
        strict: true
      }
    },
    temperature: 0.35,
    max_output_tokens: 6000
  });

  const result = JSON.parse(response.output_text) as AIResponse;

  // STEP 3 (optional but recommended): retry if ATS score below 95
  if (result.ats_coverage.estimated_ats_score < 95 && result.ats_coverage.required_missed.length > 0) {
    console.warn(
      `[ATS] Score ${result.ats_coverage.estimated_ats_score}; missing required keywords:`,
      result.ats_coverage.required_missed
    );
    // Optionally call again with explicit instruction to add missing keywords
  }

  return result;
}

// Helper: extract "Job Description: ..." block from the user's prompt
function extractJDFromPrompt(prompt: string): string {
  const jdMatch = prompt.match(/(?:Job Description|Target Job|JD)[:\s]*([\s\S]+?)(?=\n\n[A-Z]|$)/i);
  return jdMatch ? jdMatch[1].trim() : prompt;
}