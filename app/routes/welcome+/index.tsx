import { type LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/react'
import { getStep, questions } from '#app/utils/welcome-form.js'

export function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const step = getStep(searchParams)
  const type = questions[step]?.type
  return redirect(`/welcome/${type}?${searchParams}`)
}
