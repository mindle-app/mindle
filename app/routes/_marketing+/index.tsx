import { type MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => [{ title: 'Mindle' }]

export default function Index() {
  return (
    <main className="font-poppins grid h-full place-items-center bg-background">
      <div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
        <div className="flex max-w-md flex-col items-center text-center xl:order-2 xl:items-start xl:text-left">
          <a
            href="https://www.epicweb.dev/stack"
            className="animate-slide-top [animation-fill-mode:backwards] xl:animate-slide-left xl:[animation-delay:0.5s] xl:[animation-fill-mode:backwards]"
          >
            <svg
              className="size-20 text-foreground xl:-mt-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 65 65"
            >
              <path
                fill="currentColor"
                d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
              ></path>
            </svg>
          </a>
          <h1
            data-heading
            className="mt-8 animate-slide-top text-4xl font-medium text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] md:text-5xl xl:mt-4 xl:animate-slide-left xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
          >
            <a href="https://www.epicweb.dev/stack">The Epic Stack</a>
          </h1>
          <p
            data-paragraph
            className="mt-6 animate-slide-top text-xl/7 text-muted-foreground [animation-delay:0.8s] [animation-fill-mode:backwards] xl:mt-8 xl:animate-slide-left xl:text-xl/6 xl:leading-10 xl:[animation-delay:1s] xl:[animation-fill-mode:backwards]"
          >
            Check the{' '}
            <a
              className="underline hover:no-underline"
              href="https://github.com/epicweb-dev/epic-stack/blob/main/docs/getting-started.md"
            >
              Getting Started guide
            </a>{' '}
            file for how to get your project off the ground!
          </p>
        </div>
      </div>
    </main>
  )
}
