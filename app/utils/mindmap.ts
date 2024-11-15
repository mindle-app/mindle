import { Prisma } from '@prisma/client'
import {
  type DefaultArgs,
  type GetFindResult,
} from '@prisma/client/runtime/library'
import { prisma } from './db.server'
import { getChapterImgSrc, getLessonImgSrc, includeOption } from './misc'
import { isUserState, UserState } from './user'

export type MindmapId = `${
  | 'lesson'
  | 'subchapter'
  | 'chapter'
  | 'subject'}|${number}`

export interface MindmapTree {
  id: MindmapId
  name: string
  attributes: {
    state: UserState
    id: number
    name: string
    description: string | null
    imageUrl: string | null
    isParent: boolean
    noPopup: boolean
    width: number | null
    height: number | null
    zoom: number | null
    depth: number | null
    spacing: number | null
    nonSiblings: number | null
    displayId: string | null
  }
  children: MindmapTree[]
}

export type MindmapLesson = GetFindResult<
  Prisma.$LessonPayload<DefaultArgs>,
  unknown,
  {
    select: {
      image: boolean
      isParent: boolean
      description: boolean
      zoom: boolean
      nonSiblings: boolean
      depth: boolean
      spacing: boolean
      userLessons: { select: { state: boolean }; where: { userId: string } }
      width: boolean
      name: boolean
      noPopup: boolean
      id: boolean
      displayId: boolean
      height: boolean
      parentLesson: boolean
    }
    where: { subchapterId: number }
  }
>

const lessonForMindmap = Prisma.validator<Prisma.LessonDefaultArgs>()({
  include: { parentLesson: true, userLessons: true, image: true },
})

type LessonForMindmap = Prisma.LessonGetPayload<typeof lessonForMindmap>

export function assembleMindmapFromLessons(lessons: LessonForMindmap[]) {
  let root: MindmapTree | null = null

  // Convert each lesson to Mindmap format and store in a map
  const lessonMap = lessons.reduce(
    (acc: Record<number, MindmapTree>, lesson) => {
      const lessonState = isUserState(lesson.userLessons[0]?.state)
        ? lesson.userLessons[0]?.state
        : UserState.LOCKED
      acc[lesson.id] = {
        id: `lesson|${lesson.id}`,
        name: lesson.name ?? '',
        attributes: {
          name: lesson.name ?? '',
          state: lessonState,
          id: lesson.id,
          imageUrl: lesson.image?.id ? getLessonImgSrc(lesson.image?.id) : null,
          description: lesson.description,
          isParent: lesson.isParent,
          noPopup: lesson.noPopup,
          zoom: lesson.zoom,
          depth: lesson.depth,
          spacing: lesson.spacing,
          nonSiblings: lesson.nonSiblings,
          displayId: lesson.displayId,
          width: lesson.width,
          height: lesson.height,
        },
        children: [],
      }
      return acc
    },
    {},
  )

  // Convert lessons to a mindmap structure using reduce
  for (const lesson of lessons) {
    const currentNode = lessonMap[lesson.id]
    if (!currentNode) {
      throw new Error('Something went wrong generating mindmap. Node not found')
    }
    if (lesson.parentLesson) {
      const parentNode = lessonMap[lesson.parentLesson.id]
      parentNode?.children.push(currentNode)
    } else {
      // This node has no parent, hence it's the root
      root = currentNode || null
    }
  }

  if (!root) {
    throw new Error('Root node not found')
  }
  return root
}

export async function generateSubchapterMindmap(
  subchapterId: number,
  userId: string,
) {
  const lessons = await prisma.lesson.findMany({
    where: { subchapterId },
    include: {
      parentLesson: true,
      userLessons: { where: { userId } },
      image: true,
    },

    orderBy: { order: 'asc' },
  })

  return assembleMindmapFromLessons(lessons)
}

export function getMindmapProgress(m: MindmapTree) {
  const doneChildren = children(m).filter(
    (node) => node.attributes.state === UserState.DONE,
  )
  return (doneChildren.length / children(m).length) * 100
}

export async function getChapterProgress({
  chapterId,
  userId,
}: {
  chapterId: number
  userId: string
}) {
  const userSubchapters = await prisma.userSubChapter.findMany({
    select: { state: true },
    where: { userId, subchapter: { chapterId } },
  })
  const doneSubchapters = userSubchapters.reduce((acc, subChapter) => {
    if (subChapter.state === UserState.DONE) {
      return acc + 1
    }
    return acc
  }, 0)

  return (doneSubchapters / userSubchapters.length) * 100
}

