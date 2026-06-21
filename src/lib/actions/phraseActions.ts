'use server';

import {
  getPhrases,
  createPhrase,
  createPhrases,
  updatePhrase,
  deletePhrase
} from '@/lib/firestore/phrases';
import { PhraseInput } from '@/types/phrase';
import { idParamSchema, phraseInputSchema, phraseUpdateSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function getPhrasesAction() {
  return await getPhrases();
}

export async function createPhraseAction(input: PhraseInput) {
  const validated = phraseInputSchema.parse(input);
  const result = await createPhrase(validated);
  revalidatePath('/phrases');
  revalidatePath('/');
  return result;
}

export async function createPhrasesAction(inputs: PhraseInput[]) {
  const validated = inputs.map((input) => phraseInputSchema.parse(input));
  const count = await createPhrases(validated);
  revalidatePath('/phrases');
  revalidatePath('/');
  return count;
}

export async function updatePhraseAction(id: string, input: Partial<PhraseInput>) {
  const validatedId = idParamSchema.parse(id);
  const validated = phraseUpdateSchema.parse(input);
  await updatePhrase(validatedId, validated);
  revalidatePath('/phrases');
  revalidatePath('/');
}

export async function deletePhraseAction(id: string) {
  const validatedId = idParamSchema.parse(id);
  await deletePhrase(validatedId);
  revalidatePath('/phrases');
  revalidatePath('/');
}
