import api from './api'
import type { KpiData, QueryResult, InsightData, ForecastData } from '../types'

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
}

export const dashboardService = {
  getKpis: (params?: Record<string, string>) =>
    api.get<KpiData>('/dashboard/kpis', { params }).then(r => r.data),
}

export const queryService = {
  run: (question: string, dataset: string, sessionId?: string) =>
    api.post<QueryResult>('/query/run', { question, dataset, sessionId }).then(r => r.data),

  generate: (question: string, dataset: string, sessionId?: string) =>
    api.post<{ sql: string; session_id: string }>('/query/generate', { question, dataset, sessionId }).then(r => r.data),
}

export const insightService = {
  generate: (question: string, data: unknown[]) =>
    api.post<InsightData>('/insights', { question, data }).then(r => r.data),
}

export const forecastService = {
  get: (metric = 'revenue', periods = 30) =>
    api.post<ForecastData>('/forecast', { metric, periods }).then(r => r.data),
}

export const anomalyService = {
  detect: () => api.get('/anomaly').then(r => r.data),
}

export const reportService = {
  generatePdf: (kpis: unknown, insights: unknown, title: string) =>
    api.post('/reports/generate', { kpis, insights, title }, { responseType: 'blob' }).then(r => r.data),
}
