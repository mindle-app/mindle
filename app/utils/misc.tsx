import { useFormAction, useNavigation } from '@remix-run/react'
import { clsx, type ClassValue } from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSpinDelay } from 'spin-delay'
import { extendTailwindMerge } from 'tailwind-merge'
import { extendedTheme } from './extended-theme.ts'

export function makeGetEntityImgSrc(entity: string) {
  return (imageId: string) => `/resources/${entity}/${imageId}`
}
export function getUserImgSrc(imageId?: string | null) {
  return imageId ? `/resources/user-images/${imageId}` : '/img/user.png'
}

export function getChapterImgSrc(imageId: string) {
  return `/resources/chapter-image/${imageId}`
}

export function getLessonImgSrc(imageId: string, noCache = false) {
  return `/resources/lesson-image/${imageId}${noCache ? `?no-cache=true` : ''}`
}

export function getSubjectImgSrc(imageId: string) {
  return `/resources/subject-image/${imageId}`
}
export function getNoteImgSrc(imageId: string) {
  return `/resources/note-images/${imageId}`
}

export const getAuthorImgSrc = makeGetEntityImgSrc('author-image')

export function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof error.data === 'string'
  ) {
    return error.data
  }
  console.error('Unable to get error message for error', error)
  return 'Unknown Error'
}

export async function fetchChapterSVG(imageId: string): Promise<string> {
  const response = await fetch(getChapterImgSrc(imageId))
  if (!response.ok) {
    return ''
  }
  return response.text()
}

function formatColors() {
  const colors = []
  for (const [key, color] of Object.entries(extendedTheme.colors)) {
    if (typeof color === 'string') {
      colors.push(key)
    } else {
      const colorGroup = Object.keys(color).map((subKey) =>
        subKey === 'DEFAULT' ? '' : subKey,
      )
      colors.push({ [key]: colorGroup })
    }
  }
  return colors
}

