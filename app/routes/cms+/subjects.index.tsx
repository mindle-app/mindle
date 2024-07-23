import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, redirect, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.js'
import { SearchBar } from '#app/components/search-bar.js'
import { prisma } from '#app/utils/db.server.js'
import { cn, getSubjectImgSrc, useDelayedIsPending } from '#app/utils/misc.js'

const SubjectSearchResult = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    imageId: z.string().nullable().optional(),
  }),
)

export async function loader({ request }: LoaderFunctionArgs) {
  const searchTerm = new URL(request.url).searchParams.get('search')
  if (searchTerm === '') {
    return redirect('/cms/subjects')
  }

  const like = `%${searchTerm ?? ''}%`
  const rawUsers = await prisma.$queryRaw`
		SELECT subject.id, subject.name, subject_image.id AS imageId
		FROM subject
		LEFT JOIN subject_image ON subject.id = subject_image.subjectId
		WHERE subject.name LIKE ${like}
		ORDER BY subject."updatedAt" DESC
	`

  const result = SubjectSearchResult.safeParse(rawUsers)
  if (!result.success) {
    return json({ status: 'error', error: result.error.message } as const, {
      status: 400,
    })
  }
  return json({ status: 'idle', subjects: result.data } as const)
}
export default function SubjectCms() {
  const data = useLoaderData<typeof loader>()
  const isPending = useDelayedIsPending({
    formMethod: 'GET',
    formAction: '/cms/subjects',
  })

  if (data.status === 'error') {
    console.error(data.error)
  }

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-xl">Mindle Subjects</h1>
        <div className="w-1/2">
          <SearchBar
            action="/cms/subjects"
            status={data.status}
            autoFocus
            autoSubmit
          />
        </div>
      </div>

      <main>
        {data.status === 'idle' ? (
          data.subjects.length ? (
            <ul
              className={cn(
                'flex w-full flex-wrap items-center justify-start gap-4 delay-200',
                { 'opacity-50': isPending },
              )}
            >
              {data.subjects.map((subject) => (
                <li key={subject.id}>
                  <Link
                    to={`/cms/subjects/${subject.id}`}
                    className="flex h-20 items-center justify-start rounded-lg bg-muted px-5 py-3"
                  >
                    {subject.imageId ? (
                      <img
                        alt={subject.name}
                        src={getSubjectImgSrc(subject.imageId)}
                        className="h-16 w-16 rounded-full"
                      />
                    ) : null}
                    {subject.name ? (
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
                        {subject.name}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No subjects found</p>
          )
        ) : data.status === 'error' ? (
          <ErrorList errors={['There was an error parsing the results']} />
        ) : null}
      </main>
    </div>
  )
}