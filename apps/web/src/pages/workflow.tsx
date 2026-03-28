import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Play, Loader2 } from 'lucide-react'
import { nodeTypes } from '@/modules/workflow/components/nodes'
import { NodePalette } from '@/modules/workflow/components/node-palette'
import { ResultsPanel } from '@/modules/workflow/components/results-panel'

const defaultNodes: Node[] = [
  { id: 'scrape-1', type: 'scrape', position: { x: 250, y: 0 }, data: { company: '' } },
  { id: 'enrich-1', type: 'enrich', position: { x: 250, y: 120 }, data: {} },
  { id: 'score-1', type: 'scoreICP', position: { x: 250, y: 240 }, data: {} },
  { id: 'personalise-1', type: 'personalise', position: { x: 250, y: 360 }, data: {} },
]

const defaultEdges: Edge[] = [
  { id: 'e1', source: 'scrape-1', target: 'enrich-1' },
  { id: 'e2', source: 'enrich-1', target: 'score-1' },
  { id: 'e3', source: 'score-1', target: 'personalise-1' },
]

let nodeId = 10

interface NodeResult {
  type: string
  status: 'completed' | 'failed'
  output?: Record<string, unknown>
  error?: string
}

export function WorkflowPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges)
  const [company, setCompany] = useState('')
  const [results, setResults] = useState<Record<string, NodeResult> | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }

      const newNode: Node = {
        id: `${type}-${nodeId++}`,
        type,
        position,
        data: type === 'scrape' ? { company: '' } : {},
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes],
  )

  const executeMutation = useMutation({
    mutationFn: async () => {
      const processedNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type ?? 'unknown',
        data: n.type === 'scrape' ? { ...n.data, company } : (n.data as Record<string, unknown>),
      }))

      const processedEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
      }))

      const res = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nodes: processedNodes,
          edges: processedEdges,
          input: { company },
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      return res.json()
    },
    onSuccess: (data: { results: Record<string, NodeResult> }) => {
      setResults(data.results ?? null)
    },
  })

  return (
    <div className="flex h-full gap-4">
      <div className="w-44 shrink-0 space-y-4">
        <NodePalette />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Company name or domain..."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="max-w-sm"
          />
          <Button
            onClick={() => executeMutation.mutate()}
            disabled={!company.trim() || executeMutation.isPending}
          >
            {executeMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Play className="mr-2 size-4" />
            )}
            Run
          </Button>
        </div>

        <div ref={reactFlowWrapper} className="flex-1 rounded-lg border bg-muted/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            className="rounded-lg"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <div className="w-80 shrink-0 overflow-auto">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Results
        </h3>
        <ResultsPanel results={results} isRunning={executeMutation.isPending} />
      </div>
    </div>
  )
}
