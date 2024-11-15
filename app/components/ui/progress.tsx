import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'h-4 w-full overflow-hidden rounded-full bg-secondary',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export function ProgressWithPercent({
  value,
  percentClassName,
  containerClassName,

  ...props
}: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  percentClassName?: string | undefined
  containerClassName?: string | undefined
}) {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      <Progress value={value} {...props} />
      {value ? (
        <div
          className={cn(
            `absolute top-5 w-full text-primary-foreground`,
            percentClassName,
          )}
          style={{ left: `${value / 2}%` }}
        >
          {value}%
        </div>
      ) : null}
    </div>
  )
}

export { Progress }
