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

  const running = (mode === 'multiple' || mode === 'blank') && !completed;
  const total = questions.length;

  // Single-screen composition (mirrors toddler AskPage):
  //   title → persistent control card (mode selector) → output area below.
  return (
    <div className="quiz">
      <header className="quiz-header">
        <h1>{t('quiz.title')}</h1>
      </header>

      {/* Persistent control card — always visible, like AskPage's input form. */}
      <div className="mode-panel">
        <p className="q-label">{t('quiz.modeLabel')}</p>
        <div className="mode-list">
          <button
            className={mode === 'multiple' ? 'mode-card active' : 'mode-card'}
            onClick={startMultiple}
            disabled={!canMultiple}
            aria-pressed={mode === 'multiple'}
          >
            <span className="mode-icon" aria-hidden="true">A</span>
            <span className="mode-text">
              <span className="mode-name">{t('quiz.multiple')}</span>
              <span className="mode-desc">{t('quiz.multipleDesc')}</span>
            </span>
            <span className="mode-arrow" aria-hidden="true">→</span>
          </button>
          <button
            className={mode === 'blank' ? 'mode-card active' : 'mode-card'}
            onClick={startBlank}
            disabled={!canBlank}
            aria-pressed={mode === 'blank'}
          >
            <span className="mode-icon" aria-hidden="true">_</span>
            <span className="mode-text">
              <span className="mode-name">{t('quiz.blank')}</span>
              <span className="mode-desc">
                {canBlank ? t('quiz.blankDesc') : t('quiz.blankUnavailable')}
              </span>
            </span>
            <span className="mode-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Output area — appears below the control card on the same screen. */}
      <div className="quiz-output">
        {phrases.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji" aria-hidden="true">📝</div>
            <p className="empty-text">{t('quiz.empty')}</p>
          </div>
        ) : completed ? (
          <Result
            score={score}
            onAgain={mode === 'multiple' ? startMultiple : startBlank}
            onBack={backToMenu}
            t={t}
          />
        ) : running ? (
          <RunningQuestion
            mode={mode}
            index={index}
            total={total}
            multipleQs={multipleQs}
            blankQs={blankQs}
            selected={selected}
            setSelected={setSelected}
            input={input}
            setInput={setInput}
            revealed={revealed}
            setRevealed={setRevealed}
            advance={advance}
            backToMenu={backToMenu}
            record={record}
            t={t}
          />
        ) : (
          <div className="empty">
            <div className="empty-emoji" aria-hidden="true">📝</div>
            <p className="empty-text">{t('quiz.idleMain')}</p>
            <p className="empty-sub">{t('quiz.idleSub')}</p>
          </div>
        )}
      </div>

      <QuizStyles />
    </div>
  );
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function Result({
  score,
  onAgain,
  onBack,
  t,
}: {
  score: { correct: number; total: number };
  onAgain: () => void;
  onBack: () => void;
  t: TFn;
}) {
  return (
    <div className="result">
      <div className="score-ring">
        <span className="score-num nums">{score.correct}</span>
        <span className="score-den nums">/ {score.total}</span>
      </div>
      <h2>{t('quiz.done')}</h2>
      <p className="score">{t('quiz.score', { correct: score.correct, total: score.total })}</p>
      <div className="result-actions">
        <button onClick={onAgain}>{t('quiz.again')}</button>
        <button className="ghost" onClick={onBack}>{t('quiz.backMenu')}</button>
      </div>
    </div>
  );
}

