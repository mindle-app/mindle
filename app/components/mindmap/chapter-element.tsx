import { cn } from '#app/utils/misc.js'
import { UserState } from '#app/utils/user.js'
import { SvgImage } from '../svg-image'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Icon } from '../ui/icon'

export function ChapterElement({
  title,
  image,
  state,
}: {
  title: string
  image: string | null
  state: UserState
}) {
  const isActive = state === UserState.IN_PROGRESS
  const isComplete = state === UserState.DONE
  const isLocked = state === UserState.LOCKED
  return (
    <Card
      className={cn(
        'group min-w-52 overflow-hidden rounded-2xl border-2 border-solid pb-6 shadow-2xl delay-0 dark:shadow-none',
        {
          'shadow-active': isActive,
          'shadow-complete': isComplete,
          'shadow-locked': isLocked,
        },
      )}
    >
      <CardContent
        className={cn(
          'W-full flex items-center justify-center border-b-2 pt-6 transition-all duration-300 ease-in-out',
          {
            'bg-active group-hover:bg-active-foreground': isActive,
          },
        )}
      >
        {image ? (
          <SvgImage
            src={image}
            className={cn('h-24 w-24 stroke-transparent', {
              'fill-active-svg delay-0': isActive,
            })}
          />
        ) : (
          <Icon
            name={'brain'}
            className="aspect-square w-24 max-w-full object-contain object-center"
          />
        )}
      </CardContent>
      <CardFooter className="pt-6 text-center font-poppinsBold text-3xl font-medium leading-7">
        {title}
      </CardFooter>
    </Card>
  )
}
