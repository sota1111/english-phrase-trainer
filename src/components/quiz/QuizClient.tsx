'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { createLearningRecordAction } from '@/lib/actions/reviewActions';
import {
  QuizPhrase,
  buildMultipleChoice,
  buildBlank,
  blankablePhrases,
  shuffle,
} from '@/lib/quiz';

const QUESTION_LIMIT = 10;

type Mode = 'menu' | 'multiple' | 'blank';

type MultipleQuestion = { phrase: QuizPhrase; options: string[] };
type BlankQuestion = { phrase: QuizPhrase; sentence: string; answer: string; exampleJa: string };

export function QuizClient({ phrases }: { phrases: QuizPhrase[] }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('menu');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);

  const blankable = useMemo(() => blankablePhrases(phrases), [phrases]);
  const canMultiple = phrases.length >= 1;
  const canBlank = blankable.length >= 1;

  const [multipleQs, setMultipleQs] = useState<MultipleQuestion[]>([]);
  const [blankQs, setBlankQs] = useState<BlankQuestion[]>([]);

  const startMultiple = () => {
    const qs = shuffle(phrases)
      .slice(0, QUESTION_LIMIT)
      .map((p) => ({ phrase: p, options: buildMultipleChoice(p, phrases) }));
    setMultipleQs(qs);
    resetSession('multiple');
  };

  const startBlank = () => {
    const qs = shuffle(blankable)
      .slice(0, QUESTION_LIMIT)
      .map((p) => {
        const b = buildBlank(p)!;
        return { phrase: p, sentence: b.sentence, answer: b.answer, exampleJa: b.exampleJa };
      });
    setBlankQs(qs);
    resetSession('blank');
  };

  const resetSession = (next: Mode) => {
    setMode(next);
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setSelected(null);
    setInput('');
    setRevealed(false);
    setCompleted(false);
  };

  const backToMenu = () => resetSession('menu');

  const questions = mode === 'multiple' ? multipleQs : mode === 'blank' ? blankQs : [];

  const advance = () => {
    if (index + 1 >= questions.length) {
      setCompleted(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setInput('');
      setRevealed(false);
    }
  };

  const record = async (
    phrase: QuizPhrase,
    quizType: 'meaning_to_phrase' | 'blank',
    answer: string,
    correctAnswer: string
  ) => {
    const isCorrect = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    try {
      await createLearningRecordAction({ phraseId: phrase.id, quizType, answer, correctAnswer });
    } catch (error) {
      console.error('Failed to record quiz result:', error);
    }
  };

  // ---- Menu ----
  if (mode === 'menu') {
    return (
      <div className="quiz">
        <header className="quiz-header">
          <h1>{t('quiz.title')}</h1>
          <p className="subtitle">{t('quiz.subtitle')}</p>
        </header>
        {phrases.length === 0 ? (
          <p className="empty">{t('quiz.empty')}</p>
        ) : (
          <div className="mode-cards">
            <button className="mode-card" onClick={startMultiple} disabled={!canMultiple}>
              <span className="mode-name">{t('quiz.multiple')}</span>
              <span className="mode-desc">{t('quiz.multipleDesc')}</span>
            </button>
            <button className="mode-card" onClick={startBlank} disabled={!canBlank}>
              <span className="mode-name">{t('quiz.blank')}</span>
              <span className="mode-desc">
                {canBlank ? t('quiz.blankDesc') : t('quiz.blankUnavailable')}
              </span>
            </button>
          </div>
        )}
        <QuizStyles />
      </div>
    );
  }

  // ---- Completed ----
  if (completed) {
    return (
      <div className="quiz">
        <div className="result">
          <h2>{t('quiz.done')}</h2>
          <p className="score">{t('quiz.score', { correct: score.correct, total: score.total })}</p>
          <div className="result-actions">
            <button onClick={mode === 'multiple' ? startMultiple : startBlank}>{t('quiz.again')}</button>
            <button className="ghost" onClick={backToMenu}>{t('quiz.backMenu')}</button>
          </div>
        </div>
        <QuizStyles />
      </div>
    );
  }

  const total = questions.length;
  const progress = t('quiz.progress', { current: index + 1, total });

  // ---- Multiple choice ----
  if (mode === 'multiple') {
    const q = multipleQs[index];
    const correctValue = q.phrase.phrase.trim();
    return (
      <div className="quiz">
        <QuizTopBar progress={progress} onBack={backToMenu} backLabel={t('quiz.backMenu')} />
        <div className="card-q">
          <p className="q-label">{t('quiz.pickEnglish')}</p>
          <p className="q-prompt">{q.phrase.meaningJa}</p>
          <div className="options">
            {q.options.map((opt) => {
              const isCorrect = opt.trim().toLowerCase() === correctValue.toLowerCase();
              const isPicked = selected === opt;
              const cls = revealed
                ? isCorrect
                  ? 'option correct'
                  : isPicked
                  ? 'option wrong'
                  : 'option'
                : 'option';
              return (
                <button
                  key={opt}
                  className={cls}
                  disabled={revealed}
                  onClick={() => {
                    setSelected(opt);
                    setRevealed(true);
                    record(q.phrase, 'meaning_to_phrase', opt, q.phrase.phrase);
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {revealed && (
            <div className="feedback">
              <p className={selected?.trim().toLowerCase() === correctValue.toLowerCase() ? 'ok' : 'ng'}>
                {selected?.trim().toLowerCase() === correctValue.toLowerCase()
                  ? t('quiz.correct')
                  : t('quiz.incorrect', { answer: correctValue })}
              </p>
              <button className="next" onClick={advance}>{t('quiz.next')}</button>
            </div>
          )}
        </div>
        <QuizStyles />
      </div>
    );
  }

  // ---- Fill in the blank ----
  const q = blankQs[index];
  const isCorrectBlank = input.trim().toLowerCase() === q.answer.trim().toLowerCase();
  return (
    <div className="quiz">
      <QuizTopBar progress={progress} onBack={backToMenu} backLabel={t('quiz.backMenu')} />
      <div className="card-q">
        <p className="q-label">{t('quiz.fillBlank')}</p>
        <p className="q-prompt blank-sentence">{q.sentence}</p>
        <p className="q-hint">{q.phrase.meaningJa}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (revealed) return;
            setRevealed(true);
            record(q.phrase, 'blank', input, q.answer);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={revealed}
            placeholder={t('quiz.blankPlaceholder')}
            autoFocus
          />
          {!revealed && (
            <button type="submit" className="next" disabled={!input.trim()}>{t('quiz.submit')}</button>
          )}
        </form>
        {revealed && (
          <div className="feedback">
            <p className={isCorrectBlank ? 'ok' : 'ng'}>
              {isCorrectBlank ? t('quiz.correct') : t('quiz.incorrect', { answer: q.answer })}
            </p>
            <button className="next" onClick={advance}>{t('quiz.next')}</button>
          </div>
        )}
      </div>
      <QuizStyles />
    </div>
  );
}

function QuizTopBar({ progress, onBack, backLabel }: { progress: string; onBack: () => void; backLabel: string }) {
  return (
    <div className="topbar">
      <button className="link-btn" onClick={onBack}>{backLabel}</button>
      <span className="progress">{progress}</span>
      <style jsx>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .link-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
        }
        .progress {
          color: var(--muted);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

function QuizStyles() {
  return (
    <style jsx>{`
      .quiz {
        padding: 2rem;
        max-width: 640px;
        margin: 0 auto;
      }
      .quiz-header {
        margin-bottom: 1.5rem;
      }
      h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      .subtitle {
        margin: 0.25rem 0 0;
        color: var(--muted);
        font-size: 0.9rem;
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--muted);
      }
      .mode-cards {
        display: grid;
        gap: 1rem;
      }
      .mode-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        padding: 1.25rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        color: var(--foreground);
        box-shadow: var(--shadow-sm);
      }
      .mode-card:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .mode-name {
        font-size: 1.1rem;
        font-weight: 700;
      }
      .mode-desc {
        font-size: 0.85rem;
        color: var(--muted);
      }
      .card-q {
        padding: 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
      }
      .q-label {
        margin: 0 0 0.5rem;
        font-size: 0.8rem;
        color: var(--muted);
      }
      .q-prompt {
        margin: 0 0 1rem;
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--foreground);
      }
      .blank-sentence {
        font-size: 1.2rem;
      }
      .q-hint {
        margin: -0.5rem 0 1rem;
        color: var(--muted);
        font-size: 0.95rem;
      }
      .options {
        display: grid;
        gap: 0.6rem;
      }
      .option {
        padding: 0.8rem 1rem;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        text-align: left;
        color: var(--foreground);
      }
      .option:disabled {
        cursor: default;
      }
      .option.correct {
        background: #dcfce7;
        border-color: #22c55e;
        color: #14532d;
      }
      .option.wrong {
        background: #fee2e2;
        border-color: #ef4444;
        color: #7f1d1d;
      }
      input {
        width: 100%;
        padding: 0.7rem;
        border: 1px solid var(--border-strong);
        border-radius: 8px;
        font-size: 1rem;
        background: var(--surface);
        color: var(--foreground);
        margin-bottom: 0.75rem;
      }
      .feedback {
        margin-top: 1rem;
      }
      .feedback .ok {
        color: #15803d;
        font-weight: 700;
      }
      .feedback .ng {
        color: #b91c1c;
        font-weight: 700;
      }
      .next {
        padding: 0.6rem 1.5rem;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
      }
      .next:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .result {
        text-align: center;
        padding: 2rem;
      }
      .score {
        font-size: 1.2rem;
        margin: 1rem 0;
      }
      .result-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
      .result-actions button {
        padding: 0.6rem 1.5rem;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      .result-actions button.ghost {
        background: var(--surface-muted);
        color: var(--foreground);
        border: 1px solid var(--border);
      }
    `}</style>
  );
}