function RunningQuestion({
  mode,
  index,
  total,
  multipleQs,
  blankQs,
  selected,
  setSelected,
  input,
  setInput,
  revealed,
  setRevealed,
  advance,
  backToMenu,
  record,
  t,
}: {
  mode: Mode;
  index: number;
  total: number;
  multipleQs: MultipleQuestion[];
  blankQs: BlankQuestion[];
  selected: string | null;
  setSelected: (v: string | null) => void;
  input: string;
  setInput: (v: string) => void;
  revealed: boolean;
  setRevealed: (v: boolean) => void;
  advance: () => void;
  backToMenu: () => void;
  record: (
    phrase: QuizPhrase,
    quizType: 'meaning_to_phrase' | 'blank',
    answer: string,
    correctAnswer: string
  ) => void;
  t: TFn;
}) {
  const progress = t('quiz.progress', { current: index + 1, total });
  const pct = total > 0 ? Math.min(100, Math.round(((index + 1) / total) * 100)) : 0;

  return (
    <>
      <div className="progress-row">
        <span className="progress nums">{progress}</span>
        <button className="link-btn" onClick={backToMenu}>{t('quiz.backMenu')}</button>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
      >
        <span className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {mode === 'multiple' ? (
        (() => {
          const q = multipleQs[index];
          const correctValue = q.phrase.phrase.trim();
          return (
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
          );
        })()
      ) : (
        (() => {
          const q = blankQs[index];
          const isCorrectBlank = input.trim().toLowerCase() === q.answer.trim().toLowerCase();
          return (
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
          );
        })()
      )}
    </>
  );
}

