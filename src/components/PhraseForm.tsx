'use client';

import { useState } from 'react';
import { PhraseInput } from '@/types/phrase';

type PhraseFormProps = {
  initialData?: Partial<PhraseInput>;
  onSubmit: (data: PhraseInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function PhraseForm({ initialData, onSubmit, onCancel, isLoading }: PhraseFormProps) {
  const [formData, setFormData] = useState<PhraseInput>({
    phrase: initialData?.phrase ?? '',
    meaningJa: initialData?.meaningJa ?? '',
    example: initialData?.example ?? '',
    exampleJa: initialData?.exampleJa ?? '',
    category: initialData?.category ?? '',
    difficulty: initialData?.difficulty ?? 'normal',
    memo: initialData?.memo ?? '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (mode: 'ja2en' | 'en2ja') => {
    const text = mode === 'ja2en' ? formData.meaningJa : formData.phrase;
    if (!text.trim()) return;

    setIsGenerating(true);
    setGenMessage(null);

    try {
      const response = await fetch('/api/phrases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          ...data.result,
        }));
        setGenMessage({ type: 'info', text: '自動生成しました。内容を確認・編集して保存してください。' });
      } else {
        setGenMessage({
          type: response.status === 503 ? 'info' : 'error',
          text: data.message || '自動生成に失敗しました。手動で入力してください。'
        });
      }
    } catch (error) {
      console.error('Generate error:', error);
      setGenMessage({ type: 'error', text: '通信エラーが発生しました。手動で入力してください。' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="phrase-form">
      <div className="form-field">
        <label htmlFor="phrase">英語フレーズ</label>
        <input
          id="phrase"
          name="phrase"
          type="text"
          value={formData.phrase}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="meaningJa">日本語の意味</label>
        <input
          id="meaningJa"
          name="meaningJa"
          type="text"
          value={formData.meaningJa}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="example">例文（英語）</label>
        <input
          id="example"
          name="example"
          type="text"
          value={formData.example}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="exampleJa">例文（日本語）</label>
        <input
          id="exampleJa"
          name="exampleJa"
          type="text"
          value={formData.exampleJa}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="category">カテゴリ</label>
        <input
          id="category"
          name="category"
          type="text"
          value={formData.category}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="difficulty">難易度</label>
        <select
          id="difficulty"
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          required
        >
          <option value="easy">易しい</option>
          <option value="normal">普通</option>
          <option value="hard">難しい</option>
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="memo">メモ（任意）</label>
        <textarea
          id="memo"
          name="memo"
          value={formData.memo}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <div className="auto-gen-section">
        <div className="gen-buttons">
          <button
            type="button"
            onClick={() => handleGenerate('ja2en')}
            disabled={isGenerating || isLoading || !formData.meaningJa.trim()}
          >
            日本語から英文を生成
          </button>
          <button
            type="button"
            onClick={() => handleGenerate('en2ja')}
            disabled={isGenerating || isLoading || !formData.phrase.trim()}
          >
            英文から日本語を生成
          </button>
        </div>
        <p className="gen-note">
          日本語または英語のどちらかを入力して生成できます。ANTHROPIC_API_KEY 未設定時は自動生成は使えませんが手動入力は可能です。
        </p>
        {genMessage && (
          <p className={`gen-message ${genMessage.type}`}>
            {genMessage.text}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading || isGenerating}>
          キャンセル
        </button>
        <button type="submit" className="submit" disabled={isLoading || isGenerating}>
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>

      <style jsx>{`
        .phrase-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        label {
          font-weight: bold;
          font-size: 0.9rem;
        }
        input, select, textarea {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        .auto-gen-section {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          border: 1px dashed #ccc;
          margin-top: 0.5rem;
        }
        .gen-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .gen-buttons button {
          flex: 1;
          font-size: 0.8rem;
          padding: 0.4rem;
          background: #eef;
          border-color: #ccd;
        }
        .gen-note {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
        }
        .gen-message {
          font-size: 0.8rem;
          margin-top: 0.5rem;
          font-weight: bold;
        }
        .gen-message.info {
          color: #0070f3;
        }
        .gen-message.error {
          color: #e00;
        }
        button {
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #ccc;
          background: white;
        }
        button.submit {
          background: #0070f3;
          color: white;
          border-color: #0070f3;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
