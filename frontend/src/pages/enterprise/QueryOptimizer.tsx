import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Zap, AlertTriangle, CheckCircle, TrendingUp, Database,
  Code2, ChevronDown, ChevronRight, Loader2, Copy, Check,
  ArrowRight, Info, Shield
} from 'lucide-react'
import { queryOptimizerService } from '../../services/dataService'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bottleneck {
  type: string
  table: string
  description: string
  impact: 'high' | 'medium' | 'low'
  estimated_rows_scanned?: number
}

interface IndexRecommendation {
  ddl: string
  table: string
  columns: string[]
  index_type: string
  rationale: string
  estimated_speedup: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface Benchmark {
  original_time_ms: number | null
  optimized_time_ms: number | null
  original_rows: number | null
  optimized_rows: number | null
  speedup_ms: number
}

interface ExplainPlan {
  plan_type?: string
  total_cost?: number
  actual_time_ms?: number
  rows_estimated?: number
  rows_actual?: number
  error?: string
}

interface OptimizeResult {
  original_sql: string
  optimized_sql: string
  performance_score: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  tables_analyzed: string[]
  existing_indexes: Array<{ tablename: string; indexname: string; indexdef: string }>
  benchmark: Benchmark
  explain_original: ExplainPlan
  explain_optimized: ExplainPlan
  bottlenecks: Bottleneck[]
  optimization_changes: string[]
  index_recommendations: IndexRecommendation[]
  rewrite_explanation: string
  estimated_improvement: string
  best_practices_violated: string[]
  additional_tips: string[]
}

// ─── Sample queries ──────────────────────────────────────────────────────────

const SAMPLES = [
  {
    label: 'Select * with no index',
    sql: `SELECT * FROM orders\nWHERE order_date > '2024-06-01';`,
  },
  {
    label: 'Missing JOIN index',
    sql: `SELECT c.first_name, c.last_name, SUM(o.total_amount) AS revenue\nFROM orders o\nJOIN customers c ON c.customer_id = o.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.customer_id, c.first_name, c.last_name\nORDER BY revenue DESC;`,
  },
  {
    label: 'Subquery instead of JOIN',
    sql: `SELECT order_id, total_amount\nFROM orders\nWHERE customer_id IN (\n  SELECT customer_id FROM customers\n  WHERE region = 'South'\n)\nAND status = 'completed';`,
  },
  {
    label: 'No LIMIT on large table',
    sql: `SELECT o.order_id, o.order_date, o.total_amount,\n       p.product_name, oi.quantity\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status = 'completed';`,
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Good' : score >= 55 ? 'Needs Work' : 'Poor'
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

function ImpactBadge({ impact }: { impact: string }) {
  const styles: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', styles[impact] ?? styles.medium)}>
      {impact}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', styles[priority] ?? styles.LOW)}>
      {priority}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

function ExplainCard({ plan, label }: { plan: ExplainPlan; label: string }) {
  if (plan?.error) return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
      {label}: {plan.error}
    </div>
  )
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1.5">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-gray-400">Plan Type</span>
        <span className="font-medium">{plan.plan_type ?? '—'}</span>
        <span className="text-gray-400">Total Cost</span>
        <span className="font-medium">{plan.total_cost ?? '—'}</span>
        <span className="text-gray-400">Actual Time</span>
        <span className="font-medium">{plan.actual_time_ms != null ? `${plan.actual_time_ms}ms` : '—'}</span>
        <span className="text-gray-400">Est. Rows</span>
        <span className="font-medium">{plan.rows_estimated ?? '—'}</span>
        <span className="text-gray-400">Actual Rows</span>
        <span className="font-medium">{plan.rows_actual ?? '—'}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QueryOptimizer() {
  const [sql, setSql] = useState(SAMPLES[0].sql)
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [showOriginalPlan, setShowOriginalPlan] = useState(false)
  const [showOptimizedPlan, setShowOptimizedPlan] = useState(false)
  const [showExisting, setShowExisting] = useState(false)

  const mutation = useMutation({
    mutationFn: () => queryOptimizerService.optimize(sql),
    onSuccess: (data) => setResult(data as OptimizeResult),
  })

  const severityBanner: Record<string, string> = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/10',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
    medium: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
    low: 'border-green-400 bg-green-50 dark:bg-green-900/10',
  }

  const severityIcon = {
    critical: <AlertTriangle size={16} className="text-red-500" />,
    high: <AlertTriangle size={16} className="text-orange-500" />,
    medium: <AlertTriangle size={16} className="text-yellow-500" />,
    low: <CheckCircle size={16} className="text-green-500" />,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Zap size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Query Optimization Advisor</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Detect slow queries, suggest indexes, explain bottlenecks, and compare original vs optimized SQL
        </p>
      </div>

      {/* Sample queries */}
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map(s => (
          <button key={s.label} onClick={() => setSql(s.sql)}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              sql === s.sql
                ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-purple-300'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {/* SQL Input */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Code2 size={15} className="text-purple-500" /> SQL Query to Analyze
          </label>
          <CopyButton text={sql} />
        </div>
        <textarea
          className="w-full font-mono text-sm bg-gray-900 text-green-400 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={6}
          value={sql}
          onChange={e => setSql(e.target.value)}
          placeholder="Paste your SQL query here…"
          spellCheck={false}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !sql.trim()}
          className="btn-primary flex items-center gap-2 w-fit bg-purple-600 hover:bg-purple-700">
          {mutation.isPending
            ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
            : <><Zap size={14} /> Analyze & Optimize</>}
        </button>
      </div>

      {/* Error */}
      {mutation.isError && (
        <div className="card border-l-4 border-red-500 text-sm text-red-600">
          Optimization failed. Ensure the AI service is running.
        </div>
      )}

      {/* Results */}
      {result && !mutation.isPending && (
        <div className="space-y-5">

          {/* Score + Severity + Benchmark */}
          <div className={clsx('card border-l-4', severityBanner[result.severity])}>
            <div className="flex items-start gap-6 flex-wrap">
              <ScoreGauge score={result.performance_score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {severityIcon[result.severity as keyof typeof severityIcon]}
                  <span className="font-bold text-base capitalize">{result.severity} severity</span>
                  <span className="text-xs text-gray-400 ml-1">
                    Tables: {result.tables_analyzed.join(', ')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{result.estimated_improvement}</p>

                {/* Benchmark bar */}
                {result.benchmark.original_time_ms != null && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Original Time', val: `${result.benchmark.original_time_ms}ms`, color: 'text-red-600' },
                      { label: 'Optimized Time', val: result.benchmark.optimized_time_ms != null ? `${result.benchmark.optimized_time_ms}ms` : '—', color: 'text-green-600' },
                      { label: 'Time Saved', val: result.benchmark.speedup_ms > 0 ? `${result.benchmark.speedup_ms}ms` : '—', color: 'text-blue-600' },
                      { label: 'Rows', val: result.benchmark.original_rows != null ? `${result.benchmark.original_rows}` : '—', color: 'text-gray-600' },
                    ].map(m => (
                      <div key={m.label} className="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-gray-400">{m.label}</p>
                        <p className={clsx('font-bold text-sm mt-0.5', m.color)}>{m.val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottlenecks */}
          {result.bottlenecks.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="text-orange-500" /> Bottlenecks Detected
                <span className="ml-auto text-xs text-gray-400">{result.bottlenecks.length} issue{result.bottlenecks.length > 1 ? 's' : ''}</span>
              </h2>
              <div className="space-y-2">
                {result.bottlenecks.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <AlertTriangle size={14} className={
                      b.impact === 'high' ? 'text-red-500 mt-0.5 shrink-0' :
                      b.impact === 'medium' ? 'text-yellow-500 mt-0.5 shrink-0' : 'text-green-500 mt-0.5 shrink-0'
                    } />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{b.type}</span>
                        {b.table && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                            {b.table}
                          </span>
                        )}
                        <ImpactBadge impact={b.impact} />
                        {b.estimated_rows_scanned != null && (
                          <span className="text-xs text-gray-400">
                            ~{b.estimated_rows_scanned.toLocaleString()} rows scanned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SQL Comparison */}
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Code2 size={15} className="text-blue-500" /> SQL Comparison
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    ● Original
                  </span>
                  <CopyButton text={result.original_sql} />
                </div>
                <pre className="bg-gray-900 text-red-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {result.original_sql}
                </pre>
              </div>

              {/* Arrow */}
              <div className="hidden xl:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                <ArrowRight size={20} className="text-purple-400" />
              </div>

              {/* Optimized */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    ✓ Optimized
                  </span>
                  <CopyButton text={result.optimized_sql} />
                </div>
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {result.optimized_sql}
                </pre>
              </div>
            </div>

            {/* Changes made */}
            {result.optimization_changes.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Changes Made</p>
                {result.optimization_changes.map((c, i) => (
                  <p key={i} className="text-xs text-blue-600 dark:text-blue-400 flex gap-2">
                    <span>→</span><span>{c}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Rewrite explanation */}
            {result.rewrite_explanation && (
              <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{result.rewrite_explanation}</p>
              </div>
            )}
          </div>

          {/* Index Recommendations */}
          {result.index_recommendations.length > 0 && (
            <div className="card space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Database size={15} className="text-purple-500" /> Index Recommendations
                <span className="ml-auto text-xs text-gray-400">{result.index_recommendations.length} index{result.index_recommendations.length > 1 ? 'es' : ''}</span>
              </h2>
              <div className="space-y-3">
                {result.index_recommendations.map((idx, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={idx.priority} />
                        <span className="font-mono text-sm font-medium text-purple-600 dark:text-purple-400">
                          {idx.table}({idx.columns.join(', ')})
                        </span>
                        <span className="text-xs text-gray-400">{idx.index_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-semibold">{idx.estimated_speedup}</span>
                        <CopyButton text={idx.ddl} />
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <pre className="bg-gray-900 text-yellow-300 rounded p-3 text-xs overflow-x-auto font-mono">
                        {idx.ddl}
                      </pre>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{idx.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Plans */}
          <div className="card space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp size={15} className="text-teal-500" /> Execution Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <ExplainCard plan={result.explain_original} label="Original Query" />
                <button onClick={() => setShowOriginalPlan(p => !p)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  {showOriginalPlan ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showOriginalPlan ? 'Hide' : 'Show'} full plan JSON
                </button>
                {showOriginalPlan && result.explain_original.full_plan && (
                  <pre className="bg-gray-900 text-gray-300 rounded p-3 text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(result.explain_original.full_plan, null, 2)}
                  </pre>
                )}
              </div>
              <div className="space-y-2">
                <ExplainCard plan={result.explain_optimized} label="Optimized Query" />
                <button onClick={() => setShowOptimizedPlan(p => !p)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  {showOptimizedPlan ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showOptimizedPlan ? 'Hide' : 'Show'} full plan JSON
                </button>
                {showOptimizedPlan && result.explain_optimized.full_plan && (
                  <pre className="bg-gray-900 text-gray-300 rounded p-3 text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(result.explain_optimized.full_plan, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Best Practices + Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {result.best_practices_violated.length > 0 && (
              <div className="card border-l-4 border-red-400 space-y-2">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Shield size={14} className="text-red-500" /> Best Practices Violated
                </h2>
                {result.best_practices_violated.map((v, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400 flex gap-2">
                    <span>✕</span><span>{v}</span>
                  </p>
                ))}
              </div>
            )}
            {result.additional_tips.length > 0 && (
              <div className="card border-l-4 border-blue-400 space-y-2">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Info size={14} className="text-blue-500" /> Additional Tips
                </h2>
                {result.additional_tips.map((t, i) => (
                  <p key={i} className="text-sm text-blue-600 dark:text-blue-400 flex gap-2">
                    <span>→</span><span>{t}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Existing Indexes */}
          {result.existing_indexes.length > 0 && (
            <div className="card">
              <button onClick={() => setShowExisting(p => !p)}
                className="w-full flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Database size={14} className="text-gray-400" />
                  Existing Indexes on Analyzed Tables
                  <span className="text-xs text-gray-400 font-normal">({result.existing_indexes.length})</span>
                </span>
                {showExisting ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showExisting && (
                <div className="mt-3 space-y-1">
                  {result.existing_indexes.map((idx, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="font-mono text-blue-600 shrink-0 w-28 truncate">{idx.tablename}</span>
                      <span className="font-mono text-purple-600 shrink-0 w-40 truncate">{idx.indexname}</span>
                      <span className="text-gray-500 truncate">{idx.indexdef}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
