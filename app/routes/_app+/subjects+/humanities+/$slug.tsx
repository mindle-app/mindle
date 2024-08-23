import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type HeadersFunction,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useParams,
  Form,
  useSearchParams,
  useSubmit,
} from '@remix-run/react'
import {
  motion,
  useAnimationControls,
  type AnimationControls,
} from 'framer-motion'
import * as React from 'react'
import { useId } from 'react'
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
import { useUser } from '#app/utils/user.js'

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
  action = '/users',
  isMenuOpened,
}: {
  status: 'idle' | 'pending' | 'success' | 'error'
  autoFocus?: boolean
  autoSubmit?: boolean
  action?: string
  isMenuOpened: boolean
}) {
  const id = useId()
  const [searchParams] = useSearchParams()
  const submit = useSubmit()
  const isSubmitting = useIsPending({
    formMethod: 'GET',
    formAction: action,
  })

  const handleFormChange = useDebounce((form: HTMLFormElement) => {
    submit(form)
  }, 400)

  return (
    <Form
      method="GET"
      action={action}
      className="mx-6 flex flex-wrap items-center justify-center gap-2"
      onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
    >
      {isMenuOpened ? (
        <motion.div
          className="flex-1"
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
            className="w-full"
            autoFocus={autoFocus}
          />
        </motion.div>
      ) : null}
      <div>
        <StatusButton
          type="submit"
          status={isSubmitting ? 'pending' : status}
          className="flex w-full items-center justify-center"
        >
          <Icon name="magnifying-glass" size="md" />
          <span className="sr-only">Search</span>
        </StatusButton>
      </div>
    </Form>
  )
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  await requireUserId(request)
  const subject = await prisma.subject.findUnique({
    where: { slug: params.slug },
  })
  invariantResponse(subject, 'Subject not found', { status: 404 })
  const studyMaterials = await prisma.studyMaterial.findMany({
    where: { subjectId: subject.id },
    include: { essays: true, author: true },
  })

  return json({ studyMaterials, workshopTitle: 'Mindle', subject })
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  const headers = {
    'Cache-Control': loaderHeaders.get('Cache-Control') ?? '',
    Vary: 'Cookie',
  }
  return headers
}

const useIsWide = makeMediaQueryStore('(min-width: 640px)', true)

