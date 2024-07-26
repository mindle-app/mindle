import { type LucideProps } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { lazy, Suspense } from 'react'

const fallback = <div style={{ background: '#ddd', width: 24, height: 24 }} />

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof dynamicIconImports
}

export const LucideIcon = ({ name, ...props }: IconProps) => {
  const LuIcon = lazy(dynamicIconImports[name])

  return (
    <Suspense fallback={fallback}>
      <LuIcon {...props} />
    </Suspense>
  )
}
