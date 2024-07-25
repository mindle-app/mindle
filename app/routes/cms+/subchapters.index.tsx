import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, redirect, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.js'
import { SearchBar } from '#app/components/search-bar.js'
import { Button } from '#app/components/ui/button.js'
import { prisma } from '#app/utils/db.server.js'
import { cn, useDelayedIsPending } from '#app/utils/misc.js'

const SubchapterSearchResult = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    displayId: z.string().optional(),
    order: z.number().optional().nullable(),
  }),
)

export async function loader({ request }: LoaderFunctionArgs) {
  const searchTerm = new URL(request.url).searchParams.get('search')
  if (searchTerm === '') {
    return redirect('/cms/subchapters')
  }

  const like = `%${searchTerm ?? ''}%`
  const rawUsers = await prisma.$queryRaw`
		SELECT subchapter.id, subchapter.name, subchapter."displayId", subchapter."order"
		FROM subchapter
		WHERE subchapter.name LIKE ${like}
		ORDER BY subchapter."updatedAt" DESC
	`

  const result = SubchapterSearchResult.safeParse(rawUsers)
  if (!result.success) {
    return json({ status: 'error', error: result.error.message } as const, {
      status: 400,
    })
  }
  return json({ status: 'idle', subchapters: result.data } as const)
}
export default function SubchapterCms() {
  const data = useLoaderData<typeof loader>()
  const isPending = useDelayedIsPending({
    formMethod: 'GET',
    formAction: '/cms/subchapters',
  })

  if (data.status === 'error') {
    console.error(data.error)
  }

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-xl">Mindle Subchapters</h1>
        <div className="w-1/2">
          <SearchBar
            action="/cms/subchapters"
            status={data.status}
            autoFocus
            autoSubmit
          />
        </div>
      </div>

      <main>
        {data.status === 'idle' ? (
          data.subchapters.length ? (
            <ul
              className={cn('flex flex-col justify-start gap-4 delay-200', {
                'opacity-50': isPending,
              })}
            >
              {data.subchapters.map((subchapter) => (
                <li key={subchapter.id}>
                  <Link
                    to={`/cms/subchapters/${subchapter.id}`}
                    className="flex h-20 items-center justify-between rounded-lg bg-muted px-5 py-3"
                  >
                    {subchapter.name ? (
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-body-md">
                        {subchapter.displayId} {subchapter.name}
                      </span>
                    ) : null}
                    <Link to={`/cms/subchapters/${subchapter.id}/edit`}>
                      <Button>Edit</Button>
                    </Link>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No subchapters found</p>
          )
        ) : data.status === 'error' ? (
          <ErrorList errors={['There was an error parsing the results']} />
        ) : null}
      </main>
    </div>
  )
}