export async function generateChapterMindmap(
  chapterId: number,
  userId: string,
): Promise<MindmapTree> {
  const chapter = await prisma.chapter.findFirstOrThrow({
    where: { id: chapterId },
    select: {
      id: true,
      name: true,
      image: true,
      userChapters: { where: { userId }, select: { state: true } },
      subChapters: {
        select: {
          userSubchapters: { where: { userId }, select: { state: true } },
          id: true,
          depth: true,
          height: true,
          width: true,
          name: true,
          image: true,
          zoom: true,
          spacing: true,
          nonSiblings: true,
          displayId: true,
        },
        orderBy: { displayId: 'asc' },
      },
    },
  })

  const chapterState = isUserState(chapter.userChapters?.[0]?.state)
    ? chapter.userChapters?.[0]?.state
    : UserState.LOCKED

  return {
    id: `chapter|${chapter.id}`,
    name: chapter.name ?? '',
    attributes: {
      name: chapter.name ?? '',
      id: chapter.id,
      state: chapterState,
      description: '',
      imageUrl: getChapterImgSrc(chapter.image?.id ?? ''),
      isParent: false,
      noPopup: false,
      displayId: '',
      zoom: 0.5,
      depth: 750,
      spacing: 1.5,
      nonSiblings: 1.5,
      width: 200,
      height: 200,
    },
    children: chapter.subChapters.map((subchapter) => {
      const userSubchapter = subchapter.userSubchapters[0]
      const subchapterState = isUserState(userSubchapter?.state)
        ? userSubchapter?.state
        : UserState.LOCKED
      return {
        id: `subchapter|${subchapter.id}`,
        name: subchapter.name ?? '',
        attributes: {
          name: subchapter.name ?? '',
          id: subchapter.id,
          state: subchapterState,
          description: '',
          imageUrl: null,
          isParent: true,
          noPopup: false,
          isCompleted: subchapterState === UserState.DONE,
          zoom: subchapter.zoom,
          depth: subchapter.depth,
          spacing: subchapter.spacing,
          nonSiblings: subchapter.nonSiblings,
          displayId: subchapter.displayId,
          width: subchapter.width,
          height: subchapter.height,
        },
        children: [],
      }
    }),
  }
}

export function findMindmapNode(
  m: MindmapTree,
  id: MindmapId,
): MindmapTree | null {
  if (m.id === id) {
    return m
  }
  for (const child of m.children) {
    const found = findMindmapNode(child, id)
    if (found) {
      return found
    }
  }
  return null
}

export function children(m: MindmapTree) {
  return m.children
}

export function getParents(m: MindmapTree, id: MindmapId) {
  const loop = (path: MindmapTree[], node: MindmapTree): MindmapTree[] =>
    node.id === id
      ? path
      : node.children.reduce(
          (acc: MindmapTree[], child) =>
            acc.concat(loop([...path, node], child)),
          [],
        )
  return loop([], m)
}

export function getClosestParent(m: MindmapTree, id: MindmapId) {
  const p = getParents(m, id)
  return p[p.length - 1] ?? null
}

export function isRoot(m: MindmapTree, id: MindmapId) {
  return m.id === id
}

export function siblings(m: MindmapTree, id: MindmapId) {
  if (isRoot(m, id)) {
    return null
  }
  const p = getParents(m, id)
  if (!p.length) return null

  const closestParent = p[p.length - 1]
  return closestParent?.children ?? null
}

export function nextSibling(m: MindmapTree, id: MindmapId) {
  const s = siblings(m, id)
  if (!s) {
    return null
  }

  // only child or node not found
  if (s.length < 2) {
    return null
  }

  for (let i = 0; i < s.length; ++i) {
    if (s[i]?.id === id && s[i + 1]) {
      return s[i + 1]
    }
  }
  return null
}

/////////////// Logic for chapter/subchapter trees - Completion goes from leaf to root /////////////////////////

/**
 * Given a node and a list of children to complete, check if the node should be completed if all children are completed
 * @param node
 * @param childrenToComplete
 */
function shouldCompleteNode(
  node: MindmapTree,
  childrenToComplete: MindmapId[],
) {
  return node.children
    .filter((child) => !childrenToComplete.includes(child.id))
    .every((child) => child.attributes.state === UserState.DONE)
}

/**
 * Given a mindmap and a node id, return a list of node ids that should be completed to complete the node
 * @param m
 * @param id
 */
export function getEntitiesToComplete(
  m: MindmapTree,
  id: MindmapId,
): MindmapId[] {
  const nodeParents = getParents(m, id).reverse()
  return nodeParents.reduce(
    (childrenToComplete: MindmapId[], parent) => {
      if (shouldCompleteNode(parent, childrenToComplete)) {
        childrenToComplete.push(parent.id)
      }

      return childrenToComplete
    },
    [id],
  )
}

