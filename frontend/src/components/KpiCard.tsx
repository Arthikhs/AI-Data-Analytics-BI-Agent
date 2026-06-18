import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  title: string
  value: string
  change?: number
  icon: React.ReactNode
  color?: string
}

export function KpiCard({ title, value, change, icon, color = 'blue' }: Props) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green:  'bg-green-50 text-green-600 dark:bg-green-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
    red:    'bg-red-50 text-red-600 dark:bg-red-900/20',
  }

  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {change !== undefined && (
          <div className={clsx('flex items-center gap-1 text-sm mt-1 font-medium',
            change >= 0 ? 'text-green-600' : 'text-red-500')}>
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-gray-400 font-normal">vs last period</span>
          </div>
        )}
      </div>
      <div className={clsx('p-3 rounded-xl', colorMap[color] ?? colorMap.blue)}>
        {icon}
      </div>
    </div>
  )
}
