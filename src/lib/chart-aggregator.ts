import Decimal from 'decimal.js'
import type { CandleData, Tick } from '@/types/chart'

/**
 * Aggregates a list of Ticks into CandleData based on the provided interval in seconds.
 *
 * Logic:
 * 1. Determine the start time of the bucket for each tick:
 *    bucketTime = Math.floor(tick.time / intervalSeconds) * intervalSeconds
 * 2. Group ticks into these buckets.
 * 3. For each bucket, calculate:
 *    - Open: First tick's open
 *    - High: Max of all highs
 *    - Low: Min of all lows
 *    - Close: Last tick's close
 *    - Volume: Sum of volumes
 */
export function aggregateCandles(
  ticks: Array<Tick>,
  intervalSeconds: number,
): Array<CandleData> {
  if (ticks.length === 0) return []

  // Map to store partial candles by their start time
  const candlesMap = new Map<number, CandleData>()

  for (const tick of ticks) {
    const bucketTime = Math.floor(tick.time / intervalSeconds) * intervalSeconds

    const existing = candlesMap.get(bucketTime)

    if (!existing) {
      // Start a new candle
      candlesMap.set(bucketTime, {
        time: bucketTime,
        open: tick.open,
        high: tick.high,
        low: tick.low,
        close: tick.close,
        volume: tick.volume,
      })
    } else {
      // Update existing candle
      candlesMap.set(bucketTime, {
        time: bucketTime,
        open: existing.open, // Open stays same
        high: Decimal.max(existing.high, tick.high),
        low: Decimal.min(existing.low, tick.low),
        close: tick.close, // Close updates to latest
        volume: existing.volume.plus(tick.volume),
      })
    }
  }

  // Convert map to array and sort by time
  return Array.from(candlesMap.values()).sort((a, b) => a.time - b.time)
}

/**
 * Ensures the list of candles has at least `minCount` items.
 * If fewer, prepends empty candles (all values 0) with correct timestamps.
 */
export function padCandlesWithEmpty(
  candles: Array<CandleData>,
  intervalSeconds: number,
  minCount: number,
): Array<CandleData> {
  if (candles.length >= minCount) {
    return candles
  }

  const missingCount = minCount - candles.length
  const paddedCandles: Array<CandleData> = []

  // Determine the start time for the padding
  // If we have candles, start from the first one and go backwards
  // If no candles, start from "now" bucket
  let startTime: number

  if (candles.length > 0) {
    startTime = candles[0].time
  } else {
    const now = Math.floor(Date.now() / 1000)
    startTime = Math.floor(now / intervalSeconds) * intervalSeconds
  }

  // Generate empty candles backwards
  for (let i = 1; i <= missingCount; i++) {
    const time = startTime - i * intervalSeconds
    paddedCandles.unshift({
      time,
      open: new Decimal(0),
      high: new Decimal(0),
      low: new Decimal(0),
      close: new Decimal(0),
      volume: new Decimal(0),
    })
  }

  return [...paddedCandles, ...candles]
}
