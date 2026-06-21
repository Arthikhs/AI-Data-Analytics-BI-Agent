import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bot, Search, MapPin, Package, TrendingDown, TrendingUp,
  AlertTriangle, CheckCircle, Loader2, RefreshCw, ChevronRight,
  Zap, Target, BarChart2
} from 'lucide-react'
import { DynamicChart } from '../../components/DynamicChart'
import api from '../../services/api'
import clsx from 'clsx'

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-red-500 bg-red-50 dark:bg-red-900/10',
  high:     'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
  medium:   'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
  low:      'border-green-400 bg-green-50 dark:bg-green-900/10',
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
}

const PRIORITY_BADGE: Record<string, string> = {
  IMMEDIATE:   'bg-red-100 text-red-700',
  SHORT_TERM:  'bg-yellow-100 text-yellow-700',
  STRATEGIC:   'bg-blue-100 text-blue-700',
}

const STEPS = [
  { key: 'anomaly_detection',   label: 'Anomaly Detection',    icon: AlertTriangle },
  { key: 'region_analysis',     label: 'Region Analysis',      icon: MapPin },
  { key: 'segment_analysis',    label: 'Segment Analysis',     icon: Package },
  { key: 'trend_comparison',    label: 'Trend Comparison',     icon: BarChart2 },
  { key: 'root_cause_analysis', label: 'Root Cause Analysis',  icon: Search },
]

