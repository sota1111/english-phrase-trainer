export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .replace(/　/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function isCorrectAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
