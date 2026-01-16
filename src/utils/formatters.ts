import Decimal from 'decimal.js'
import type { CandleData, ChartCandle, Tick } from '@/types/chart'

export const SCALING_FACTOR = 10000

/**
 * Converts a scaled integer (e.g. 125430) to a Decimal (e.g. 12.543)
 * Uses Decimal.js for precision in calculations
 */
export function scaleDown(value: number): Decimal {
  return new Decimal(value).dividedBy(SCALING_FACTOR)
}

/**
 * Converts a Decimal to a number for chart display
 */
export function toNumber(value: Decimal): number {
  return value.toNumber()
}

/**
 * Converts a CandleData (with Decimal values) to ChartCandle (with number values)
 * for use with lightweight-charts
 */
export function candleToChart(candle: CandleData): ChartCandle {
  return {
    time: candle.time,
    open: candle.open.toNumber(),
    high: candle.high.toNumber(),
    low: candle.low.toNumber(),
    close: candle.close.toNumber(),
    volume: candle.volume.toNumber(),
  }
}

/**
 * Converts an array of CandleData to ChartCandle array
 */
export function candlesToChart(candles: Array<CandleData>): Array<ChartCandle> {
  return candles.map(candleToChart)
}

/**
 * Formats a price with appropriate decimals.
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(value)
}

/**
 * Formats a date string.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

/**
 * Converts a percent value to a formatted string.
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * Decompresses/Parses an API kline array into a structured Tick object
 * format: [high, low, open, close, mark, volume, trades, timestamp]
 */
export function parseKline(data: Array<number>): Tick {
  // [high, low, open, close, mark, volume, trades, timestamp]
  const [high, low, open, close, mark, volume, trades, timestamp] = data

  return {
    time: Math.floor(timestamp / 1000), // Convert ms to seconds
    open: scaleDown(open),
    high: scaleDown(high),
    low: scaleDown(low),
    close: scaleDown(close),
    mark: scaleDown(mark),
    volume: scaleDown(volume),
    trades: trades, // trades is usually an integer count, not price scaled
  }
}
