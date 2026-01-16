import { useMemo, useState, useTransition } from 'react'
import { TradingChartUI } from './trading-chart-ui'

import { aggregateCandles, padCandlesWithEmpty } from '@/lib/chart-aggregator'
import { INTERVAL_SECONDS, VISIBLE_CANDLES_COUNT } from '@/constants/chart'
import { candlesToChart } from '@/utils/formatters'
import { useChartData } from '@/hooks/useChartData'

type IntervalType = keyof typeof INTERVAL_SECONDS

export const TradingChartContainer = () => {
  const [interval, setInterval] = useState<IntervalType>('30s')
  const [isPending, startTransition] = useTransition()

  const { data: rawTicks } = useChartData(interval)

  const intervalSeconds = useMemo(() => {
    // Basic Parsing for now, assuming valid keys from INTERVAL_SECONDS
    return INTERVAL_SECONDS[interval] || 60
  }, [interval])

  const chartData = useMemo(() => {
    const aggregated = aggregateCandles(rawTicks, intervalSeconds)
    const padded = padCandlesWithEmpty(
      aggregated,
      intervalSeconds,
      VISIBLE_CANDLES_COUNT,
    )
    return candlesToChart(padded)
  }, [rawTicks, intervalSeconds])

  // Find the current/last candle for the real-time update prop
  const currentCandle =
    chartData.length > 0 ? chartData[chartData.length - 1] : undefined

  return (
    <div
      className={
        isPending ? 'opacity-70 transition-opacity' : 'transition-opacity'
      }
    >
      <pre>{JSON.stringify(currentCandle, null, 2)}</pre>
      <TradingChartUI
        initialData={chartData}
        newCandle={currentCandle}
        assetName="BTC/USD"
        assetDescription="Bitcoin / US Dollar"
        interval={interval as any}
        onIntervalChange={(i) => setInterval(i as IntervalType)}
      />
    </div>
  )
}
