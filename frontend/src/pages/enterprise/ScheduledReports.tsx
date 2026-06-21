import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, Trash2, Download, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import { scheduleService } from '../../services/dataService'
import { useAuthStore } from '../../store'
import type { ReportSchedule } from '../../types'
import clsx from 'clsx'

const FREQ_COLOR: Record<string, string> = {
  daily: 'bg-blue-100 text-blue-700', weekly: 'bg-purple-100 text-purple-700', monthly: 'bg-green-100 text-green-700'
}
const TYPE_COLOR: Record<string, string> = {
  kpi: 'bg-orange-100 text-orange-700', executive: 'bg-red-100 text-red-700',
  forecast: 'bg-cyan-100 text-cyan-700', health: 'bg-emerald-100 text-emerald-700'
}

export default function ScheduledReports() {
  const { username } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', frequency: 'weekly', report_type: 'kpi', recipients: '' })

  const { data: schedData, isLoading } = useQuery({
    queryKey: ['schedules', username],
    queryFn: () => scheduleService.list(username!),
    enabled: !!username,
  })

  const { data: downloadsData } = useQuery({
    queryKey: ['report-downloads', username],
    queryFn: () => scheduleService.downloads(username!),
    enabled: !!username,
  })

  const createMutation = useMutation({
    mutationFn: () => scheduleService.create({
      username, name: form.name, frequency: form.frequency,
      report_type: form.report_type,
      recipients: form.recipients.split(',').map(s => s.trim()).filter(Boolean),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); setShowForm(false); setForm({ name: '', frequency: 'weekly', report_type: 'kpi', recipients: '' }) },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      scheduleService.update({ username, schedule_id: id, updates: { enabled } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleService.delete(username!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })

  const schedules: ReportSchedule[] = schedData?.schedules ?? []
  const downloads = downloadsData?.downloads ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Reports</h1>
          <p className="text-sm text-gray-500">Automated report delivery — daily, weekly, monthly</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> New Schedule
        </button>
      </div>

      {showForm && (
        <div className="card border border-blue-200 dark:border-blue-800 space-y-4">
          <p className="font-semibold text-sm">Create Report Schedule</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2"><label className="text-xs text-gray-500 mb-1 block">Schedule Name</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Weekly KPI Report" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Frequency</label>
              <select className="input" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
              </select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Report Type</label>
              <select className="input" value={form.report_type} onChange={e => setForm(p => ({ ...p, report_type: e.target.value }))}>
                <option value="kpi">KPI Report</option><option value="executive">Executive Summary</option>
                <option value="forecast">Forecast Report</option><option value="health">Data Health</option>
              </select></div>
            <div className="md:col-span-2"><label className="text-xs text-gray-500 mb-1 block">Recipients (comma-separated emails)</label>
              <input className="input" value={form.recipients} onChange={e => setForm(p => ({ ...p, recipients: e.target.value }))} placeholder="user@company.com, ceo@company.com" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.name} className="btn-primary text-sm">Create Schedule</button>
          </div>
        </div>
      )}

      {isLoading
        ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        : schedules.length === 0
          ? <div className="card text-center py-16 text-gray-400"><Calendar size={36} className="mx-auto mb-3" /><p>No schedules yet</p></div>
          : <div className="space-y-3">
            {schedules.map(s => (
              <div key={s.id} className={clsx('card flex items-center justify-between', !s.enabled && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', FREQ_COLOR[s.frequency])}>{s.frequency}</span>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', TYPE_COLOR[s.report_type])}>{s.report_type}</span>
                      {s.recipients.length > 0 && <span className="text-xs text-gray-400">{s.recipients.join(', ')}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> Next run: {new Date(s.next_run).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMutation.mutate({ id: s.id, enabled: !s.enabled })} className="text-gray-400 hover:text-blue-600">
                    {s.enabled ? <ToggleRight size={20} className="text-blue-600" /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
      }

      {/* Download Center */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Download size={16} className="text-blue-500" />Download Center</h2>
        {downloads.length === 0
          ? <p className="text-gray-400 text-sm text-center py-6">No reports generated yet</p>
          : <div className="space-y-2">
            {downloads.map((d: Record<string, string>) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-gray-400">{new Date(d.generated_at).toLocaleString()} · {d.report_type}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ready</span>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  )
}
