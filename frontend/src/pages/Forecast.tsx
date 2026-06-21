import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Brain } from 'lucide-react'
import { DynamicChart } from '../components/DynamicChart'
import { forecastService } from '../services/dataService'
import type { ForecastPoint } from '../types'

const DATASET_METRICS: Record<string, { value: string; label: string }[]> = {
  ecommerce: [
    { value: 'revenue',   label: 'Revenue' },
    { value: 'orders',    label: 'Orders' },
    { value: 'customers', label: 'Customers' },
  ],
  banking: [
    { value: 'transactions', label: 'Transactions' },
    { value: 'fraud',        label: 'Fraud Cases' },
    { value: 'revenue',      label: 'Credit Volume' },
  ],
  logistics: [
    { value: 'deliveries', label: 'Deliveries' },
    { value: 'failures',   label: 'Failed Deliveries' },
    { value: 'revenue',    label: 'Shipping Cost' },
  ],
}

export default function Forecast() {
  const [dataset, setDataset] = useState('ecommerce')
  const [metric, setMetric]   = useState('revenue')
  const [periods, setPeriods] = useState(30)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['forecast', dataset, metric, periods],
    queryFn: () => forecastService.get(metric, periods, dataset),
    staleTime: 300_000,
  })

  const chartData = (data?.forecast ?? []).map((p: ForecastPoint) => ({
    date: p.date,
    forecast: p.value,
    lower_bound: p.lower,
    upper_bound: p.upper,
  }))

  const metrics = DATASET_METRICS[dataset] ?? DATASET_METRICS.ecommerce

  const handleDatasetChange = (ds: string) => {
    setDataset(ds)
    setMetric(DATASET_METRICS[ds][0].value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Forecasting</h1>
          <p className="text-sm text-gray-500">Prophet-powered predictive analytics across all datasets</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-auto" value={dataset} onChange={e => handleDatasetChange(e.target.value)}>
            <option value="ecommerce">E-Commerce</option>
            <option value="banking">Banking</option>
            <option value="logistics">Logistics</option>
          </select>
          <select className="input w-auto" value={metric} onChange={e => setMetric(e.target.value)}>
            {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="input w-auto" value={periods} onChange={e => setPeriods(Number(e.target.value))}>
            <option value={7}>7 months</option>
            <option value={30}>30 months</option>
            <option value={90}>90 months</option>
          </select>
          <button onClick={() => refetch()} className="btn-primary flex items-center gap-1.5">
            <TrendingUp size={14} /> Run Forecast
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card h-80 animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold capitalize">
                {metrics.find(m => m.value === metric)?.label ?? metric} Forecast
                <span className="ml-2 text-xs text-gray-400 font-normal">({dataset})</span>
              </h2>
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
