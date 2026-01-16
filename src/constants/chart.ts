/**
 * Chart Configuration Constants
 */

// Скільки свічок завжди показувати на графіку
export const VISIBLE_CANDLES_COUNT = 100

// Максимальна історія операцій в секундах (2 години)
export const MAX_HISTORY_SECONDS = 7200

// Інтервали в секундах
export const INTERVAL_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '1d': 86400,
}
