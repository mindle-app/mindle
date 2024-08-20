import { Link, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
import { cn } from '#app/utils/misc.js'
import { withParam } from '#app/utils/search-params.js'
import { getStep, questions } from '#app/utils/welcome-form.js'

export default function WelcomeForm() {
  const [searchParams] = useSearchParams()
  const step = getStep(searchParams)
  const question = questions[step]
  if (question?.type !== 'multi') {
    return null
  }
  const options = question.options
  const userAnswer = searchParams.get(`q${step}`)
  let parsedMultiAnswer: Set<string> = new Set()
  if (userAnswer) {
    const result = z.array(z.string()).safeParse(JSON.parse(userAnswer))
    if (result.success) {
      parsedMultiAnswer = new Set(result.data)
    }
  }

  return (
    <>
      {(options ?? []).map((option) => {
        const nextSet = new Set(parsedMultiAnswer)
        let isSelected = nextSet.has(option.text)
        let nextValue: string
        if (isSelected) {
          nextSet.delete(option.text)
        } else {
          nextSet.add(option.text)
        }

        nextValue = JSON.stringify([...nextSet])
        return (
          <Link
            key={option.text}
            to={`/welcome?${withParam(searchParams, `q${step}`, nextValue)}`}
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
