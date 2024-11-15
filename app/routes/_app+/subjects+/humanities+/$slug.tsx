import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useParams,
  Form,
  useSearchParams,
  useSubmit,
  useLocation,
} from '@remix-run/react'
import {
  motion,
  useAnimationControls,
  type AnimationControls,
} from 'framer-motion'
import * as React from 'react'
import { useId } from 'react'
import { ExistingSearchParams } from 'remix-utils/existing-search-params'
import { z } from 'zod'
import { makeMediaQueryStore } from '#app/components/media-query.js'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#app/components/ui/accordion.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { cn, useDebounce, useIsPending } from '#app/utils/misc.tsx'

const RawIdsResultSchema = z.array(z.object({ id: z.string() }))

export async function loader({ params, request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  await requireUserId(request)
  const searchTerm = searchParams.get('search')
  const subject = await prisma.subject.findUnique({
    where: { slug: params.slug },
  })
  invariantResponse(subject, 'Subject not found', { status: 404 })

  let studyMaterialSearchIds: string[] | undefined
  let essaySearchIds: string[] | undefined
  if (searchTerm) {
    const like = `%${searchTerm ?? ''}%`
    const studyMaterialSearchQuery = prisma.$queryRaw`
      SELECT s."id"
      FROM study_material s
      WHERE s."title" LIKE ${like} AND s."subjectId" = ${subject.id}`

    const essaySearchQuery = prisma.$queryRaw`
      SELECT e."id"
      FROM essay e
      LEFT JOIN study_material s ON e."studyMaterialId" = s.id
      WHERE e."title" LIKE ${like} AND s."subjectId" = ${subject.id}`

    const [rawStudyMaterialIds, rawEssayIds] = await Promise.all([
      studyMaterialSearchQuery,
      essaySearchQuery,
    ])
    const smResult = RawIdsResultSchema.safeParse(rawStudyMaterialIds)
    const eResult = RawIdsResultSchema.safeParse(rawEssayIds)
    if (smResult.success)
      studyMaterialSearchIds = smResult.data.map((s) => s.id)
    if (eResult.success) essaySearchIds = eResult.data.map((e) => e.id)
  }

  const studyMaterials = (
    await prisma.studyMaterial.findMany({
      where: {
        subjectId: subject.id,
        ...(studyMaterialSearchIds?.length
          ? { id: { in: studyMaterialSearchIds } }
          : {}),
      },
      include: {
        essays: essaySearchIds
          ? { where: { id: { in: essaySearchIds } } }
          : true,
        author: true,
      },
    })
  ).filter((s) => s.essays.length)

  return json({ studyMaterials, workshopTitle: 'Mindle', subject })
}

const inputVariants = {
  visible: {
    opacity: 1,
    transition: {
      duration: 0.05,
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
  },
  hidden: {
    opacity: 0,
  },
}

export function SearchBar({
  status,
  autoFocus = false,
  autoSubmit = false,
  isMenuOpened,
}: {
  status: 'idle' | 'pending' | 'success' | 'error'
  autoFocus?: boolean
  autoSubmit?: boolean
  isMenuOpened: boolean
}) {
  const id = useId()
  const [searchParams] = useSearchParams()
  const submit = useSubmit()
  const isSubmitting = useIsPending({
    formMethod: 'GET',
  })
  const location = useLocation()

  const handleFormChange = useDebounce((form: HTMLFormElement) => {
    submit(form)
  }, 400)

  return (
    <Form
      method="GET"
      action={location.pathname}
      className="mx-6 flex"
      onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
    >
      <ExistingSearchParams exclude={['search']} />
      {isMenuOpened ? (
        <motion.div
          className="flex w-full flex-1 gap-2 rounded-xl border bg-card p-2"
          variants={inputVariants}
          initial={'hidden'}
          animate={'visible'}
        >
          <Input
            type="search"
            name="search"
            id={id}
            defaultValue={searchParams.get('search') ?? ''}
            placeholder="Search"
            className="w-full border-0"
            autoFocus={autoFocus}
          />
          <StatusButton
            variant={'secondary'}
            type={'submit'}
            status={isSubmitting ? 'pending' : status}
            className="flex items-center justify-center"
          >
            <Icon name="magnifying-glass-full" size="md" />
            <span className="sr-only">Search</span>
          </StatusButton>
        </motion.div>
      ) : null}
    </Form>
  )
}

const path01Variants = {
  open: { d: 'M3.06061 2.99999L21.0606 21' },
  closed: { d: 'M0 9.5L24 9.5' },
}

const path02Variants = {
  open: { d: 'M3.00006 21.0607L21 3.06064' },
  moving: { d: 'M0 14.5L24 14.5' },
  closed: { d: 'M0 14.5L15 14.5' },
}
function NavToggle({
  title,
  isMenuOpened,
  setMenuOpened,
  menuControls,
}: {
  title?: string
  isMenuOpened: boolean
  setMenuOpened: (value: boolean) => void
  menuControls?: AnimationControls
}) {
  const path01Controls = useAnimationControls()
  const path02Controls = useAnimationControls()

  const toggleMenu = React.useCallback(async () => {
    await menuControls?.start(isMenuOpened ? 'close' : 'open')
    setMenuOpened(!isMenuOpened)

    if (isMenuOpened) {
      void path01Controls.start(path01Variants.closed)
      await path02Controls.start(path02Variants.moving)
      void path02Controls.start(path02Variants.closed)
    } else {
      await path02Controls.start(path02Variants.moving)
      void path01Controls.start(path01Variants.open)
      void path02Controls.start(path02Variants.open)
    }
  }, [
    isMenuOpened,
    menuControls,
    path01Controls,
    path02Controls,
    setMenuOpened,
  ])

  React.useEffect(() => {
    if (!isMenuOpened) return

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        toggleMenu()
      }
    }
    document.addEventListener('keyup', handleKeyUp)
    return () => document.removeEventListener('keyup', handleKeyUp)
  }, [isMenuOpened, toggleMenu])

  return (
    <div
      className={cn(
        'relative inline-flex flex-shrink-0 items-center justify-between overflow-hidden border-r sm:w-full sm:border-r-0',
        {
          'w-full': isMenuOpened,
        },
      )}
    >
      <button
        className="flex h-14 w-14 items-center justify-center"
        aria-label="Open Navigation menu"
        onClick={toggleMenu}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <motion.path
            {...path01Variants.closed}
            animate={path01Controls}
            transition={{ duration: 0.05 }}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <motion.path
            {...path02Variants.closed}
            animate={path02Controls}
            transition={{ duration: 0.05 }}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </svg>
      </button>
      {isMenuOpened && (
        <motion.p
          transition={{ delay: 0.2 }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-5 whitespace-nowrap font-mono text-sm uppercase"
        >
          <Link to="/">{title ?? 'Mindle'}</Link>
        </motion.p>
      )}
    </div>
  )
}

const useIsWide = makeMediaQueryStore('(min-width: 640px)', true)

function MobileNavigation({
  isMenuOpened,
  onMenuOpenChange: setMenuOpened,
}: {
  isMenuOpened: boolean
  onMenuOpenChange: (change: boolean) => void
}) {
  // items
  const listVariants = {
    visible: {
      opacity: 1,
      transition: {
        duration: 0.05,
        when: 'beforeChildren',
        staggerChildren: 0.03,
      },
    },
    hidden: {
      opacity: 0,
    },
  }

  return (
    <nav className="flex w-full border-b sm:hidden">
      <div className="w-full">
        <div
          className={cn('flex items-center', {
            'flex-col': isMenuOpened,
            'h-14': !isMenuOpened,
          })}
        >
          <NavToggle
            isMenuOpened={isMenuOpened}
            setMenuOpened={setMenuOpened}
          />
          {isMenuOpened && (
            <motion.div
              className="scrollbar-thin scrollbar-thumb-scrollbar flex w-full flex-grow flex-col justify-between overflow-x-auto p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col"
              ></motion.ul>
            </motion.div>
          )}
          <div className="flex-grow" />
        </div>
      </div>
    </nav>
  )
}

const OPENED_MENU_WIDTH = 400

function Navigation({
  isMenuOpened,
  onMenuOpenChange: setMenuOpened,
}: {
  isMenuOpened: boolean
  onMenuOpenChange: (change: boolean) => void
}) {
  const data = useLoaderData<typeof loader>()
  const { subject } = data
  const params = useParams()
  const [searchParams] = useSearchParams()

  const studyMaterial = data.studyMaterials.find(
    (e) => e.id === params.studyMaterialId,
  )

  // container
  const menuControls = useAnimationControls()
  const menuVariants = {
    close: { width: 64 },
    open: { width: OPENED_MENU_WIDTH },
  }

  // items
  const listVariants = {
    visible: {
      opacity: 1,
      transition: {
        duration: 0.05,
        when: 'beforeChildren',
        staggerChildren: 0.03,
      },
    },
    hidden: {
      opacity: 0,
    },
  }

  return (
    <nav className="hidden border-r border-primary/20 sm:flex">
      <motion.div
        className="h-[calc(100vh - 68px)] flex h-full flex-col justify-between overflow-scroll"
        initial={isMenuOpened ? 'open' : 'close'}
        variants={menuVariants}
        animate={menuControls}
      >
        <NavToggle
          menuControls={menuControls}
          isMenuOpened={isMenuOpened}
          setMenuOpened={setMenuOpened}
        />
        <SearchBar
          status={'idle'}
          autoFocus
          autoSubmit={true}
          isMenuOpened={isMenuOpened}
        />
        <div className="flex flex-grow flex-col items-center">
          {isMenuOpened && (
            <motion.div
              style={{ width: OPENED_MENU_WIDTH }}
              className="scrollbar-thin scrollbar-thumb-scrollbar flex flex-grow flex-col justify-between overflow-y-auto p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-3"
              >
                {data.studyMaterials.map(
                  ({ id: studyMaterialId, title, author, essays }) => {
                    const isActive = params.studyMaterialId === studyMaterialId
                    return (
                      <Accordion
                        key={studyMaterialId}
                        type="single"
                        value={
                          // Auto expand all accordions if user is searching to show all resulting essays
                          isActive || !!searchParams.get('search')
                            ? studyMaterialId
                            : undefined
                        }
                        collapsible
                        className="w-full rounded-xl border bg-card px-4"
                      >
                        <AccordionItem
                          value={studyMaterialId}
                          className="border-b-0"
                        >
                          <AccordionTrigger className="font-medium group-hover:no-underline">
                            <NavLink
                              to={`/subjects/humanities/${subject.slug}/${studyMaterialId}?${searchParams.toString()}`}
                              className={({ isActive }) =>
                                cn('flex flex-col', {
                                  'text-primary': isActive,
                                })
                              }
                            >
                              <span className="text-start group-hover:underline">
                                {title}
                              </span>
                              {author?.name ? (
                                <p
                                  className={cn(
                                    'text-start text-sm text-card-foreground/50 group-hover:no-underline',
                                    { 'text-primary': isActive },
                                  )}
                                >
                                  de {author.name}
                                </p>
                              ) : null}
                            </NavLink>
                          </AccordionTrigger>
                          <AccordionContent className="flex flex-col gap-2">
                            {essays.map((essay) => {
                              return (
                                <NavLink
                                  className={({ isActive }) =>
                                    cn('text-md hover:underline', {
                                      'text-primary': isActive,
                                    })
                                  }
                                  key={essay.id}
                                  to={`/subjects/humanities/${subject.slug}/${studyMaterialId}/${essay.id}?${searchParams.toString()}`}
                                >
                                  {essay.title}
                                </NavLink>
                              )
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )
                  },
                )}
              </motion.ul>
            </motion.div>
          )}
          {!isMenuOpened && (
            <div className="flex flex-grow flex-col justify-center">
              <div className="orientation-sideways w-full font-coHeadline text-sm font-medium">
                {studyMaterial?.title ? (
                  <Link
                    to={`/subjects/humanities/${subject.slug}/${studyMaterial.id}`}
                  >
                    {studyMaterial.title}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  )
}

export default function App() {
  const isWide = useIsWide()

  const [isMenuOpened, setMenuOpened] = React.useState(false)

  return (
    <div className="flex max-h-[calc(100vh-68px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col">
      {/*
				this isn't placed in a conditional with isWide because the server render
				doesn't know whether it should be around or not so we just use CSS to hide it
				if it's not supposed to show up.

				We don't just use media queries for the wider screen nav because we want
				to avoid running all the logic in there unnecessarily.
			*/}
      <MobileNavigation
        isMenuOpened={isMenuOpened}
        onMenuOpenChange={setMenuOpened}
      />
      <div
        // this nonsense is here because we want the panels to be scrollable rather
        // than having the entire page be scrollable (at least on wider screens)
        className={cn(
          'flex h-[calc(100vh-68px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-grow flex-col sm:flex-row',
          {
            'h-[unset]': !isWide && isMenuOpened,
          },
        )}
      >
        {isWide ? (
          <Navigation
            isMenuOpened={isMenuOpened}
            onMenuOpenChange={setMenuOpened}
          />
        ) : null}
        <div
          className={cn(
            'h-full w-full max-w-full sm:max-w-[calc(100%-68px)]',
            isMenuOpened ? 'hidden md:block' : '',
          )}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}
