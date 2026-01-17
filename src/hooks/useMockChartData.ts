import { useEffect, useRef, useState } from 'react'
import Decimal from 'decimal.js'
import type { Tick } from '@/types/chart'

/**
 * Generates a single mock tick with realistic price action
 */
const generateNextTick = (
  prevTick: Tick,
  trendDirection: number,
  volatility: number,
  isBigMove: boolean = false,
): Tick => {
  // Increased trend bias for more noticeable movement
  const baseTrendBias = 0.0008 * trendDirection
  const trendBias = isBigMove ? baseTrendBias * 3 : baseTrendBias

  // More realistic noise with occasional spikes
  const baseNoise = (Math.random() - 0.5) * volatility * 0.002
  const spike = isBigMove ? (Math.random() - 0.5) * volatility * 0.005 : 0
  const noise = baseNoise + spike

  const change = trendBias + noise

  const prevPrice = prevTick.close.toNumber()
  const newPrice = prevPrice * (1 + change)

  const open = prevTick.close // Open is previous close
  const close = new Decimal(newPrice)

  // More varied wick sizes - some candles with big wicks, some without
  const wickType = Math.random()
  let wickFactor: number

  if (wickType < 0.3) {
    // 30% - small wicks
    wickFactor = 0.0005 + Math.random() * 0.001
  } else if (wickType < 0.7) {
    // 40% - medium wicks
    wickFactor = 0.002 + Math.random() * 0.003
  } else if (wickType < 0.9) {
    // 20% - large wicks
    wickFactor = 0.005 + Math.random() * 0.008
  } else {
    // 10% - very large wicks (volatile moments)
    wickFactor = 0.01 + Math.random() * 0.015
  }

  // Asymmetric wicks (more realistic)
  const upperWick = Math.random() * wickFactor
  const lowerWick = Math.random() * wickFactor

  const high = Decimal.max(open, close).times(1 + upperWick)
  const low = Decimal.min(open, close).times(1 - lowerWick)

  // Varied volume
  const volumeType = Math.random()
  let volume: number
  if (volumeType < 0.6) {
    volume = 1 + Math.random() * 5 // Low volume
  } else if (volumeType < 0.9) {
    volume = 5 + Math.random() * 15 // Medium volume
  } else {
    volume = 15 + Math.random() * 30 // High volume
  }

  const trades = Math.floor(Math.random() * 80) + 10

  return {
    time: prevTick.time + 1,
    open,
    high,
    low,
    close,
    mark: close,
    volume: new Decimal(volume),
    trades,
  }
}

/**
 * Hook to provide mock chart data (historical + real-time)
 */
export const useMockChartData = (
  _interval: string,
  enabled: boolean = true,
) => {
  const [data, setData] = useState<Array<Tick>>([])
  const [isLoading, setIsLoading] = useState(false)

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const latestTickRef = useRef<Tick | null>(null)

  const trendDirectionRef = useRef(1)
  const trendDurationRef = useRef(0)
  const volatilityRef = useRef(1.0)

  // Generate Initial Data
  useEffect(() => {
    if (!enabled) {
      setData([])
      return
    }

    setIsLoading(true)

    const now = Math.floor(Date.now() / 1000)
    const initialTicks: Array<Tick> = []

    const startingPrice = 50000
    const startTime = now - 9999999

    // Create first tick
    const currentPrice = startingPrice
    const firstOpen = new Decimal(currentPrice)
    const firstClose = firstOpen.times(1 + (Math.random() - 0.5) * 0.001)

    let lastTick: Tick = {
      time: startTime,
      open: firstOpen,
      high: Decimal.max(firstOpen, firstClose).times(1.002),
      low: Decimal.min(firstOpen, firstClose).times(0.998),
      close: firstClose,
      mark: firstClose,
      volume: new Decimal(5 + Math.random() * 10),
      trades: Math.floor(Math.random() * 50) + 10,
    }
    initialTicks.push(lastTick)

    // Market phases for more realistic movement
    let currentTrendDir = 1
    let currentTrendDur = Math.floor(Math.random() * 60) + 30
    let currentVolatility = 0.8 + Math.random() * 0.4 // 0.8 to 1.2

    for (let i = 1; i < 555; i++) {
      // Change trend periodically
      if (currentTrendDur <= 0) {
        currentTrendDir = Math.random() > 0.5 ? 1 : -1
        currentTrendDur = Math.floor(Math.random() * 80) + 20
        // Sometimes change volatility with trend
        if (Math.random() > 0.7) {
          currentVolatility = 0.6 + Math.random() * 0.8 // 0.6 to 1.4
        }
      }
      currentTrendDur--

      // 15% chance of a big move
      const isBigMove = Math.random() < 0.15

      const newTick = generateNextTick(
        lastTick,
        currentTrendDir,
        currentVolatility,
        isBigMove,
      )

      newTick.time = startTime + i
      initialTicks.push(newTick)
      lastTick = newTick
    }

    setData(initialTicks)
    latestTickRef.current = initialTicks[initialTicks.length - 1]

    trendDirectionRef.current = currentTrendDir
    trendDurationRef.current = currentTrendDur
    volatilityRef.current = currentVolatility

    setIsLoading(false)
  }, [enabled])

  // Simulate Real-time Updates
  useEffect(() => {
    if (!enabled) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current)
      return
    }

    const tickIntervalMs = 1000

    intervalIdRef.current = setInterval(() => {
      if (!latestTickRef.current) return

      // Update trend
      if (trendDurationRef.current <= 0) {
        trendDirectionRef.current = Math.random() > 0.5 ? 1 : -1
        trendDurationRef.current = Math.floor(Math.random() * 50) + 20

        // Occasionally change volatility
        if (Math.random() > 0.7) {
          volatilityRef.current = 0.6 + Math.random() * 0.8
        }
      }
      trendDurationRef.current--

      // 12% chance of big move in real-time
      const isBigMove = Math.random() < 0.12

      const newTick = generateNextTick(
        latestTickRef.current,
        trendDirectionRef.current,
        volatilityRef.current,
        isBigMove,
      )

      newTick.time = Math.floor(Date.now() / 1000)

      setData((prev) => {
        if (prev.length === 0) return [newTick]
        const last = prev[prev.length - 1]

        if (newTick.time > last.time) {
          // Keep only last ~600 ticks to prevent memory issues
          const newData = prev.length > 600 ? prev.slice(-599) : prev
          return [...newData, newTick]
        } else if (newTick.time === last.time) {
          const copy = [...prev]
          copy[copy.length - 1] = newTick
          return copy
        }
        return prev
      })

      latestTickRef.current = newTick
    }, tickIntervalMs)

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current)
    }
  }, [enabled])

  return {
    data,
    isLoading,
    error: null,
  }
}
