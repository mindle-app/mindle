import { Link, useSearchParams } from '@remix-run/react'
import { cn } from '#app/utils/misc.js'
import { withParam } from '#app/utils/search-params.js'
import { questions } from './_layout.tsx'

export default function SingleOption() {
  const [searchParams] = useSearchParams()
  const step = searchParams.get('step') ?? '1'
  const question = questions[step]
  if (question?.type !== 'single') {
    return null
  }
  const options = question.options
  const userAnswer = searchParams.get(`q${step}`)

  return (
    <>
      {(options ?? []).map((option) => {
        let isSelected = userAnswer === option
        return (
          <Link
            key={option}
            to={`?${withParam(searchParams, `q${step}`, option)}`}
            className={cn(
              'rounded-xl border bg-card p-4 text-lg hover:border-primary/60',
              {
                'border-primary bg-primary/10 text-primary': isSelected,
              },
            )}
          >
            {option}
          </Link>
        )
      })}
    </>
  )
}
