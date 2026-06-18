import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Loader2 } from 'lucide-react'
import { dashboardService, insightService, reportService } from '../services/dataService'

export default function Reports() {
  const [generating, setGenerating] = useState(false)
  const [title, setTitle] = useState('Monthly Business Intelligence Report')

  const { data: kpis } = useQuery({
    queryKey: ['kpis', {}],
    queryFn: () => dashboardService.getKpis(),
  })

  const handleDownload = async () => {
    setGenerating(true)
    try {
      let insights = null
      if (kpis) {
        try {
          insights = await insightService.generate('Give a full business overview', kpis.revenueByMonth ?? [])
        } catch {}
      }

      const blob = await reportService.generatePdf(kpis, insights, title)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-gray-500">Generate downloadable PDF reports with KPIs and AI insights</p>
      </div>

      <div className="card max-w-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">Business Intelligence Report</p>
            <p className="text-xs text-gray-400">PDF • KPI Summary • AI Insights • Recommendations</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Report Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <button onClick={handleDownload} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {generating ? 'Generating…' : 'Download PDF Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'CSV Export', desc: 'Raw data export for all queries', icon: '📊' },
          { name: 'Excel Report', desc: 'Formatted spreadsheet with charts', icon: '📋' },
          { name: 'Weekly Summary', desc: 'Auto-generated weekly digest', icon: '📅' },
        ].map(r => (
          <div key={r.name} className="card opacity-60 cursor-not-allowed">
            <div className="text-2xl mb-2">{r.icon}</div>
            <p className="font-semibold text-sm">{r.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
            <span className="mt-3 inline-block text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
