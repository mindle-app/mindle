import { z } from 'zod'

export const BaseLessonSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0).nullable(),
  id: z.number().optional(),
  image: z.object({ id: z.string().optional() }).optional().nullable(),
  displayId: z.string().max(5).min(1).nullable(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  parentLessonId: z.number().optional().nullable(),
})
export type BaseLesson = z.infer<typeof BaseLessonSchema>

export type Lesson = BaseLesson & {
  childLessons?: Lesson[]
}

export const LessonFieldsetSchema: z.ZodType<Lesson> = BaseLessonSchema.extend({
  childLessons: z.lazy(() => LessonFieldsetSchema.array().optional()),
})

export type LessonFieldset = z.infer<typeof LessonFieldsetSchema>

export function flattenLessons(lessons: Lesson[]): Lesson[] {
  return lessons.flatMap((l) => [
    l,
    ...(l.childLessons && l.childLessons.length
      ? flattenLessons(l.childLessons)
      : []),
  ])
}
