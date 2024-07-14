import { Link } from '@remix-run/react'
import { UserState } from '#app/utils/user.js'
import { Icon } from './ui/icon'
import { cn } from '#app/utils/misc.js'

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
        `group flex h-16 w-full cursor-pointer justify-between overflow-hidden border-2 border-solid bg-card transition-all duration-300 ease-in-out hover:border-foreground md:rounded-lg 2xl:h-24`,
        {
          'border-locked': isLocked,
          'border-active-border': isInProgress,
          'border-complete': isCompleted,
        },
      )}
    >
      <div
        className={cn(
          `h-full flex-none items-center border-0 border-r-2 p-4 transition-all duration-300 ease-in-out group-hover:border-foreground`,
          {
            'border-active bg-active group-hover:bg-active-foreground':
              isInProgress,
            'border-complete bg-complete group-hover:bg-complete-foreground':
              isCompleted,
            'border-locked bg-locked group-hover:bg-locked-foreground':
              isLocked,
          },
        )}
      >
        <div
          className={cn(
            `flex h-8 w-8 flex-1 items-center justify-center rounded-full border-2 border-opacity-20 transition-all duration-300 ease-in-out group-hover:border-foreground group-hover:bg-card md:h-8 md:w-8 2xl:h-16 2xl:w-16 2xl:gap-2.5`,
            {
              'border-active-border bg-active-foreground': isInProgress,
              'border-complete-border bg-complete-foreground': isCompleted,
              'bg-locked-foreground border-locked-border': isLocked,
            },
          )}
        >
          <div className="font-['Co Headline'] font-bold leading-loose text-card transition-all duration-300 ease-in-out group-hover:text-card-foreground">
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
          `flex h-full flex-none items-center justify-center border-0 border-l-2 bg-card p-4 transition-all duration-300 ease-in-out group-hover:border-foreground`,
          {
            'border-active-border': isInProgress,
            'border-complete-border': isCompleted,
            'border-locked-border': isLocked,
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
