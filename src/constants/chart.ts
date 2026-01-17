/**
 * Chart Configuration Constants
 */

// Скільки свічок завжди показувати на графіку
export const VISIBLE_CANDLES_COUNT = 120

// Максимальна історія операцій в секундах (2 години)
export const MAX_HISTORY_SECONDS = 14400

// Інтервали в секундах
export const INTERVAL_SECONDS: Record<string, number> = {
  '1s': 1,
  '5s': 5,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '1d': 86400,
}
