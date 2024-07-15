import { expect, test } from 'vitest'
import {
  chapterMindmap,
  chapterMindmapMultipleIncompleteSubchaptersLastIncompleteLessonInSubchapter,
  chapterMindmapMultipleIncompleteSubchaptersMultipleIncompleteLessons,
  chapterMindmapMultipleLessons,
  lessonsMindmap,
  Mindmap,
  subchapterMindmap,
} from '#tests/mocks/mindmap.js'
import {
  computeTreeWithCompletedNodes,
  findMindmapNode,
  findNextInProgress,
  getEntitiesToComplete,
  getNextInProgressNodes,
  mindMapIdsToDbIds,
} from './mindmap'
import { UserState } from './user'

test('getEntititesToComplete lessons', () => {
  expect(getEntitiesToComplete(lessonsMindmap, 'lesson|2')).toEqual([
    'lesson|2',
    'lesson|3',
    'lesson|1',
    'lesson|4',
  ])
})

test('getEntititesToComplete subchapter + lessons', () => {
  expect(getEntitiesToComplete(subchapterMindmap, 'lesson|2')).toEqual([
    'lesson|2',
    'lesson|3',
    'lesson|1',
    'lesson|4',
    'subchapter|1',
  ])
})

test('getEntititesToComplete chapter + subchapter + lessons', () => {
  expect(getEntitiesToComplete(chapterMindmap, 'lesson|2')).toEqual([
    'lesson|2',
    'lesson|3',
    'lesson|1',
    'lesson|4',
    'subchapter|1',
    'chapter|1',
  ])
})

test('getEntititesToComplete chapter multiple lessons', () => {
  expect(
    getEntitiesToComplete(chapterMindmapMultipleLessons, 'lesson|2'),
  ).toEqual(['lesson|2', 'subchapter|2', 'chapter|1'])
})

test('getEntititesToComplete chapter multiple incomplete subchapters, last incomplete lesson in subchapter', () => {
  expect(
    getEntitiesToComplete(
      chapterMindmapMultipleIncompleteSubchaptersLastIncompleteLessonInSubchapter,
      'lesson|2',
    ),
  ).toEqual(['lesson|2', 'subchapter|2'])
})

test('getEntititesToComplete chapter multiple incomplete lessons in subchapter', () => {
  expect(
    getEntitiesToComplete(
      chapterMindmapMultipleIncompleteSubchaptersMultipleIncompleteLessons,
      'lesson|2',
    ),
  ).toEqual(['lesson|2'])
})

test('getEntitiesToComplete nonexistent node id', () => {
  expect(
    getEntitiesToComplete(
      chapterMindmapMultipleIncompleteSubchaptersMultipleIncompleteLessons,
      'lesson|1054',
    ),
  ).toEqual(['lesson|1054'])
})

test('mindMapIdsToDbIds', () => {
  expect(
    mindMapIdsToDbIds([
      'lesson|2',
      'lesson|3',
      'lesson|1',
      'lesson|1',
      'lesson|4',
      'subchapter|1',
      'chapter|1',
    ]),
  ).toEqual({ chapters: [1], lessons: [2, 3, 1, 4], subchapters: [1] })
})

const chapterMindmapMultipleLessonsMarkedComplete = Mindmap({
  id: 'chapter|1',
  name: 'incomplete chapter',
  attributes: {
    state: UserState.DONE,
  },
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
          attributes: {
            state: UserState.DONE,
          },
        }),
      ],
    }),
    Mindmap({
      id: 'subchapter|2',
      name: 'incomplete subchapter',
      attributes: {
        state: UserState.DONE,
      },
      children: [
        Mindmap({
          id: 'lesson|2',
          name: 'incomplete lesson',
          attributes: {
            state: UserState.DONE,
          },
        }),
        Mindmap({
          id: 'lesson|3',
          name: 'complete lesson',
          attributes: {
            state: UserState.DONE,
          },
        }),
      ],
    }),
  ],
})

test('computeTreeWithCompletedNodes marks nodes correctly as completed', () => {
  expect(
    computeTreeWithCompletedNodes(
      chapterMindmapMultipleLessons,
      getEntitiesToComplete(chapterMindmapMultipleLessons, 'lesson|2'),
    ),
  ).toEqual(chapterMindmapMultipleLessonsMarkedComplete)
})

test('Get next in progress nodes for full inactive tree', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter locked',
        children: [Mindmap({ id: 'subchapter|1', name: 'subchapter locked' })],
      }),
    ),
  ).toEqual(['chapter|1', 'subchapter|1'])

  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter locked',
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter locked',
            children: [Mindmap({ id: 'lesson|1', name: 'lesson locked' })],
          }),
        ],
      }),
    ),
  ).toEqual(['chapter|1', 'subchapter|1', 'lesson|1'])
})

test('Get next in progress nodes for tree with in progress root', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter locked',
            children: [Mindmap({ id: 'lesson|1', name: 'lesson locked' })],
          }),
        ],
      }),
    ),
  ).toEqual(['subchapter|1', 'lesson|1'])
})

