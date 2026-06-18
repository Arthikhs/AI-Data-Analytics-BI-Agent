import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

interface Props {
  type: string
  data: Record<string, unknown>[]
  height?: number
}

export function DynamicChart({ type, data, height = 300 }: Props) {
  if (!data?.length) return <p className="text-gray-400 text-sm text-center py-8">No data available</p>

  const keys = Object.keys(data[0]).filter(k => {
    const v = data[0][k]
    return typeof v === 'number' || !isNaN(Number(v))
  })
  const labelKey = Object.keys(data[0]).find(k => !keys.includes(k)) ?? keys[0]
  const valueKey = keys[0] ?? labelKey

  const normalized = data.map(row => {
    const r: Record<string, unknown> = { ...row }
    keys.forEach(k => { r[k] = Number(r[k]) || 0 })
    return r
  })

  const commonProps = { data: normalized }

  if (type === 'line') return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
        <Legend />
        {keys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  )

  if (type === 'area') return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
        <Legend />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length] + '33'} strokeWidth={2} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )

  if (type === 'pie') return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={normalized} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%"
          outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {normalized.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  if (type === 'scatter') return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={keys[0]} name={keys[0]} tick={{ fontSize: 12 }} />
        <YAxis dataKey={keys[1] ?? keys[0]} name={keys[1] ?? keys[0]} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={normalized} fill={COLORS[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  )

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
        <Legend />
        {keys.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}
