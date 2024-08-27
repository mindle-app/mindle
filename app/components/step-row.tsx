import { Link } from '@remix-run/react'
import { cn } from '#app/utils/misc.js'
import { UserState } from '#app/utils/user.js'
import { Icon } from './ui/icon'

interface StepRowProps {
  number: number
  title: string
  subtitle?: string
  state: UserState
  href: string
}

export function StepRow({
  number = 1,
  title,
  subtitle,
  state = UserState.LOCKED,
  href,
}: StepRowProps) {
  const isInProgress = state === UserState.IN_PROGRESS
  const isCompleted = state === UserState.DONE
  const isLocked = state === UserState.LOCKED

  return (
    <Link
      to={href}
      className={cn(
        `group flex h-16 w-full cursor-pointer justify-between overflow-hidden border border-solid border-disabled bg-card transition-all duration-300 ease-in-out md:rounded-lg 2xl:h-24`,
        {
          'cursor-not-allowed': isLocked,
          'hover:border-foreground': !isLocked,
          'border-primary/40': isInProgress,
          'border-emerald-500': isCompleted,
        },
      )}
    >
      <div
        className={cn(
          `lex-none items-center border-0 border-r border-disabled bg-disabled p-4 transition-all duration-300 ease-in-out`,
          {
            'border-primary/40 bg-primary/20 group-hover:bg-active-foreground dark:bg-primary/20':
              isInProgress,
            'border-emerald-500 bg-complete group-hover:bg-complete-foreground dark:bg-complete/40':
              isCompleted,
            'group-hover:border-foreground': !isLocked,
          },
        )}
      >
        <div
          className={cn(
            `flex h-8 w-8 flex-1 items-center justify-center rounded-full border border-disabled-border border-opacity-20 bg-disabled-foreground transition-all duration-300 ease-in-out md:h-8 md:w-8 2xl:h-16 2xl:w-16 2xl:gap-2.5`,
            {
              'group-hover:border-foreground group-hover:bg-card': !isLocked,
              'border-active-border bg-active-foreground dark:group-hover:bg-active':
                isInProgress,
              'border-complete-border bg-complete-foreground dark:group-hover:bg-complete':
                isCompleted,
            },
          )}
        >
          <div
            className={cn(
              "font-['Co Headline'] font-bold leading-loose text-card transition-all duration-300 ease-in-out",
              {
                'group-hover:text-card-foreground dark:group-hover:text-foreground':
                  !isLocked,
              },
            )}
          >
            {number}
          </div>
        </div>
      </div>
      <div className="flex-6 flex flex-grow flex-col justify-center md:pl-3 2xl:pl-6">
        <div>
          <h3 className="font-medium md:text-[10px] 2xl:text-lg">{title}</h3>
          <div className="font-normal md:text-sm lg:w-full 2xl:text-2xl">
            <span className="overflow-ellipsis whitespace-nowrap">
              {subtitle}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          `border-locked-border flex h-full flex-none items-center justify-center border-0 border-l-2 bg-card p-4 transition-all duration-300 ease-in-out`,
          {
            'group-hover:border-foreground': !isLocked,
            'border-active-border': isInProgress,
            'border-complete-border': isCompleted,
          },
        )}
      >
        <Icon
          name={'caret-right'}
          className="fill-foreground md:h-4 md:w-4 2xl:h-8 2xl:w-8"
        />
      </div>
    </Link>
  )
}
