import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Code2, BarChart2, Loader2 } from 'lucide-react'
import { DynamicChart } from '../components/DynamicChart'
import { queryService, insightService } from '../services/dataService'
import type { QueryResult, InsightData } from '../types'
import clsx from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text?: string
  result?: QueryResult
  insights?: InsightData
}

const SUGGESTIONS = [
  'Show top 10 products by revenue',
  'Revenue trend for last 12 months',
  'Top customers by lifetime value',
  'Compare sales by region',
  'Which payment method is most popular?',
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const [dataset, setDataset] = useState('ecommerce')
  const [showSql, setShowSql] = useState<Record<string, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (question: string) => {
    if (!question.trim() || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: question }
    setMessages(prev => [...prev, userMsg])

    try {
      const result = await queryService.run(question, dataset, sessionId)
      if (!sessionId) setSessionId(result.sessionId)

      let insights: InsightData | undefined
      if (result.success && result.data.length > 0) {
        try { insights = await insightService.generate(question, result.data) } catch {}
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        result,
        insights,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Ask AI</h1>
          <p className="text-sm text-gray-500">Natural language analytics — ask anything about your data</p>
        </div>
        <select className="input w-auto" value={dataset} onChange={e => setDataset(e.target.value)}>
          <option value="ecommerce">E-Commerce</option>
          <option value="banking">Banking</option>
          <option value="logistics">Logistics</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <Sparkles size={40} className="mx-auto text-blue-400 mb-3" />
            <h2 className="font-semibold text-lg mb-1">What would you like to analyze?</h2>
            <p className="text-gray-400 text-sm mb-6">Ask questions in plain English. The AI will query your database.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-sm px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'user' ? (
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-4xl w-full space-y-3">
                {msg.text && (
                  <div className="card text-sm text-gray-600 dark:text-gray-400">{msg.text}</div>
                )}
                {msg.result && (
                  <div className="card space-y-4">
                    {/* SQL Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <BarChart2 size={14} />
                        <span>{msg.result.rowCount} rows</span>
                        <span>·</span>
                        <span>{msg.result.executionTimeMs}ms</span>
                      </div>
                      <button onClick={() => setShowSql(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                        className="btn-ghost text-xs flex items-center gap-1">
                        <Code2 size={13} /> {showSql[msg.id] ? 'Hide SQL' : 'View SQL'}
                      </button>
                    </div>

                    {showSql[msg.id] && (
                      <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">
                        {msg.result.generatedSql}
                      </pre>
                    )}

                    {/* Chart */}
                    {msg.result.data.length > 0 && (
                      <DynamicChart type={msg.result.chartType ?? 'bar'} data={msg.result.data} height={280} />
                    )}

                    {/* Data table (first 5 rows) */}
                    {msg.result.data.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              {Object.keys(msg.result.data[0]).map(k => (
                                <th key={k} className="text-left py-1.5 px-2 text-gray-400 font-medium">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.result.data.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                                {Object.values(row).map((v, j) => (
                                  <td key={j} className="py-1.5 px-2">{String(v ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {msg.result.rowCount > 5 && (
                          <p className="text-xs text-gray-400 mt-1 px-2">
                            Showing 5 of {msg.result.rowCount} rows
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Insights */}
                {msg.insights && (
                  <div className="card border-l-4 border-blue-500 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-blue-500" />
                      <span className="text-sm font-semibold">AI Insights</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{msg.insights.summary}</p>
                    {msg.insights.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Recommendations</p>
                        <ul className="space-y-1">
                          {msg.insights.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                              <span className="text-blue-500 mt-0.5">→</span><span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Analyzing your question…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <form onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a business question… e.g. 'Show revenue by region for Q4'"
            disabled={loading}
          />
          <button type="submit" className="btn-primary flex items-center gap-1.5" disabled={loading || !input.trim()}>
            <Send size={14} /> Send
          </button>
        </form>
      </div>
    </div>
  )
}
