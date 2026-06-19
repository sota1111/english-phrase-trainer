/**
 * Idempotent Firestore seed for the SOT-823 initial phrase dataset.
 *
 * Inserts every entry from `src/data/initialPhrases.ts` into the `phrases`
 * collection, skipping any whose `phrase` text already exists. Safe to re-run:
 * a second run inserts nothing.
 *
 * Run (requires Application Default Credentials for the target project):
 *
 *   GOOGLE_CLOUD_PROJECT=<your-gcp-project-id> npx tsx scripts/seed-phrases.ts
 *
 * Without GOOGLE_CLOUD_PROJECT set, the script refuses to write and exits 1 so
 * it never blind-writes to the wrong (or a default) project.
 */
import { initialPhrases } from '../src/data/initialPhrases';
import { getPhrases, createPhrase } from '../src/lib/firestore/phrases';

async function main(): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error(
      'GOOGLE_CLOUD_PROJECT is not set. Refusing to seed.\n' +
        'Run: GOOGLE_CLOUD_PROJECT=<project-id> npx tsx scripts/seed-phrases.ts',
    );
    process.exit(1);
  }

  console.log(`Seeding ${initialPhrases.length} phrases into project "${projectId}"...`);

  const existing = await getPhrases();
  const existingTexts = new Set(existing.map((p) => p.phrase));

  let inserted = 0;
  let skipped = 0;
  for (const entry of initialPhrases) {
    if (existingTexts.has(entry.phrase)) {
      skipped += 1;
      continue;
    }
    await createPhrase(entry);
    existingTexts.add(entry.phrase);
    inserted += 1;
  }

  console.log(`Done. inserted=${inserted}, skipped(existing)=${skipped}, total=${initialPhrases.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
