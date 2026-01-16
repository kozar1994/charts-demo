import type Decimal from 'decimal.js'

/**
 * Individual trade/tick/operation
 * Represents a single market operation with price and volume
 */
export interface Tick {
  time: number // Unix timestamp in seconds (interval start)
  open: Decimal
  high: Decimal
  low: Decimal
  close: Decimal
  mark: Decimal // added mark price
  volume: Decimal
  trades: number // added trades count
}

/**
 * Aggregated candle data using Decimal for precision
 * Used internally for aggregation calculations
 */
export interface CandleData {
  time: number // Unix timestamp in seconds (interval start)
  open: Decimal
  high: Decimal
  low: Decimal
  close: Decimal
  volume: Decimal
}

/**
 * Chart-ready candle data with number types
 * Used for display in lightweight-charts which requires numbers
 */
export interface ChartCandle {
  time: number // Unix timestamp in seconds (interval start)
  open: number
  high: number
  low: number
  close: number
  volume: number
}
