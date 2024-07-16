import { useEffect, useState, useCallback, useRef } from 'react'
import {
  type CustomNodeElementProps,
  type RawNodeDatum,
  Tree,
} from 'react-d3-tree'

import './tree.css'

import { type MindmapTree } from '#app/utils/mindmap.js'

import { toUserState, UserState } from '#app/utils/user.js'
import { ChapterElement } from './chapter-element.tsx'
import { ClickableElement } from './clickable-element.tsx'

const NonClickableElement = ({ text }: { text: string }) => {
  return (
    <div className="mt-4 inline-flex shrink grow basis-0 flex-col items-center justify-center gap-2.5 self-stretch rounded-2xl border-2 border-l-0 border-orange-700 border-opacity-10 bg-white px-6 py-4">
      <div className="self-stretch text-center font-['Poppins'] text-2xl font-medium leading-[28.80px] text-black">
        {text}
      </div>
    </div>
  )
}

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

interface MindmapProps {
  isSubchapter: boolean
  mindmap: MindmapTree
  studyProgramActive: boolean
  handleNodeClick: (node: MindmapTree) => void
}

const Mindmap = ({
  isSubchapter,
  studyProgramActive,
  mindmap,
  handleNodeClick,
}: MindmapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const translate = useTreeCenterTranslation(containerRef)

  const attr = mindmap.attributes
  const x = attr ? attr.width : 200
  const y = attr ? attr.height : 200
  const depthFactor = parseDepthFactor(attr?.depth)
  const separation = attr
    ? { siblings: Number(attr.spacing), nonSiblings: Number(attr.nonSiblings) }
    : { siblings: 1.5, nonSiblings: 1.5 }
  const zoom = attr ? Number(attr.zoom) : 0.5
  const nodeSize = { x, y }
  const foreignObjectProps = {
    width: nodeSize.x,
    height: nodeSize.y,
    x: 0,
    y: -50,
  }
  const renderNodeWithCustomEvents = useCallback(
    ({ nodeDatum }: CustomNodeElementProps) => {
      const treeDatum = nodeDatum as unknown as MindmapTree
      const buttonText =
        treeDatum.attributes?.displayId ?? nodeDatum.attributes?.id
      const text = nodeDatum.name
      const noPopup = treeDatum.attributes?.noPopup
      const imageUrl = treeDatum.attributes?.imageUrl?.toString() ?? ''

      if (isSubchapter) {
        return (
          <g overflow="visible">
            <foreignObject
              overflow="visible"
              width={`${nodeDatum.attributes?.width ?? 200}px`}
              height={`${nodeDatum.attributes?.height ?? 200}px`}
              x={foreignObjectProps.x}
              y={foreignObjectProps.y}
            >
              <div onClick={() => handleNodeClick(treeDatum)}>
                {!noPopup && (
                  <ClickableElement
                    text={text}
                    buttonText={buttonText?.toString() ?? ''}
                    state={
                      studyProgramActive
                        ? treeDatum.attributes.state
                        : UserState.IN_PROGRESS
                    }
                    // next lesson is leaf that is in progress
                    isNextLesson={
                      studyProgramActive &&
                      !treeDatum.children.length &&
                      treeDatum.attributes.state === UserState.IN_PROGRESS
                    }
                  />
                )}
                {noPopup && <NonClickableElement text={text} />}
              </div>
            </foreignObject>
          </g>
        )
      }
      return (
        <g overflow="visible">
          <foreignObject
            overflow="visible"
            width={`${nodeDatum.attributes?.width ?? 200}px`}
            height={`${nodeDatum.attributes?.height ?? 200}px`}
            x={foreignObjectProps.x}
            y={
              nodeDatum.children?.length !== 0
                ? foreignObjectProps.y * 2
                : foreignObjectProps.y
            }
          >
            <div onClick={() => handleNodeClick(treeDatum)}>
              {nodeDatum.children?.length === 0 && (
                <ClickableElement
                  text={text}
                  buttonText={buttonText?.toString() ?? ''}
                  state={
                    studyProgramActive
                      ? treeDatum.attributes.state
                      : UserState.IN_PROGRESS
                  }
                  isNextLesson={
                    studyProgramActive &&
                    !treeDatum.children.length &&
                    treeDatum.attributes.state === UserState.IN_PROGRESS
                  }
                />
              )}
              {nodeDatum.children?.length !== 0 && (
                <ChapterElement
                  title={text}
                  image={imageUrl}
                  state={toUserState(nodeDatum.attributes?.state)}
                />
              )}
            </div>
          </foreignObject>
        </g>
      )
    },
    [
      foreignObjectProps.x,
      foreignObjectProps.y,
      handleNodeClick,
      isSubchapter,
      studyProgramActive,
    ],
  )

  return (
    <div id="treeWrapper" ref={containerRef} className="h-full w-full">
      <Tree
        data={mindmap as unknown as RawNodeDatum}
        translate={translate}
        renderCustomNodeElement={renderNodeWithCustomEvents}
        orientation="horizontal"
        pathFunc="diagonal"
        zoomable={true}
        draggable={true}
        depthFactor={depthFactor}
        zoom={zoom}
        separation={separation}
      />
    </div>
  )
}
export default Mindmap
