import { useEffect, useRef, useState } from 'react'
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
} from 'lightweight-charts'
import {
  CandlestickChart,
  LineChart,
  Pause,
  Play,
  TrendingUp,
} from 'lucide-react'
import type { IChartApi, Time } from 'lightweight-charts'

import type { ChartCandle } from '@/types/chart'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TradingChartUIProps {
  initialData: Array<ChartCandle>
  newCandle?: ChartCandle
  assetName?: string
  assetDescription?: string
  interval: TimeInterval
  onIntervalChange: (interval: TimeInterval) => void
}

type ChartType = 'candlestick' | 'line'
type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d'

export const TradingChartUI = ({
  initialData,
  newCandle,
  assetName = 'Asset name',
  assetDescription = 'Short description',
  interval,
  onIntervalChange,
}: TradingChartUIProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [chartData, setChartData] = useState<Array<ChartCandle>>(initialData)

  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [isPlaying, setIsPlaying] = useState(true)
  const [priceChange, setPriceChange] = useState<number>(0)

  // Series refs
  const candlestickSeriesRef = useRef<any>(null)
  const lineSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)

  // Track last candle interval time (not individual tick time)
  const lastCandleTimeRef = useRef<number>(0)

  // Initialization: apply initial data
  useEffect(() => {
    setChartData(initialData)
    if (initialData.length > 0) {
      lastCandleTimeRef.current = initialData[initialData.length - 1].time
    }

    if (
      candlestickSeriesRef.current &&
      lineSeriesRef.current &&
      volumeSeriesRef.current
    ) {
      candlestickSeriesRef.current.setData(
        initialData.map((d: ChartCandle) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })),
      )

      lineSeriesRef.current.setData(
        initialData.map((d: ChartCandle) => ({
          time: d.time as Time,
          value: d.close,
        })),
      )

      volumeSeriesRef.current.setData(
        initialData.map((d: ChartCandle, index: number) => ({
          time: d.time as Time,
          value: d.volume,
          color:
            index > 0 && d.close >= initialData[index - 1].close
              ? 'rgba(34, 197, 94, 0.4)'
              : 'rgba(239, 68, 68, 0.4)',
        })),
      )

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    }
  }, [initialData])

  // Real-time updates from aggregated candle
  useEffect(() => {
    if (!newCandle || !isPlaying) return

    const isUpdatingExistingCandle =
      newCandle.time === lastCandleTimeRef.current
    const isNewCandle = newCandle.time > lastCandleTimeRef.current

    // Safety check: ignore old data
    if (newCandle.time < lastCandleTimeRef.current) {
      console.warn('Received candle with older timestamp, skipping', {
        newTime: newCandle.time,
        lastTime: lastCandleTimeRef.current,
      })
      return
    }

    // Update chart series
    if (
      candlestickSeriesRef.current &&
      lineSeriesRef.current &&
      volumeSeriesRef.current
    ) {
      const candlePoint = {
        time: newCandle.time as Time,
        open: newCandle.open,
        high: newCandle.high,
        low: newCandle.low,
        close: newCandle.close,
      }
      const linePoint = {
        time: newCandle.time as Time,
        value: newCandle.close,
      }
      const volumePoint = {
        time: newCandle.time as Time,
        value: newCandle.volume,
        color:
          newCandle.close >= newCandle.open
            ? 'rgba(34, 197, 94, 0.4)'
            : 'rgba(239, 68, 68, 0.4)',
      }

      try {
        // Use update() for both cases - lightweight-charts handles it correctly
        candlestickSeriesRef.current.update(candlePoint)
        lineSeriesRef.current.update(linePoint)
        volumeSeriesRef.current.update(volumePoint)

        // Update ref only when moving to new candle
        if (isNewCandle) {
          lastCandleTimeRef.current = newCandle.time
        }
      } catch (err) {
        console.error('Chart update failed:', err, {
          newCandle,
          lastCandleTime: lastCandleTimeRef.current,
        })
      }
    }

    // Update React state for UI stats
    setChartData((prevData) => {
      if (prevData.length === 0) {
        return [newCandle]
      }

      // lastCandle (for potential future price change calculation)

      if (isUpdatingExistingCandle) {
        // Update existing candle in place
        const updated = [...prevData]
        updated[updated.length - 1] = newCandle
        return updated
      } else {
        // Add new candle
        return [...prevData, newCandle]
      }
    })
  }, [newCandle, isPlaying])

  // Calculate price change
  useEffect(() => {
    if (chartData.length >= 2) {
      const firstPrice = chartData[0].close
      const lastPrice = chartData[chartData.length - 1].close
      const change = ((lastPrice - firstPrice) / firstPrice) * 100
      setPriceChange(change)
    }
  }, [chartData])

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2a2a2a', style: 1, visible: true },
        horzLines: { color: '#2a2a2a', style: 1, visible: true },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#6b7280',
          width: 1,
          style: 3,
          labelBackgroundColor: '#374151',
        },
        horzLine: {
          color: '#6b7280',
          width: 1,
          style: 3,
          labelBackgroundColor: '#374151',
        },
      },
      leftPriceScale: {
        visible: true,
        borderColor: '#2a2a2a',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      visible: chartType === 'candlestick',
      priceScaleId: 'left',
    })
    candlestickSeriesRef.current = candlestickSeries

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      visible: chartType === 'line',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#3b82f6',
      crosshairMarkerBackgroundColor: '#ffffff',
      priceScaleId: 'left',
    })
    lineSeriesRef.current = lineSeries

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#4b5563',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })
    volumeSeriesRef.current = volumeSeries

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      candlestickSeriesRef.current = null
      lineSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [])

  // Toggle chart type visibility
  useEffect(() => {
    if (candlestickSeriesRef.current && lineSeriesRef.current) {
      candlestickSeriesRef.current.applyOptions({
        visible: chartType === 'candlestick',
      })
      lineSeriesRef.current.applyOptions({
        visible: chartType === 'line',
      })
    }
  }, [chartType])

  const formatDate = () => {
    if (chartData.length === 0) return ''
    const lastTime = chartData[chartData.length - 1].time * 1000
    const date = new Date(lastTime)
    return `${date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })}  ${date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .replace(/\s?(AM|PM)/, '')}`
  }

  return (
    <div className="w-full bg-neutral-950 rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-neutral-900 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
        <div>
          <h2 className="text-white text-lg font-semibold">{assetName}</h2>
          <p className="text-neutral-500 text-xs">{assetDescription}</p>
        </div>
      </div>
      <div className="bg-neutral-900 px-4 py-2 flex justify-between items-center gap-4 border-b border-neutral-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <span className="text-white text-3xl font-bold">
              {chartData.length > 0
                ? chartData[chartData.length - 1].close.toFixed(2)
                : '0.00'}
            </span>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                priceChange >= 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)}%
            </div>
          </div>
          <span className="text-neutral-400 text-sm">{formatDate()}</span>
        </div>

        <div className="bg-neutral-900 px-4 py-3 flex items-center justify-end gap-3 ">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setChartType((prev) =>
                prev === 'candlestick' ? 'line' : 'candlestick',
              )
            }
            className="text-neutral-300 hover:text-white"
          >
            {chartType === 'candlestick' ? (
              <CandlestickChart className="size-4" />
            ) : (
              <LineChart className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-neutral-300 hover:text-white"
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          <Select
            value={interval}
            onValueChange={(value) => onIntervalChange(value as TimeInterval)}
          >
            <SelectTrigger
              size="sm"
              className="w-[100px] border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent className="border-neutral-700 bg-neutral-800 text-neutral-200">
              <SelectItem value="1m">1 min</SelectItem>
              <SelectItem value="5m">5 min</SelectItem>
              <SelectItem value="15m">15 min</SelectItem>
              <SelectItem value="30m">30 min</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
