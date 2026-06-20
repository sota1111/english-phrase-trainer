'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Phrase, PhraseInput } from '@/types/phrase';
import { PhraseFilter, FilterState } from '@/components/phrases/PhraseFilter';
import { PhraseList } from '@/components/phrases/PhraseList';
import { PhraseForm } from '@/components/phrases/PhraseForm';
import { useI18n } from '@/i18n/I18nContext';
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
  const { t } = useI18n();
  const [phrases, setPhrases] = useState<Phrase[]>(initialPhrases);
  const [filter, setFilter] = useState<FilterState>({
    keyword: '',
    category: '',
    importance: '',
    onlyUnanswered: false,
    onlyWeak: false,
  });
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setEditingPhraseId(null);
    setJustCreated(false);
  }, []);

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
      if (filter.importance && p.importance !== filter.importance) {
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
      setJustCreated(true);
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
      closeModal();
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
        <div className="header-left">
          <Link href="/" className="back-home">
            {t('common.backHome')}
          </Link>
          <h1>{t('phrases.list.title')}</h1>
        </div>
        <button className="add-button" onClick={() => setModalMode('create')}>
          {t('phrases.add')}
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
            {justCreated ? (
              <div className="created-view">
                <h2>{t('phrases.created.title')}</h2>
                <p className="created-message">{t('phrases.created.body')}</p>
                <div className="created-actions">
                  <button
                    type="button"
                    onClick={() => setJustCreated(false)}
                  >
                    {t('phrases.created.again')}
                  </button>
                  <Link href="/" className="home-link">
                    {t('common.home')}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2>{modalMode === 'create' ? t('phrases.modal.create') : t('phrases.modal.edit')}</h2>
                <PhraseForm
                  key={editingPhraseId || 'create'}
                  initialData={editingPhrase}
                  categories={categories}
                  onSubmit={modalMode === 'create' ? handleCreate : handleEdit}
                  onCancel={closeModal}
                  isLoading={isLoading}
                />
              </>
            )}
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
          gap: 1rem;
        }
        .header-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .back-home {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          background: var(--surface-muted);
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.875rem;
        }
        .back-home:hover {
          border-color: var(--border-strong);
          color: var(--foreground);
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .add-button {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .add-button:hover {
          background-color: var(--primary-hover);
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
          background: var(--surface);
          color: var(--foreground);
          padding: 2rem;
          border-radius: 14px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
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
