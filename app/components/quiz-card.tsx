import { Link } from '@remix-run/react'
import { cn } from '#app/utils/misc'
import { UserState } from '#app/utils/user'
import { Card, CardContent, CardFooter } from './ui/card'

export type Quiz = {
  id: number
  name: string
  score: number | null
  state: UserState
}
export function QuizCard({ name, id, score, state }: Quiz) {
  const isInProgress = state === UserState.IN_PROGRESS
  const isCompleted = state === UserState.DONE
  const isLocked = state === UserState.LOCKED

  return (
    <Link to={`/quiz/${id}`} aria-disabled={isLocked}>
      <Card
        className={cn(
          'group overflow-hidden border-2 border-disabled-border shadow-none transition-all duration-300 ease-in-out',
          {
            'hover:border-foreground': !isLocked,
            'border-active-border': isInProgress,
            'cursor-not-allowed': isLocked,
            'border-complete-border': isCompleted,
          },
        )}
      >
        <CardContent
          className={cn(
            `flex items-center justify-center border-b-2 px-5 pt-7 transition-all duration-300 ease-in-out`,
            {
              'group-hover:border-foreground': !isLocked,
              'border-disabled-border bg-disabled': isLocked,
              'border-active-border bg-active group-hover:bg-active-foreground':
                isInProgress,
              'border-complete-border bg-complete group-hover:bg-complete-foreground':
                isCompleted,
            },
          )}
        >
          <div
            className={cn(
              'default-transition flex items-center justify-center rounded-full border-2 border-disabled-border bg-disabled-foreground',
              {
                'border-active-border bg-active-foreground group-hover:bg-card dark:group-hover:bg-primary':
                  isInProgress,
                'border-complete-border bg-complete-foreground group-hover:bg-card dark:group-hover:bg-complete':
                  isCompleted,
                'group-hover:border-foreground': !isLocked,
              },
            )}
          >
            <span
              className={cn(
                'default-transition px-5 py-4 text-center font-coHeadlineBold text-xl text-primary-foreground',
                {
                  'dark:text-card': isInProgress || isCompleted,
                  'group-hover:text-card-foreground': !isLocked,
                },
              )}
            >
              {name}
            </span>
          </div>
        </CardContent>
        <CardFooter className="w-full p-2 text-center font-poppins font-bold leading-none md:text-xs 2xl:p-4 2xl:text-base">
          <span className="w-full text-lg 2xl:text-base">
            {score ? `${score}%` : 'Fără scor'}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
