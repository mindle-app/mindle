export function withParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null,
) {
  const newSearchParams = new URLSearchParams(searchParams)
  if (value === null) {
    newSearchParams.delete(key)
  } else {
    newSearchParams.set(key, value)
  }
  return newSearchParams
}
