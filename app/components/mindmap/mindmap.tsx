import { useEffect, useState, useCallback, useRef } from 'react'
import {
  type CustomNodeElementProps,
  type RawNodeDatum,
  Tree,
} from 'react-d3-tree'

import './tree.css'

import { type MindmapTree } from '#app/utils/mindmap.js'
import { cn } from '#app/utils/misc.js'
import { toUserState, UserState } from '#app/utils/user.js'
import { SvgImage } from '../svg-image'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Icon } from '../ui/icon'

function ChapterElement({
  title,
  image,
  state,
}: {
  title: string
  image: string | null
  state: UserState
}) {
  const isActive = state === UserState.IN_PROGRESS
  const isComplete = state === UserState.DONE
  const isLocked = state === UserState.LOCKED
  return (
    <Card
      className={cn(
        'group min-w-52 overflow-hidden rounded-2xl border-2 border-solid pb-6 shadow-2xl dark:shadow-none',
        {
          'shadow-active': isActive,
          'shadow-complete': isComplete,
          'shadow-locked': isLocked,
        },
      )}
    >
      <CardContent
        className={cn(
          'W-full flex items-center justify-center border-b-2 pt-6 transition-all duration-300 ease-in-out',
          {
            'bg-active group-hover:bg-active-foreground': isActive,
          },
        )}
      >
        {image ? (
          <SvgImage
            src={image}
            className={cn('h-24 w-24 stroke-transparent', {
              'fill-active-svg': isActive,
            })}
          />
        ) : (
          <Icon
            name={'brain'}
            className="aspect-square w-24 max-w-full object-contain object-center"
          />
        )}
      </CardContent>
      <CardFooter className="pt-6 text-center font-poppinsBold text-3xl font-medium leading-7">
        {title}
      </CardFooter>
    </Card>
  )
}

const ClickableElement = ({
  text,
  buttonText,
  state: state = UserState.LOCKED,
  isNextLesson,
}: {
  text: string
  buttonText: string
  state: UserState
  isNextLesson?: boolean
}) => {
  const isActive = state === UserState.IN_PROGRESS
  const isComplete = state === UserState.DONE
  const isLocked = state === UserState.LOCKED
  return (
    <div
      className={cn('w-fit', {
        'relative rounded-2xl border-2 border-active p-2': isNextLesson,
      })}
      key={text + state}
    >
      <div className="inline-flex h-[100px] items-start justify-start rounded-2xl border-opacity-20">
        <div
          className={cn(
            'inline-flex w-[100px] flex-col items-center justify-center gap-6 self-stretch rounded-bl-2xl rounded-tl-2xl border-2 border-opacity-20 p-6',
            {
              'bg-active': isActive,
              'bg-complete': isComplete,
              'bg-locked': isLocked,
            },
          )}
        >
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full border-2',
              {
                'bg-active-foreground': isActive,
                'bg-complete-foreground': isComplete,
                'bg-locked-foreground': isLocked,
              },
            )}
          >
            <div
              className={`font-['Co Headline'] text-[32px] font-bold leading-loose text-card`}
            >
              {buttonText}
            </div>
          </div>
        </div>
        <div
          className={`inline-flex shrink grow basis-0 flex-col items-center justify-center gap-2.5 self-stretch rounded-br-2xl rounded-tr-2xl border-2 border-l-0 border-opacity-10 px-6 py-4`}
        >
          <div
            className={`self-stretch text-center font-poppins text-2xl font-medium leading-[28.80px] text-foreground`}
          >
            {text}
          </div>
        </div>
      </div>
      {isNextLesson && (
        <Icon
          name={'mindle-head'}
          width={60}
          height={60}
          className="absolute right-[-30px] top-[-30px] h-14 w-14 rounded-full border-2 border-active bg-background p-2"
        />
      )}
    </div>
  )
}

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
        pathFunc="step"
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
