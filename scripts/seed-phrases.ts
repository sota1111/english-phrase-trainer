/**
 * Idempotent Firestore seed + category reconcile for the initial phrase datasets.
 *
 * Inserts every entry from `src/data/initialPhrases.ts` (SOT-823) and
 * `src/data/sot826Phrases.ts` (SOT-826) into the `phrases` collection, skipping
 * any whose `phrase` text already exists. Safe to re-run: a second run inserts
 * nothing. Dedupe is by `phrase` text, so any phrase shared across the two
 * datasets is only inserted once.
 *
 * It then runs a RECONCILE pass (SOT-866 / SOT-890): for every already-registered
 * document whose `phrase` text matches the source data but whose stored `category`
 * or `importance` differs from the source value, it updates the document in place.
 * This is what keeps previously-seeded documents in sync after the source data is
 * reorganized (e.g. the category collapse to ビジネス / 技術 / 日常, or the SOT-890
 * importance classification at a high:normal:low = 1:2:7 ratio) — insert-only
 * seeding leaves old field values on existing docs untouched. The reconcile pass is
 * also idempotent: a second run finds no mismatches and updates nothing.
 *
 * It then runs a CLEANUP pass (SOT-865): every already-registered document whose
 * `phrase` field still carries a Japanese annotation — `(優先暗記)` / `(セット表現)`
 * / `(重要動詞)` — is fixed so phrases are English-only. If a clean document with
 * the de-annotated text already exists, the annotated duplicate is deleted;
 * otherwise the document's `phrase` is rewritten in place to the stripped text.
 * Source-data removal alone never reaches these docs (the insert pass skips
 * existing text and the reconcile pass only touches `category`). This pass is also
 * idempotent: once clean, a second run finds nothing to fix.
 *
 * Run (requires Application Default Credentials for the target project):
 *
 *   GOOGLE_CLOUD_PROJECT=<your-gcp-project-id> npx tsx scripts/seed-phrases.ts
 *
 * Without GOOGLE_CLOUD_PROJECT set, the script refuses to write and exits 1 so
 * it never blind-writes to the wrong (or a default) project.
 */
import { initialPhrases } from '../src/data/initialPhrases';
import { sot826Phrases } from '../src/data/sot826Phrases';
import { DEFAULT_IMPORTANCE } from '../src/lib/importance';
import { Importance } from '../src/types/phrase';
import {
  getPhrases,
  createPhrase,
  updatePhrase,
  deletePhrase,
} from '../src/lib/firestore/phrases';
import { hasPhraseAnnotation, stripPhraseAnnotation } from '../src/lib/phraseText';

const allPhrases = [...initialPhrases, ...sot826Phrases];

// Desired category for each phrase text, taken from the source datasets. Later
// datasets win on a text collision, matching the insert-pass dedupe order.
const desiredCategoryByPhrase = new Map<string, string>(
  allPhrases.map((entry) => [entry.phrase, entry.category]),
);

// Desired importance for each phrase text, taken from the source datasets. Entries
// without an explicit `importance` fall back to the default ('normal'), matching how
// the read layer treats legacy docs. Later datasets win on a text collision.
const desiredImportanceByPhrase = new Map<string, Importance>(
  allPhrases.map((entry) => [entry.phrase, entry.importance ?? DEFAULT_IMPORTANCE]),
);

async function main(): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error(
      'GOOGLE_CLOUD_PROJECT is not set. Refusing to seed.\n' +
        'Run: GOOGLE_CLOUD_PROJECT=<project-id> npx tsx scripts/seed-phrases.ts',
    );
    process.exit(1);
  }

  console.log(`Seeding ${allPhrases.length} phrases into project "${projectId}"...`);

  const existing = await getPhrases();
  const existingTexts = new Set(existing.map((p) => p.phrase));

  let inserted = 0;
  let skipped = 0;
  for (const entry of allPhrases) {
    if (existingTexts.has(entry.phrase)) {
      skipped += 1;
      continue;
    }
    await createPhrase(entry);
    existingTexts.add(entry.phrase);
    inserted += 1;
  }

  // Reconcile pass: fix the `category` of already-registered documents that the
  // insert pass skipped, so registered data follows source category changes.
  let recategorized = 0;
  for (const doc of existing) {
    const desired = desiredCategoryByPhrase.get(doc.phrase);
    if (desired !== undefined && desired !== doc.category) {
      await updatePhrase(doc.id, { category: desired });
      recategorized += 1;
    }
  }

  // Reconcile pass (SOT-890): fix the `importance` of already-registered documents
  // so registered data follows the source importance classification (1:2:7). The
  // insert pass skips existing phrase text, so without this the docs stay 'normal'.
  let reimportanced = 0;
  for (const doc of existing) {
    const desired = desiredImportanceByPhrase.get(doc.phrase);
    if (desired !== undefined && desired !== doc.importance) {
      await updatePhrase(doc.id, { importance: desired });
      reimportanced += 1;
    }
  }

  // Cleanup pass: make already-registered phrases English-only by removing the
  // Japanese annotation. Delete the annotated doc when a clean equivalent already
  // exists; otherwise rewrite the phrase in place to the stripped text.
  let annotationDeleted = 0;
  let annotationStripped = 0;
  for (const doc of existing) {
    if (!hasPhraseAnnotation(doc.phrase)) continue;
    const cleaned = stripPhraseAnnotation(doc.phrase);
    if (existingTexts.has(cleaned)) {
      await deletePhrase(doc.id);
      existingTexts.delete(doc.phrase);
      annotationDeleted += 1;
    } else {
      await updatePhrase(doc.id, { phrase: cleaned });
      existingTexts.delete(doc.phrase);
      existingTexts.add(cleaned);
      annotationStripped += 1;
    }
  }

  console.log(
    `Done. inserted=${inserted}, skipped(existing)=${skipped}, ` +
      `recategorized=${recategorized}, reimportanced=${reimportanced}, ` +
      `annotationDeleted=${annotationDeleted}, annotationStripped=${annotationStripped}, ` +
      `total=${allPhrases.length}`,
  );
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
