export interface SM2Params {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result extends SM2Params {
  dueDate: Date;
}

export function calculateNextReview(params: SM2Params, isCorrect: boolean): SM2Result {
  let { easeFactor, interval, repetitions } = params;
  if (isCorrect) {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  return { easeFactor, interval, repetitions, dueDate };
}

export const DEFAULT_SM2_PARAMS: SM2Params = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};
