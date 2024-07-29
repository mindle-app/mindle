import { forwardRef } from 'react'
import { Icon, type IconName } from '#app/components/ui/icon.js'
import { cn } from '#app/utils/misc.js'

export type CommandButtonProps = {
  active?: boolean
  description: string
  icon: IconName
  onClick: () => void
  title: string
}

export const CommandButton = forwardRef<HTMLButtonElement, CommandButtonProps>(
  ({ active, icon, onClick, title }, ref) => {
    const wrapperClass = cn(
      'flex items-center justify-start gap-2 rounded p-1.5 text-xs font-semibold text-neutral-500',
      !active && 'bg-transparent hover:bg-neutral-50 hover:text-black',
      active && 'bg-neutral-100 text-black hover:bg-neutral-100',
    )

    return (
      <button ref={ref} onClick={onClick} className={wrapperClass}>
        <Icon name={icon} className="h-3 w-3" />
        <div className="flex flex-col items-start justify-start">
          <div className="text-sm font-medium">{title}</div>
        </div>
      </button>
    )
  },
)

CommandButton.displayName = 'CommandButton'