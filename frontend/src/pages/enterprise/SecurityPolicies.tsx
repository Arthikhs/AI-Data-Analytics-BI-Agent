import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Lock, Eye, EyeOff, Save } from 'lucide-react'
import { rlsService } from '../../services/dataService'
import type { RlsPolicy } from '../../types'
import clsx from 'clsx'

const ROLES = ['ROLE_ADMIN', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_SOUTH_MANAGER', 'ROLE_NORTH_MANAGER']
const ALL_DATASETS = ['ecommerce', 'banking', 'logistics']
const ALL_COLUMNS = ['email', 'phone', 'balance', 'password', 'card_number']

export default function SecurityPolicies() {
  const qc = useQueryClient()
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [editPolicy, setEditPolicy] = useState<RlsPolicy | null>(null)

  const { data: policies, isLoading } = useQuery({
    queryKey: ['rls-policies'],
    queryFn: () => rlsService.policies(),
    staleTime: 60_000,
  })

  const { data: rolePolicy } = useQuery({
    queryKey: ['rls-policy', selectedRole],
    queryFn: () => rlsService.getPolicy(selectedRole),
    staleTime: 60_000,
  })

  const saveMutation = useMutation({
    mutationFn: () => rlsService.savePolicy(selectedRole, editPolicy!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rls-policies'] }); qc.invalidateQueries({ queryKey: ['rls-policy'] }); setEditPolicy(null) },
  })

  const currentPolicy: RlsPolicy = editPolicy ?? rolePolicy ?? { datasets: [], region_filter: null, column_masks: [] }

  const toggleDataset = (d: string) => {
    const cur = editPolicy ?? { ...(rolePolicy ?? { datasets: [], region_filter: null, column_masks: [] }) }
    const datasets = cur.datasets.includes(d) ? cur.datasets.filter(x => x !== d) : [...cur.datasets, d]
    setEditPolicy({ ...cur, datasets })
  }

  const toggleMask = (col: string) => {
    const cur = editPolicy ?? { ...(rolePolicy ?? { datasets: [], region_filter: null, column_masks: [] }) }
    const masks = cur.column_masks.includes(col) ? cur.column_masks.filter(x => x !== col) : [...cur.column_masks, col]
    setEditPolicy({ ...cur, column_masks: masks })
  }

  const setRegion = (v: string) => {
    const cur = editPolicy ?? { ...(rolePolicy ?? { datasets: [], region_filter: null, column_masks: [] }) }
    setEditPolicy({ ...cur, region_filter: v || null })
  }

  const policyMap = policies?.policies ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dataset & Row-Level Security</h1>
        <p className="text-sm text-gray-500">RBAC policies, dataset access, column masking and row-level filtering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role list */}
        <div className="card space-y-2">
          <p className="font-semibold text-sm mb-3">Roles</p>
          {ROLES.map(role => (
            <button key={role} onClick={() => { setSelectedRole(role); setEditPolicy(null) }}
              className={clsx('w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors',
                selectedRole === role ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 font-medium' : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800')}>
              <Shield size={14} />
              {role.replace('ROLE_', '')}
            </button>
          ))}
        </div>

        {/* Policy editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">{selectedRole.replace('ROLE_', '')} Policy</p>
              <div className="flex gap-2">
                {editPolicy && (
                  <>
                    <button onClick={() => setEditPolicy(null)} className="btn-ghost text-sm">Cancel</button>
                    <button onClick={() => saveMutation.mutate()} className="btn-primary text-sm flex items-center gap-1.5">
                      <Save size={13} /> Save
                    </button>
                  </>
                )}
                {!editPolicy && (
                  <button onClick={() => setEditPolicy({ ...currentPolicy })} className="btn-ghost text-sm">Edit Policy</button>
                )}
              </div>
            </div>

            {/* Dataset Access */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Lock size={11} />Dataset Access</p>
              <div className="flex gap-2">
                {ALL_DATASETS.map(d => {
                  const allowed = currentPolicy.datasets?.includes(d)
                  return (
                    <button key={d} onClick={() => editPolicy !== null && toggleDataset(d)}
                      className={clsx('text-sm px-3 py-1.5 rounded-lg border transition-colors',
                        allowed ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400',
                        editPolicy === null && 'cursor-default')}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Region Filter */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Row-Level Region Filter</p>
              {editPolicy ? (
                <select className="input w-auto" value={currentPolicy.region_filter ?? ''} onChange={e => setRegion(e.target.value)}>
                  <option value="">No restriction (all regions)</option>
                  {['North', 'South', 'East', 'West'].map(r => <option key={r}>{r}</option>)}
                </select>
              ) : (
                <span className={clsx('text-sm px-3 py-1.5 rounded-lg border inline-block',
                  currentPolicy.region_filter ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400')}>
                  {currentPolicy.region_filter ?? 'No restriction'}
                </span>
              )}
            </div>

            {/* Column Masking */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><EyeOff size={11} />Column Masking</p>
              <div className="flex flex-wrap gap-2">
                {ALL_COLUMNS.map(col => {
                  const masked = currentPolicy.column_masks?.includes(col)
                  return (
                    <button key={col} onClick={() => editPolicy !== null && toggleMask(col)}
                      className={clsx('text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-colors',
                        masked ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400',
                        editPolicy === null && 'cursor-default')}>
                      {masked ? <EyeOff size={10} /> : <Eye size={10} />}
                      {col}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* All Policies Summary */}
          {!isLoading && (
            <div className="card">
              <p className="font-semibold text-sm mb-3">All Policies Summary</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-2 px-2 text-gray-400 font-medium">Role</th>
                      <th className="text-left py-2 px-2 text-gray-400 font-medium">Datasets</th>
                      <th className="text-left py-2 px-2 text-gray-400 font-medium">Region</th>
                      <th className="text-left py-2 px-2 text-gray-400 font-medium">Masked Cols</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(policyMap).map(([role, p]: [string, unknown]) => {
                      const policy = p as RlsPolicy
                      return (
                        <tr key={role} className="border-b border-gray-50 dark:border-gray-800/50">
                          <td className="py-2 px-2 font-medium">{role.replace('ROLE_', '')}</td>
                          <td className="py-2 px-2">{policy.datasets?.join(', ') || '—'}</td>
                          <td className="py-2 px-2">{policy.region_filter ?? 'All'}</td>
                          <td className="py-2 px-2">{policy.column_masks?.join(', ') || 'None'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
