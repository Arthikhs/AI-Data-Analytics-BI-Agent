import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Loader2, Table2, Sheet } from 'lucide-react'
import { dashboardService, insightService, reportService } from '../services/dataService'

type ExportFormat = 'pdf' | 'csv' | 'excel'

export default function Reports() {
  const [generating, setGenerating] = useState<ExportFormat | null>(null)
  const [title, setTitle] = useState('Monthly Business Intelligence Report')

  const { data: kpis } = useQuery({
    queryKey: ['kpis', {}],
    queryFn: () => dashboardService.getKpis(),
  })

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePdf = async () => {
    setGenerating('pdf')
    try {
      let insights = null
      if (kpis) {
        try { insights = await insightService.generate('Give a full business overview', kpis.revenueByMonth ?? []) } catch {}
      }
      const blob = await reportService.generatePdf(kpis, insights, title)
      triggerDownload(blob, `${title.replace(/\s+/g, '_')}.pdf`)
    } finally { setGenerating(null) }
  }

  const handleCsv = async () => {
    setGenerating('csv')
    try {
      const rows = [
        ...(kpis?.revenueByMonth ?? []),
        ...(kpis?.topProducts ?? []),
        ...(kpis?.revenueByRegion ?? []),
      ]
      const blob = await reportService.exportCsv(rows, title)
      triggerDownload(blob, `${title.replace(/\s+/g, '_')}.csv`)
    } finally { setGenerating(null) }
  }

  const handleExcel = async () => {
    setGenerating('excel')
    try {
      const data = [
        ...(kpis?.revenueByMonth ?? []),
        ...(kpis?.topProducts ?? []),
        ...(kpis?.revenueByRegion ?? []),
      ]
      const blob = await reportService.exportExcel(data, kpis, title)
      triggerDownload(blob, `${title.replace(/\s+/g, '_')}.xlsx`)
    } finally { setGenerating(null) }
  }

  const FORMATS = [
    {
      key: 'pdf' as ExportFormat,
      icon: <FileText size={18} className="text-red-500" />,
      color: 'bg-red-50 dark:bg-red-900/20',
      label: 'PDF Report',
      desc: 'KPI Summary + AI Insights + Recommendations',
      ext: 'PDF',
      action: handlePdf,
    },
    {
      key: 'csv' as ExportFormat,
      icon: <Table2 size={18} className="text-green-600" />,
      color: 'bg-green-50 dark:bg-green-900/20',
      label: 'CSV Export',
      desc: 'Raw data export — revenue trend, products, regions',
      ext: 'CSV',
      action: handleCsv,
    },
    {
      key: 'excel' as ExportFormat,
      icon: <Sheet size={18} className="text-emerald-600" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      label: 'Excel Report',
      desc: 'Formatted spreadsheet with KPI summary + data sheets',
      ext: 'XLSX',
      action: handleExcel,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-gray-500">Generate downloadable reports in PDF, CSV, and Excel formats</p>
      </div>

      {/* Report title input */}
      <div className="card max-w-xl">
        <label className="block text-sm font-medium mb-1">Report Title</label>
        <input className="input w-full" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FORMATS.map(f => (
          <div key={f.key} className="card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${f.color}`}>{f.icon}</div>
              <div>
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full w-fit">
              .{f.ext}
            </span>
            <button
              onClick={f.action}
              disabled={generating !== null}
              className="btn-primary flex items-center gap-2 mt-auto">
              {generating === f.key
                ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                : <><Download size={14} /> Download {f.ext}</>}
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">📌 Report Contents</p>
        <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
          <li>• PDF — Executive KPI summary, key findings, growth drivers, risks, AI recommendations</li>
          <li>• CSV — Revenue trend, top products, regional breakdown (raw data)</li>
          <li>• Excel — KPI summary sheet + data sheet with formatted headers</li>
        </ul>
      </div>
    </div>
  )
}
