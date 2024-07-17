import { cn } from '#app/utils/misc.js'
import { UserState } from '#app/utils/user.js'
import { Icon } from '../ui/icon'

export const ClickableElement = ({
  text,
  buttonText,
  state: state = UserState.LOCKED,
  isNextLesson,
}: {
  text: string
  buttonText: string
  state: UserState
  isNextLesson?: boolean
}) => {
  const isActive = state === UserState.IN_PROGRESS
  const isComplete = state === UserState.DONE
  const isLocked = state === UserState.LOCKED
  return (
    <div
      className={cn('group w-fit', {
        'relative rounded-2xl border-2 border-active-foreground p-2':
          isNextLesson,
      })}
      key={text + state}
    >
      <div
        className={cn(
          'default-transition inline-flex h-[100px] items-start justify-start overflow-hidden rounded-2xl border-2',
          {
            'border-active-border group-hover:border-foreground': isActive,
            'border-complete-border group-hover:border-foreground': isComplete,
            'border-disabled-border': isLocked,
          },
        )}
      >
        <div
          className={cn(
            'default-transition inline-flex w-[100px] flex-col items-center justify-center gap-6 self-stretch p-6',
            {
              'bg-active group-hover:bg-active-foreground': isActive,
              'bg-complete group-hover:bg-complete-foreground': isComplete,
              'bg-disabled': isLocked,
            },
          )}
        >
          <div
            className={cn(
              'default-transition flex h-16 w-16 items-center justify-center rounded-full border-2',
              {
                'group-hover:bg-card': isActive || isComplete,
                'border-active-border bg-active-foreground': isActive,
                'border-complete-border bg-complete-foreground': isComplete,
                'border-disabled-border bg-disabled-foreground': isLocked,
              },
            )}
          >
            <div
              className={cn(
                'default-transition font-coHeadline text-[32px] font-bold leading-loose text-card',
                { 'group-hover:text-card-foreground': isActive || isComplete },
              )}
            >
              {buttonText}
            </div>
          </div>
        </div>
        <div
          className={cn(
            'default-transition inline-flex shrink grow basis-0 flex-col items-center justify-center gap-2.5 self-stretch bg-card px-6 py-4',
            {
              'group-hover:bg-active': isActive,
              'group-hover:bg-complete': isComplete,
            },
          )}
        >
          <div
            className={`self-stretch text-center font-poppins text-2xl font-medium leading-[28.80px] text-foreground`}
          >
            {text}
          </div>
        </div>
      </div>
      {isNextLesson && (
        <div className="absolute right-[-30px] top-[-30px] rounded-full border-2 border-active-foreground bg-card p-2">
          <Icon name={'mindle-head'} className="stroke-sm h-12 w-12" />
        </div>
      )}
    </div>
  )
}
