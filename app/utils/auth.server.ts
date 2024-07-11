import { type Connection, type Password, type User } from '@prisma/client'
import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { Authenticator } from 'remix-auth'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { connectionSessionStorage, providers } from './connections.server.ts'
import { prisma } from './db.server.ts'
import { combineHeaders, downloadFile } from './misc.tsx'
import { type ProviderUser } from './providers/provider.ts'
import { authSessionStorage } from './session.server.ts'
import { UserState } from './user.ts'

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const sessionKey = 'sessionId'

export const authenticator = new Authenticator<ProviderUser>(
  connectionSessionStorage,
)

for (const [providerName, provider] of Object.entries(providers)) {
  authenticator.use(provider.getAuthStrategy(), providerName)
}

export async function getUserId(request: Request) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const sessionId = authSession.get(sessionKey)
  if (!sessionId) return null
  const session = await prisma.session.findUnique({
    select: { user: { select: { id: true } } },
    where: { id: sessionId, expirationDate: { gt: new Date() } },
  })
  if (!session?.user) {
    throw redirect('/', {
      headers: {
        'set-cookie': await authSessionStorage.destroySession(authSession),
      },
    })
  }
  return session.user.id
}

export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {},
) {
  const userId = await getUserId(request)
  if (!userId) {
    const requestUrl = new URL(request.url)
    redirectTo =
      redirectTo === null
        ? null
        : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
    const loginRedirect = ['/login', loginParams?.toString()]
      .filter(Boolean)
      .join('?')
    throw redirect(loginRedirect)
  }
  return userId
}

export async function requireAnonymous(request: Request) {
  const userId = await getUserId(request)
  if (userId) {
    throw redirect('/')
  }
}

export async function login({
  username,
  password,
}: {
  username: User['username']
  password: string
}) {
  const user = await verifyUserPassword({ username }, password)
  if (!user) return null
  const session = await prisma.session.create({
    select: { id: true, expirationDate: true, userId: true },
    data: {
      expirationDate: getSessionExpirationDate(),
      userId: user.id,
    },
  })
  return session
}

export async function resetUserPassword({
  username,
  password,
}: {
  username: User['username']
  password: string
}) {
  const hashedPassword = await getPasswordHash(password)
  return prisma.user.update({
    where: { username },
    data: {
      password: {
        update: {
          hash: hashedPassword,
        },
      },
    },
  })
}

// Get all the initial user content we'll mark as in progress when a
// user signs up. By default the chosen subject is bilogy (id = 1)
export async function getFirstUserContent(subjectId = 1) {
  const { id: firstChapterId } = await prisma.chapter.findFirstOrThrow({
    where: { subjectId },
    select: { id: true },
    orderBy: { chapterOrder: 'asc' },
  })
  const { id: firstSubchapterId } = await prisma.subChapter.findFirstOrThrow({
    select: { id: true },
    where: { chapterId: firstChapterId },
    orderBy: { order: 'asc' },
  })
  const { id: firstLessonId } = await prisma.lesson.findFirstOrThrow({
    select: { id: true },
    where: { subchapterId: firstSubchapterId },
    orderBy: { order: 'asc' },
  })

  return { firstChapterId, firstSubchapterId, firstLessonId }
}

export async function signup({
  email,
  username,
  password,
  name,
}: {
  email: User['email']
  username: User['username']
  name: User['name']
  password: string
}) {
  const hashedPassword = await getPasswordHash(password)

  const { firstChapterId, firstSubchapterId, firstLessonId } =
    await getFirstUserContent()
  const session = await prisma.session.create({
    data: {
      expirationDate: getSessionExpirationDate(),
      user: {
        create: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          name,
          roles: { connect: { name: 'user' } },
          userChapters: {
            create: [
              { chapterId: firstChapterId, state: UserState.IN_PROGRESS },
            ],
          },
          userSubchapters: {
            create: [
              { subchapterId: firstSubchapterId, state: UserState.IN_PROGRESS },
            ],
          },
          userLessons: {
            create: [{ lessonId: firstLessonId, state: UserState.IN_PROGRESS }],
          },
          password: {
            create: {
              hash: hashedPassword,
            },
          },
        },
      },
    },
    select: { id: true, expirationDate: true },
  })

  return session
}

export async function signupWithConnection({
  email,
  username,
  name,
  providerId,
  providerName,
  imageUrl,
}: {
  email: User['email']
  username: User['username']
  name: User['name']
  providerId: Connection['providerId']
  providerName: Connection['providerName']
  imageUrl?: string
}) {
  const { firstChapterId, firstSubchapterId, firstLessonId } =
    await getFirstUserContent()

  const session = await prisma.session.create({
    data: {
      expirationDate: getSessionExpirationDate(),
      user: {
        create: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          name,
          roles: { connect: { name: 'user' } },
          connections: { create: { providerId, providerName } },
          userChapters: {
            create: [
              { chapterId: firstChapterId, state: UserState.IN_PROGRESS },
            ],
          },
          userSubchapters: {
            create: [
              { subchapterId: firstSubchapterId, state: UserState.IN_PROGRESS },
            ],
          },
          userLessons: {
            create: [{ lessonId: firstLessonId, state: UserState.IN_PROGRESS }],
          },
          image: imageUrl
            ? { create: await downloadFile(imageUrl) }
            : undefined,
        },
      },
    },
    select: { id: true, expirationDate: true },
  })

  return session
}

export async function logout(
  {
    request,
    redirectTo = '/',
  }: {
    request: Request
    redirectTo?: string
  },
  responseInit?: ResponseInit,
) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const sessionId = authSession.get(sessionKey)
  // if this fails, we still need to delete the session from the user's browser
  // and it doesn't do any harm staying in the db anyway.
  if (sessionId) {
    // the .catch is important because that's what triggers the query.
    // learn more about PrismaPromise: https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismapromise-behavior
    void prisma.session.deleteMany({ where: { id: sessionId } }).catch(() => {})
  }
  throw redirect(safeRedirect(redirectTo), {
    ...responseInit,
    headers: combineHeaders(
      { 'set-cookie': await authSessionStorage.destroySession(authSession) },
      responseInit?.headers,
    ),
  })
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10)
  return hash
}

export async function verifyUserPassword(
  where: Pick<User, 'username'> | Pick<User, 'id'>,
  password: Password['hash'],
) {
  const userWithPassword = await prisma.user.findUnique({
    where,
    select: { id: true, password: { select: { hash: true } } },
  })

  if (!userWithPassword || !userWithPassword.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

  if (!isValid) {
    return null
  }

  return { id: userWithPassword.id }
}
