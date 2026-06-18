import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Brain } from 'lucide-react'
import { DynamicChart } from '../components/DynamicChart'
import { forecastService } from '../services/dataService'
import type { ForecastPoint } from '../types'

export default function Forecast() {
  const [metric, setMetric] = useState('revenue')
  const [periods, setPeriods] = useState(30)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['forecast', metric, periods],
    queryFn: () => forecastService.get(metric, periods),
    staleTime: 300_000,
  })

  const chartData = (data?.forecast ?? []).map((p: ForecastPoint) => ({
    date: p.date,
    forecast: p.value,
    lower_bound: p.lower,
    upper_bound: p.upper,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forecasting</h1>
          <p className="text-sm text-gray-500">AI-powered predictive analytics using Prophet</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={metric} onChange={e => setMetric(e.target.value)}>
            <option value="revenue">Revenue</option>
            <option value="orders">Orders</option>
            <option value="customers">Customers</option>
          </select>
          <select className="input w-auto" value={periods} onChange={e => setPeriods(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button onClick={() => refetch()} className="btn-primary">
            <TrendingUp size={14} className="mr-1.5 inline" /> Run Forecast
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card h-80 animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{metric.charAt(0).toUpperCase() + metric.slice(1)} Forecast</h2>
              <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                Model: {data?.model_used}
              </span>
            </div>
            <DynamicChart type="line" data={chartData as Record<string, unknown>[]} height={320} />
          </div>

          {data?.recommendations && data.recommendations.length > 0 && (
            <div className="card border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={15} className="text-blue-500" />
                <span className="font-semibold text-sm">Forecast Recommendations</span>
              </div>
              <ul className="space-y-2">
                {data.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                    <span className="text-blue-500">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
