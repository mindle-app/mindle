import React, { useEffect, useState } from 'react'
import { cn } from '#app/utils/misc'

type Props = {
  src: string
  className?: string
}

export const SvgImage: React.FC<Props> = ({ src, className = '' }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch(src)
      .then((response) => {
        if (isMounted && response.ok) {
          response.text().then((svg) => {
            setSvgContent(svg)
          })
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      isMounted = false
    }
  }, [src])

  return (
    <div
      className={cn('[&>svg]:h-full [&>svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  )
}
