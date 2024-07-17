import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type SerializeFrom,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { cn } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
import { QuizState } from '#app/utils/user.js'

const ParamsSchema = z.object({
  quizId: z.string().transform((val) => parseInt(val, 10)),
})

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)
  const { quizId } = ParamsSchema.parse(params)
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: {
      userQuizzes: { where: { userId } },
      subchapter: true,
      questions: {
        include: {
          answers: true,
        },
      },
    },
  })
  invariantResponse(quiz, 'Quiz not found', { status: 404 })

  if (quiz.questions.length === 0) {
    redirectWithToast('/dashboard', {
      type: 'error',
      title: 'Quiz has no questions',
      description: 'Please choose another quizz.',
    })
  }
  return json({
    quiz,
  })
}

type QuestionId = number

type Quiz = SerializeFrom<typeof loader>['quiz']
type Question = Quiz['questions'][0]

function correctAnswer(question: Question) {
  return question.answers.find((answer) => answer.isCorrect)?.id
}

export function Score({ score }: { score: number }) {
  return (
    <>
      <div className="flex rounded-2xl border-2 border-dashed border-primary px-9 py-5 text-[24px] font-medium text-primary">
        Score: {score * 10}%
      </div>
    </>
  )
}

const selectedStyle = {
  borderColor: 'border-active-foreground',
  backgroundColorSecondary: 'bg-active-foreground',
  backgroundColor: ' bg-active',
  textColor: 'text-active-foreground',
}

const wrongAnswerStyle = {
  borderColor: 'border-destructive',
  backgroundColorSecondary: 'bg-destructive',
  backgroundColor: 'bg-destructive/10',
  textColor: 'text-destructive',
}

const correctAnswerStyle = {
  borderColor: 'border-complete-foreground',
  backgroundColor: 'bg-complete',
  backgroundColorSecondary: 'bg-complete-foreground',
  textColor: 'text-complete-foreground',
}

const defaultStyle = {
  borderColor: 'border-muted-foreground/30',
  backgroundColor: 'bg-card',
  backgroundColorSecondary: 'bg-card',
  textColor: 'text-card-foreground',
}

function getCorrectStyle({
  isSelected,
  isCorrect,
  userSubmittedChoice,
}: {
  isSelected: boolean
  isCorrect: boolean
  userSubmittedChoice: boolean
}) {
  if (userSubmittedChoice) {
    if (isCorrect) {
      return correctAnswerStyle
    } else if (isSelected) {
      return wrongAnswerStyle
    } else {
      return defaultStyle
    }
  } else {
    if (isSelected) {
      return selectedStyle
    } else {
      return defaultStyle
    }
  }
}

type QuizQuestionCounterProps = {
  numberOfSteps: number
  questionStates: QuizState[] // Add this line
  state?: QuizState
  className?: string
}
type StateProps = {
  backgroundColor: string
}

const statePropsMap: Record<QuizState, StateProps> = {
  [QuizState.CORRECT]: {
    backgroundColor: 'bg-complete-foreground',
  },
  [QuizState.WRONG]: {
    backgroundColor: ' bg-destructive',
  },
  [QuizState.UNANSWERED]: {
    backgroundColor: 'bg-primary/20 bg-opacity-5',
  },
}

export function QuizQuestionCounter({
  numberOfSteps,
  className,
  questionStates,
}: QuizQuestionCounterProps) {
  const stepsArray = Array.from({ length: numberOfSteps }, (_, i) => i + 1)
  return (
    <div
      className={`flex max-h-2 w-full flex-1 flex-row items-start justify-between gap-4 2xl:gap-9 ${className}`}
    >
      {stepsArray.map((_, i) => {
        const stepState = questionStates[i]
        const stateClass =
          statePropsMap[stepState ?? QuizState.UNANSWERED].backgroundColor
        return (
          <div
            className={`h-2 w-full ${stateClass} justify-between rounded-full`}
            key={i}
          >
            &nbsp;
          </div>
        )
      })}
    </div>
  )
}

