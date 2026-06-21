import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, ShieldAlert, Truck, CreditCard } from 'lucide-react'
import { anomalyService } from '../services/dataService'
import type { AnomalyItem } from '../types'
import clsx from 'clsx'

const DATASETS = [
  { value: 'all',        label: 'All Datasets',  icon: AlertTriangle },
  { value: 'ecommerce',  label: 'E-Commerce',    icon: CreditCard },
  { value: 'banking',    label: 'Banking',       icon: ShieldAlert },
  { value: 'logistics',  label: 'Logistics',     icon: Truck },
]

const DATASET_BADGE: Record<string, string> = {
  ecommerce: 'bg-blue-100 text-blue-700',
  banking:   'bg-purple-100 text-purple-700',
  logistics: 'bg-orange-100 text-orange-700',
}

function formatValue(a: AnomalyItem) {
  if (a.dataset === 'ecommerce') return `₹${a.actual.toLocaleString('en-IN')}`
  if (a.dataset === 'banking') return a.actual.toLocaleString('en-IN')
  return a.actual.toFixed(2)
}

export default function Anomalies() {
  const [dataset, setDataset] = useState('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['anomalies', dataset],
    queryFn: () => anomalyService.detect(dataset),
    staleTime: 120_000,
  })

  const anomalies: AnomalyItem[] = data?.anomalies ?? []
  const high = data?.high_severity ?? 0
  const medium = data?.medium_severity ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anomaly Detection</h1>
          <p className="text-sm text-gray-500">Z-score statistical detection across E-Commerce, Banking &amp; Logistics</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Dataset selector */}
      <div className="flex gap-2 flex-wrap">
        {DATASETS.map(d => (
          <button key={d.value}
            onClick={() => setDataset(d.value)}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              dataset === d.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800')}>
            <d.icon size={13} /> {d.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {!isLoading && anomalies.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold">{anomalies.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Anomalies</p>
          </div>
          <div className="card text-center border-l-4 border-red-500">
            <p className="text-2xl font-bold text-red-600">{high}</p>
            <p className="text-xs text-gray-400 mt-1">High Severity</p>
          </div>
          <div className="card text-center border-l-4 border-yellow-400">
            <p className="text-2xl font-bold text-yellow-600">{medium}</p>
            <p className="text-xs text-gray-400 mt-1">Medium Severity</p>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : anomalies.length === 0 ? (
        <div className="card text-center py-16">
          <AlertTriangle size={36} className="mx-auto text-green-400 mb-3" />
          <p className="font-semibold">No anomalies detected</p>
          <p className="text-gray-400 text-sm mt-1">All metrics are within normal ranges</p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((a, i) => (
            <div key={i} className={clsx('card border-l-4',
              a.severity === 'high' ? 'border-red-500' : 'border-yellow-400')}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className={a.severity === 'high' ? 'text-red-500' : 'text-yellow-500'} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{a.type}</p>
                      {a.dataset && (
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                          DATASET_BADGE[a.dataset] ?? 'bg-gray-100 text-gray-600')}>
                          {a.dataset}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{a.date}</p>
                  </div>
                </div>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                  a.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                  {a.severity}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Actual</p>
                  <p className="font-semibold">{formatValue(a)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Expected</p>
                  <p className="font-semibold">{a.expected.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Z-Score</p>
                  <p className="font-semibold">{a.z_score}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                💡 {a.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
