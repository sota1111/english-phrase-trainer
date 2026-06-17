import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const phraseInputSchema = z.object({
  phrase: z.string().min(1),
  meaningJa: z.string().min(1),
  example: z.string().optional().default(''),
  exampleJa: z.string().optional().default(''),
  category: z.string().optional().default(''),
  memo: z.string().optional().default(''),
  difficulty: z.enum(['easy', 'normal', 'hard']).optional().default('normal'),
});

export const phraseUpdateSchema = phraseInputSchema.partial();

export const idParamSchema = z.string().min(1);

export const phraseGenerateSchema = z.object({
  mode: z.enum(['ja2en', 'en2ja']),
  text: z.string().min(1),
});

export const learningRecordSchema = z.object({
  phraseId: z.string().min(1),
  quizType: z.enum(['meaning_to_phrase', 'blank']),
  answer: z.string(),
  correctAnswer: z.string(),
});

export const spacedReviewResultSchema = z.object({
  phraseId: z.string().min(1),
  isCorrect: z.boolean(),
});
