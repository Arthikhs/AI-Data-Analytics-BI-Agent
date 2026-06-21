import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { DynamicChart } from '../../components/DynamicChart'
import { benchmarkService } from '../../services/dataService'
import type { BenchmarkResult } from '../../types'
import clsx from 'clsx'

type BenchmarkTab = 'mom' | 'qoq' | 'yoy' | 'region' | 'segment'

const TABS: { key: BenchmarkTab; label: string }[] = [
  { key: 'mom', label: 'Month-over-Month' },
  { key: 'qoq', label: 'Quarter-over-Quarter' },
  { key: 'yoy', label: 'Year-over-Year' },
  { key: 'region', label: 'By Region' },
  { key: 'segment', label: 'By Segment' },
]

function VarianceBadge({ pct }: { pct?: number }) {
  if (pct == null) return null
  const up = pct >= 0
  return (
    <span className={clsx('text-xs font-bold flex items-center gap-0.5', up ? 'text-green-600' : 'text-red-500')}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export default function Benchmarking() {
  const [tab, setTab] = useState<BenchmarkTab>('mom')
  const [region, setRegion] = useState('')

  const fetchers: Record<BenchmarkTab, () => Promise<BenchmarkResult>> = {
    mom: () => benchmarkService.mom(region || undefined),
    qoq: () => benchmarkService.qoq(region || undefined),
    yoy: () => benchmarkService.yoy(),
    region: () => benchmarkService.region(),
    segment: () => benchmarkService.segment(),
  }

  const { data, isLoading, refetch } = useQuery<BenchmarkResult>({
    queryKey: ['benchmark', tab, region],
    queryFn: fetchers[tab],
    staleTime: 120_000,
  })

  const tableRows = data?.periods ?? data?.data ?? []
  const labelKey = tab === 'mom' ? 'month' : tab === 'qoq' ? 'quarter' : tab === 'yoy' ? 'year' : tab === 'region' ? 'region' : 'segment'
  const chartData = tableRows.map((r: Record<string, unknown>) => ({ [labelKey]: r[labelKey], revenue: Number(r['revenue']) || 0 }))

  const outlookColor = (o?: string) => o === 'positive' ? 'text-green-600 bg-green-50' : o === 'negative' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benchmarking & Variance</h1>
          <p className="text-sm text-gray-500">Period comparisons, variance analytics & AI trend explanations</p>
        </div>
        <div className="flex items-center gap-3">
          {(tab === 'mom' || tab === 'qoq') && (
            <select className="input w-auto" value={region} onChange={e => setRegion(e.target.value)}>
              <option value="">All Regions</option>
              {['North', 'South', 'East', 'West'].map(r => <option key={r}>{r}</option>)}
            </select>
          )}
          <button onClick={() => refetch()} className="btn-ghost"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading
        ? <div className="card h-64 animate-pulse bg-gray-100 dark:bg-gray-800" />
        : <>
          {/* AI Insight */}
          {data?.insight?.trend_explanation && (
            <div className="card border-l-4 border-blue-500 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">{data.insight.trend_explanation}</p>
                {data.insight.recommendation && (
                  <p className="text-sm text-blue-600 mt-2 flex gap-1"><span>→</span><span>{data.insight.recommendation}</span></p>
                )}
              </div>
              {data.insight.outlook && (
                <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full capitalize shrink-0', outlookColor(data.insight.outlook))}>
                  {data.insight.outlook}
                </span>
              )}
            </div>
          )}

          {/* Chart */}
          <div className="card">
            <h2 className="font-semibold mb-4">{TABS.find(t => t.key === tab)?.label} Revenue</h2>
            <DynamicChart type="bar" data={chartData as Record<string, unknown>[]} height={280} />
          </div>

          {/* Data Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium capitalize">{labelKey}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Orders</th>
                  {(tab === 'mom' || tab === 'qoq' || tab === 'yoy') && (
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Variance</th>
                  )}
                  {tab === 'region' && <th className="text-right py-2 px-3 text-gray-500 font-medium">Share %</th>}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row: Record<string, unknown>, i: number) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-2 px-3 font-medium">{String(row[labelKey] ?? '')}</td>
                    <td className="py-2 px-3 text-right">₹{Number(row['revenue'] ?? 0).toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right">{String(row['orders'] ?? row['total_orders'] ?? '—')}</td>
                    {(tab === 'mom' || tab === 'qoq' || tab === 'yoy') && (
                      <td className="py-2 px-3 text-right"><VarianceBadge pct={Number(row['variance_pct'])} /></td>
                    )}
                    {tab === 'region' && <td className="py-2 px-3 text-right">{Number(row['revenue_share_pct'] ?? 0).toFixed(1)}%</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
    </div>
  )
}
