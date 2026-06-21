import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Settings, CheckCheck, Plus, Trash2, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { alertService } from '../../services/dataService'
import { useAuthStore } from '../../store'
import type { AlertRule, AlertNotification } from '../../types'
import clsx from 'clsx'

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-red-500 bg-red-50 dark:bg-red-900/10',
  warning:  'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
  info:     'border-blue-400 bg-blue-50 dark:bg-blue-900/10',
}
const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertCircle size={15} className="text-red-500" />,
  warning:  <AlertTriangle size={15} className="text-yellow-500" />,
  info:     <Info size={15} className="text-blue-500" />,
}

const DEFAULT_METRICS = ['revenue_growth_pct', 'total_orders', 'total_revenue', 'churn_rate', 'anomaly_count']

export default function AlertsPage() {
  const { username } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'notifications' | 'rules'>('notifications')
  const [editingRule, setEditingRule] = useState<Partial<AlertRule> | null>(null)

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['alert-notifications', username],
    queryFn: () => alertService.notifications(username!),
    enabled: !!username,
    refetchInterval: 60_000,
  })

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['alert-rules', username],
    queryFn: () => alertService.getRules(username!),
    enabled: !!username,
  })

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => alertService.markRead(username!, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-notifications'] }),
  })

  const saveRulesMutation = useMutation({
    mutationFn: (rules: object[]) => alertService.saveRules(username!, rules),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alert-rules'] }); setEditingRule(null) },
  })

  const notifications: AlertNotification[] = notifData?.notifications ?? []
  const rules: AlertRule[] = rulesData?.rules ?? []
  const unreadCount = notifications.filter(n => !n.read).length

  const addOrUpdateRule = () => {
    if (!editingRule?.name || !editingRule.metric) return
    const newRule: AlertRule = {
      id: editingRule.id ?? `rule_${Date.now()}`,
      name: editingRule.name!,
      metric: editingRule.metric!,
      condition: editingRule.condition ?? 'lt',
      threshold: Number(editingRule.threshold ?? 0),
      severity: editingRule.severity ?? 'warning',
      message: editingRule.message ?? editingRule.name!,
      enabled: true,
    }
    const updated = editingRule.id ? rules.map(r => r.id === editingRule.id ? newRule : r) : [...rules, newRule]
    saveRulesMutation.mutate(updated)
  }

  const deleteRule = (id: string) => {
    saveRulesMutation.mutate(rules.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alert & Monitoring Engine</h1>
          <p className="text-sm text-gray-500">Configurable business alerts and real-time notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markReadMutation.mutate(notifications.filter(n => !n.read).map(n => n.notification_id))}
            className="btn-ghost flex items-center gap-2 text-sm">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => setTab('notifications')}
          className={clsx('px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2',
            tab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>
          <Bell size={14} /> Notifications
          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{unreadCount}</span>}
        </button>
        <button onClick={() => setTab('rules')}
          className={clsx('px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2',
            tab === 'rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>
          <Settings size={14} /> Rules
        </button>
      </div>

      {tab === 'notifications' && (
        notifLoading
          ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
          : notifications.length === 0
            ? <div className="card text-center py-16 text-gray-400"><Bell size={36} className="mx-auto mb-3" /><p>No alerts triggered</p></div>
            : <div className="space-y-3">
              {notifications.map((n, i) => (
                <div key={i} className={clsx('card border-l-4', SEVERITY_STYLE[n.severity] ?? SEVERITY_STYLE.info, n.read && 'opacity-60')}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {SEVERITY_ICON[n.severity]}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{n.name}</p>
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Actual: <b>{n.actual_value}</b> · Threshold: <b>{n.threshold}</b> · {new Date(n.triggered_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!n.read && (
                      <button onClick={() => markReadMutation.mutate([n.notification_id])} className="btn-ghost text-xs">Mark read</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setEditingRule({})} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Rule
            </button>
          </div>

          {editingRule !== null && (
            <div className="card border border-blue-200 dark:border-blue-800 space-y-4">
              <p className="font-semibold text-sm">{editingRule.id ? 'Edit Rule' : 'New Alert Rule'}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Name</label>
                  <input className="input" value={editingRule.name ?? ''} onChange={e => setEditingRule(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Metric</label>
                  <select className="input" value={editingRule.metric ?? ''} onChange={e => setEditingRule(p => ({ ...p, metric: e.target.value }))}>
                    <option value="">Select…</option>
                    {DEFAULT_METRICS.map(m => <option key={m}>{m}</option>)}
                  </select></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Condition</label>
                  <select className="input" value={editingRule.condition ?? 'lt'} onChange={e => setEditingRule(p => ({ ...p, condition: e.target.value }))}>
                    <option value="lt">Less than (&lt;)</option>
                    <option value="gt">Greater than (&gt;)</option>
                  </select></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Threshold</label>
                  <input className="input" type="number" value={editingRule.threshold ?? ''} onChange={e => setEditingRule(p => ({ ...p, threshold: Number(e.target.value) }))} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Severity</label>
                  <select className="input" value={editingRule.severity ?? 'warning'} onChange={e => setEditingRule(p => ({ ...p, severity: e.target.value }))}>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Message</label>
                  <input className="input" value={editingRule.message ?? ''} onChange={e => setEditingRule(p => ({ ...p, message: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingRule(null)} className="btn-ghost text-sm">Cancel</button>
                <button onClick={addOrUpdateRule} className="btn-primary text-sm">Save Rule</button>
              </div>
            </div>
          )}

          {rulesLoading
            ? <div className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />
            : <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {SEVERITY_ICON[rule.severity]}
                    <div>
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-gray-400">{rule.metric} {rule.condition === 'lt' ? '<' : '>'} {rule.threshold}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                      rule.severity === 'critical' ? 'bg-red-100 text-red-700' : rule.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
                      {rule.severity}
                    </span>
                    <button onClick={() => setEditingRule(rule)} className="btn-ghost p-1.5"><Settings size={13} /></button>
                    <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  )
}
