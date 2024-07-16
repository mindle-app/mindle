import { useEffect, useState, useRef } from 'react'
import { type RawNodeDatum, Tree, type TreeProps } from 'react-d3-tree'

import './tree.css'

import { type MindmapTree } from '#app/utils/mindmap.js'

// Given a container ref, this hook returns the correct translate
// values to center the tree in the container
const useTreeCenterTranslation = (
  ref: React.RefObject<HTMLElement>,
  defaultTranslate = { x: 0, y: 0 },
): { x: number; y: number } => {
  const [translate, setTranslate] = useState(defaultTranslate)
  useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect()
      setTranslate({ x: width / 5, y: height / 2.5 })
    }
  }, [ref])
  return translate
}

function parseDepthFactor(
  d: string | number | undefined | boolean | null,
): number {
  if (!d) return 750
  if (typeof d === 'number') return d
  if (typeof d === 'boolean') return 750
  return parseInt(d, 10)
}

interface MindmapProps extends Omit<TreeProps, 'data'> {
  mindmap: MindmapTree
}

export const Mindmap = ({ mindmap, ...rest }: MindmapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const translate = useTreeCenterTranslation(containerRef)

  const attr = mindmap.attributes
  const depthFactor = parseDepthFactor(attr?.depth)
  const separation = attr
    ? { siblings: Number(attr.spacing), nonSiblings: Number(attr.nonSiblings) }
    : { siblings: 1.5, nonSiblings: 1.5 }
  const zoom = attr ? Number(attr.zoom) : 0.5

  return (
    <div id="treeWrapper" ref={containerRef} className="h-full w-full">
      <Tree
        translate={translate}
        orientation="horizontal"
        pathFunc="diagonal"
        zoomable={true}
        draggable={true}
        depthFactor={depthFactor}
        zoom={zoom}
        separation={separation}
        {...rest}
        data={mindmap as unknown as RawNodeDatum}
      />
    </div>
  )
}
