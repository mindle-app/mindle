import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, redirect, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.js'
import { SearchBar } from '#app/components/search-bar.js'
import { prisma } from '#app/utils/db.server.js'
import { cn, getChapterImgSrc, useDelayedIsPending } from '#app/utils/misc.js'

const ChapterSearchResult = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    imageId: z.string().nullable().optional(),
  }),
)

export async function loader({ request }: LoaderFunctionArgs) {
  const searchTerm = new URL(request.url).searchParams.get('search')
  if (searchTerm === '') {
    return redirect('/cms/chapters')
  }

  const like = `%${searchTerm ?? ''}%`
  const rawUsers = await prisma.$queryRaw`

		SELECT chapter.id, chapter.name, chapter_image.id AS imageId
		FROM chapter
		LEFT JOIN chapter_image ON chapter.id = chapter_image.chapterId
		WHERE chapter.name LIKE ${like}
		ORDER BY chapter."updatedAt" DESC
	`

  const result = ChapterSearchResult.safeParse(rawUsers)
  if (!result.success) {
    return json({ status: 'error', error: result.error.message } as const, {
      status: 400,
    })
  }
  return json({ status: 'idle', chapters: result.data } as const)
}
export default function ChapterCms() {
  const data = useLoaderData<typeof loader>()
  const isPending = useDelayedIsPending({
    formMethod: 'GET',
    formAction: '/cms/chapters',
  })

  if (data.status === 'error') {
    console.error(data.error)
  }

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-xl">Mindle Chapters</h1>
        <div className="w-1/2">
          <SearchBar
            action="/cms/chapters"
            status={data.status}
            autoFocus
            autoSubmit
          />
        </div>
      </div>

      <main>
        {data.status === 'idle' ? (
          data.chapters.length ? (
            <ul
              className={cn(
                'flex w-full flex-col justify-start gap-4 delay-200',
                { 'opacity-50': isPending },
              )}
            >
              {data.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link
                    to={`/cms/chapters/${chapter.id}`}
                    className="flex h-20 items-center justify-start rounded-lg bg-muted px-5 py-3"
                  >
                    {chapter.imageId ? (
                      <img
                        alt={chapter.name}
                        src={getChapterImgSrc(chapter.imageId)}
                        className="h-16 w-16 rounded-full"
                      />
                    ) : null}
                    {chapter.name ? (
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
                        {chapter.name}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No chapters found</p>
          )
        ) : data.status === 'error' ? (
          <ErrorList errors={['There was an error parsing the results']} />
        ) : null}
      </main>
    </div>
  )
}
