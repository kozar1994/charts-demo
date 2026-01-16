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
  basePrice = 50000,
  volatility = 0.001,
) => {
  const onUpdateRef = useRef(onUpdate)
  const currentPriceRef = useRef(basePrice)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    console.log('✅ Mock socket connected')

    const generateTick = (): Tick => {
      // Generate random price movement
      const change = (Math.random() - 0.5) * 2 * volatility
      const prevPrice = currentPriceRef.current
      const newPrice = prevPrice * (1 + change)
      currentPriceRef.current = newPrice

      // Generate random high/low based on open/close
      const open = new Decimal(prevPrice)
      const close = new Decimal(newPrice)
      const high = Decimal.max(open, close).times(1 + Math.random() * 0.0005)
      const low = Decimal.min(open, close).times(1 - Math.random() * 0.0005)

      // Generate random volume between 0.1 and 10
      const volume = Math.random() * 9.9 + 0.1

      // Generate random trades count
      const trades = Math.floor(Math.random() * 50) + 1

      const tick: Tick = {
        time: Math.floor(Date.now() / 1000),
        open: open,
        high: high,
        low: low,
        close: close,
        mark: close, // Mock mark price same as close
        volume: new Decimal(volume),
        trades: trades,
      }

      console.log('📥 Mock tick:', {
        time: tick.time,
        price: tick.close.toNumber(),
        volume: tick.volume.toNumber(),
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
