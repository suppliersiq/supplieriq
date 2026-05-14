// tierEngine.js — pure functions, no side effects
// Import these wherever you need to evaluate tier changes

const TIER_RANK = { Bronze: 0, Silver: 1, Gold: 2 };
const RANK_TIER = { 0: "Bronze", 1: "Silver", 2: "Gold" };

function tierDown(currentTier, reason) {
  const newRank = Math.max(0, TIER_RANK[currentTier] - 1);
  const newTier = RANK_TIER[newRank];
  return { tier: newTier, changed: newTier !== currentTier, direction: "down", reason };
}

function tierUp(currentTier, reason) {
  const newRank = Math.min(2, TIER_RANK[currentTier] + 1);
  const newTier = RANK_TIER[newRank];
  return { tier: newTier, changed: newTier !== currentTier, direction: "up", reason };
}

// TRIGGER 1 — call after every delivery submission
export function evaluateDeliveryQuality(currentTier, deductionPoints, threshold) {
  if (deductionPoints > threshold) {
    return tierDown(currentTier, `Deduction ${deductionPoints} pts exceeded threshold of ${threshold} pts`);
  }
  return { tier: currentTier, changed: false, direction: null, reason: `Quality OK — ${deductionPoints}/${threshold} pts` };
}

// TRIGGER 2 — call at every weekly rollover
export function evaluateWeeklyTarget(currentTier, deliveriesThisWeek, weeklyTarget, wasDowngradedLastWeek) {
  const met = deliveriesThisWeek >= weeklyTarget;
  if (!met) {
    return { ...tierDown(currentTier, `Missed weekly target: ${deliveriesThisWeek}/${weeklyTarget}`), newDowngradedFlag: true };
  }
  if (wasDowngradedLastWeek) {
    return { ...tierUp(currentTier, `Recovered: ${deliveriesThisWeek}/${weeklyTarget} deliveries`), newDowngradedFlag: false };
  }
  return { tier: currentTier, changed: false, direction: null, reason: `Target met (${deliveriesThisWeek}/${weeklyTarget})`, newDowngradedFlag: false };
}
