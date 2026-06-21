import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { dataQualityService } from '../../services/dataService'
import type { DataQualityReport } from '../../types'
import clsx from 'clsx'

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'text-green-600 bg-green-50' : score >= 65 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
  return <span className={clsx('text-sm font-bold px-2 py-0.5 rounded-full', color)}>{score.toFixed(1)}</span>
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-green-500' : value >= 65 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
      <div className={clsx('h-1.5 rounded-full transition-all', color)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

export default function DataQuality() {
  const [dataset, setDataset] = useState('ecommerce')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { data, isLoading, refetch } = useQuery<DataQualityReport>({
    queryKey: ['data-quality', dataset],
    queryFn: () => dataQualityService.check(dataset),
    staleTime: 300_000,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Quality Monitor</h1>
          <p className="text-sm text-gray-500">Completeness, accuracy, consistency & validity metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={dataset} onChange={e => setDataset(e.target.value)}>
            <option value="ecommerce">E-Commerce</option>
            <option value="banking">Banking</option>
            <option value="logistics">Logistics</option>
          </select>
          <button onClick={() => refetch()} className="btn-ghost"><RefreshCw size={14} /></button>
        </div>
      </div>

      {isLoading
        ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        : <>
          {/* Overall Score */}
          <div className="card flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-blue-600">{data?.overall_health_score?.toFixed(0)}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Overall Data Health Score</p>
              <p className="text-sm text-gray-500 mt-1">{data?.health_summary}</p>
            </div>
            <ShieldCheck size={32} className={clsx((data?.overall_health_score ?? 0) >= 80 ? 'text-green-500' : 'text-yellow-500')} />
          </div>

          {/* Critical Issues */}
          {(data?.critical_issues?.length ?? 0) > 0 && (
            <div className="card border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle size={15} className="text-red-500" /><span className="font-semibold text-sm">Critical Issues</span></div>
              <ul className="space-y-1">
                {data!.critical_issues.map((issue, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-400 flex gap-2"><span>•</span><span>{issue}</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Results */}
          <div className="space-y-3">
            {Object.entries(data?.tables ?? {}).filter(([, v]) => !('error' in v)).map(([table, meta]) => (
              <div key={table} className="card">
                <button className="w-full flex items-center justify-between" onClick={() => setExpanded(p => ({ ...p, [table]: !p[table] }))}>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{table}</span>
                    <ScoreBadge score={meta.health_score ?? 0} />
                    <span className="text-xs text-gray-400">{meta.total_rows?.toLocaleString()} rows</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Completeness: <b>{meta.completeness_pct}%</b></span>
                    <span>Duplicates: <b>{meta.duplicate_rows}</b></span>
                    {expanded[table] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>

                {expanded[table] && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Completeness', value: meta.completeness_pct },
                        { label: 'Uniqueness', value: meta.uniqueness_pct },
                        { label: 'Health Score', value: meta.health_score },
                      ].map(m => (
                        <div key={m.label} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">{m.label}</p>
                          <p className="font-bold text-sm mt-1">{m.value?.toFixed(1)}%</p>
                          <ScoreBar value={m.value ?? 0} />
                        </div>
                      ))}
                    </div>

                    {Object.keys(meta.null_stats ?? {}).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Null Analysis</p>
                        <div className="space-y-1">
                          {Object.entries(meta.null_stats).filter(([, v]) => v.null_count > 0).map(([col, stats]) => (
                            <div key={col} className="flex items-center gap-3 text-xs">
                              <span className="font-mono w-40 truncate text-gray-600 dark:text-gray-400">{col}</span>
                              <div className="flex-1"><ScoreBar value={100 - stats.null_pct} /></div>
                              <span className="text-red-500 w-16 text-right">{stats.null_pct}% null</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(meta.outliers ?? {}).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Outliers Detected</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(meta.outliers).map(([col, count]) => (
                            <span key={col} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{col}: {count} outliers</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          {(data?.ai_recommendations?.length ?? 0) > 0 && (
            <div className="card border-l-4 border-blue-500">
              <p className="font-semibold text-sm mb-3">AI Recommendations</p>
              <ul className="space-y-2">
                {data!.ai_recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2"><span className="text-blue-500">→</span><span>{r}</span></li>
                ))}
              </ul>
            </div>
          )}
        </>
      }
    </div>
  )
}