export default function App() {
  const user = useUser()
  const isWide = useIsWide()

  const [isMenuOpened, setMenuOpened] = React.useState(false)

  return (
    <div className="flex flex-col">
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
        className={cn('flex flex-grow flex-col sm:flex-row', {
          'h-[calc(100vh-113px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:h-[calc(100vh-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]':
            !user,
          'h-[calc(100vh-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]':
            user,
          'h-[unset]': !isWide && isMenuOpened,
        })}
      >
        {isWide ? (
          <Navigation
            isMenuOpened={isMenuOpened}
            onMenuOpenChange={setMenuOpened}
          />
        ) : null}
        <div
          className={cn(
            'h-full w-full max-w-full sm:max-w-[calc(100%-56px)]',
            isMenuOpened ? 'hidden md:block' : '',
          )}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}
function NavigationExerciseListItem({
  children,
}: {
  exerciseNumber: number
  children: React.ReactNode
}) {
  const progressClassName = 0
  return (
    <motion.li
      variants={itemVariants}
      className={cn(
        // add gap of 3 to children, but using padding so the progress extends through the whole height
        'py-[6px] first:pt-3 last:pb-3',
        progressClassName ? `${progressClassName} before:border-t` : null,
      )}
    >
      <span className="ml-2">{children}</span>
    </motion.li>
  )
}

function NavigationExerciseStepListItem({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.li
      variants={itemVariants}
      className={cn(
        // add gap of 3 to children, but using padding so the progress extends through the whole height
        'py-[6px] first:pt-3 last:pb-3',
      )}
    >
      <span className="ml-2">{children}</span>
    </motion.li>
  )
}

function MobileNavigation({
  isMenuOpened,
  onMenuOpenChange: setMenuOpened,
}: {
  isMenuOpened: boolean
  onMenuOpenChange: (change: boolean) => void
}) {
  const data = useLoaderData<typeof loader>()
  const params = useParams()

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
              >
                {data.studyMaterials.map(
                  ({ id: studyMaterialId, title, essays }) => {
                    const isActive = params.studyMaterialId === studyMaterialId
                    return (
                      <NavigationExerciseListItem
                        exerciseNumber={1}
                        key={studyMaterialId}
                      >
                        <Link
                          prefetch="intent"
                          to={`${studyMaterialId}`}
                          className={cn(
                            'relative whitespace-nowrap px-2 py-0.5 pr-3 text-2xl font-bold outline-none hover:underline focus:underline',
                            'after:absolute after:-bottom-2.5 after:-right-2.5 after:h-5 after:w-5 after:rotate-45 after:scale-75 after:bg-background after:content-[""] hover:underline focus:underline',
                            { 'bg-foreground text-background': isActive },
                          )}
                        >
                          {title}
                        </Link>
                        {isActive ? (
                          <motion.ul
                            variants={listVariants}
                            initial="hidden"
                            animate="visible"
                            className="ml-4 mt-4 flex flex-col"
                          >
                            {essays
                              .filter(Boolean)
                              .map(({ id: essayId, title }) => {
                                const isActive =
                                  params.essayId === studyMaterialId
                                return (
                                  <NavigationExerciseStepListItem key={essayId}>
                                    <Link
                                      to={`/${studyMaterialId}/${essayId}`}
                                      prefetch="intent"
                                      className={cn(
                                        'relative whitespace-nowrap px-2 py-0.5 pr-3 text-xl font-medium outline-none after:absolute after:-bottom-2.5 after:-right-2.5 after:h-5 after:w-5 after:rotate-45 after:scale-75 after:bg-background after:content-[""] hover:underline focus:underline',
                                        {
                                          'bg-foreground text-background':
                                            isActive,
                                        },
                                      )}
                                    >
                                      {title}
                                    </Link>
                                  </NavigationExerciseStepListItem>
                                )
                              })}
                          </motion.ul>
                        ) : null}
                      </NavigationExerciseListItem>
                    )
                  },
                )}
              </motion.ul>
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

  const studyMaterial = data.studyMaterials.find(
    (e) => e.id === params.studyMaterialId,
  )

  // container
  const menuControls = useAnimationControls()
  const menuVariants = {
    close: { width: 104 },
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
    <nav className="hidden border-r sm:flex">
      <motion.div
        initial={isMenuOpened ? 'open' : 'close'}
        variants={menuVariants}
        animate={menuControls}
      >
        <NavToggle
          menuControls={menuControls}
          isMenuOpened={isMenuOpened}
          setMenuOpened={setMenuOpened}
        />
        <SearchBar status={'idle'} isMenuOpened={isMenuOpened} />
        <div className="flex h-full flex-col items-center justify-between">
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
                        value={isActive ? studyMaterialId : undefined}
                        collapsible
                        className="w-full rounded-xl border bg-card px-4"
                      >
                        <AccordionItem
                          value={studyMaterialId}
                          className="border-b-0"
                        >
                          <AccordionTrigger className="font-medium group-hover:no-underline">
                            <NavLink
                              to={`/subjects/humanities/${subject.slug}/${studyMaterialId}`}
                              className={({ isActive }) =>
                                cn('flex flex-col', {
                                  'text-primary': isActive,
                                })
                              }
                            >
                              <span className="group-hover:underline">
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
                                  to={`/subjects/humanities/${subject.slug}/${studyMaterialId}/${essay.id}`}
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

function NavToggle({
  isMenuOpened,
  setMenuOpened,
  menuControls,
}: {
  isMenuOpened: boolean
  setMenuOpened: (value: boolean) => void
  menuControls?: AnimationControls
}) {
  const toggleMenu = React.useCallback(() => {
    void menuControls?.start(isMenuOpened ? 'close' : 'open')
    setMenuOpened(!isMenuOpened)
  }, [isMenuOpened, menuControls, setMenuOpened])

  const latestToggleMenu = React.useRef(toggleMenu)
  React.useEffect(() => {
    latestToggleMenu.current = toggleMenu
  }, [toggleMenu])

  return (
    <div
      className={cn(
        'relative inline-flex h-14 flex-shrink-0 items-center justify-between overflow-hidden border-r sm:w-full sm:border-r-0',
      )}
    >
      <button
        className="flex h-14 w-14 items-center justify-center"
        aria-label="Open Navigation menu"
        onClick={toggleMenu}
      >
        <Icon name={isMenuOpened ? 'chevrons-left' : 'chevrons-right'} />
      </button>
    </div>
  )
}
