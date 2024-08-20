import { type LoaderFunctionArgs } from '@remix-run/node'
import { redirectWithToast } from '#app/utils/toast.server.js'
import { type LearningTIme, type Motivation } from '#app/utils/welcome-form.js'
import { createFormAnswersHeaders } from '#app/utils/welcome-form.server.js'

export async function loader({ request }: LoaderFunctionArgs) {
  const sp = new URL(request.url).searchParams
  const headers = await createFormAnswersHeaders({
    motivation: sp.get('q1') as Motivation,
    examSubjects: sp.get('q2') as string,
    highSchoolId: sp.get('q3') as string,
    bestLearningTime: sp.get('q4') as LearningTIme,
  })

  return redirectWithToast(
    '/signup',
    {
      title: 'Bine ai venit!',
      description: 'Creează cont pentru a începe',
    },
    { headers },
  )
}
