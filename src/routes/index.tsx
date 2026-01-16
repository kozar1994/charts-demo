import { createFileRoute } from '@tanstack/react-router'
import { TradingChartContainer } from '@/components/ui/trading-chart/trading-chart-container'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div>
      <TradingChartContainer />
    </div>
  )
}
