'use client';

import { useState, useCallback, useMemo } from 'react';
import { Phrase, PhraseInput } from '@/types/phrase';
import { PhraseFilter, FilterState } from '@/components/phrases/PhraseFilter';
import { PhraseList } from '@/components/phrases/PhraseList';
import { PhraseForm } from '@/components/phrases/PhraseForm';
import { 
  getPhrasesAction, 
  createPhraseAction, 
  updatePhraseAction, 
  deletePhraseAction 
} from '@/lib/actions/phraseActions';

type PhrasesClientProps = {
  initialPhrases: Phrase[];
};

export function PhrasesClient({ initialPhrases }: PhrasesClientProps) {
  const [phrases, setPhrases] = useState<Phrase[]>(initialPhrases);
  const [filter, setFilter] = useState<FilterState>({
    keyword: '',
    category: '',
    difficulty: '',
    onlyUnanswered: false,
    onlyWeak: false,
  });
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const data = await getPhrasesAction();
      setPhrases(data);
    } catch (error) {
      console.error('Failed to refetch phrases:', error);
    }
  }, []);

  const filteredPhrases = useMemo(() => {
    return phrases.filter((p) => {
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        const matchesKeyword =
          p.phrase.toLowerCase().includes(kw) || p.meaningJa.includes(kw);
        if (!matchesKeyword) return false;
      }
      if (filter.category && p.category !== filter.category) {
        return false;
      }
      if (filter.difficulty && p.difficulty !== filter.difficulty) {
        return false;
      }
      if (filter.onlyUnanswered && p.answeredCount > 0) {
        return false;
      }
      if (filter.onlyWeak && !(p.answeredCount > 0 && p.accuracy < 0.5)) {
        return false;
      }
      return true;
    });
  }, [phrases, filter]);

  const categories = useMemo(() => {
    const cats = new Set(phrases.map((p) => p.category));
    return Array.from(cats).sort();
  }, [phrases]);

  const handleCreate = async (data: PhraseInput) => {
    setIsLoading(true);
    try {
      await createPhraseAction(data);
      await refetch();
      setModalMode(null);
    } catch (error) {
      console.error('Failed to create phrase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (data: PhraseInput) => {
    if (!editingPhraseId) return;
    setIsLoading(true);
    try {
      await updatePhraseAction(editingPhraseId, data);
      await refetch();
      setModalMode(null);
      setEditingPhraseId(null);
    } catch (error) {
      console.error('Failed to update phrase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhraseAction(id);
      await refetch();
    } catch (error) {
      console.error('Failed to delete phrase:', error);
    }
  };

  const editingPhrase = useMemo(() => {
    if (modalMode === 'edit' && editingPhraseId) {
      return phrases.find((p) => p.id === editingPhraseId);
    }
    return undefined;
  }, [modalMode, editingPhraseId, phrases]);

  return (
    <div className="container">
      <header>
        <h1>フレーズ一覧</h1>
        <button className="add-button" onClick={() => setModalMode('create')}>
          フレーズを追加
        </button>
      </header>

      <PhraseFilter
        categories={categories}
        filter={filter}
        onChange={setFilter}
      />

      <PhraseList
        phrases={filteredPhrases}
        onEdit={(id) => {
          setEditingPhraseId(id);
          setModalMode('edit');
        }}
        onDelete={handleDelete}
      />

      {modalMode && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{modalMode === 'create' ? '新規フレーズ登録' : 'フレーズ編集'}</h2>
            <PhraseForm
              key={editingPhraseId || 'create'}
              initialData={editingPhrase}
              onSubmit={modalMode === 'create' ? handleCreate : handleEdit}
              onCancel={() => {
                setModalMode(null);
                setEditingPhraseId(null);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .add-button {
          background-color: #0070f3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-content h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
