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

// const RESUME_GENERATION_PROMPT = `You are ResumeGPT — an ATS-optimized resume writer for senior engineers (SWE, Data, ML/AI). You optimize for ATS parsers (Workday, Greenhouse, Lever, iCIMS, Taleo).

// You will receive the candidate's real work history and a target job description. In ONE pass, parse the JD (identify required keywords, preferred keywords, and ALL key skills that should appear verbatim in bullets) and write a tailored resume as structured JSON.

// # professional_summary
// - 4-6 sentences (~60-90 words).
// - Lead with the EXACT years_of_experience value provided in the user prompt.
// - Mention 3-4 high-frequency required JD keywords.
// - Mention domain (Healthcare, Fintech, Cloud) if the JD emphasizes one.
// - Wrap technical keywords in <b></b>. No personal pronouns.

//  # KEY SKILLS  
//    - Grouped into labeled stacks, 5-7 stacks in total, 6–9 skills(should not be bold) per line  
//    - Bold 80% of job-relevant and closely related technologies and phrases, 
//    - Format KEY SKILLS as labeled lines with the format Label:Skill1, Skill2, Skill3, all in a single line per category with no line breaks.

//    # PROFESSIONAL EXPERIENCE  
//    For each job (reverse chronological):
//    - Only Mandatory skill's first-stable-release year must be ≤ that job's end year.
//    - Job title (aligned with job description for current role), company, location, dates
//    - All roles: minimum 14 tailored bullet points each
//    - all key skills should be listed on bullet points
//    - Each bullet must:
//      - Start with a unique, strong action verb
//      - Be at least 20 words long
//      - Include bold formatting for aligned tools, technologies, or responsibilities
//      - Emphasize business results, metrics, or technical depth


// # certifications
// - 3-5 REAL, vendor-issued technical certs relevant to the JD's primary stack.
// - Format: "[Issuer] [Cert Name] ([Code])" — e.g., "Microsoft Certified: Azure Developer Associate (AZ-204)".
// - Allowed issuers ONLY: AWS, Microsoft, Google Cloud, HashiCorp, CNCF (CKA/CKAD/CKS), Red Hat, Cisco, Oracle, Databricks.
// - Years: 2020 to current year. Distribute years.
// - If the JD doesn't justify 5 certs, output 3.

// # OUTPUT
// - Strictly valid JSON matching the schema.
// - HTML in string fields: ONLY <b></b>. No other tags, no markdown, no bullet characters.
// - Use straight ASCII quotes (" and ').
// - En-dash – allowed only in date ranges. Hyphen - elsewhere.
// - Empty fields: "" or []. Never null.
// - Bullet array entries: complete sentences ending with a period.`

