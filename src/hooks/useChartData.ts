import { useCallback, useEffect, useRef, useState } from 'react'
import { useKlinesQuery } from './useKlinesQuery'
// import { useRealtimeSocket } from './useRealtimeSocket'
import { useRealtimeSocket } from './useRealtimeSocket'
import type { Tick } from '@/types/chart'

export const useChartData = (interval: string, enabled: boolean = true) => {
  const [data, setData] = useState<Array<Tick>>([])
  // Ref to store ALL real-time ticks received since component mount
  const accumulatedTicksRef = useRef<Array<Tick>>([])
  const {
    data: initialData,
    isLoading,
    error,
  } = useKlinesQuery(interval, { enabled })

  // Initialize data when historical data loads
  // We merge historical data with our accumulated real-time ticks
  useEffect(() => {
    if (initialData) {
      const mergedData = [...initialData]

      // Replay accumulated ticks onto the new historical data
      // This ensures we don't lose recent price action when switching intervals
      accumulatedTicksRef.current.forEach((tick) => {
        if (mergedData.length === 0) {
          mergedData.push(tick)
          return
        }

        const lastTick = mergedData[mergedData.length - 1]

        if (tick.time === lastTick.time) {
          mergedData[mergedData.length - 1] = tick
        } else if (tick.time > lastTick.time) {
          mergedData.push(tick)
        }
      })

      setData(mergedData)
    }
  }, [initialData])

  // Handle real-time updates
  const handleTick = useCallback((tick: Tick) => {
    // 1. Store in ref for future persistence
    accumulatedTicksRef.current.push(tick)

    // 2. Update current state
    setData((prevData) => {
      if (prevData.length === 0) return [tick]

      const lastTick = prevData[prevData.length - 1]

      if (tick.time === lastTick.time) {
        const newData = [...prevData]
        newData[newData.length - 1] = tick
        return newData
      }

      if (tick.time > lastTick.time) {
        return [...prevData, tick]
      }

      return prevData
    })
  }, [])

  // Subscribe to socket
  // Switch to useMockRealtimeSocket for development without API
  useRealtimeSocket(handleTick, enabled)
  // useRealtimeSocket(handleTick)

  return { data, isLoading, error }
}
