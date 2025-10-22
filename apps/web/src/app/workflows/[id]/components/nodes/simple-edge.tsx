import { EdgeProps, getBezierPath } from '@xyflow/react'

export function SimpleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX: sourceX - 2.5,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <path
      d={edgePath}
      className='react-flow__edge-path'
      strokeWidth={2}
      stroke='#cbd5e1'
      strokeLinecap='round'
      style={style}
      markerEnd={markerEnd}
    />
  )
}
