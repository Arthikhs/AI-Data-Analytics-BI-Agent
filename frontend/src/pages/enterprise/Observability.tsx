import { useQuery } from '@tanstack/react-query'
import { Activity, RefreshCw, Zap, Database, Brain, Server } from 'lucide-react'
import { DynamicChart } from '../../components/DynamicChart'
import { observabilityService } from '../../services/dataService'
import type { ObservabilitySummary } from '../../types'
import clsx from 'clsx'

function MetricCard({ label, avg, p95, icon, color }: { label: string; avg: number; p95: number; icon: React.ReactNode; color: string }) {
  const latencyColor = avg < 200 ? 'text-green-600' : avg < 1000 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={clsx('text-2xl font-bold mt-1', latencyColor)}>{avg.toFixed(0)}ms</p>
          <p className="text-xs text-gray-400 mt-0.5">P95: {p95.toFixed(0)}ms</p>
        </div>
        <div className={clsx('p-3 rounded-xl', color)}>{icon}</div>
      </div>
    </div>
  )
}

export default function Observability() {
  const { data, isLoading, refetch } = useQuery<ObservabilitySummary>({
    queryKey: ['observability'],
    queryFn: () => observabilityService.summary(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const { data: apiMetrics } = useQuery({
    queryKey: ['obs-metrics', 'api_latency'],
    queryFn: () => observabilityService.metrics('api_latency', 50),
    refetchInterval: 30_000,
  })

  const latencyChartData = (apiMetrics?.data ?? [])
    .slice(0, 30)
    .reverse()
    .map((m: Record<string, unknown>, i: number) => ({
      request: i + 1,
      latency_ms: Math.round(Number(m['value']) || 0),
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Observability</h1>
          <p className="text-sm text-gray-500">API latency, SQL performance, AI response times, cache & error rates</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {isLoading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        : <>
          {/* Latency Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="API Latency" avg={data?.api_latency_avg_ms ?? 0} p95={data?.api_latency_p95_ms ?? 0}
              icon={<Server size={18} />} color="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
            <MetricCard label="SQL Latency" avg={data?.sql_latency_avg_ms ?? 0} p95={data?.sql_latency_p95_ms ?? 0}
              icon={<Database size={18} />} color="bg-purple-50 text-purple-600 dark:bg-purple-900/20" />
            <MetricCard label="AI Latency" avg={data?.ai_latency_avg_ms ?? 0} p95={data?.ai_latency_p95_ms ?? 0}
              icon={<Brain size={18} />} color="bg-orange-50 text-orange-600 dark:bg-orange-900/20" />
            <MetricCard label="Forecast Latency" avg={data?.forecast_latency_avg_ms ?? 0} p95={0}
              icon={<Zap size={18} />} color="bg-green-50 text-green-600 dark:bg-green-900/20" />
          </div>

          {/* Cache & Errors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <Activity size={20} className="mx-auto text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-blue-600">{data?.cache_hit_ratio_pct ?? 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Cache Hit Ratio</p>
              <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
                <span>Hits: {data?.cache_hits}</span>
                <span>Misses: {data?.cache_misses}</span>
              </div>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-500">{data?.total_errors ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Total Errors</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{data?.recent_api_calls?.length ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Recent API Calls Tracked</p>
            </div>
          </div>

          {/* API Latency Chart */}
          {latencyChartData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-4">API Latency — Last 30 Requests (ms)</h2>
              <DynamicChart type="line" data={latencyChartData as Record<string, unknown>[]} height={240} />
            </div>
          )}

          {/* Recent Errors */}
          {(data?.recent_errors?.length ?? 0) > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3 text-sm">Recent Errors</h2>
              <div className="space-y-2">
                {data!.recent_errors.slice(0, 10).map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded-lg text-xs">
                    <span className="text-red-600 font-medium">{e.labels?.['endpoint'] ?? 'unknown'}</span>
                    <span className="text-red-500">{e.labels?.['error_type'] ?? 'Error'}</span>
                    <span className="text-gray-400">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      }
    </div>
  )
}