// Do a BFS and mark from `nodesToComplete` as completed
export function computeTreeWithCompletedNodes(
  m: MindmapTree,
  nodesToComplete: MindmapId[],
) {
  const copy = JSON.parse(JSON.stringify(m)) as MindmapTree
  const queue = [copy]
  while (queue.length) {
    const node = queue.shift()
    if (!node) {
      continue
    }
    if (nodesToComplete.includes(node.id)) {
      node.attributes.state = UserState.DONE
    }
    queue.push(...node.children)
  }
  return copy
}

export function mindMapIdsToDbIds(ids: MindmapId[]): {
  lessons: number[]
  chapters: number[]
  subchapters: number[]
} {
  const dbIds = ids.reduce(
    (acc, id) => {
      const dbIdStr = id.split('|')[1]
      if (!dbIdStr) {
        return acc
      }
      const dbId = parseInt(dbIdStr, 10)
      if (id.startsWith('lesson')) {
        acc.lessons.add(dbId)
      } else if (id.startsWith('subchapter')) {
        acc.subchapters.add(dbId)
      } else if (id.startsWith('chapter')) {
        acc.chapters.add(dbId)
      } else {
        throw new Error(`Invalid id: ${id}`)
      }
      return acc
    },
    {
      lessons: new Set<number>(),
      chapters: new Set<number>(),
      subchapters: new Set<number>(),
    },
  )
  return {
    lessons: Array.from(dbIds.lessons),
    chapters: Array.from(dbIds.chapters),
    subchapters: Array.from(dbIds.subchapters),
  }
}

function getFirstChildInProgress(m: MindmapTree) {
  return m.children.find(
    (child) => child.attributes.state === UserState.IN_PROGRESS,
  )
}

function getFirstChildLocked(m: MindmapTree) {
  return (
    m.children.find((child) => child.attributes.state === UserState.LOCKED) ??
    null
  )
}

function getFirstViableNodeToMarkInProgress(m: MindmapTree) {
  const firstIp = getFirstChildInProgress(m)
  if (firstIp) {
    return firstIp
  }
  const firstLocked = getFirstChildLocked(m)
  if (firstLocked) {
    return firstLocked
  }
  return null
}

export function getNextInProgressNodes(m: MindmapTree) {
  const idsToMarkInProgress: MindmapId[] = []

  const getNodesToMarkInProgress = (
    node: MindmapTree,
    ids: MindmapId[],
  ): MindmapId[] => {
    if (node.attributes.state === UserState.LOCKED) {
      ids.push(node.id)
    }
    if (!node.children.length) {
      return ids
    }

    const nextNode = getFirstViableNodeToMarkInProgress(node)
    if (!nextNode) {
      return ids
    }
    return getNodesToMarkInProgress(nextNode, ids)
  }

  return getNodesToMarkInProgress(m, idsToMarkInProgress)
}

async function markNextChapterInProgress(chapterId: number, userId: string) {
  const res = await prisma.chapter.findFirst({
    where: { id: chapterId },
    select: { nextChapterId: true },
  })

  if (res && res.nextChapterId) {
    // Mark the first lesson from the next chapter as in progress
    const chapterMindmap = await generateChapterMindmap(
      res.nextChapterId,
      userId,
    )
    const subchapter = chapterMindmap.children[0]
    let lesson: MindmapTree | null = null
    if (subchapter) {
      lesson = await generateSubchapterMindmap(subchapter.attributes.id, userId)
    }

    return prisma.$transaction([
      prisma.userChapter.upsert({
        where: { chapterId_userId: { userId, chapterId: res.nextChapterId } },
        update: { state: UserState.IN_PROGRESS },
        create: {
          state: UserState.IN_PROGRESS,
          chapterId: res.nextChapterId,
          userId,
        },
      }),
      ...(subchapter
        ? [
            prisma.userSubChapter.upsert({
              where: {
                subchapterId_userId: {
                  userId,
                  subchapterId: subchapter?.attributes.id,
                },
              },
              update: { state: UserState.IN_PROGRESS },
              create: {
                state: UserState.IN_PROGRESS,
                subchapterId: subchapter?.attributes.id,
                userId,
              },
            }),
          ]
        : []),

      ...(lesson
        ? [
            prisma.userLesson.upsert({
              where: {
                lessonId_userId: {
                  userId,
                  lessonId: lesson.attributes.id,
                },
              },
              update: { state: UserState.IN_PROGRESS },
              create: {
                state: UserState.IN_PROGRESS,
                lessonId: lesson.attributes.id,
                userId,
              },
            }),
          ]
        : []),
    ])
  }
}

