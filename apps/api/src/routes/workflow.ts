import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { requireAuth } from '../middleware/auth'
import { enrichAgent, scoreICPAgent, personaliseAgent } from '../agents/lead-research'

interface WorkflowNode {
  id: string
  type: string
  data: Record<string, unknown>
}

interface WorkflowEdge {
  source: string
  target: string
}

interface WorkflowPayload {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  input: Record<string, unknown>
}

function buildExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adj.set(node.id, [])
  }
  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id)
  const order: WorkflowNode[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node) order.push(node)
    for (const next of adj.get(id) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1
      inDegree.set(next, deg)
      if (deg === 0) queue.push(next)
    }
  }

  return order
}

async function executeNode(
  node: WorkflowNode,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  switch (node.type) {
    case 'scrape': {
      const company = (node.data.company as string) || (context.company as string) || ''
      // Placeholder: in production this would hit a scraping API
      return { ...context, company, scraped: { company, source: 'manual_input' }, stage: 'scraped' }
    }

    case 'enrich': {
      const company = (context.company as string) || ''
      const response = await enrichAgent.generate(
        `Enrich this company for B2B lead gen: "${company}". Return JSON.`,
      )
      return { ...context, enrichment: response.text, stage: 'enriched' }
    }

    case 'scoreICP': {
      const enrichment = (context.enrichment as string) || JSON.stringify(context)
      const response = await scoreICPAgent.generate(
        `Score this lead against ICP:\n${enrichment}\n\nReturn JSON.`,
      )
      return { ...context, scoring: response.text, stage: 'scored' }
    }

    case 'personalise': {
      const enrichment = (context.enrichment as string) || ''
      const scoring = (context.scoring as string) || ''
      const response = await personaliseAgent.generate(
        `Write personalised outreach.\n\nEnrichment:\n${enrichment}\n\nScoring:\n${scoring}\n\nReturn JSON.`,
      )
      return { ...context, outreach: response.text, stage: 'personalised' }
    }

    default:
      return context
  }
}

export const workflowRoutes = new Hono()
  .post(
    '/workflow/execute',
    describeRoute({
      tags: ['Workflow'],
      summary: 'Execute lead gen workflow',
      description: 'Runs the Scrape > Enrich > Score ICP > Personalise pipeline',
      responses: {
        200: { description: 'Workflow results' },
        400: { description: 'Invalid workflow' },
      },
    }),
    requireAuth,
    async (c) => {
      const body = (await c.req.json()) as WorkflowPayload
      const { nodes, edges, input } = body

      if (!nodes || nodes.length === 0) {
        return c.json({ success: false, error: 'Workflow needs at least one node' }, 400)
      }

      const executionOrder = buildExecutionOrder(nodes, edges)
      let context: Record<string, unknown> = { ...input }
      const results: Record<string, unknown> = {}

      for (const node of executionOrder) {
        try {
          context = await executeNode(node, context)
          results[node.id] = { type: node.type, status: 'completed', output: context }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          results[node.id] = { type: node.type, status: 'failed', error: message }
          break
        }
      }

      return c.json({ success: true, results, finalContext: context })
    },
  )
