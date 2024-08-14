import { createCookieSessionStorage } from '@remix-run/node'
import { type FormAnswersInput, FormAnswersSchema } from './welcome-form'

export const welcomeFormKey = 'welcome-form-answers'

export const welcomeFormSessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'en_welcome-form',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: process.env.SESSION_SECRET.split(','),
    secure: process.env.NODE_ENV === 'production',
  },
})

export async function createFormAnswersHeaders(formAnswers: FormAnswersInput) {
  const session = await welcomeFormSessionStorage.getSession()
  const answers = FormAnswersSchema.parse(formAnswers)
  session.set(welcomeFormKey, answers)
  const cookie = await welcomeFormSessionStorage.commitSession(session)
  return new Headers({ 'set-cookie': cookie })
}

export async function getFormAnswers(request: Request) {
  const session = await welcomeFormSessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const result = FormAnswersSchema.safeParse(session.get(welcomeFormKey))
  const answers = result.success ? result.data : null
  return {
    answers,
  }
}
