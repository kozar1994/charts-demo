import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CHART_PAIR_ID } from '../constants/api'
import { parseKline } from '../utils/formatters'
import { authClient, ensureLoggedIn } from '../utils/auth'
import type { Tick } from '@/types/chart'

type KlineArray = [
  number, // high
  number, // low
  number, // open
  number, // close
  number, // mark
  number, // volume
  number, // trades
  number, // timestamp
]

interface ApiResponse {
  success: boolean
  details: string
  data: Array<KlineArray>
}

/**
 * Fetches individual trade ticks/operations from the API
 * Converts scaled prices to Decimal for precision
 *
 * @param interval - Time interval parameter (sent to API, but API returns raw ticks)
 * @returns Array of individual ticks with Decimal precision
 */
const fetchKlines = async (interval: string): Promise<Array<Tick>> => {
  try {
    await ensureLoggedIn()

    const response = await authClient.get<ApiResponse>(
      '/derivatives/pairs/klines',
      {
        params: {
          pairId: CHART_PAIR_ID,
          interval: interval,
        },
      },
    )

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response.data || !response.data.data) {
      console.warn('fetchKlines: No data returned from API', response.data)
      return []
    }

    console.log('response.data.data[0]', response.data.data)

    console.log('🔍 RAW API Response:', {
      interval,
      totalRecords: response.data.data.length,
      firstRecord: response.data.data[0],
      lastRecord: response.data.data[response.data.data.length - 1],
    })

    // Convert API data to Tick format
    const ticks = response.data.data
      .map(parseKline)
      .sort((a: Tick, b: Tick) => a.time - b.time)

    // Diagnostics
    if (ticks.length > 0) {
      const timeSpan = ticks[ticks.length - 1].time - ticks[0].time
      const hours = timeSpan / 3600

      console.log('📊 PROCESSED Ticks:', {
        totalTicks: ticks.length,
        timeSpanHours: hours.toFixed(2),
        firstTime: new Date(ticks[0].time * 1000).toISOString(),
        lastTime: new Date(ticks[ticks.length - 1].time * 1000).toISOString(),
        firstTick: {
          time: ticks[0].time,
          price: ticks[0].close.toNumber(), // Using close price for display
          volume: ticks[0].volume.toNumber(),
        },
        lastTick: {
          time: ticks[ticks.length - 1].time,
          price: ticks[ticks.length - 1].close.toNumber(), // Using close price for display
          volume: ticks[ticks.length - 1].volume.toNumber(),
        },
      })

      // Check if all ticks have the same price
      const uniquePrices = new Set(ticks.map((t) => t.close.toNumber()))
      if (uniquePrices.size === 1) {
        console.warn('⚠️ WARNING: All ticks have the same price!', {
          price: ticks[0].close.toNumber(),
          possibleIssue: 'No trading activity or data issue',
        })
      }

      // Check time intervals between ticks
      const intervals = []
      for (let i = 1; i < Math.min(10, ticks.length); i++) {
        intervals.push(ticks[i].time - ticks[i - 1].time)
      }
      console.log('⏱️ Time intervals between ticks (seconds):', intervals)
    }

    return ticks
  } catch (error: any) {
    console.error('❌ fetchKlines ERROR:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw error
  }
}

/**
 * React Query hook for fetching tick data
 * Returns individual trade operations, not pre-built candles
 */
export const useKlinesQuery = (
  interval: string = '30m',
  options: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: ['klines', CHART_PAIR_ID, interval],
    queryFn: () => fetchKlines(interval),
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  })
}
