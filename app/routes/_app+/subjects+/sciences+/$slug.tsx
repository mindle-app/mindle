import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { SvgImage } from '#app/components/svg-image.js'
import { Icon, type IconName } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { cn, getChapterImgSrc } from '#app/utils/misc'
import { UserState } from '#app/utils/user'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)
  const subject = await prisma.subject.findUnique({
    where: { slug: params.slug },
  })

  invariantResponse(subject, 'Subject not found', { status: 404 })

  const chapters = await prisma.chapter.findMany({
    where: {
      subjectId: subject.id,
    },
    include: {
      userChapters: { where: { userId } },
      image: { select: { id: true, altText: true } },
    },
    orderBy: { order: 'asc' },
  })

  return json({
    subject,
    chapters: chapters.map(({ userChapters, ...c }) => ({
      ...c,
      state: userChapters[0]?.state ?? UserState.LOCKED,
    })),
  })
}

type Chapter = ReturnType<
  typeof useLoaderData<typeof loader>
>['chapters'][0] & { href: string }

function ChapterCard({ name, state, image, href }: Chapter) {
  const isInProgress = state === UserState.IN_PROGRESS
  const isCompleted = state === UserState.DONE
  const isLocked = state === UserState.LOCKED
  const icon: IconName = isCompleted
    ? 'check'
    : isInProgress
      ? 'dots-horizontal'
      : 'lock-closed'

  return (
    <Link className="relative" prefetch="intent" to={href}>
      <div
        className={cn(
          'group flex aspect-square max-w-[150px] flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 ease-in-out',
          {
            'hover:border-foreground': !isLocked,
            'border-primary/40': isInProgress,
            'cursor-not-allowed border-muted-foreground/40': isLocked,
            'border-emerald-500': isCompleted,
          },
        )}
      >
        <Icon
          name={icon}
          className="absolute -top-2 left-0 right-0 mx-auto h-4 w-4 rounded-full border border-foreground bg-card p-0.5"
        />
        <div
          className={cn(
            `p-x-6 flex h-[70%] items-center justify-center border-b py-4 transition-all duration-300 ease-in-out`,
            {
              'group-hover:border-foreground': !isLocked,
              'border-muted bg-disabled': isLocked,
              'border-primary/20 bg-primary/30 group-hover:bg-active-foreground dark:bg-primary/20':
                isInProgress,
              'border-emerald-500 bg-complete group-hover:bg-complete-foreground dark:bg-complete/60':
                isCompleted,
            },
          )}
        >
          <SvgImage
            className={cn('flex h-full w-full items-center justify-center', {
              'fill-active-svg border-active-border': isInProgress,
              'fill-disabled-svg border-disabled-border': isLocked,
              'fill-complete-svg border-complete-border': isCompleted,
            })}
            src={getChapterImgSrc(image?.id ?? name)}
          />
        </div>
        <div className="w-full p-2 text-center font-sans font-bold leading-none md:text-xs 2xl:p-4 2xl:text-base">
          <span className="w-full text-xs 2xl:text-base">{name}</span>
        </div>
      </div>
      {/* Dashing line from one card to the next*/}
      <div
        className={cn(
          'absolute -bottom-2 left-0 right-0 -z-10 mx-auto h-5 w-[0.1px] border-r border-dashed border-foreground',
        )}
      />
    </Link>
  )
}

export default function SciencesSubjectLayout() {
  const { chapters, subject } = useLoaderData<typeof loader>()

  return (
    <>
      <div className="grid grid-rows-[auto_1fr] border-border md:grid-cols-[140px_auto] lg:grid-cols-[170px_auto] lg:grid-rows-[auto_1fr] 2xl:grid-cols-[180px_auto] 2xl:grid-rows-[auto_1fr] min-[2400px]:border-2">
        {/* Sidebar */}
        <aside className="col-span-14 scrollbar-thin scrollbar-thumb-scrollbar row-span-1 border-r-2 border-primary/20">
          <div
            className={`scrollbar-thin scrollbar-thumb-scrollbar px-auto flex h-[calc(100vh-56.5px)] w-full flex-col items-stretch gap-4 overflow-y-scroll p-base-padding pt-8 transition-all duration-300 ease-in-out 2xl:gap-7`}
          >
            {chapters.map((c) => (
              <ChapterCard
                key={c.name}
                {...c}
                href={`/subjects/sciences/${subject.slug}/${c.id}`}
              />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-1 row-span-1 p-base-padding">
          <Outlet />
        </main>
      </div>
    </>
  )
}
