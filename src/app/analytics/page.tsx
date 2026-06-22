import { AnalyticsClient, type AnalyticsData } from '@/components/analytics/AnalyticsClient';
import { getAnalyticsAction } from '@/lib/actions/statsActions';

// Read live Firestore data on every request (avoid build-time static prerender).
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  let data: AnalyticsData = {
    totalPhrases: 0,
    answeredPhrases: 0,
    unansweredPhrases: 0,
    overallAccuracy: 0,
    totalAnswered: 0,
    distribution: [],
    weakPhrases: [],
    dailyTrend: [],
  };
  try {
    data = await getAnalyticsAction();
  } catch {
    /* Firestore unavailable at build time */
  }

  return <AnalyticsClient data={data} />;
}
