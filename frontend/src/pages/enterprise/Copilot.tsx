import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Brain, Send, Loader2, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react'
import { copilotService, dashboardService, forecastService, anomalyService } from '../../services/dataService'
import type { CopilotResponse } from '../../types'
import clsx from 'clsx'

const SUGGESTIONS = [
  'Why is revenue declining?',
  'What are the major business risks?',
  'Which products need immediate attention?',
  'What growth opportunities exist?',
  'Generate a full executive briefing',
]

interface Message { id: string; role: 'user' | 'assistant'; text?: string; response?: CopilotResponse }

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: kpis } = useQuery({ queryKey: ['kpis', {}], queryFn: () => dashboardService.getKpis(), staleTime: 60_000 })
  const { data: forecast } = useQuery({ queryKey: ['forecast', 'revenue', 30], queryFn: () => forecastService.get('revenue', 30), staleTime: 300_000 })
  const { data: anomalyData } = useQuery({ queryKey: ['anomalies'], queryFn: anomalyService.detect, staleTime: 120_000 })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (question: string) => {
    if (!question.trim() || loading) return
    setInput('')
    setLoading(true)
    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', text: question }])

    try {
      const context = {
        kpis: kpis ?? {},
        forecasts: forecast ?? {},
        anomalies: anomalyData?.anomalies ?? [],
        trends: kpis?.revenueByMonth ?? [],
      }
      const response: CopilotResponse = question.toLowerCase().includes('briefing')
        ? await copilotService.briefing(context)
        : await copilotService.ask(question, context)

      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', response }])
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Copilot temporarily unavailable.' }])
    } finally { setLoading(false) }
  }

  const priorityColor = (p: string) => p === 'HIGH' ? 'text-red-600 bg-red-50' : p === 'MEDIUM' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Executive AI Copilot</h1>
        <p className="text-sm text-gray-500">Strategic business advisor powered by your live data</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Brain size={44} className="mx-auto text-blue-400 mb-3" />
            <h2 className="font-semibold text-lg mb-1">Ask your strategic advisor</h2>
            <p className="text-gray-400 text-sm mb-6">Combines KPIs, forecasts, anomalies and trends into executive-level answers</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-sm px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'user'
              ? <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm">{msg.text}</div>
              : <div className="max-w-4xl w-full space-y-3">
                  {msg.text && <div className="card text-sm text-gray-500">{msg.text}</div>}
                  {msg.response && (
                    <div className="card space-y-4">
                      {/* Executive Summary */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2"><Brain size={14} className="text-blue-600" /><span className="text-sm font-semibold text-blue-700">Executive Summary</span></div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{msg.response.executive_summary}</p>
                      </div>

                      {/* Answer */}
                      <p className="text-sm text-gray-700 dark:text-gray-300">{msg.response.answer}</p>

                      {/* Key Metrics */}
                      {msg.response.key_metrics?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><TrendingUp size={12} />Key Metrics</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {msg.response.key_metrics.map((m, i) => (
                              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg">
                                <p className="text-xs text-gray-500">{m.metric}</p>
                                <p className="font-bold text-sm">{m.value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{m.significance}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strategic Recommendations */}
                      {msg.response.strategic_recommendations?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Target size={12} />Strategic Recommendations</p>
                          <div className="space-y-2">
                            {msg.response.strategic_recommendations.map((r, i) => (
                              <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium shrink-0', priorityColor(r.priority))}>{r.priority}</span>
                                <div>
                                  <p className="text-sm font-medium">{r.action}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{r.expected_impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risks & Opportunities */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {msg.response.risks?.length > 0 && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1"><AlertTriangle size={12} />Risks</p>
                            {msg.response.risks.map((r, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400 mb-1">• {r}</p>)}
                          </div>
                        )}
                        {msg.response.opportunities?.length > 0 && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><Lightbulb size={12} />Opportunities</p>
                            {msg.response.opportunities.map((o, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400 mb-1">• {o}</p>)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
            }
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Analyzing business data…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
          <input className="input flex-1" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask a strategic question… e.g. 'Why is revenue declining?'" disabled={loading} />
          <button type="submit" className="btn-primary flex items-center gap-1.5" disabled={loading || !input.trim()}>
            <Send size={14} /> Ask
          </button>
        </form>
      </div>
    </div>
  )
}
