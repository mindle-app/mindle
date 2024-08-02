import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, redirect, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.js'
import { SearchBar } from '#app/components/search-bar.js'
import { Icon } from '#app/components/ui/icon.js'
import { prisma } from '#app/utils/db.server.js'
import { cn, useDelayedIsPending } from '#app/utils/misc.js'

const EssayResult = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
  }),
)

export async function loader({ request }: LoaderFunctionArgs) {
  const searchTerm = new URL(request.url).searchParams.get('search')
  if (searchTerm === '') {
    return redirect('/cms/study-materials')
  }

  const like = `%${searchTerm ?? ''}%`
  const rawUsers = await prisma.$queryRaw`
		SELECT essay.id, essay.title
		FROM essay
		WHERE essay.title LIKE ${like}
		ORDER BY essay."updatedAt" DESC
	`

  const result = EssayResult.safeParse(rawUsers)
  if (!result.success) {
    return json({ status: 'error', error: result.error.message } as const, {
      status: 400,
    })
  }
  return json({ status: 'idle', essays: result.data } as const)
}
export default function EssayCms() {
  const data = useLoaderData<typeof loader>()
  const isPending = useDelayedIsPending({
    formMethod: 'GET',
    formAction: '/cms/essays',
  })

  if (data.status === 'error') {
    console.error(data.error)
  }

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-xl">Mindle Study Materials</h1>
        <div className="w-1/2">
          <SearchBar
            action="/cms/essays"
            status={data.status}
            autoFocus
            autoSubmit
          />
        </div>
      </div>

      <main className="max-w-md">
        {data.status === 'idle' ? (
          data.essays.length ? (
            <ul
              className={cn(
                'flex w-full flex-col justify-start gap-4 delay-200',
                { 'opacity-50': isPending },
              )}
            >
              <li key={'create-essay'}>
                <Link
                  to={`/cms/essays/create/edit`}
                  className="flex h-20 items-center justify-start rounded-lg bg-muted px-5 py-3"
                >
                  <Icon name={'plus'} className="mr-4 h-6 w-6" />
                  Create Essay
                </Link>
              </li>
              {data.essays.map((essay) => (
                <li key={essay.id}>
                  <Link
                    to={`/cms/essays/${essay.id}`}
                    className="flex h-20 items-center justify-start rounded-lg bg-muted px-5 py-3"
                  >
                    {essay.title ? (
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
                        {essay.title}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="pb-4 text-lg">No study materials found</p>
              <Link
                to={`/cms/essays/create/edit`}
                className="flex h-20 items-center justify-start rounded-lg bg-muted px-5 py-3"
              >
                <Icon name={'plus'} className="mr-4 h-6 w-6" />
                Create Essays
              </Link>
            </div>
          )
        ) : data.status === 'error' ? (
          <ErrorList errors={['There was an error parsing the results']} />
        ) : null}
      </main>
    </div>
  )
}
