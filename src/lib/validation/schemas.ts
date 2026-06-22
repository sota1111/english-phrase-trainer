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
  importance: z.enum(['high', 'normal', 'low']).optional().default('normal'),
  // AI-enriched study aids (提案2)
  synonyms: z.array(z.string()).optional().default([]),
  collocations: z.array(z.string()).optional().default([]),
  // Deck / tag organization (提案3)
  deck: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

// AI enrichment request (提案2): given a phrase + meaning, return study aids.
export const phraseEnrichSchema = z.object({
  phrase: z.string().min(1),
  meaningJa: z.string().optional().default(''),
});

// AI writing feedback (SOT-1075 / B2): user writes one English sentence using a
// phrase; AI grades grammar & naturalness and proposes an improved version.
export const writingFeedbackSchema = z.object({
  phrase: z.string().min(1),
  meaningJa: z.string().optional().default(''),
  sentence: z.string().min(1).max(2000),
});

export const phraseUpdateSchema = phraseInputSchema.partial();

export const idParamSchema = z.string().min(1);

export const phraseGenerateSchema = z.object({
  mode: z.enum(['ja2en', 'en2ja']),
  text: z.string().min(1),
});

// Free-form bulk parse: one blob of mixed text is split by AI into many phrase
// candidates. Capped to keep prompt size and latency bounded.
export const phraseParseSchema = z.object({
  text: z.string().min(1).max(20000),
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
