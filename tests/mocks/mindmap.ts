import { type MindmapTree } from '#app/utils/mindmap'
import { UserState } from '#app/utils/user'

export function Mindmap({
  id,
  name,
  attributes = {},
  children = [],
}: Pick<MindmapTree, 'id' | 'name'> & {
  attributes?: Partial<MindmapTree['attributes']>
  children?: MindmapTree[]
}): MindmapTree {
  const idStr = id.split('|')[1]
  if (idStr === undefined) throw new Error('Invalid id')
  return {
    id,
    name,
    attributes: {
      name: 'corpul omenesc',
      id: parseInt(idStr),
      description: 'corpul omenesc',
      imageUrl: null,
      isParent: children.length > 0,
      noPopup: false,
      state: UserState.LOCKED,
      displayId: '🧍🏻',
      zoom: 0.5,
      depth: 750,
      spacing: 1.5,
      nonSiblings: 1.5,
      width: 200,
      height: 200,
      ...(attributes ?? {}),
    },
    children,
  }
}

export const lessonsMindmap = Mindmap({
  id: 'lesson|4',
  name: 'corpul omenesc',
  children: [
    Mindmap({
      id: 'lesson|1',
      name: 'celule + țesuturi',
      children: [
        Mindmap({
          id: 'lesson|3',
          name: 'sisteme de organe',
          children: [Mindmap({ id: 'lesson|2', name: 'organe' })],
        }),
      ],
    }),
  ],
})

export const subchapterMindmap = Mindmap({
  id: 'subchapter|1',
  name: 'corpul omenesc',
  children: [lessonsMindmap],
})

export const chapterMindmap = Mindmap({
  id: 'chapter|1',
  name: 'corpul omenesc',
  children: [subchapterMindmap],
})

export const chapterMindmapMultipleLessons = Mindmap({
  id: 'chapter|1',
  name: 'incomplete chapter',
  children: [
    Mindmap({
      id: 'subchapter|1',
      name: 'completed subchapter',
      attributes: {
        state: UserState.DONE,
      },
      children: [
        Mindmap({
          id: 'lesson|1',
          name: 'completed lesson',
          attributes: { state: UserState.DONE },
        }),
      ],
    }),
    Mindmap({
      id: 'subchapter|2',
      name: 'incomplete subchapter',
      children: [
        Mindmap({ id: 'lesson|2', name: 'incomplete lesson' }),
        Mindmap({
          id: 'lesson|3',
          name: 'complete lesson',
          attributes: { state: UserState.DONE },
        }),
      ],
    }),
  ],
})

export const chapterMindmapMultipleIncompleteSubchaptersLastIncompleteLessonInSubchapter =
  Mindmap({
    id: 'chapter|1',
    name: 'incomplete chapter',
    children: [
      Mindmap({
        id: 'subchapter|1',
        name: 'incomplete subchapter',
        children: [
          Mindmap({
            id: 'lesson|1',
            name: 'incomplete lesson',
            attributes: { state: UserState.DONE },
          }),
        ],
      }),
      Mindmap({
        id: 'subchapter|2',
        name: 'incomplete subchapter',
        children: [
          Mindmap({ id: 'lesson|2', name: 'incomplete lesson' }),
          Mindmap({
            id: 'lesson|3',
            name: 'complete lesson',
            attributes: { state: UserState.DONE },
          }),
        ],
      }),
    ],
  })

export const chapterMindmapMultipleIncompleteSubchaptersMultipleIncompleteLessons =
  Mindmap({
    id: 'chapter|1',
    name: 'incomplete chapter',
    attributes: {},
    children: [
      Mindmap({
        id: 'subchapter|1',
        name: 'incomplete subchapter',
        attributes: {},
        children: [
          Mindmap({
            id: 'lesson|1',
            name: 'incomplete lesson',
            attributes: { state: UserState.DONE },
          }),
        ],
      }),
      Mindmap({
        id: 'subchapter|2',
        name: 'incomplete subchapter',
        children: [
          Mindmap({ id: 'lesson|2', name: 'incomplete lesson' }),
          Mindmap({
            id: 'lesson|3',
            name: 'incomplete lesson',
          }),
        ],
      }),
    ],
  })
