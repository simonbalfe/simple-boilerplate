import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Globe, Sparkles, Target, Pen } from 'lucide-react'

const nodeBase =
  'rounded-lg border bg-card px-4 py-3 shadow-sm min-w-[180px] text-sm'

function NodeShell({
  children,
  color,
  selected,
}: {
  children: React.ReactNode
  color: string
  selected?: boolean
}) {
  return (
    <div
      className={`${nodeBase} ${selected ? 'ring-2 ring-ring' : ''}`}
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      {children}
    </div>
  )
}

export function ScrapeNode({ data, selected }: NodeProps) {
  return (
    <NodeShell color="#3b82f6" selected={selected}>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
      <div className="flex items-center gap-2 font-medium">
        <Globe className="size-4 text-blue-500" />
        Scrape
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {(data.company as string) || 'Company to scrape'}
      </p>
    </NodeShell>
  )
}

export function EnrichNode({ selected }: NodeProps) {
  return (
    <NodeShell color="#8b5cf6" selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-violet-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-violet-500" />
      <div className="flex items-center gap-2 font-medium">
        <Sparkles className="size-4 text-violet-500" />
        Enrich
      </div>
      <p className="mt-1 text-xs text-muted-foreground">AI enrichment with Mastra</p>
    </NodeShell>
  )
}

export function ScoreICPNode({ selected }: NodeProps) {
  return (
    <NodeShell color="#10b981" selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-emerald-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
      <div className="flex items-center gap-2 font-medium">
        <Target className="size-4 text-emerald-500" />
        Score ICP
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Fit scoring against ICP</p>
    </NodeShell>
  )
}

export function PersonaliseNode({ selected }: NodeProps) {
  return (
    <NodeShell color="#f59e0b" selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />
      <div className="flex items-center gap-2 font-medium">
        <Pen className="size-4 text-amber-500" />
        Personalise
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Generate personalised outreach</p>
    </NodeShell>
  )
}

export const nodeTypes = {
  scrape: ScrapeNode,
  enrich: EnrichNode,
  scoreICP: ScoreICPNode,
  personalise: PersonaliseNode,
}