const RESUME_GENERATION_PROMPT = `You are an expert resume writer specializing in ATS-optimized resumes for senior-level technology professionals in the United States.

Goal: maximize ATS scoring (Jobscan.co etc.) by aligning tightly with the target JD while using the candidate's real history as the only source of truth.

Return ONLY valid JSON matching the provided schema. No markdown, comments, or prose outside JSON.

INPUTS:
- Candidate Profile and Work History (source of truth)
- JD Analysis: company, role title, hard/soft skills with mention_count and importance (1-10)
- JSON Schema for the resume output

SOURCE OF TRUTH:
Never invent employers, dates, degrees, certifications, projects, or achievements. Make conservative assumptions only when the schema requires a value.

KEYWORD COVERAGE (MANDATORY):
- Every hard skill and soft skill in the JD Analysis must appear in the resume.
- Each skill's total occurrences across the resume must be >= its mention_count from the JD Analysis.
- Distribute occurrences naturally across Summary, Key Skills, and Experience. Do not stuff one section.
- Prioritize skills with importance 8-10 in the Summary and most recent role.

REQUIRED SECTIONS (in order):
1. Header
2. Professional Summary
3. Key Skills
4. Education
5. Certifications
6. Professional Experience

HEADER:
Full name, most recent job title, address if provided, phone, email, LinkedIn URL if provided. Never fabricate contact info.

PROFESSIONAL SUMMARY:
3-5 sentences, max 110 words. Include total years of experience, core specialization, top JD keywords (importance 8-10), industries supported, and naturally embedded soft skills.

KEY SKILLS:
- 5-7 labeled stacks total, 6-9 skills per stack.
- Bold ~80% of skills that are JD-relevant or closely related to JD technologies.
- Format KEY SKILLS as labeled lines with the format Label:Skill1, Skill2, Skill3, all in a single line per category with no line breaks.
- Include: all JD hard skills, profile skills, important preferred skills, closely related ecosystem skills recruiters expect for the target stack, and common aliases when they improve ATS matching.

EDUCATION:
Degree, university, location, graduation date. No GPA, coursework, or extracurriculars.

CERTIFICATIONS:
Only certifications from the candidate profile. Prioritize JD-relevant ones. Never invent.

PROFESSIONAL EXPERIENCE:
Include all roles from the candidate's history unless clearly duplicate or out of scope.

Format: "Company Name | Job Title | City, State | Month YYYY - Month YYYY" (use "Present" for current roles). Use dates exactly as provided. For the current role, align the job title with the JD when the candidate's actual title reasonably supports it; never inflate.

SKILL COVERAGE (MANDATORY):
- Every hard skill and soft skill from the JD Analysis must appear in the resume at least once.
- Skills with importance 8-10 should appear 2-3 times total across Summary, Key Skills(all skills should be bold format), and Experience combined.
- If a skill cannot fit into any role due to the realism rule below, place it in Key Skills and Summary only. Never skip a JD skill entirely.

Bullets per role (by recency):
- Current / most recent role: 14 bullets.
- Second most recent role: 10-12 bullets.
- Third most recent role: 8-10 bullets.

Recent roles should still carry the densest JD keyword coverage; older roles cover responsibilities truthfully without forcing modern keywords.

ROLE-SENIORITY REALISM (MANDATORY):
Older roles must reflect the candidate's actual seniority at that time, not their current seniority.

Responsibilities must evolve naturally from junior implementation work toward senior leadership across the career timeline. Never apply senior-level language uniformly to all roles.

MEASURABLE RESULTS (MANDATORY):
Every role must demonstrate measurable impact. Bullets should quantify outcomes wherever the candidate's history supports it.

- At least 50% of bullets in recent roles (current + second most recent) must include a measurable result.
- At least 30% of bullets in older roles must include a measurable result.
- Measurable results include: percentages (latency reduced 40%, throughput up 2x), absolute numbers (handled 5M+ daily requests, supported 200+ microservices), time savings (cut deployment time from 2 hours to 15 minutes), cost figures (reduced cloud spend by $120K/year), team or scale metrics (mentored 6 engineers, migrated 30+ services), reliability metrics (99.9% uptime, p95 latency under 200ms), or adoption metrics (rolled out to 12 teams, processed 50TB monthly).
- Match the metric type to the seniority level: junior roles use task-scale metrics (test coverage raised to 85%, resolved 40+ tickets/quarter); senior roles use system-scale or business-scale metrics (saved $400K annually, reduced incidents by 60%).
- Never invent specific numbers not supported by the candidate's profile. When exact figures are unavailable, use realistic order-of-magnitude estimates phrased conservatively (e.g., "thousands of daily users" instead of "47,392 daily users"), OR use a non-numeric outcome (e.g., "eliminated recurring nightly job failures").
- Bullets without a metric must still describe a concrete outcome — what changed, what got faster, what got more reliable, what the team gained — not just an activity.

Each bullet must:
- Start with a unique, strong action verb (no verb repeated across bullets within the same role).
- Be at least 20 words long.
- Bold the JD-aligned tools, technologies, methodologies, or responsibilities it contains.
- Emphasize business results, metrics, or technical depth appropriate to the role's seniority level.
- Describe one clear action with 1-2 hard skills and at most 1 soft skill. Avoid tool-stuffing.

Vary sentence structure and bullet length naturally. Mix implementation, architecture, debugging, production support, optimization, API work, database work, cloud, DevOps, mentoring, documentation, and stakeholder communication.

CHRONOLOGICAL TECHNOLOGY REALISM (MANDATORY — OVERRIDES KEYWORD COVERAGE):
A technology may appear in a role's bullets ONLY if it was generally available AND in production use during that employment period. When uncertain, omit. This rule overrides the keyword coverage rule: if a skill cannot be placed in a realistic role, it appears only in Key Skills and Summary, never forced into an older role.

- Kubernetes: 2015+
- Docker: 2014+
- React: 2014+
- TensorFlow: 2016+, PyTorch: 2017+
- Transformer-based LLMs (GPT-3+, ChatGPT, RAG, prompt engineering, vector DBs): 2022+ for production use
- Azure OpenAI, Semantic Kernel, LangChain, LangGraph, AutoGen, MCP: 2023+
- Terraform: 2015+, Bicep: 2021+

A skill may appear in Key Skills (if the candidate has it now) without appearing in older Experience entries. Modern AI keywords belong only in recent roles supported by the candidate's background.

METRICS:
Use only credible, supported numbers. When exact metrics aren't available, use realistic non-numeric outcomes. Do not force a metric into every bullet.

WRITING STYLE:
Sound human, not AI-generated. Avoid filler phrases, repeated action verbs, exaggerated claims, identical bullet structures, and corporate cliches. Use concise, specific, experience-based language.

FINAL CHECK (verify internally before returning):
- Valid JSON, matches schema exactly.
- Only the 6 required sections, in order.
- Summary <= 70 words.
- Every JD hard skill and soft skill appears at least mention_count times across the resume.
- Every role has >= 14 bullets, each >= 20 words, each starting with a unique strong action verb.
- No technology appears in a role before its realistic adoption date.
- No fabricated facts.

FORMATTING RULES (MANDATORY):
- For bold emphasis in any string field, use ONLY HTML <b></b> tags.

Return ONLY JSON that matches the given schema.
`

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
  });

  const result = JSON.parse(response.output_text) as AIResponse;

  return result;
}