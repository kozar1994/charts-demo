# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Trading Chart

This project utilizes [lightweight-charts](https://github.com/tradingview/lightweight-charts) to render a high-performance financial chart.

### Core Logic

The chart is built on a foundation of real-time tick data processing. Each tick consists of:
- **Open**: Opening price
- **Close**: Closing price
- **High**: Maximum price during the interval
- **Low**: Minimum price during the interval
- **Volume**: Trading volume
- **Timestamp**: Exact time of the tick

### Data Aggregation & Intervals

The application implements client-side aggregation to construct candlesticks from raw ticks:
- **Real-time Construction**: As new ticks arrive, the logic determines whether to update the current candle or start a new one based on the tick's timestamp and the active chart interval.
- **Dynamic Recalculation**: Changing the chart interval (e.g., 5s, 1m, 1h) triggers an immediate recalculation, re-aggregating the underlying tick data to reflect the new time granularity.

### Data Sources & Demo Mode

The chart features a toggle to switch between real and simulated environments:
- **Real Data**: Connects to a backend via HTTP (for history) and WebSockets (for live updates).
- **Demo Mode**: Uses a local simulation engine to generate realistic market movements, allowing for testing and UI verification without a backend connection.
