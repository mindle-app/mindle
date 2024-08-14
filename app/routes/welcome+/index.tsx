import { type LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/react'
import { questions } from './_layout'

export function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const step = searchParams.get('step') ?? '1'
  const type = questions[step]?.type
  const strSearchParams = request.url.split('?')[1]
  return redirect(`/welcome/${type}?${strSearchParams ?? ''}`)
}