function QuizStyles() {
  return (
    <style jsx>{`
      .quiz {
        padding: 2rem 1.25rem 2.5rem;
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
      .quiz-output {
        margin-top: 1.5rem;
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--muted);
      }
      .empty-emoji {
        font-size: 2.5rem;
        line-height: 1;
        margin-bottom: 0.6rem;
      }
      .empty-text {
        margin: 0;
        font-size: 0.95rem;
      }
      .empty-sub {
        margin: 0.3rem 0 0;
        font-size: 0.82rem;
        color: var(--muted-2, var(--muted));
      }
      .mode-panel {
        padding: 1.75rem 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-sm);
      }
      .mode-list {
        display: grid;
        gap: 0.65rem;
      }
      .mode-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-height: 72px;
        padding: 0.9rem 1.1rem;
        background: var(--surface);
        border: 1.5px solid var(--border-strong);
        border-radius: var(--radius-sm);
        cursor: pointer;
        text-align: left;
        color: var(--foreground);
        transition: border-color 0.12s ease, background 0.12s ease;
      }
      .mode-card:hover:not(:disabled) {
        border-color: var(--primary);
        background: var(--primary-soft);
      }
      .mode-card.active {
        border-color: var(--primary);
        background: var(--primary-soft);
      }
      .mode-card:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .mode-icon {
        flex: none;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--primary-soft);
        color: var(--primary-soft-fg);
        font-size: 1.25rem;
        font-weight: 800;
        font-family: var(--font-serif-stack);
      }
      .mode-text {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex: 1 1 auto;
        min-width: 0;
      }
      .mode-name {
        font-size: 1.1rem;
        font-weight: 700;
      }
      .mode-desc {
        font-size: 0.85rem;
        color: var(--muted);
      }
      .mode-arrow {
        flex: none;
        color: var(--muted-2);
        font-size: 1.2rem;
        transition: transform 0.15s ease, color 0.15s ease;
      }
      .mode-card:hover:not(:disabled) .mode-arrow,
      .mode-card.active .mode-arrow {
        transform: translateX(3px);
        color: var(--primary);
      }
      .progress-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.6rem;
      }
      .link-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: none;
        border: none;
        color: var(--primary);
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        padding: 0;
      }
      .link-btn:hover {
        color: var(--primary-hover);
      }
      .progress {
        color: var(--muted);
        font-size: 0.85rem;
        font-weight: 600;
      }
      .progress-track {
        height: 8px;
        width: 100%;
        background: var(--surface-muted);
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 1.25rem;
      }
      .progress-fill {
        display: block;
        height: 100%;
        background: var(--primary);
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      .card-q {
        padding: 1.75rem 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-sm);
      }
      .q-label {
        display: block;
        margin: 0 0 0.75rem;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .q-prompt {
        margin: 0 0 1.25rem;
        font-size: 1.55rem;
        line-height: 1.35;
        font-weight: 700;
        color: var(--foreground);
      }
      .blank-sentence {
        font-size: 1.25rem;
        font-family: var(--font-serif-stack);
      }
      .q-hint {
        margin: -0.6rem 0 1.25rem;
        color: var(--muted);
        font-size: 0.95rem;
      }
      .options {
        display: grid;
        gap: 0.65rem;
      }
      .option {
        display: flex;
        align-items: center;
        min-height: 58px;
        padding: 0.85rem 1.15rem;
        background: var(--surface);
        border: 1.5px solid var(--border-strong);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 1.08rem;
        line-height: 1.4;
        text-align: left;
        color: var(--foreground);
        transition: border-color 0.12s ease, background 0.12s ease, transform 0.12s ease;
      }
      .option:hover:not(:disabled) {
        border-color: var(--primary);
        background: var(--primary-soft);
      }
      .option:disabled {
        cursor: default;
      }
      .option.correct {
        background: var(--success-soft);
        border-color: var(--success);
        color: #14532d;
        font-weight: 600;
      }
      .option.wrong {
        background: var(--danger-soft);
        border-color: var(--danger);
        color: #7f1d1d;
        font-weight: 600;
      }
      input {
        width: 100%;
        min-height: 50px;
        padding: 0.75rem 0.9rem;
        border: 1.5px solid var(--border-strong);
        border-radius: var(--radius-sm);
        font-size: 1.1rem;
        background: var(--surface);
        color: var(--foreground);
        margin-bottom: 0.85rem;
        transition: border-color 0.12s ease, box-shadow 0.12s ease;
      }
      input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-soft);
      }
      .feedback {
        margin-top: 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .feedback .ok,
      .feedback .ng {
        margin: 0;
        padding: 0.85rem 1rem;
        border-radius: var(--radius-sm);
        font-size: 1.05rem;
        font-weight: 700;
      }
      .feedback .ok {
        color: #14532d;
        background: var(--success-soft);
        border: 1px solid var(--success);
      }
      .feedback .ng {
        color: #7f1d1d;
        background: var(--danger-soft);
        border: 1px solid var(--danger);
      }
      .feedback .ok::before {
        content: '✓ ';
      }
      .feedback .ng::before {
        content: '✗ ';
      }
      .next {
        width: 100%;
        min-height: 52px;
        padding: 0.75rem 1.5rem;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 1.08rem;
        font-weight: 700;
      }
      .next:hover:not(:disabled) {
        background: var(--primary-hover);
      }
      .next:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .result {
        text-align: center;
        padding: 2.5rem 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-sm);
      }
      .score-ring {
        display: grid;
        place-content: center;
        gap: 0.1rem;
        width: 132px;
        height: 132px;
        margin: 0 auto 1.25rem;
        border-radius: 50%;
        background: var(--primary-soft);
        border: 3px solid var(--primary);
        color: var(--primary-soft-fg);
      }
      .score-num {
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1;
      }
      .score-den {
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-soft-fg);
        opacity: 0.8;
      }
      .result h2 {
        margin: 0;
        font-size: 1.35rem;
      }
      .score {
        font-size: 1.05rem;
        color: var(--muted);
        margin: 0.5rem 0 1.5rem;
      }
      .result-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
      }
      .result-actions button {
        flex: 1 1 0;
        min-height: 52px;
        padding: 0.75rem 1.5rem;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 1.05rem;
        font-weight: 700;
      }
      .result-actions button:hover {
        background: var(--primary-hover);
      }
      .result-actions button.ghost {
        background: var(--surface-muted);
        color: var(--foreground);
        border: 1px solid var(--border-strong);
      }
      .result-actions button.ghost:hover {
        background: var(--surface);
      }
      @media (max-width: 480px) {
        .quiz {
          padding: 1.5rem 1rem 2.5rem;
        }
        .card-q {
          padding: 1.4rem 1.1rem;
        }
        .q-prompt {
          font-size: 1.4rem;
        }
        .result-actions {
          flex-direction: column;
        }
      }
    `}</style>
  );
}
