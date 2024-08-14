import { Link, useSearchParams } from '@remix-run/react'
import { cn } from '#app/utils/misc.js'
import { withParam } from '#app/utils/search-params.js'
import { getStep, questions } from '#app/utils/welcome-form.js'

export default function SingleOption() {
  const [searchParams] = useSearchParams()
  const step = getStep(searchParams)
  const question = questions[step]
  if (question?.type !== 'single') {
    return null
  }
  const options = question.options
  const userAnswer = searchParams.get(`q${step}`)

  return (
    <>
      {(options ?? []).map((option) => {
        let isSelected = userAnswer === option.text
        return (
          <Link
            key={option.text}
            to={`?${withParam(searchParams, `q${step}`, option.text)}`}
            className={cn(
              'flex items-center gap-4 rounded-xl border bg-card p-4 text-lg hover:border-primary/60',
              {
                'border-primary bg-primary/10 text-primary': isSelected,
              },
            )}
          >
            <span className="text-3xl">{option.icon}</span>
            <span>{option.text}</span>
          </Link>
        )
      })}
    </>
  )
}
