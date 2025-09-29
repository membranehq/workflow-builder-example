import { Handle, Position } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PlusNodeProps {
  data: {
    parentId: string
    createNewNode: (afterId: string) => void
  }
}

export function PlusNode({ data }: PlusNodeProps) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0! top-0! pointer-events-none!"
        style={{
          top: 0,
          left: '50%',
          width: '1px',
          height: '1px',
          transform: 'none',
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
        }}
      />

      <div className="flex items-center justify-center w-[400px] h-[30px]">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 rounded-none border-2 border-gray-300 hover:border-gray-400 bg-gray-100 hover:bg-gray-200"
          onClick={() => data.createNewNode(data.parentId)}
        >
          <Plus className="h-3 w-3 text-gray-600" />
        </Button>
      </div>
    </div>
  )
}