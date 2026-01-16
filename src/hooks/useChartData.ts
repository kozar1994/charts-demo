import { useCallback, useEffect, useState } from 'react'
import { useKlinesQuery } from './useKlinesQuery'
import { useMockRealtimeSocket } from './useMockRealtimeSocket'
// import { useRealtimeSocket } from './useRealtimeSocket'
import type { Tick } from '@/types/chart'

export const useChartData = (interval: string) => {
  const [data, setData] = useState<Array<Tick>>([])
  const { data: initialData, isLoading, error } = useKlinesQuery(interval)

  // Initialize data when historical data loads
  useEffect(() => {
    if (initialData) {
      // setData(initialData)
      setData([])
    }
  }, [initialData])

  // Handle real-time updates
  const handleTick = useCallback((tick: Tick) => {
    setData((prevData) => {
      if (prevData.length === 0) return [tick]

      const lastTick = prevData[prevData.length - 1]

      // If tick belongs to the same time interval (or older/overlapping), update the last candle
      // Note: This logic assumes ticks come in order or update the tip.
      // API candles are usually time-indexed.
      if (tick.time === lastTick.time) {
        // Update the last candle
        // For partial candles (real-time), "tick" might be a full candle update or just a trade.
        // Since our hooks parse everything into "Tick" (which is actually a Candle structure), we replace/update.
        const newData = [...prevData]
        newData[newData.length - 1] = tick
        return newData
      }

      // If tick is newer, append it
      if (tick.time > lastTick.time) {
        return [...prevData, tick]
      }

      // If tick is older, we ignore it for now to avoid re-sorting whole array/messing up history
      // (Or we could find the index and update it if we needed to handle late arrival)
      return prevData
    })
  }, [])

  // Subscribe to socket
  // Switch to useMockRealtimeSocket for development without API
  useMockRealtimeSocket(handleTick)
  // useRealtimeSocket(handleTick)

  return { data, isLoading, error }
}