async function markLessonFromNextSubchapterInProgress(
  subchapterId: number,
  userId: string,
) {
  const subchapterMindmap = await generateSubchapterMindmap(
    subchapterId,
    userId,
  )

  console.log('subchapterMindmap', subchapterMindmap)

  await prisma.userLesson.upsert({
    where: {
      lessonId_userId: { userId, lessonId: subchapterMindmap.attributes.id },
    },
    update: { state: UserState.IN_PROGRESS },
    create: {
      state: UserState.IN_PROGRESS,
      lessonId: subchapterMindmap.attributes.id,
      userId,
    },
  })
}

export async function completeChapterMindmap({
  chapterId,
  subChapterId,
  userId,
}: {
  chapterId: number
  subChapterId: number
  userId: string
}) {
  const chapterMindmap = await generateChapterMindmap(chapterId, userId)

  const entitiesToComplete = getEntitiesToComplete(
    chapterMindmap,
    `subchapter|${subChapterId}`,
  )

  const { subchapters: subchaptersToComplete, chapters: chaptersToComplete } =
    mindMapIdsToDbIds(entitiesToComplete)

  // Compute next ids that will be in progress
  const nextTreeState = computeTreeWithCompletedNodes(
    chapterMindmap,
    entitiesToComplete,
  )

  const nextInProgressNodes = getNextInProgressNodes(nextTreeState)

  const { subchapters: nextInProgressSubchapters } =
    mindMapIdsToDbIds(nextInProgressNodes)

  // Update the user chapter state, including the subchapters and lessons
  const currentChapterOperations = prisma.$transaction([
    // mark completed subchapters as done
    prisma.userSubChapter.deleteMany({
      where: { userId, subchapterId: { in: subchaptersToComplete } },
    }),
    prisma.userSubChapter.createMany({
      data: subchaptersToComplete.map((subchapterId) => ({
        userId,
        state: UserState.DONE,
        subchapterId,
      })),
    }),

    // mark next subchapters as in progress
    prisma.userSubChapter.deleteMany({
      where: { userId, subchapterId: { in: nextInProgressSubchapters } },
    }),
    prisma.userSubChapter.createMany({
      data: nextInProgressSubchapters.map((subchapterId) => ({
        userId,
        state: UserState.IN_PROGRESS,
        subchapterId,
      })),
    }),

    // mark completed chapters as done
    prisma.userChapter.deleteMany({
      where: { userId, chapterId: { in: chaptersToComplete } },
    }),
    prisma.userChapter.createMany({
      data: chaptersToComplete.map((chapterId) => ({
        userId,
        state: UserState.DONE,
        chapterId,
      })),
    }),
  ])

  return Promise.all([
    currentChapterOperations,
    ...includeOption(
      !!subchaptersToComplete.length,
      unlockSubchaptersQuizzes(subchaptersToComplete, userId),
    ),
    ...(chaptersToComplete.length && chaptersToComplete[0]
      ? [markNextChapterInProgress(chaptersToComplete[0], userId)]
      : []),

    ...(nextInProgressSubchapters.length && nextInProgressSubchapters[0]
      ? [
          markLessonFromNextSubchapterInProgress(
            nextInProgressSubchapters[0],
            userId,
          ),
        ]
      : []),
  ])
}

async function unlockSubchaptersQuizzes(
  subchapterIds: number[],
  userId: string,
) {
  const quizzes = await prisma.quiz.findMany({
    where: { subchapterId: { in: subchapterIds } },
    select: { id: true },
  })

  return prisma.$transaction([
    prisma.userQuiz.deleteMany({
      where: { userId, quizId: { in: quizzes.map((q) => q.id) } },
    }),
    prisma.userQuiz.createMany({
      data: quizzes.map((q) => ({
        userId,
        quizId: q.id,
        state: UserState.IN_PROGRESS,
      })),
    }),
  ])
}

//////////////// LOGIC for Lesson trees - Completion goes from root to leaf ///////////////////////////////////

export function findNextInProgress(
  tree: MindmapTree,
  completedNode: MindmapTree | null,
): { completed?: MindmapId | null; nextInProgress: MindmapId | null } {
  if (!completedNode) {
    return { nextInProgress: null }
  }
  const nextInProgress = getFirstChildLocked(completedNode)
  if (nextInProgress) {
    // special case for nodes with noPopup. Guaranteed to have children
    if (nextInProgress.attributes.noPopup) {
      return {
        completed: nextInProgress.id,
        nextInProgress: nextInProgress.children[0]?.id ?? null,
      }
    }
    return {
      nextInProgress: nextInProgress.id,
    }
  }

  return findNextInProgress(tree, getClosestParent(tree, completedNode.id))
}
