import { Link, Outlet, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
import { MindleHead } from '#app/components/illustrations/mindle-head.js'
import { Icon } from '#app/components/ui/icon.js'
import { LinkButton } from '#app/components/ui/link-button.js'
import { Progress } from '#app/components/ui/progress.js'
import { cn } from '#app/utils/misc.js'
import { withParam } from '#app/utils/search-params.js'
import { getStep, questions } from '#app/utils/welcome-form.js'

function MessageBubble({
  question,
  className,
}: {
  question: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-primary bg-primary-orange-100 px-4 py-6 dark:bg-primary-orange-700',
        className,
      )}
    >
      <div className="rounded-xs absolute left-0 top-1/2 z-50 h-2 w-2 -translate-x-[65%] -translate-y-1/2 rotate-45 transform border-b-2 border-l-2 border-primary bg-primary-orange-50 dark:bg-primary-orange-700"></div>

      <p className="text-lg font-bold text-foreground">{question}</p>
    </div>
  )
}

const MultiAnswerSchema = z.array(z.string()).min(1)

export default function WelcomeForm() {
  const [searchParams] = useSearchParams()
  const step = getStep(searchParams)
  const stepNum = Number(step)
  const welcomeQuestion = questions[step]
  const question = welcomeQuestion.question
  const userAnswer = searchParams.get(`q${step}`)
  let userCanContinue = step === '5'
  if (userAnswer) {
    if (welcomeQuestion.type === 'multi') {
      const answer = JSON.parse(userAnswer)
      const result = MultiAnswerSchema.safeParse(answer)
      userCanContinue = result.success
    } else {
      userCanContinue = !!userAnswer
    }
  }
  return (
    <div className="container flex h-screen flex-col">
      <div className="flex flex-grow overflow-hidden">
        <main className="items-cetner flex flex-grow flex-col gap-4 overflow-scroll p-5 2xl:p-9">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Link
                to={`/welcome?${withParam(searchParams, 'step', String(step === '1' ? step : Number(step) - 1))}`}
                aria-disabled={step === '1'}
                className={cn('flex items-center', {
                  'pointer-events-none opacity-0': step === '1',
                })}
              >
                <Icon name={'chevron-left'} className="text-foreground" />
              </Link>
              <Progress value={(stepNum / 5) * 100} className="h-2" />
              <LinkButton
                to={
                  step !== '5'
                    ? `/welcome?${withParam(searchParams, 'step', String(Number(step) + 1))}`
                    : `/welcome/submit?${searchParams}`
                }
                linkProps={{
                  // https://github.com/remix-run/react-router/issues/1082
                  className: cn({
                    'pointer-events-none': !userCanContinue,
                  }),
                }}
                buttonProps={{
                  variant: 'default',
                  disabled: !userCanContinue,
                }}
              >
                <Icon name={'chevron-right'} />
              </LinkButton>
            </div>
            <section className="flex animate-slide-left items-center gap-2">
              <MindleHead className="flex-shrink-0" />
              <MessageBubble className="flex-grow" question={question ?? ''} />
            </section>
            <section className="flex animate-slide-left flex-col gap-6">
              <Outlet />
            </section>
          </div>
          <div className="flex h-full w-full items-center justify-center">
            <LinkButton
              to={
                step !== '5'
                  ? `/welcome?${withParam(searchParams, 'step', String(Number(step) + 1))}`
                  : `/welcome/submit?${searchParams}`
              }
              linkProps={{
                // https://github.com/remix-run/react-router/issues/1082
                className: cn({ 'pointer-events-none': !userCanContinue }),
              }}
              buttonProps={{
                variant: 'default',
                disabled: !userCanContinue,
                size: 'wide',
                className: 'rounded-full',
              }}
            >
              Continua
            </LinkButton>
          </div>
        </main>
      </div>
    </div>
  )
}