const customTwMerge = extendTailwindMerge<string, string>({
  extend: {
    theme: {
      colors: formatColors(),
      borderRadius: Object.keys(extendedTheme.borderRadius),
    },
    classGroups: {
      'font-size': [
        {
          text: Object.keys(extendedTheme.fontSize),
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}

export function getDomainUrl(request: Request) {
  const host =
    request.headers.get('X-Forwarded-Host') ??
    request.headers.get('host') ??
    new URL(request.url).host
  const protocol = request.headers.get('X-Forwarded-Proto') ?? 'http'
  return `${protocol}://${host}`
}

export function getReferrerRoute(request: Request) {
  // spelling errors and whatever makes this annoyingly inconsistent
  // in my own testing, `referer` returned the right value, but 🤷‍♂️
  const referrer =
    request.headers.get('referer') ??
    request.headers.get('referrer') ??
    request.referrer
  const domain = getDomainUrl(request)
  if (referrer?.startsWith(domain)) {
    return referrer.slice(domain.length)
  } else {
    return '/'
  }
}

/**
 * Merge multiple headers objects into one (uses set so headers are overridden)
 */
export function mergeHeaders(
  ...headers: Array<ResponseInit['headers'] | null | undefined>
) {
  const merged = new Headers()
  for (const header of headers) {
    if (!header) continue
    for (const [key, value] of new Headers(header).entries()) {
      merged.set(key, value)
    }
  }
  return merged
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(
  ...headers: Array<ResponseInit['headers'] | null | undefined>
) {
  const combined = new Headers()
  for (const header of headers) {
    if (!header) continue
    for (const [key, value] of new Headers(header).entries()) {
      combined.append(key, value)
    }
  }
  return combined
}

/**
 * Combine multiple response init objects into one (uses combineHeaders)
 */
export function combineResponseInits(
  ...responseInits: Array<ResponseInit | null | undefined>
) {
  let combined: ResponseInit = {}
  for (const responseInit of responseInits) {
    combined = {
      ...responseInit,
      headers: combineHeaders(combined.headers, responseInit?.headers),
    }
  }
  return combined
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 *
 * Defaults state to 'non-idle'
 *
 * NOTE: the default formAction will include query params, but the
 * navigation.formAction will not, so don't use the default formAction if you
 * want to know if a form is submitting without specific query params.
 */
export function useIsPending({
  formAction,
  formMethod = 'POST',
  state = 'non-idle',
}: {
  formAction?: string
  formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
  state?: 'submitting' | 'loading' | 'non-idle'
} = {}) {
  const contextualFormAction = useFormAction()
  const navigation = useNavigation()
  const isPendingState =
    state === 'non-idle'
      ? navigation.state !== 'idle'
      : navigation.state === state
  return (
    isPendingState &&
    navigation.formAction === (formAction ?? contextualFormAction) &&
    navigation.formMethod === formMethod
  )
}

/**
 * This combines useSpinDelay (from https://npm.im/spin-delay) and useIsPending
 * from our own utilities to give you a nice way to show a loading spinner for
 * a minimum amount of time, even if the request finishes right after the delay.
 *
 * This avoids a flash of loading state regardless of how fast or slow the
 * request is.
 */
export function useDelayedIsPending({
  formAction,
  formMethod,
  delay = 400,
  minDuration = 300,
}: Parameters<typeof useIsPending>[0] &
  Parameters<typeof useSpinDelay>[1] = {}) {
  const isPending = useIsPending({ formAction, formMethod })
  const delayedIsPending = useSpinDelay(isPending, {
    delay,
    minDuration,
  })
  return delayedIsPending
}

function callAll<Args extends Array<unknown>>(
  ...fns: Array<((...args: Args) => unknown) | undefined>
) {
  return (...args: Args) => fns.forEach((fn) => fn?.(...args))
}

/**
 * Use this hook with a button and it will make it so the first click sets a
 * `doubleCheck` state to true, and the second click will actually trigger the
 * `onClick` handler. This allows you to have a button that can be like a
 * "are you sure?" experience for the user before doing destructive operations.
 */
export function useDoubleCheck() {
  const [doubleCheck, setDoubleCheck] = useState(false)

  function getButtonProps(
    props?: React.ButtonHTMLAttributes<HTMLButtonElement>,
  ) {
    const onBlur: React.ButtonHTMLAttributes<HTMLButtonElement>['onBlur'] =
      () => setDoubleCheck(false)

    const onClick: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'] =
      doubleCheck
        ? undefined
        : (e) => {
            e.preventDefault()
            setDoubleCheck(true)
          }

    const onKeyUp: React.ButtonHTMLAttributes<HTMLButtonElement>['onKeyUp'] = (
      e,
    ) => {
      if (e.key === 'Escape') {
        setDoubleCheck(false)
      }
    }

    return {
      ...props,
      onBlur: callAll(onBlur, props?.onBlur),
      onClick: callAll(onClick, props?.onClick),
      onKeyUp: callAll(onKeyUp, props?.onKeyUp),
    }
  }

  return { doubleCheck, getButtonProps }
}

/**
 * Simple debounce implementation
 */
function debounce<Callback extends (...args: Parameters<Callback>) => void>(
  fn: Callback,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<Callback>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Debounce a callback function
 */
export function useDebounce<
  Callback extends (...args: Parameters<Callback>) => ReturnType<Callback>,
>(callback: Callback, delay: number) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })
  return useMemo(
    () =>
      debounce(
        (...args: Parameters<Callback>) => callbackRef.current(...args),
        delay,
      ),
    [delay],
  )
}

export async function downloadFile(url: string, retries: number = 0) {
  const MAX_RETRIES = 3
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image with status ${response.status}`)
    }
    const contentType = response.headers.get('content-type') ?? 'image/jpg'
    const blob = Buffer.from(await response.arrayBuffer())
    return { contentType, blob }
  } catch (e) {
    if (retries > MAX_RETRIES) throw e
    return downloadFile(url, retries + 1)
  }
}

export function includeOption<T>(condition: boolean, value: T | T[]) {
  return condition ? [...(Array.isArray(value) ? value : [value])] : []
}

export function normalizeRomanianName(name: string) {
  const diacriticMap: Record<string, string | undefined> = {
    ă: 'a',
    î: 'i',
    ț: 't',
    â: 'a',
    ș: 's',
    Ă: 'A',
    Î: 'I',
    Ț: 'T',
    Â: 'A',
    Ș: 'S',
  }

  return name
    .toLowerCase()
    .split('')
    .map((char) => diacriticMap[char] ?? char)
    .join('')
}

export function stripHtmlTags(html: string) {
  return html.replace(/<[^>]*>/g, '')
}

/** Copy richly formatted text.
 *
 * @param rich - the text formatted as HTML
 * @param plain - a plain text fallback
 */
export async function copyRichText(rich: string, plain = stripHtmlTags(rich)) {
  if (typeof ClipboardItem !== 'undefined') {
    // Shiny new Clipboard API, not fully supported in Firefox.
    // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#browser_compatibility
    const html = new Blob([rich], { type: 'text/html' })
    const text = new Blob([plain], { type: 'text/plain' })
    const data = new ClipboardItem({ 'text/html': html, 'text/plain': text })
    await navigator.clipboard.write([data])
  } else {
    const listener = (e: ClipboardEvent) => {
      e.clipboardData?.setData('text/html', rich)
      e.clipboardData?.setData('text/plain', plain)
      e.preventDefault()
    }
    // Fallback using the deprecated `document.execCommand`.
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#browser_compatibility
    document.addEventListener('copy', listener)
    document.execCommand('copy')
    document.removeEventListener('copy', listener)
  }
}
