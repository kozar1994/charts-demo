import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { CHART_PAIR_ID, WS_URL } from '../constants/api'
import { parseKline } from '../utils/formatters'
import type { Socket } from 'socket.io-client'
import type { Tick } from '@/types/chart'

/**
 * WebSocket hook for real-time tick/trade data
 * Converts incoming socket data to Tick format with Decimal precision
 *
 * @param onUpdate - Callback function to handle incoming ticks
 */
export const useRealtimeSocket = (onUpdate: (tick: Tick) => void) => {
  const socketRef = useRef<Socket | null>(null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    // Initialize socket connection
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket connected')
      // Subscribe to the pair
      socket.emit('subscribe', {
        type: 2, // As per instructions
        data: { pairId: CHART_PAIR_ID },
      })
    })

    socket.on('futuresCandle', (data: Array<number>) => {
      // Decompress/Format data using shared utility
      // Data is [high, low, open, close, mark, volume, trades, timestamp]
      const tick = parseKline(data)

      console.log('📥 Socket tick:', {
        time: tick.time,
        price: tick.close.toNumber(),
        volume: tick.volume.toNumber(),
      })

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (onUpdateRef.current) {
        onUpdateRef.current(tick)
      }
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    socket.on('error', (err: any) => {
      console.error('Socket error:', err)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, []) // Empty dependency array to ensure connection only happens once
}
