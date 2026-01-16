import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { CandleData } from '@/types/chart'
import { aggregateInitialData } from '@/lib/aggregateInitialData'
import { fillEmptyCandles } from '@/lib/fillEmptyCandles'
import { candlesToChart } from '@/utils/formatters'
import { useKlinesQuery } from '@/hooks/useKlinesQuery'

export const TradingChartContainer = () => {
  const [interval, setInterval] = useState<string>('30s')
  const [isPending, startTransition] = useTransition()

  const { data: rawTicks } = useKlinesQuery(interval)

  return (
    <div
      className={
        isPending ? 'opacity-70 transition-opacity' : 'transition-opacity'
      }
    >
      {/* <TradingChartUI
        initialData={chartData}
        newCandle={
          currentCandle
            ? {
                time: currentCandle.time,
                open: currentCandle.open.toNumber(),
                high: currentCandle.high.toNumber(),
                low: currentCandle.low.toNumber(),
                close: currentCandle.close.toNumber(),
                volume: currentCandle.volume.toNumber(),
              }
            : undefined
        }
        assetName={assetName}
        assetDescription={assetDescription}
        interval={interval as any}
        onIntervalChange={handleIntervalChange}
      /> */}
    </div>
  )
}
