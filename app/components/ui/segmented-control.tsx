import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { cn } from '#app/utils/misc.js'
import {
  type ComponentPropsWithout,
  type RemovedProps,
} from '#app/utils/prop-def.js'

interface SegmentedControlRootProps
  extends ComponentPropsWithout<'div', RemovedProps | 'dir'> {
  value?: string
  defaultValue?: string
  onValueChange?(value: string): void
}

export const SegmentedControlRoot = React.forwardRef<
  HTMLDivElement,
  SegmentedControlRootProps
>((props, forwardedRef) => {
  const {
    className,
    children,
    value: valueProp,
    defaultValue: defaultValueProp,
    onValueChange: onValueChangeProp,
    ...rootProps
  } = props

  // Compute a map of values to indices and count the items
  const { valueToIndexMap, itemCount } = React.useMemo(() => {
    let map: Record<string, number> = {}
    let count = 0
    React.Children.forEach(children, (child, index) => {
      if (
        React.isValidElement(child) &&
        (child.props as { value: string }).value
      ) {
        map[child.props.value] = index
        count++
      }
    })
    return { valueToIndexMap: map, itemCount: count }
  }, [children])

  const [value, setValue] = useControllableState({
    prop: valueProp,
    onChange: onValueChangeProp,
    defaultProp: defaultValueProp,
  })
  const selectedIndex = value !== undefined ? valueToIndexMap[value] ?? 0 : 0

  return (
    <ToggleGroupPrimitive.Root
      ref={forwardedRef}
      className={cn(
        'align-center group relative isolate inline-grid min-w-max auto-cols-fr grid-flow-col items-stretch rounded-full border border-active-border p-0 text-center text-foreground',
        className,
      )}
      onValueChange={(value) => {
        if (value) {
          setValue(value)
        }
      }}
      {...rootProps}
      type="single"
      style={{
        '--selected-index': selectedIndex,
        '--item-count': itemCount,
      }}
      value={value}
      asChild={false}
      disabled={false}
    >
      {children}
      <div
        className={cn(
          'transition-ftransform pointer-events-none absolute left-0 top-0 -z-[1] h-full rounded-3xl duration-100 ease-in-out',
          "before:absolute before:inset-[0.01px] before:rounded-full before:bg-primary before:content-['']",
          'group-data-[state=on]/item:block',
          'w-[calc(100%/var(--item-count))]',
          'translate-x-[calc(var(--selected-index)*100%)]',
        )}
      />
    </ToggleGroupPrimitive.Root>
  )
})

SegmentedControlRoot.displayName = 'SegmentedControl.Root'

interface SegmentedControlItemOwnProps {
  value: string
}

interface SegmentedControlItemProps
  extends ComponentPropsWithout<
      typeof ToggleGroupPrimitive.Item,
      RemovedProps | 'disabled' | 'type' | 'value'
    >,
    SegmentedControlItemOwnProps {}

export const SegmentedControlItem = React.forwardRef<
  HTMLButtonElement,
  SegmentedControlItemProps
>(({ children, className, ...props }, forwardedRef) => (
  <ToggleGroupPrimitive.Item
    ref={forwardedRef}
    className={cn(
      'group/item flex select-none items-stretch rounded-2xl p-2',
      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-primary',
      className,
    )}
    {...props}
    disabled={false}
    asChild={false}
  >
    <span className="flex flex-grow items-center justify-center rounded-2xl">
      <span className="group-data[state=on]/item:ease-out font-bold text-primary-foreground opacity-0 transition-opacity duration-100 ease-in group-data-[state=on]/item:opacity-100">
        {children}
      </span>
      <span className="absolute font-normal opacity-100 transition-opacity duration-100 ease-out group-data-[state=on]/item:opacity-0 group-data-[state=on]/item:ease-in">
        {children}
      </span>
    </span>
  </ToggleGroupPrimitive.Item>
))

SegmentedControlItem.displayName = 'SegmentedControl.Item'

export type {
  SegmentedControlRootProps as RootProps,
  SegmentedControlItemProps as ItemProps,
}
