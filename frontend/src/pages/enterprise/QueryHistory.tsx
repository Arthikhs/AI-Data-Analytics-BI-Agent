import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Star, Trash2, Code2, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { historyService } from '../../services/dataService'
import { useAuthStore } from '../../store'
import type { HistoryEntry } from '../../types'
import clsx from 'clsx'

export default function QueryHistory() {
  const { username } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'favorites'>('all')
  const [expandedSql, setExpandedSql] = useState<Record<string, boolean>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['history', username, search],
    queryFn: () => historyService.get(username!, 50, search),
    enabled: !!username,
    staleTime: 30_000,
  })

  const { data: favData } = useQuery({
    queryKey: ['favorites', username],
    queryFn: () => historyService.getFavorites(username!),
    enabled: !!username && tab === 'favorites',
  })

  const favMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => historyService.favorite(username!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['history'] }); qc.invalidateQueries({ queryKey: ['favorites'] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => historyService.delete(username!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  })

  const entries: HistoryEntry[] = tab === 'favorites'
    ? (favData?.favorites ?? [])
    : (data?.history ?? [])

  const datasetColor = (d: string) => ({
    ecommerce: 'bg-blue-100 text-blue-700', banking: 'bg-green-100 text-green-700', logistics: 'bg-orange-100 text-orange-700'
  }[d] ?? 'bg-gray-100 text-gray-600')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Query History</h1>
          <p className="text-sm text-gray-500">All past queries, favorites and saved analytics</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="input pl-8" placeholder="Search queries…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          {(['all', 'favorites'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx('px-3 py-1.5 text-sm rounded-md capitalize transition-colors',
                tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading
        ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        : entries.length === 0
          ? <div className="card text-center py-16 text-gray-400"><Clock size={36} className="mx-auto mb-3" /><p>No queries found</p></div>
          : <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', datasetColor(entry.dataset))}>{entry.dataset}</span>
                      <span className="text-xs text-gray-400">{entry.row_count} rows</span>
                      <span className="text-xs text-gray-400">{entry.execution_time_ms}ms</span>
                      <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => favMutation.mutate({ id: entry.id })}
                      className={clsx('p-1.5 rounded-lg transition-colors', entry.is_favorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                      <Star size={14} fill={entry.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => setExpandedSql(p => ({ ...p, [entry.id]: !p[entry.id] }))}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      {expandedSql[entry.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(entry.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expandedSql[entry.id] && (
                  <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">
                    {entry.sql}
                  </pre>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  )
}
