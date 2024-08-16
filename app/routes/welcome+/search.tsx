import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Form,
  Link,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from '@remix-run/react'
import { invariant } from 'framer-motion'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { Label } from '#app/components/ui/label.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.js'
import {
  cn,
  normalizeRomanianName,
  useDebounce,
  useIsPending,
} from '#app/utils/misc.js'
import { withParam } from '#app/utils/search-params.js'
import { getStep, questions } from '#app/utils/welcome-form.js'

const RawHighscoolSchema = z.array(
  z.object({ id: z.string(), name: z.string() }),
)

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const step = getStep(searchParams)
  const question = questions[step]

  invariant(question?.type === 'search', 'Invalid question type')
  const searchTerm = searchParams.get('search')
  const normalizedSearchTerm = normalizeRomanianName(searchTerm ?? '')

  const like = `%${searchTerm ?? ''}%`
  const normalizedLike = `%${normalizedSearchTerm}%`

  const rawHighschools = await prisma.$queryRaw`
  SELECT h.id, h.name
  FROM highschool h
  WHERE h.name LIKE ${like} OR h."normalizedName" LIKE ${normalizedLike}
  ORDER BY h.name ASC
  LIMIT 10
`
  const result = RawHighscoolSchema.safeParse(rawHighschools)
  if (!result.success) {
    return json({ status: 'error', error: result.error.message } as const, {
      status: 400,
    })
  }
  return json({ status: 'idle', highschools: result.data } as const)
}

export function SearchBar({
  status,
  autoFocus = false,
  autoSubmit = false,
}: {
  status: 'idle' | 'pending' | 'success' | 'error'
  autoFocus?: boolean
  autoSubmit?: boolean
  action?: string
}) {
  const [searchParams] = useSearchParams()
  const submit = useSubmit()
  const isSubmitting = useIsPending({
    formMethod: 'GET',
    formAction: '/welcome/search',
  })

  const handleFormChange = useDebounce((form: HTMLFormElement) => {
    submit(form)
  }, 400)

  return (
    <Form
      method="GET"
      action={'/welcome/search'}
      className="flex flex-wrap items-center justify-center gap-2"
      onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
    >
      <div className="flex-1">
        {[...searchParams.entries()].map(([k, v]) =>
          k !== 'search' ? (
            <input key={k} type="hidden" name={k} value={v} />
          ) : null,
        )}
        <Label htmlFor={'search'} className="sr-only">
          Search
        </Label>
        <Input
          type="search"
          name="search"
          id={'search'}
          defaultValue={searchParams.get('search') ?? ''}
          placeholder="Search"
          className="h-14 w-full rounded-xl border-2 py-4 text-lg"
          autoFocus={autoFocus}
        />
      </div>
      <div>
        <StatusButton
          type="submit"
          status={isSubmitting ? 'pending' : status}
          className="flex h-14 w-full items-center justify-center rounded-xl"
        >
          <Icon name="magnifying-glass" size="md" />
          <span className="sr-only">Search</span>
        </StatusButton>
      </div>
    </Form>
  )
}

export default function WelcomeSearch() {
  const [searchParams] = useSearchParams()
  const step = getStep(searchParams)
  const data = useLoaderData<typeof loader>()
  const selectedHighschool = searchParams.get(`q${step}`)
  if (data.status === 'error') {
    console.error(data.error)
  }

  return (
    <>
      <SearchBar status={data.status} autoFocus autoSubmit />

      {data.status === 'idle' ? (
        data.highschools.length ? (
          data.highschools.map((h) => (
            <Link
              key={h.id}
              className={cn(
                'rounded-xl border-2 bg-card p-4 text-lg hover:border-primary/60',
                {
                  'border-2 border-primary bg-primary/10 text-primary':
                    h.id === selectedHighschool,
                },
              )}
              to={`/welcome?${withParam(searchParams, `q${step}`, h.id)}`}
            >
              {h.name}
            </Link>
          ))
        ) : (
          <div>
            <p className="pb-4 text-lg">Liceu necunoscut</p>
          </div>
        )
      ) : data.status === 'error' ? (
        <ErrorList errors={['S-a produs o eroare']} />
      ) : null}
    </>
  )
}
