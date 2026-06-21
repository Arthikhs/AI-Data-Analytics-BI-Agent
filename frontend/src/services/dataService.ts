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
  get: (metric = 'revenue', periods = 30, dataset = 'ecommerce') =>
    api.post<ForecastData>('/forecast', { metric, periods, dataset }).then(r => r.data),
}

export const anomalyService = {
  detect: (dataset = 'all') => api.get('/anomaly', { params: { dataset } }).then(r => r.data),
}

export const reportService = {
  generatePdf: (kpis: unknown, insights: unknown, title: string) =>
    api.post('/reports/generate', { kpis, insights, title }, { responseType: 'blob' }).then(r => r.data),

  exportCsv: (data: unknown[], filename: string) =>
    api.post('/reports/export/csv', { data, filename }, { responseType: 'blob' }).then(r => r.data),

  exportExcel: (data: unknown[], kpis: unknown, filename: string) =>
    api.post('/reports/export/excel', { data, kpis, filename, sheet_name: 'Analytics Data' }, { responseType: 'blob' }).then(r => r.data),
}

// ─── Enterprise Services ──────────────────────────────────────────────────────────
const E = '/enterprise'

export const schemaService = {
  discover: (dataset = 'ecommerce') => api.get(`${E}/schema/discover`, { params: { dataset } }).then(r => r.data),
  glossary: (dataset = 'ecommerce') => api.get(`${E}/schema/glossary`, { params: { dataset } }).then(r => r.data),
}

export const sqlExplainService = {
  explain: (sql: string, execution_time_ms = 0, row_count = 0) =>
    api.post(`${E}/query/explain`, { sql, execution_time_ms, row_count }).then(r => r.data),
}

export const historyService = {
  save: (data: object) => api.post(`${E}/history/save`, data).then(r => r.data),
  get: (username: string, limit = 50, search = '') =>
    api.get(`${E}/history/${username}`, { params: { limit, search } }).then(r => r.data),
  favorite: (username: string, entryId: string) =>
    api.post(`${E}/history/${username}/favorite/${entryId}`).then(r => r.data),
  getFavorites: (username: string) => api.get(`${E}/history/${username}/favorites`).then(r => r.data),
  delete: (username: string, entryId: string) => api.delete(`${E}/history/${username}/${entryId}`).then(r => r.data),
}

export const dataQualityService = {
  check: (dataset = 'ecommerce') => api.get(`${E}/data-quality`, { params: { dataset } }).then(r => r.data),
}

export const copilotService = {
  ask: (question: string, context: object) => api.post(`${E}/copilot/ask`, { question, context }).then(r => r.data),
  briefing: (context: object) => api.post(`${E}/copilot/briefing`, context).then(r => r.data),
}

export const benchmarkService = {
  mom: (region?: string) => api.get(`${E}/benchmark/mom`, { params: region ? { region } : {} }).then(r => r.data),
  qoq: (region?: string) => api.get(`${E}/benchmark/qoq`, { params: region ? { region } : {} }).then(r => r.data),
  yoy: () => api.get(`${E}/benchmark/yoy`).then(r => r.data),
  region: (params?: object) => api.get(`${E}/benchmark/region`, { params }).then(r => r.data),
  segment: (params?: object) => api.get(`${E}/benchmark/segment`, { params }).then(r => r.data),
}

export const alertService = {
  evaluate: (kpis: object, anomaly_count: number, username: string) =>
    api.post(`${E}/alerts/evaluate`, { kpis, anomaly_count, username }).then(r => r.data),
  notifications: (username: string, unread_only = false) =>
    api.get(`${E}/alerts/notifications/${username}`, { params: { unread_only } }).then(r => r.data),
  getRules: (username: string) => api.get(`${E}/alerts/rules/${username}`).then(r => r.data),
  saveRules: (username: string, rules: object[]) =>
    api.post(`${E}/alerts/rules`, { username, rules }).then(r => r.data),
  markRead: (username: string, notification_ids: string[]) =>
    api.post(`${E}/alerts/mark-read`, { username, notification_ids }).then(r => r.data),
}

export const scheduleService = {
  list: (username: string) => api.get(`${E}/schedules/${username}`).then(r => r.data),
  create: (data: object) => api.post(`${E}/schedules`, data).then(r => r.data),
  update: (data: object) => api.put(`${E}/schedules`, data).then(r => r.data),
  delete: (username: string, scheduleId: string) =>
    api.delete(`${E}/schedules/${username}/${scheduleId}`).then(r => r.data),
  downloads: (username: string) => api.get(`${E}/schedules/${username}/downloads`).then(r => r.data),
}

export const rlsService = {
  policies: () => api.get(`${E}/rls/policies`).then(r => r.data),
  getPolicy: (role: string) => api.get(`${E}/rls/policy/${role}`).then(r => r.data),
  savePolicy: (role: string, policy: object) => api.post(`${E}/rls/policy`, { role, policy }).then(r => r.data),
  checkAccess: (role: string, dataset: string) =>
    api.get(`${E}/rls/access`, { params: { role, dataset } }).then(r => r.data),
}

export const observabilityService = {
  summary: () => api.get(`${E}/observability/summary`).then(r => r.data),
  metrics: (metric_type: string, limit = 100) =>
    api.get(`${E}/observability/metrics/${metric_type}`, { params: { limit } }).then(r => r.data),
}
