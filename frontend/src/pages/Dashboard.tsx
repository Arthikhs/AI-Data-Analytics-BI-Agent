import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, RefreshCw } from 'lucide-react'
import { KpiCard } from '../components/KpiCard'
import { DynamicChart } from '../components/DynamicChart'
import { dashboardService } from '../services/dataService'

export default function Dashboard() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [region, setRegion] = useState('')

  const params: Record<string, string> = {}
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo
  if (region) params.region = region

  const { data: kpis, isLoading, refetch } = useQuery({
    queryKey: ['kpis', params],
    queryFn: () => dashboardService.getKpis(params),
    staleTime: 60_000,
  })

  const fmt = (n?: number) => n != null ? `₹${(n / 100000).toFixed(1)}L` : '—'
  const fmtNum = (n?: number) => n?.toLocaleString('en-IN') ?? '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time business intelligence overview</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="input w-auto" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" className="input w-auto" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <select className="input w-auto" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">All Regions</option>
            {['North', 'South', 'East', 'West'].map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => refetch()} className="btn-ghost">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard title="Total Revenue" value={fmt(kpis?.totalRevenue)} change={kpis?.revenueGrowthPct}
            icon={<DollarSign size={20} />} color="blue" />
          <KpiCard title="Gross Profit" value={fmt(kpis?.grossProfit)}
            icon={<TrendingUp size={20} />} color="green" />
          <KpiCard title="Total Orders" value={fmtNum(kpis?.totalOrders)}
            icon={<ShoppingCart size={20} />} color="purple" />
          <KpiCard title="Customers" value={fmtNum(kpis?.totalCustomers)}
            icon={<Users size={20} />} color="orange" />
          <KpiCard title="Avg. Order" value={fmt(kpis?.avgOrderValue)}
            icon={<Package size={20} />} color="red" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="font-semibold mb-4">Revenue Trend</h2>
          <DynamicChart type="area" data={(kpis?.revenueByMonth ?? []) as Record<string, unknown>[]}
            height={260} />
        </div>
        <div className="card">
          <h2 className="font-semibold mb-4">Revenue by Region</h2>
          <DynamicChart type="bar" data={(kpis?.revenueByRegion ?? []) as Record<string, unknown>[]}
            height={260} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card">
          <h2 className="font-semibold mb-4">Category Breakdown</h2>
          <DynamicChart type="pie" data={(kpis?.revenueByCategory ?? []) as Record<string, unknown>[]}
            height={250} />
        </div>
        <div className="card xl:col-span-2">
          <h2 className="font-semibold mb-4">Top Products</h2>
          <DynamicChart type="bar" data={(kpis?.topProducts ?? []) as Record<string, unknown>[]}
            height={250} />
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="card">
        <h2 className="font-semibold mb-4">Top Customers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">#</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Customer</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Segment</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Region</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Orders</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(kpis?.topCustomers ?? []).map((c, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{c.customer_name}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.segment === 'VIP' ? 'bg-purple-100 text-purple-700' :
                      c.segment === 'Premium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'}`}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-500">{c.region}</td>
                  <td className="py-2 px-3 text-right">{c.total_orders}</td>
                  <td className="py-2 px-3 text-right font-semibold">₹{Number(c.total_revenue).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
