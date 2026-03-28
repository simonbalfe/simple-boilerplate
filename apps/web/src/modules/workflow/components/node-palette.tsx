import { Globe, Sparkles, Target, Pen } from 'lucide-react'

const paletteItems = [
  { type: 'scrape', label: 'Scrape', icon: Globe, color: 'text-blue-500' },
  { type: 'enrich', label: 'Enrich', icon: Sparkles, color: 'text-violet-500' },
  { type: 'scoreICP', label: 'Score ICP', icon: Target, color: 'text-emerald-500' },
  { type: 'personalise', label: 'Personalise', icon: Pen, color: 'text-amber-500' },
]

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex flex-col gap-1">
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Nodes
      </h3>
      {paletteItems.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => onDragStart(e, item.type)}
          className="flex cursor-grab items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent active:cursor-grabbing"
        >
          <item.icon className={`size-4 ${item.color}`} />
          {item.label}
        </div>
      ))}
    </div>
  )
}
