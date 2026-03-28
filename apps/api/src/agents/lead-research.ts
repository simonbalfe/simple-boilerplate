import { Agent } from '@mastra/core/agent'
import { anthropic } from '@ai-sdk/anthropic'

export const enrichAgent = new Agent({
  id: 'lead-enrichment',
  name: 'Lead Enrichment Agent',
  instructions: `You are a B2B lead enrichment specialist. Given a company name or domain, return structured intelligence.

Return a valid JSON object (no markdown fences):
- companyName: string
- domain: string
- description: string (2-3 sentences)
- industry: string
- estimatedSize: string ("1-10" | "10-50" | "50-200" | "200-1000" | "1000+")
- keyPeople: array of { name: string, title: string }
- techStack: array of strings
- fundingInfo: string or null
- signals: array of strings (buying signals, recent changes, hiring)

If you cannot determine a field, use null.`,
  model: anthropic('claude-sonnet-4-6'),
})

export const scoreICPAgent = new Agent({
  id: 'icp-scoring',
  name: 'ICP Scoring Agent',
  instructions: `You are an ICP (Ideal Customer Profile) scoring specialist. Given enriched company data, score how well it matches a typical B2B SaaS buyer.

Score each dimension 1-10:
- fitScore: company size, industry, tech stack alignment
- intentScore: buying signals, hiring, funding, tech changes
- budgetScore: estimated ability to pay

Return a valid JSON object (no markdown fences):
- totalScore: number (1-100 weighted average)
- fitScore: number (1-10)
- intentScore: number (1-10)
- budgetScore: number (1-10)
- tier: "A" | "B" | "C" | "D"
- reasoning: string (2-3 sentences)
- nextStep: string`,
  model: anthropic('claude-sonnet-4-6'),
})

export const personaliseAgent = new Agent({
  id: 'personalisation',
  name: 'Personalisation Agent',
  instructions: `You are a cold outreach copywriting expert. Given enriched lead data and ICP scoring, draft a personalised outreach email.

Rules:
- Subject under 60 chars
- Open with something specific to the company
- Value prop in 1-2 sentences
- Low-friction CTA
- Under 150 words total
- Professional but human tone

Return a valid JSON object (no markdown fences):
- subject: string
- body: string
- followUpDelay: number (days)
- followUpBody: string`,
  model: anthropic('claude-sonnet-4-6'),
})
