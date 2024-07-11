import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import { type PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'
import { promiseHash } from 'remix-utils/promise'
import { z } from 'zod'
import bio from './fixtures/data/biology.json'
import { downloadFile } from '#app/utils/misc.js'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createUser() {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  const username = uniqueUsernameEnforcer
    .enforce(() => {
      return (
        faker.string.alphanumeric({ length: 2 }) +
        '_' +
        faker.internet.userName({
          firstName: firstName.toLowerCase(),
          lastName: lastName.toLowerCase(),
        })
      )
    })
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
  return {
    username,
    name: `${firstName} ${lastName}`,
    email: `${username}@example.com`,
  }
}

export function createPassword(password: string = faker.internet.password()) {
  return {
    hash: bcrypt.hashSync(password, 10),
  }
}

let noteImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getNoteImages() {
  if (noteImages) return noteImages

  noteImages = await Promise.all([
    img({
      altText: 'a nice country house',
      filepath: './tests/fixtures/images/notes/0.png',
    }),
    img({
      altText: 'a city scape',
      filepath: './tests/fixtures/images/notes/1.png',
    }),
    img({
      altText: 'a sunrise',
      filepath: './tests/fixtures/images/notes/2.png',
    }),
    img({
      altText: 'a group of friends',
      filepath: './tests/fixtures/images/notes/3.png',
    }),
    img({
      altText: 'friends being inclusive of someone who looks lonely',
      filepath: './tests/fixtures/images/notes/4.png',
    }),
    img({
      altText: 'an illustration of a hot air balloon',
      filepath: './tests/fixtures/images/notes/5.png',
    }),
    img({
      altText:
        'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
      filepath: './tests/fixtures/images/notes/6.png',
    }),
    img({
      altText: 'a rusty lock',
      filepath: './tests/fixtures/images/notes/7.png',
    }),
    img({
      altText: 'something very happy in nature',
      filepath: './tests/fixtures/images/notes/8.png',
    }),
    img({
      altText: `someone at the end of a cry session who's starting to feel a little better.`,
      filepath: './tests/fixtures/images/notes/9.png',
    }),
  ])

  return noteImages
}

let userImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getUserImages() {
  if (userImages) return userImages

  userImages = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      img({ filepath: `./tests/fixtures/images/user/${index}.jpg` }),
    ),
  )

  return userImages
}

export async function getBiologyImage() {
  return img({
    altText: 'a biology atom',
    filepath: './tests/fixtures/images/subject/biology.png',
  })
}

// Array of chapter-id: image
export async function getChapterImages() {
  return await promiseHash({
    1: img({
      filepath: `./tests/fixtures/images/chapters/1.svg`,
      altText: 'Representation of the human body',
    }),
    2: img({
      filepath: `./tests/fixtures/images/chapters/2.svg`,
      altText: 'The human brain',
    }),

    4: img({
      filepath: `./tests/fixtures/images/chapters/4.svg`,
      altText: 'Hipofiza',
    }),
    5: img({
      filepath: `./tests/fixtures/images/chapters/5.svg`,
      altText: 'Flexing biceps',
    }),
    7: img({
      filepath: `./tests/fixtures/images/chapters/7.svg`,
      altText: 'Stomach',
    }),
    8: img({
      filepath: `./tests/fixtures/images/chapters/8.svg`,
      altText: 'Human heart',
    }),
    9: img({
      filepath: `./tests/fixtures/images/chapters/9.svg`,
      altText: 'Human lungs',
    }),
    10: img({
      filepath: `./tests/fixtures/images/chapters/10.svg`,
      altText: 'Kidneys',
    }),
    11: img({
      filepath: `./tests/fixtures/images/chapters/11.svg`,
      altText: 'Male and female symbols',
    }),
    12: img({
      filepath: `./tests/fixtures/images/chapters/12.svg`,
      altText: 'Chemical components',
    }),
    13: img({
      filepath: `./tests/fixtures/images/chapters/13.svg`,
      altText: 'Genetic sequence',
    }),
    14: img({
      filepath: `./tests/fixtures/images/chapters/14.svg`,
      altText: 'Hands holding Earth',
    }),
  })
}

export async function img({
  altText,
  filepath,
}: {
  altText?: string
  filepath: string
}) {
  return {
    altText,
    contentType: filepath.endsWith('.svg')
      ? 'image/svg+xml'
      : filepath.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg',
    blob: await fs.promises.readFile(filepath),
  }
}

export function mindleCMSUrl(imageId: string) {
  return `https://cms.mindle.ro/assets/${imageId}`
}

export async function downloadLessonImages(
  lessons: { id: number; image: string | undefined }[],
) {
  const promises = lessons
    .map(async (l) => {
      if (!l.image) {
        return null
      }
      try {
        const file = await downloadFile(mindleCMSUrl(l.image))
        return { lessonId: l.id, ...file }
      } catch (e) {
        return null
      }
    })
    .filter((l) => !!l)

  return await Promise.all(promises)
}

export async function cleanupDb(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<
    { name: string }[]
  >`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`
  // Disable FK constraints to avoid relation conflicts during deletion
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`)
  await prisma.$transaction([
    ...tables.map(({ name }) =>
      prisma.$executeRawUnsafe(`DELETE from "${name}"`),
    ),
  ])
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`)
}

function nullToUndefined<T>(value: T) {
  return value === null ? undefined : value
}

const bioSubjectSchema = z.object({
  chapters: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      subjectId: z.number(),
      chapterOrder: z.number(),
      nextChapterId: z.number().nullable(),
      subchapters: z.array(
        z.object({
          id: z.number(),
          displayId: z.string().nullable(),
          width: z.number().nullable().transform(nullToUndefined),
          height: z.number().nullable().transform(nullToUndefined),
          spacing: z.number().nullable().transform(nullToUndefined),
          nonSiblings: z.number().nullable().transform(nullToUndefined),
          chapterId: z.number(),
          name: z.string(),
          order: z.number().nullable(),
          depth: z.number(),
          image: z.string().nullable(),
          nextSubchapterId: z.number().nullable().transform(nullToUndefined),
          lessons: z.array(
            z.object({
              id: z.number(),
              displayId: z.string().nullable(),
              width: z.number().nullable(),
              height: z.number().nullable(),
              spacing: z.number().nullable(),
              nonSiblings: z.number().nullable(),
              subchapterId: z.number(),
              name: z.string(),
              order: z.number().nullable(),
              depth: z.number(),
              image: z.string().nullable(),
              noPopup: z.boolean(),
              description: z.string().nullable(),
            }),
          ),
        }),
      ),
    }),
  ),
})

export function getBiologyChapters() {
  const { chapters } = bioSubjectSchema.parse(bio)
  return chapters
}
