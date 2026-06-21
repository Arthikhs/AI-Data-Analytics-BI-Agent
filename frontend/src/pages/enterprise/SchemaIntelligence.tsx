import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, Link, BookOpen, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { schemaService } from '../../services/dataService'
import type { SchemaMetadata, BusinessGlossary } from '../../types'
import clsx from 'clsx'

export default function SchemaIntelligence() {
  const [dataset, setDataset] = useState('ecommerce')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'explorer' | 'relationships' | 'glossary'>('explorer')

  const { data: schema, isLoading, refetch } = useQuery<SchemaMetadata>({
    queryKey: ['schema', dataset],
    queryFn: () => schemaService.discover(dataset),
    staleTime: 300_000,
  })

  const { data: glossary, isLoading: glossaryLoading } = useQuery<BusinessGlossary>({
    queryKey: ['glossary', dataset],
    queryFn: () => schemaService.glossary(dataset),
    staleTime: 3600_000,
    enabled: tab === 'glossary',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schema Intelligence</h1>
          <p className="text-sm text-gray-500">Auto-discovered metadata, relationships & business glossary</p>
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

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(['explorer', 'relationships', 'glossary'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'explorer' && (
        isLoading
          ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
          : <div className="space-y-3">
            {Object.entries(schema?.tables ?? {}).map(([table, meta]) => (
              <div key={table} className="card">
                <button className="w-full flex items-center justify-between" onClick={() => setExpanded(p => ({ ...p, [table]: !p[table] }))}>
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-blue-500" />
                    <span className="font-semibold">{table}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{meta.row_count?.toLocaleString()} rows</span>
                    <span className="text-xs text-gray-400">{meta.columns?.length} columns</span>
                  </div>
                  {expanded[table] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded[table] && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          {['Column', 'Type', 'Nullable', 'Key'].map(h => <th key={h} className="text-left py-1.5 px-2 text-gray-400 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {meta.columns?.map(col => (
                          <tr key={col.name} className="border-b border-gray-50 dark:border-gray-800/50">
                            <td className="py-1.5 px-2 font-mono font-medium">{col.name}</td>
                            <td className="py-1.5 px-2 text-gray-500">{col.type}</td>
                            <td className="py-1.5 px-2 text-gray-400">{col.nullable ? 'yes' : 'no'}</td>
                            <td className="py-1.5 px-2 flex gap-1">
                              {col.is_primary_key && <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded text-xs">PK</span>}
                              {meta.foreign_keys?.find(fk => fk.column === col.name) && <span className="bg-purple-100 text-purple-700 px-1.5 rounded text-xs">FK</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {meta.foreign_keys?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {meta.foreign_keys.map((fk, i) => (
                          <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <Link size={10} className="text-purple-500" />
                            {fk.column} → {fk.references_table}.{fk.references_column}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
      )}

      {tab === 'relationships' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Table Relationships</h2>
          <div className="space-y-2">
            {schema?.relationships?.map((rel, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <span className="font-mono font-medium text-blue-600">{rel.from_table}.{rel.from_column}</span>
                <span className="text-gray-400">→</span>
                <span className="font-mono font-medium text-purple-600">{rel.to_table}.{rel.to_column}</span>
                <span className="ml-auto text-xs text-gray-400 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">{rel.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'glossary' && (
        glossaryLoading
          ? <div className="card h-40 animate-pulse bg-gray-100 dark:bg-gray-800" />
          : <div className="space-y-4">
            {glossary?.dataset_summary && (
              <div className="card border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2"><BookOpen size={14} className="text-blue-500" /><span className="font-semibold text-sm">Dataset Overview</span></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{glossary.dataset_summary}</p>
              </div>
            )}
            <div className="card">
              <h2 className="font-semibold mb-4">Business Glossary</h2>
              <div className="space-y-3">
                {glossary?.glossary?.map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-mono font-medium text-blue-600 text-sm">{item.term}</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.business_meaning}</p>
                    {item.example && <p className="text-xs text-gray-400 mt-1 italic">{item.example}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
      )}
    </div>
  )
}
