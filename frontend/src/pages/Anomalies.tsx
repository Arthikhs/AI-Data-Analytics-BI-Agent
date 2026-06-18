import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { anomalyService } from '../services/dataService'
import type { AnomalyItem } from '../types'
import clsx from 'clsx'

export default function Anomalies() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['anomalies'],
    queryFn: anomalyService.detect,
    staleTime: 120_000,
  })

  const anomalies: AnomalyItem[] = data?.anomalies ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anomaly Detection</h1>
          <p className="text-sm text-gray-500">Statistical detection of unusual patterns in your data</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

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
          <p className="text-sm text-gray-500">{anomalies.length} anomalies detected</p>
          {anomalies.map((a, i) => (
            <div key={i} className={clsx('card border-l-4',
              a.severity === 'high' ? 'border-red-500' : 'border-yellow-400')}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className={a.severity === 'high' ? 'text-red-500' : 'text-yellow-500'} />
                  <div>
                    <p className="font-semibold text-sm">{a.type}</p>
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
                  <p className="font-semibold">₹{a.actual.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Expected</p>
                  <p className="font-semibold">₹{a.expected.toLocaleString('en-IN')}</p>
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