test('Get next in progress nodes for tree with finished nodes', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter done',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual([])

  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter done',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
            ],
          }),
          Mindmap({
            id: 'subchapter|2',
            name: 'subchapter locked',
            attributes: { state: UserState.LOCKED },
            children: [
              Mindmap({
                id: 'lesson|2',
                name: 'lesson locked',
                attributes: { state: UserState.LOCKED },
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual(['subchapter|2', 'lesson|2'])

  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter done',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
            ],
          }),
          Mindmap({
            id: 'subchapter|2',
            name: 'subchapter in progress',
            attributes: { state: UserState.IN_PROGRESS },
            children: [
              Mindmap({
                id: 'lesson|2',
                name: 'lesson locked',
                attributes: { state: UserState.IN_PROGRESS },
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual([])
})

test('Get next in progress nodes for tree fully finished', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter done',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
            ],
          }),
          Mindmap({
            id: 'subchapter|2',
            name: 'subchapter done',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|2',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual([])
})

test('Get next in progress nodes for next leaf', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter in progress',
            attributes: { state: UserState.IN_PROGRESS },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
              Mindmap({
                id: 'lesson|2',
                name: 'lesson locked',
                attributes: { state: UserState.LOCKED },
              }),
              Mindmap({
                id: 'lesson|3',
                name: 'lesson locked',
                attributes: { state: UserState.LOCKED },
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual(['lesson|2'])
})

test('Get next in progress nodes for next subchapter', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.IN_PROGRESS },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter done',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
              Mindmap({
                id: 'lesson|2',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
              Mindmap({
                id: 'lesson|3',
                name: 'lesson done',
                attributes: { state: UserState.DONE },
              }),
            ],
          }),
          Mindmap({
            id: 'subchapter|2',
            name: 'subchapter locked',
            attributes: { state: UserState.LOCKED },
            children: [
              Mindmap({
                id: 'lesson|4',
                name: 'lesson locked',
                attributes: { state: UserState.LOCKED },
              }),
              Mindmap({
                id: 'lesson|5',
                name: 'lesson done',
                attributes: { state: UserState.LOCKED },
              }),
              Mindmap({
                id: 'lesson|6',
                name: 'lesson done',
                attributes: { state: UserState.LOCKED },
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual(['subchapter|2', 'lesson|4'])
})

test('Get next in progress nodes for deep nested lessons', () => {
  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter in progress',
        attributes: { state: UserState.LOCKED },
        children: [
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter',
            attributes: { state: UserState.LOCKED },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson',
                attributes: { state: UserState.LOCKED },
                children: [
                  Mindmap({
                    id: 'lesson|2',
                    name: 'lesson',
                    attributes: { state: UserState.LOCKED },
                    children: [
                      Mindmap({
                        id: 'lesson|3',
                        name: 'lesson',
                        attributes: { state: UserState.LOCKED },
                        children: [
                          Mindmap({
                            id: 'lesson|4',
                            name: 'lesson',
                            attributes: { state: UserState.LOCKED },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual([
    'chapter|1',
    'subchapter|1',
    'lesson|1',
    'lesson|2',
    'lesson|3',
    'lesson|4',
  ])

  expect(
    getNextInProgressNodes(
      Mindmap({
        id: 'chapter|1',
        name: 'chapter',
        attributes: { state: UserState.LOCKED },
        children: [
          Mindmap({
            id: 'subchapter|2',
            name: 'subchapter',
            attributes: { state: UserState.DONE },
            children: [
              Mindmap({
                id: 'lesson|5',
                name: 'lesson',
                attributes: { state: UserState.DONE },
                children: [
                  Mindmap({
                    id: 'lesson|6',
                    name: 'lesson',
                    attributes: { state: UserState.DONE },
                    children: [
                      Mindmap({
                        id: 'lesson|7',
                        name: 'lesson',
                        attributes: { state: UserState.DONE },
                        children: [
                          Mindmap({
                            id: 'lesson|8',
                            name: 'lesson',
                            attributes: { state: UserState.DONE },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          Mindmap({
            id: 'subchapter|1',
            name: 'subchapter',
            attributes: { state: UserState.LOCKED },
            children: [
              Mindmap({
                id: 'lesson|1',
                name: 'lesson',
                attributes: { state: UserState.LOCKED },
                children: [
                  Mindmap({
                    id: 'lesson|2',
                    name: 'lesson',
                    attributes: { state: UserState.LOCKED },
                    children: [
                      Mindmap({
                        id: 'lesson|3',
                        name: 'lesson',
                        attributes: { state: UserState.LOCKED },
                        children: [
                          Mindmap({
                            id: 'lesson|4',
                            name: 'lesson',
                            attributes: { state: UserState.LOCKED },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ),
  ).toEqual([
    'chapter|1',
    'subchapter|1',
    'lesson|1',
    'lesson|2',
    'lesson|3',
    'lesson|4',
  ])
})

test('Find next in progress node', () => {
  const mindMap = Mindmap({
    id: 'lesson|1',
    name: 'Lesson 1',
    attributes: { state: UserState.IN_PROGRESS },
    children: [
      Mindmap({
        id: 'lesson|2',
        name: 'Lesson 2',
        attributes: { state: UserState.LOCKED },
      }),
    ],
  })
  const nextDone = findMindmapNode(mindMap, 'lesson|1')
  expect(findNextInProgress(mindMap, nextDone)).toEqual({
    nextInProgress: 'lesson|2',
  })
})

test('Find next in progress node sibling', () => {
  const mindMap = Mindmap({
    id: 'lesson|1',
    name: 'Lesson 1',
    attributes: { state: UserState.DONE },
    children: [
      Mindmap({
        id: 'lesson|2',
        name: 'Lesson 2',
        attributes: { state: UserState.IN_PROGRESS },
      }),

      Mindmap({
        id: 'lesson|3',
        name: 'Lesson 2',
        attributes: { state: UserState.LOCKED },
      }),
    ],
  })
  const nextDone = findMindmapNode(mindMap, 'lesson|2')
  expect(findNextInProgress(mindMap, nextDone)).toEqual({
    nextInProgress: 'lesson|3',
  })
})

test('Find next in progress node with noPopup node', () => {
  const mindMap = Mindmap({
    id: 'lesson|1',
    name: 'Lesson 1',
    attributes: { state: UserState.IN_PROGRESS },
    children: [
      Mindmap({
        id: 'lesson|2',
        name: 'Lesson 2',
        attributes: { state: UserState.LOCKED, noPopup: true },
        children: [
          Mindmap({
            id: 'lesson|3',
            name: 'Lesson 3',
            attributes: { state: UserState.LOCKED },
          }),

          Mindmap({
            id: 'lesson|4',
            name: 'Lesson 4',
            attributes: { state: UserState.LOCKED },
          }),
        ],
      }),
    ],
  })
  const nextDone = findMindmapNode(mindMap, 'lesson|1')
  expect(findNextInProgress(mindMap, nextDone)).toEqual({
    completed: 'lesson|2',
    nextInProgress: 'lesson|3',
  })
})

test('Find next in progress node with noPopup node take first child', () => {
  const mindMap = Mindmap({
    id: 'lesson|1',
    name: 'Lesson 1',
    attributes: { state: UserState.IN_PROGRESS },
    children: [
      Mindmap({
        id: 'lesson|2',
        name: 'Lesson 2',
        attributes: { state: UserState.LOCKED, noPopup: true },
        children: [
          Mindmap({
            id: 'lesson|3',
            name: 'Lesson 3',
            attributes: { state: UserState.LOCKED },
          }),

          Mindmap({
            id: 'lesson|4',
            name: 'Lesson 4',
            attributes: { state: UserState.LOCKED },
          }),
        ],
      }),
      Mindmap({
        id: 'lesson|5',
        name: 'Lesson 5',
        attributes: { state: UserState.LOCKED, noPopup: true },
        children: [
          Mindmap({
            id: 'lesson|6',
            name: 'Lesson 6',
            attributes: { state: UserState.LOCKED },
          }),

          Mindmap({
            id: 'lesson|7',
            name: 'Lesson 7',
            attributes: { state: UserState.LOCKED },
          }),
        ],
      }),
    ],
  })
  const nextDone = findMindmapNode(mindMap, 'lesson|1')
  expect(findNextInProgress(mindMap, nextDone)).toEqual({
    nextInProgress: 'lesson|3',
    completed: 'lesson|2',
  })
})

test('Find next in progress node with noPopup node take first child', () => {
  const mindMap = Mindmap({
    id: 'lesson|1',
    name: 'Lesson 1',
    attributes: { state: UserState.DONE },
    children: [
      Mindmap({
        id: 'lesson|2',
        name: 'Lesson 2',
        attributes: { state: UserState.DONE, noPopup: true },
        children: [
          Mindmap({
            id: 'lesson|3',
            name: 'Lesson 3',
            attributes: { state: UserState.DONE },
          }),

          Mindmap({
            id: 'lesson|4',
            name: 'Lesson 4',
            attributes: { state: UserState.IN_PROGRESS },
          }),
        ],
      }),
      Mindmap({
        id: 'lesson|5',
        name: 'Lesson 5',
        attributes: { state: UserState.LOCKED, noPopup: true },
        children: [
          Mindmap({
            id: 'lesson|6',
            name: 'Lesson 6',
            attributes: { state: UserState.LOCKED },
          }),

          Mindmap({
            id: 'lesson|7',
            name: 'Lesson 7',
            attributes: { state: UserState.LOCKED },
          }),
        ],
      }),
    ],
  })
  const nextDone = findMindmapNode(mindMap, 'lesson|4')
  expect(findNextInProgress(mindMap, nextDone)).toEqual({
    completed: 'lesson|5',
    nextInProgress: 'lesson|6',
  })
})
