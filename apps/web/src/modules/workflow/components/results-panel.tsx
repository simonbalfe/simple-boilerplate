import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface NodeResult {
  type: string
  status: 'completed' | 'failed'
  output?: Record<string, unknown>
  error?: string
}

interface ResultsPanelProps {
  results: Record<string, NodeResult> | null
  isRunning: boolean
}

function tryParseJson(text: unknown): unknown {
  if (typeof text !== 'string') return text
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return text
  }
}

function ResultBlock({ nodeId, result }: { nodeId: string; result: NodeResult }) {
  const output = result.output ?? {}
  const displayData =
    output.research ?? output.qualification ?? output.outreach ?? output.exaResults ?? output

  const parsed = tryParseJson(displayData)

  return (
    <Card className="border-l-2" style={{ borderLeftColor: result.status === 'completed' ? '#10b981' : '#ef4444' }}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {result.status === 'completed' ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <XCircle className="size-4 text-red-500" />
          )}
          {result.type} <span className="text-xs text-muted-foreground">({nodeId})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {result.error ? (
          <p className="text-sm text-destructive">{result.error}</p>
        ) : (
          <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">
            {typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export function ResultsPanel({ results, isRunning }: ResultsPanelProps) {
  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Running workflow...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Run the workflow to see results here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Object.entries(results).map(([nodeId, result]) => (
        <ResultBlock key={nodeId} nodeId={nodeId} result={result} />
      ))}
    </div>
  )
}
