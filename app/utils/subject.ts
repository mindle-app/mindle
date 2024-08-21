import { z } from 'zod'

// See decisions/subjects.md
export const SubjectTypeSchema = z.enum([
  'humanities',
  'sciences',
  'mathematics',
  'history',
])

export type SubjectType = z.infer<typeof SubjectTypeSchema>

export const SubjectTypes: SubjectType[] = [
  'humanities',
  'sciences',
  'mathematics',
  'history',
]