export default function DataAgent() {
  const [dataset, setDataset] = useState('ecommerce')
  const [force, setForce] = useState(false)
  const [enabled, setEnabled] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['agent', dataset, force],
    queryFn: () => api.get(`/agent/investigate?dataset=${dataset}&force=${force}`).then(r => r.data),
    enabled,
    staleTime: 0,
  })

  const handleRun = () => {
    setEnabled(true)
    setTimeout(() => refetch(), 50)
  }

  const rca = data?.root_cause_analysis
  const steps = data?.steps_completed ?? []
  const trend = (data?.historical_trend ?? []) as Record<string, unknown>[]
  const running = isLoading || isFetching

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">AI Data Agent</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous investigation — detects anomalies, finds causes, and recommends actions
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input w-auto" value={dataset} onChange={e => setDataset(e.target.value)}>
            <option value="ecommerce">E-Commerce</option>
            <option value="banking">Banking</option>
            <option value="logistics">Logistics</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)}
              className="rounded" />
            Force Investigation
          </label>
          <button onClick={handleRun} disabled={running}
            className="btn-primary flex items-center gap-2">
            {running
              ? <><Loader2 size={14} className="animate-spin" /> Investigating…</>
              : <><Zap size={14} /> Run Agent</>}
          </button>
          {data && (
            <button onClick={() => refetch()} disabled={running} className="btn-ghost">
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!data && !running && (
        <div className="card text-center py-20">
          <Bot size={48} className="mx-auto text-blue-400 mb-4" />
          <h2 className="font-semibold text-lg mb-1">AI Data Agent Ready</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Select a dataset and click <strong>Run Agent</strong>. The agent will autonomously
            investigate your data — no questions needed.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-400">
            {STEPS.map(s => (
              <span key={s.key} className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                <s.icon size={11} /> {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Running skeleton */}
      {running && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span className="font-semibold">Agent investigating {dataset} data…</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1.5 text-sm text-gray-400 animate-pulse">
                  <s.icon size={13} />
                  <span>{s.label}</span>
                  {i < STEPS.length - 1 && <ChevronRight size={12} />}
                </div>
              ))}
            </div>
          </div>
          {[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      )}

      {/* No anomaly */}
      {data && !data.triggered && !running && (
        <div className="card text-center py-16 border-l-4 border-green-400">
          <CheckCircle size={36} className="mx-auto text-green-400 mb-3" />
          <p className="font-semibold">{data.message}</p>
          <p className="text-gray-400 text-sm mt-1">All metrics are within normal thresholds.</p>
          <p className="text-xs text-gray-400 mt-3">
            Enable <strong>Force Investigation</strong> to run a full analysis regardless.
          </p>
        </div>
      )}

      {/* Investigation Results */}
      {data?.triggered && !running && (
        <div className="space-y-5">

          {/* Investigation progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">Investigation Steps</span>
              <span className="text-xs text-gray-400">{data.investigation_time_ms}ms</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {STEPS.map((s, i) => {
                const done = steps.includes(s.key)
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    <span className={clsx('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                      done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400')}>
                      {done ? <CheckCircle size={11} /> : <s.icon size={11} />}
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Headline alert */}
          <div className={clsx('card border-l-4', SEVERITY_STYLE[data.severity] ?? SEVERITY_STYLE.medium)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-base">{data.headline}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{data.executive_summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                  SEVERITY_BADGE[data.severity])}>
                  {data.severity}
                </span>
                <span className="text-xs text-gray-400">
                  {data.confidence_score}% confidence
                </span>
              </div>
            </div>
          </div>

          {/* Trigger metrics */}
          {data.trigger && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-xs text-gray-400 mb-1">Current Week</p>
                <p className="text-xl font-bold">
                  {data.trigger.current_value?.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-400 mb-1">Previous Week</p>
                <p className="text-xl font-bold">
                  {data.trigger.previous_value?.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={clsx('card text-center border-l-4',
                data.trigger.change_pct < 0 ? 'border-red-500' : 'border-green-500')}>
                <p className="text-xs text-gray-400 mb-1">Change</p>
                <p className={clsx('text-xl font-bold flex items-center justify-center gap-1',
                  data.trigger.change_pct < 0 ? 'text-red-600' : 'text-green-600')}>
                  {data.trigger.change_pct < 0
                    ? <TrendingDown size={18} />
                    : <TrendingUp size={18} />}
                  {data.trigger.change_pct}%
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Root cause */}
            {rca && (
              <div className="card space-y-4">
                <div className="flex items-center gap-2">
                  <Search size={15} className="text-blue-500" />
                  <span className="font-semibold">Root Cause Analysis</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Primary Cause</p>
                  <p className="text-sm font-medium">{rca.primary_cause}</p>
                </div>
                {rca.contributing_factors?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">Contributing Factors</p>
                    {rca.contributing_factors.map((f: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{f.factor}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(Math.abs(f.impact_pct), 100)}%` }} />
                          </div>
                          <span className="text-red-600 font-semibold w-10 text-right">
                            {f.impact_pct > 0 ? '+' : ''}{f.impact_pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 italic">{rca.trend_analysis}</p>
              </div>
            )}

            {/* Affected regions */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-orange-500" />
                <span className="font-semibold">Affected Regions</span>
              </div>
              {(data.region_analysis ?? []).slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.region}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={clsx('h-1.5 rounded-full',
                        r.change_pct < 0 ? 'bg-red-500' : 'bg-green-500')}
                        style={{ width: `${Math.min(Math.abs(r.change_pct), 100)}%` }} />
                    </div>
                    <span className={clsx('font-semibold w-12 text-right',
                      r.change_pct < 0 ? 'text-red-600' : 'text-green-600')}>
                      {r.change_pct > 0 ? '+' : ''}{r.change_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impacted segments */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-purple-500" />
              <span className="font-semibold">Impacted Segments</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(data.segment_analysis ?? []).map((s: any, i: number) => (
                <div key={i} className={clsx('rounded-lg p-3 border',
                  s.change_pct < -10
                    ? 'border-red-200 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-700')}>
                  <p className="text-sm font-medium truncate">{s.segment}</p>
                  <p className={clsx('text-lg font-bold mt-1',
                    s.change_pct < 0 ? 'text-red-600' : 'text-green-600')}>
                    {s.change_pct > 0 ? '+' : ''}{s.change_pct}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.current_week?.toLocaleString('en-IN')} vs {s.prev_week?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical trend chart */}
          {trend.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={15} className="text-blue-500" />
                <span className="font-semibold">Historical Trend (8 weeks)</span>
              </div>
              <DynamicChart type="area" data={trend} height={220} />
            </div>
          )}

          {/* Recommended actions */}
          {rca?.recommended_actions?.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-green-600" />
                <span className="font-semibold">Recommended Actions</span>
              </div>
              {rca.recommended_actions.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0',
                    PRIORITY_BADGE[a.priority] ?? 'bg-gray-100 text-gray-600')}>
                    {a.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Expected: {a.expected_impact}
                      {a.owner && <span className="ml-2 text-blue-500">→ {a.owner}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
