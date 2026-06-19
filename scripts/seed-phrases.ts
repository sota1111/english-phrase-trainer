/**
 * Idempotent Firestore seed + category reconcile for the initial phrase datasets.
 *
 * Inserts every entry from `src/data/initialPhrases.ts` (SOT-823) and
 * `src/data/sot826Phrases.ts` (SOT-826) into the `phrases` collection, skipping
 * any whose `phrase` text already exists. Safe to re-run: a second run inserts
 * nothing. Dedupe is by `phrase` text, so any phrase shared across the two
 * datasets is only inserted once.
 *
 * It then runs a RECONCILE pass (SOT-866): for every already-registered document
 * whose `phrase` text matches the source data but whose stored `category` differs
 * from the source `category`, it updates the document's `category` in place. This
 * is what keeps previously-seeded documents in sync after the source categories
 * are reorganized (e.g. the collapse to ビジネス / 技術 / 日常) — insert-only
 * seeding leaves old categories on existing docs untouched. The reconcile pass is
 * also idempotent: a second run finds no mismatches and updates nothing.
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
import { getPhrases, createPhrase, updatePhrase } from '../src/lib/firestore/phrases';

const allPhrases = [...initialPhrases, ...sot826Phrases];

// Desired category for each phrase text, taken from the source datasets. Later
// datasets win on a text collision, matching the insert-pass dedupe order.
const desiredCategoryByPhrase = new Map<string, string>(
  allPhrases.map((entry) => [entry.phrase, entry.category]),
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

  console.log(
    `Done. inserted=${inserted}, skipped(existing)=${skipped}, ` +
      `recategorized=${recategorized}, total=${allPhrases.length}`,
  );
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
