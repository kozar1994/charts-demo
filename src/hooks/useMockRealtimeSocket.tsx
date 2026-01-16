import { useEffect, useRef } from 'react'
import Decimal from 'decimal.js'
import type { Tick } from '@/types/chart'

/**
 * Mock WebSocket hook for development
 * Generates realistic tick data with random price movements
 *
 * @param onUpdate - Callback function to handle incoming ticks
 * @param interval - Interval in ms between ticks (default: 1000)
 * @param basePrice - Starting price (default: 50000)
 * @param volatility - Price volatility factor (default: 0.001)
 */
export const useMockRealtimeSocket = (
  onUpdate: (tick: Tick) => void,
  interval = 1000,
  basePrice = 1000, // Larger base price
  volatility = 0.04, // Doubled volatility to 4%
) => {
  const onUpdateRef = useRef(onUpdate)
  const currentPriceRef = useRef(basePrice)
  const trendDirectionRef = useRef(1) // 1 for up, -1 for down
  const trendDurationRef = useRef(0) // Remaining ticks for current trend

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    console.log('✅ Mock socket connected')

    const generateTick = (): Tick => {
      // Manage trend
      if (trendDurationRef.current <= 0) {
        // Pick new trend direction
        trendDirectionRef.current = Math.random() > 0.5 ? 1 : -1
        // Pick duration (20-50 ticks)
        trendDurationRef.current = Math.floor(Math.random() * 30) + 20
        console.log(
          `📈 New trend: ${trendDirectionRef.current > 0 ? 'UP' : 'DOWN'} for ${trendDurationRef.current} ticks`,
        )
      }
      trendDurationRef.current--

      // Dynamic Volatility: 20% chance of a "spike" (2x movement)
      const isSpike = Math.random() < 0.2
      const volatilityMultiplier = isSpike ? 2 : 1

      const currentVolatility = volatility * volatilityMultiplier
      const currentTrendBias =
        0.015 * trendDirectionRef.current * volatilityMultiplier // Increased base trend

      // Calculate price movement
      const noise = (Math.random() - 0.5) * currentVolatility
      const change = currentTrendBias + noise

      const prevPrice = currentPriceRef.current
      const newPrice = prevPrice * (1 + change)
      currentPriceRef.current = newPrice

      // Generate random high/low based on open/close
      const open = new Decimal(prevPrice)
      const close = new Decimal(newPrice)

      // Wicks: Base 5%, Spikes up to 10%
      const wickFactor = 0.05 * volatilityMultiplier
      const high = Decimal.max(open, close).times(
        1 + Math.random() * wickFactor,
      )
      const low = Decimal.min(open, close).times(1 - Math.random() * wickFactor)

      // Random volume
      const volume = Math.random() * 9.9 + 0.1
      const trades = Math.floor(Math.random() * 50) + 1

      const tick: Tick = {
        time: Math.floor(Date.now() / 1000),
        open: open,
        high: high,
        low: low,
        close: close,
        mark: close,
        volume: new Decimal(volume),
        trades: trades,
      }

      console.log('📥 Mock tick:', {
        time: tick.time,
        price: tick.close.toNumber(),
        trend: trendDirectionRef.current > 0 ? 'UP' : 'DOWN',
        remaining: trendDurationRef.current,
      })

      return tick
    }

    // Generate initial tick
    const initialTick = generateTick()
    onUpdateRef.current(initialTick)

    // Set up interval for continuous ticks
    const intervalId = setInterval(() => {
      const tick = generateTick()
      onUpdateRef.current(tick)
    }, interval)

    return () => {
      clearInterval(intervalId)
      console.log('❌ Mock socket disconnected')
    }
  }, [interval, basePrice, volatility])
}
