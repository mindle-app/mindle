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
  useRouteLoaderData,
} from '@remix-run/react'
import { clsx } from 'clsx'
import {
  motion,
  useAnimationControls,
  type AnimationControls,
} from 'framer-motion'
import * as React from 'react'
import { makeMediaQueryStore } from '#app/components/media-query.js'

import { Icon } from '#app/components/ui/icon.js'
import { SimpleTooltip } from '#app/components/ui/tooltip.tsx'
import { type loader as rootLoader } from '#app/root.tsx'
import { prisma } from '#app/utils/db.server.js'
import { cn, getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.js'
import { ThemeSwitch } from '../resources+/theme-switch'

export async function loader({}: LoaderFunctionArgs) {
  const studyMaterials = await prisma.studyMaterial.findMany({
    where: { subjectId: 2 },
    include: { essays: true },
  })

  return json({ studyMaterials, workshopTitle: 'Mindle' })
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
  const user = useOptionalUser()
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
          'h-[calc(100vh-128px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:h-[calc(100vh-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]':
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
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = useOptionalUser()
  const nextExerciseRoute = '/next-exercise-todo'
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
            title={'Mindle'}
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
                    const showPlayground = false
                    return (
                      <NavigationExerciseListItem
                        exerciseNumber={1}
                        key={studyMaterialId}
                      >
                        <Link
                          prefetch="intent"
                          to={`/${studyMaterialId}`}
                          className={clsx(
                            'relative whitespace-nowrap px-2 py-0.5 pr-3 text-2xl font-bold outline-none hover:underline focus:underline',
                            'after:absolute after:-bottom-2.5 after:-right-2.5 after:h-5 after:w-5 after:rotate-45 after:scale-75 after:bg-background after:content-[""] hover:underline focus:underline',
                            { 'bg-foreground text-background': isActive },
                          )}
                        >
                          {title}
                          {showPlayground ? ' 🛝' : null}
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
                                      className={clsx(
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
              <div className="mt-6">
                <NavLink
                  to="/finished"
                  className={({ isActive }) =>
                    clsx(
                      'relative whitespace-nowrap text-lg font-bold outline-none hover:underline focus:underline',
                      {
                        'bg-black text-white after:absolute after:-bottom-2.5 after:-right-2.5 after:h-5 after:w-5 after:rotate-45 after:scale-75 after:bg-background after:content-[""]':
                          isActive,
                      },
                    )
                  }
                >
                  📝 Workshop Feedback
                </NavLink>
              </div>
            </motion.div>
          )}
          <div className="flex-grow" />

          {user ? (
            <SimpleTooltip content={isMenuOpened ? null : 'Your account'}>
              <Link
                className={cn(
                  'flex h-14 items-center justify-start space-x-3 px-4 py-4 text-center no-underline hover:underline',
                  {
                    'border-l': !isMenuOpened,
                    'w-full border-t': isMenuOpened,
                  },
                )}
                to="/account"
              >
                {user.image?.id ? (
                  <img
                    alt={user.name ?? user.username}
                    src={getUserImgSrc(user.image.id)}
                    className="h-full rounded-full"
                  />
                ) : (
                  <Icon
                    name="mindle-head"
                    className="flex-shrink-0"
                    size="lg"
                  />
                )}
                {isMenuOpened ? (
                  <motion.div
                    className="flex items-center whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Your Account
                  </motion.div>
                ) : (
                  <span className="sr-only">Your account</span>
                )}
              </Link>
            </SimpleTooltip>
          ) : null}
          {user && nextExerciseRoute ? (
            <SimpleTooltip
              content={isMenuOpened ? null : 'Continue to next lesson'}
            >
              <Link
                to={nextExerciseRoute}
                prefetch="intent"
                className={clsx(
                  'flex h-14 w-full items-center space-x-3 border-t px-4 py-4 pl-[18px] no-underline hover:underline',
                )}
                state={{ from: 'continue next lesson button' }}
              >
                <Icon name="fast-forward" className="flex-shrink-0" size="md" />
                {isMenuOpened ? (
                  <motion.div
                    className="flex items-center whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Continue to next lesson
                  </motion.div>
                ) : (
                  <span className="sr-only">Continue to next lesson</span>
                )}
              </Link>
            </SimpleTooltip>
          ) : null}
          <div
            className={cn('h-14 self-start p-4 pt-[15px] sm:mb-4 sm:w-full', {
              'w-full border-t': isMenuOpened,
              'border-l': !isMenuOpened,
            })}
          >
            <ThemeSwitch
              userPreference={rootData?.requestInfo.userPrefs.theme}
            />
          </div>
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
  const rootData = useRouteLoaderData<typeof rootLoader>('root')

  const user = useOptionalUser()
  const nextExerciseRoute = '/next-exercise-todo'
  const params = useParams()

  const studyMaterial = data.studyMaterials.find(
    (e) => e.id === params.studyMaterialId,
  )

  // container
  const menuControls = useAnimationControls()
  const menuVariants = {
    close: { width: 56 },
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
  const exNum = Number(params.exerciseNumber).toString().padStart(2, '0')

  return (
    <nav className="hidden border-r sm:flex">
      <motion.div
        initial={isMenuOpened ? 'open' : 'close'}
        variants={menuVariants}
        animate={menuControls}
      >
        <div className="flex h-full flex-col items-center justify-between">
          <NavToggle
            title={data.workshopTitle}
            menuControls={menuControls}
            isMenuOpened={isMenuOpened}
            setMenuOpened={setMenuOpened}
          />
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
                className="flex flex-col"
              >
                {data.studyMaterials.map(
                  ({ id: studyMaterialId, title, essays }) => {
                    const isActive = params.studyMaterialId === studyMaterialId
                    return (
                      <NavigationExerciseListItem
                        key={studyMaterialId}
                        exerciseNumber={1}
                      >
                        <Link
                          prefetch="intent"
                          to={`/study/${studyMaterialId}`}
                          className={clsx(
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
                                const isActive = essayId === params.essayId
                                return (
                                  <NavigationExerciseStepListItem key={essayId}>
                                    <Link
                                      prefetch="intent"
                                      to={`/study/${studyMaterialId}/${essayId}`}
                                      className={clsx(
                                        'relative whitespace-nowrap px-2 py-0.5 pr-3 text-2xl font-bold outline-none hover:underline focus:underline',
                                        'after:absolute after:-bottom-2.5 after:-right-2.5 after:h-5 after:w-5 after:rotate-45 after:scale-75 after:bg-background after:content-[""] hover:underline focus:underline',
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
              <div className="mt-6">
                <NavLink
                  to="/finished"
                  className={({ isActive }) =>
                    clsx(
                      'relative whitespace-nowrap text-lg font-bold outline-none hover:underline focus:underline',
                      {
                        'bg-black text-white after:absolute after:-bottom-2.5 after:-right-2.5 after:h-5 after:w-5 after:rotate-45 after:scale-75 after:bg-background after:content-[""]':
                          isActive,
                      },
                    )
                  }
                >
                  📝 Workshop Feedback
                </NavLink>
              </div>
            </motion.div>
          )}
          {!isMenuOpened && (
            <div className="flex flex-grow flex-col justify-center">
              <div className="orientation-sideways w-full font-coHeadline text-sm font-medium">
                {studyMaterial?.title ? (
                  <Link to={`/${exNum}`}>{studyMaterial.title}</Link>
                ) : null}
              </div>
            </div>
          )}

          {user ? (
            <SimpleTooltip content={isMenuOpened ? null : 'Your account'}>
              <Link
                className="flex h-14 w-full items-center justify-start space-x-3 border-t px-4 py-4 text-center no-underline hover:underline"
                to="/account"
              >
                {user?.image?.id ? (
                  <img
                    alt={user.name ?? user.username}
                    src={getUserImgSrc(user.image.id)}
                    className="h-full rounded-full"
                  />
                ) : (
                  <Icon
                    name="mindle-head"
                    className="flex-shrink-0"
                    size="lg"
                  />
                )}
                {isMenuOpened ? (
                  <motion.div
                    className="flex items-center whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Your Account
                  </motion.div>
                ) : (
                  <span className="sr-only">Your account</span>
                )}
              </Link>
            </SimpleTooltip>
          ) : null}
          {user && nextExerciseRoute ? (
            <SimpleTooltip
              content={isMenuOpened ? null : 'Continue to next lesson'}
            >
              <Link
                to={nextExerciseRoute}
                prefetch="intent"
                className={clsx(
                  'flex h-14 w-full items-center space-x-3 border-t px-4 py-4 pl-[18px] no-underline hover:underline',
                )}
                state={{ from: 'continue next lesson button' }}
              >
                <Icon name="fast-forward" className="flex-shrink-0" size="md" />
                {isMenuOpened ? (
                  <motion.div
                    className="flex items-center whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Continue to next lesson
                  </motion.div>
                ) : (
                  <span className="sr-only">Continue to next lesson</span>
                )}
              </Link>
            </SimpleTooltip>
          ) : null}
          <div className="mb-4 w-full self-start border-t pl-3 pt-[15px]">
            <ThemeSwitch
              userPreference={rootData?.requestInfo.userPrefs.theme}
            />
          </div>
        </div>
      </motion.div>
    </nav>
  )
}

function NavToggle({
  title,
  isMenuOpened,
  setMenuOpened,
  menuControls,
}: {
  title: string
  isMenuOpened: boolean
  setMenuOpened: (value: boolean) => void
  menuControls?: AnimationControls
}) {
  const path01Variants = {
    open: { d: 'M3.06061 2.99999L21.0606 21' },
    closed: { d: 'M0 9.5L24 9.5' },
  }
  const path02Variants = {
    open: { d: 'M3.00006 21.0607L21 3.06064' },
    moving: { d: 'M0 14.5L24 14.5' },
    closed: { d: 'M0 14.5L15 14.5' },
  }
  const path01Controls = useAnimationControls()
  const path02Controls = useAnimationControls()

  async function toggleMenu() {
    void menuControls?.start(isMenuOpened ? 'close' : 'open')
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
  }

  const latestToggleMenu = React.useRef(toggleMenu)
  React.useEffect(() => {
    latestToggleMenu.current = toggleMenu
  })

  React.useEffect(() => {
    if (!isMenuOpened) return

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        void latestToggleMenu.current()
      }
    }
    document.addEventListener('keyup', handleKeyUp)
    return () => document.removeEventListener('keyup', handleKeyUp)
  }, [isMenuOpened])

  return (
    <div
      className={cn(
        'relative inline-flex h-14 flex-shrink-0 items-center justify-between overflow-hidden border-r sm:w-full sm:border-b sm:border-r-0',
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
            transition={{ duration: 0.2 }}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <motion.path
            {...path02Variants.closed}
            animate={path02Controls}
            transition={{ duration: 0.2 }}
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
          <Link to="/">{title}</Link>
        </motion.p>
      )}
    </div>
  )
}
