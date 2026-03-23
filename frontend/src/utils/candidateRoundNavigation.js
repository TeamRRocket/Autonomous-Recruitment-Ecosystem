/**
 * Candidate pipeline navigation: interview_rounds use MCQ / CODING / INTERVIEW.
 * Technical rounds are stored as INTERVIEW with a "Technical" style round_name.
 */

export function normalizeRoundLabel(round) {
  if (!round) return '';
  const t = String(round.round_type || '').toUpperCase();
  if (t === 'MCQ') return 'APTITUDE';
  if (t === 'CODING') return 'DSA';
  if (t === 'INTERVIEW') {
    const name = String(round.round_name || '');
    if (/technical/i.test(name)) return 'TECHNICAL';
    return 'INTERVIEW';
  }
  return t;
}

export function sortRoundsByOrder(rounds) {
  if (!Array.isArray(rounds)) return [];
  return [...rounds]
    .filter((r) => r != null && Number.isFinite(Number(r.round_order)))
    .sort((a, b) => Number(a.round_order) - Number(b.round_order));
}

/**
 * @param {'APTITUDE'|'DSA'|'TECHNICAL'|'INTERVIEW'} currentLabel
 * @returns {object|null} next round row from API or null
 */
export function getNextRoundAfter(rounds, currentLabel) {
  const ordered = sortRoundsByOrder(rounds);
  const labels = ordered.map(normalizeRoundLabel);
  const idx = labels.findIndex((l) => l === currentLabel);
  if (idx < 0 || idx >= ordered.length - 1) return null;
  return ordered[idx + 1];
}

/**
 * React Router path for the next round (candidate UI).
 */
export function getNavigatePathForRound(jobId, round) {
  if (!jobId || !round) return '/applications';
  const label = normalizeRoundLabel(round);
  if (label === 'APTITUDE') return `/aptitude/round/${jobId}`;
  if (label === 'DSA') return `/dsa/round/${jobId}`;
  if (label === 'TECHNICAL') return `/technical/interview/${jobId}`;
  // HR / other INTERVIEW — no live candidate module in app yet
  return '/applications';
}