export default function Quiz() {
  const { quiz } = useLoaderData<typeof loader>()
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<
    Record<number, number | undefined>
  >({})
  const [userSubmittedAnswersRecord, setUserSubmittedAnswersRecord] = useState<
    Record<QuestionId, boolean>
  >({})
  const question = quiz.questions[currentQuestionIdx]
  const userChoice = question ? userAnswers[question.id] : undefined
  const userSubmittedCurrentAnswer = question
    ? userSubmittedAnswersRecord[question.id]
    : false

  const previousObtainedScore = quiz?.userQuizzes?.[0]?.score ?? null

  const score = useMemo(() => {
    const totalQuestions = quiz.questions.length
    const correctAnswers = Object.entries(userAnswers).reduce<number>(
      (acc, [questionId, answerId]) => {
        if (!answerId) return acc
        const question = quiz.questions.find((q) => q.id === Number(questionId))
        if (!question) return acc
        const ca = correctAnswer(question)
        return ca === answerId ? acc + 1 : acc
      },
      0,
    )

    const score = (correctAnswers / totalQuestions) * 10
    // return only with 1 decimal point
    return Math.round(score * 10) / 10
  }, [quiz.questions, userAnswers])

  const [displayScore, setDisplayScore] = useState<number>(0)

  const questionStates = useMemo(() => {
    return quiz.questions.map((q) => {
      const ca = correctAnswer(q)
      if (!ca) return QuizState.UNANSWERED
      const userAnswer = userAnswers[q.id]
      const userSubmitted = userSubmittedAnswersRecord[q.id]
      if (!userAnswer || !userSubmitted) return QuizState.UNANSWERED
      return ca === userAnswer ? QuizState.CORRECT : QuizState.WRONG
    })
  }, [quiz.questions, userAnswers, userSubmittedAnswersRecord])

  const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1

  const nextQuestionButton = (
    <Button
      className="w-full"
      size={'lg'}
      onClick={() => {
        if (isLastQuestion) {
          // add user score to db if it's higher than the previous one
          if (!previousObtainedScore || score > previousObtainedScore) {
            // TODO add fetcher submit
            //            ({ testId: test.id, score: score })
          }
        }
        if (currentQuestionIdx + 1 < quiz.questions.length) {
          setCurrentQuestionIdx((prev) => prev + 1)
        }
      }}
    >
      {isLastQuestion ? 'Finalizează quiz' : 'Următoarea întrebare'}
    </Button>
  )

  const previousQuestionButton = (
    <Button
      className="w-full"
      size={'lg'}
      variant="outline"
      disabled={currentQuestionIdx === 0}
      onClick={() => {
        if (currentQuestionIdx >= 1) {
          setCurrentQuestionIdx((prev) => prev - 1)
        }
      }}
    >
      Întrebarea precedentă
    </Button>
  )

  const submitAnswerButton = (
    <Button
      className="w-full"
      size={'lg'}
      disabled={!userChoice}
      onClick={() => {
        if (!question) return
        setUserSubmittedAnswersRecord((prev) => ({
          ...prev,
          [question.id]: true,
        }))
        setDisplayScore(score)
      }}
    >
      Verifică răspunsul
    </Button>
  )

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-grow overflow-hidden">
        <main className="flex-grow overflow-scroll p-5 2xl:p-9">
          <section className="flex flex-row justify-between backdrop-blur-sm">
            <div
              className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-solid border-primary bg-card px-3"
              role="img"
              aria-label="Image Component"
            >
              <Icon name={'mini-mindle'} className="h-9 w-auto" />
            </div>

            <Score score={displayScore} />
          </section>
          <section className="mt-9 flex w-full flex-1 flex-col gap-9 rounded-lg border-2 border-solid border-active-border bg-card p-9 shadow-sm">
            <QuizQuestionCounter
              numberOfSteps={quiz.questions.length}
              questionStates={questionStates}
            />
            <p className="mt-8 text-3xl font-bold">
              {currentQuestionIdx + 1}. {question?.name}
            </p>
            <div className="flex h-full w-full flex-col">
              <section id="quiz-choice" className="flex flex-col gap-6">
                {(question?.answers ?? []).map((answer) => {
                  const isSelected = userChoice === answer.id

                  const {
                    borderColor,
                    backgroundColorSecondary,
                    backgroundColor,
                    textColor,
                  } = getCorrectStyle({
                    isCorrect: answer.isCorrect ?? false,
                    isSelected,
                    userSubmittedChoice: !!userSubmittedCurrentAnswer,
                  })

                  const extraStyle = `${backgroundColor} ${borderColor}  ${textColor} `
                  return (
                    <label
                      key={answer.title}
                      className={cn(
                        'flex cursor-pointer items-center rounded-xl border-2 p-6',
                        'text-2xl font-medium leading-[100%]',
                        extraStyle,
                        !userSubmittedCurrentAnswer &&
                          !isSelected &&
                          'hover:bg-grey-200',
                      )}
                    >
                      <Input
                        type="radio"
                        value={answer.title}
                        checked={isSelected}
                        className="hidden"
                        onClick={() => {
                          if (userSubmittedCurrentAnswer || !question) return
                          setUserAnswers((prev) => ({
                            ...prev,
                            [question.id]: answer.id,
                          }))
                        }}
                      />
                      <div
                        className={cn(
                          'mr-4 flex h-6 w-6 items-center justify-center rounded-full border-2',
                          `${borderColor} ${backgroundColor}`,
                        )}
                      >
                        <div
                          className={cn(
                            'h-3 w-3 rounded-full',
                            `${backgroundColorSecondary}`,
                          )}
                        />
                      </div>
                      {answer.title}
                    </label>
                  )
                })}
              </section>
            </div>
            <div className="flex w-full flex-row gap-9">
              {previousQuestionButton}
              {userSubmittedCurrentAnswer
                ? nextQuestionButton
                : submitAnswerButton}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
