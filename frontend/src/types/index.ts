export interface KpiData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  grossProfit: number
  revenueGrowthPct: number
  totalCustomers: number
  newCustomers: number
  churnRate: number
  customerLifetimeValue: number
  revenueByMonth: DataPoint[]
  topProducts: ProductData[]
  topCustomers: CustomerData[]
  revenueByRegion: RegionData[]
  revenueByCategory: CategoryData[]
}

export interface DataPoint { month: string; revenue: number; orders: number }
export interface ProductData { product_name: string; revenue: number; units_sold: number }
export interface CustomerData { customer_name: string; segment: string; total_revenue: number; total_orders: number }
export interface RegionData { region: string; revenue: number; orders: number }
export interface CategoryData { category_name: string; revenue: number; units_sold: number }

export interface QueryResult {
  sessionId: string
  question: string
  generatedSql: string
  data: Record<string, unknown>[]
  rowCount: number
  executionTimeMs: number
  chartType: string
  success: boolean
  error?: string
}

export interface InsightData {
  summary: string
  keyFindings: string[]
  growthDrivers: string[]
  risks: string[]
  opportunities: string[]
  recommendations: string[]
}

export interface ForecastPoint { date: string; value: number; lower: number; upper: number }
export interface ForecastData {
  metric: string
  forecast: ForecastPoint[]
  model_used: string
  recommendations: string[]
}

export interface AnomalyItem {
  date: string
  type: string
  actual: number
  expected: number
  z_score: number
  severity: 'high' | 'medium' | 'low'
  recommendation: string
}

// ─── Enterprise Types ──────────────────────────────────────────────────────────

export interface SchemaColumn {
  name: string; type: string; nullable: boolean; is_primary_key: boolean; default?: string
}
export interface SchemaFK { column: string; references_table: string; references_column: string }
export interface SchemaTable {
  columns: SchemaColumn[]; foreign_keys: SchemaFK[]; row_count: number; indexes: string[]
}
export interface SchemaMetadata {
  dataset: string
  tables: Record<string, SchemaTable>
  relationships: Array<{ from_table: string; from_column: string; to_table: string; to_column: string; type: string }>
}
export interface GlossaryTerm { term: string; business_meaning: string; example: string }
export interface BusinessGlossary { dataset: string; glossary: GlossaryTerm[]; dataset_summary: string }

export interface SqlExplanation {
  summary: string; tables_used: string[]; joins: string[]; aggregations: string[]
  filters: string[]; sorting: string; business_interpretation: string
  complexity: string; execution_time_ms: number; row_count: number
  has_aggregation: boolean; has_join: boolean; has_subquery: boolean
}

export interface HistoryEntry {
  id: string; username: string; question: string; sql: string; dataset: string
  row_count: number; execution_time_ms: number; chart_type: string
  is_favorite: boolean; created_at: string
}

export interface DataQualityTable {
  total_rows: number; column_count: number; duplicate_rows: number
  completeness_pct: number; uniqueness_pct: number; health_score: number
  null_stats: Record<string, { null_count: number; null_pct: number }>
  outliers: Record<string, number>
}
export interface DataQualityReport {
  dataset: string; overall_health_score: number
  tables: Record<string, DataQualityTable>
  ai_recommendations: string[]; critical_issues: string[]; health_summary: string
}

export interface CopilotRecommendation { priority: 'HIGH' | 'MEDIUM' | 'LOW'; action: string; expected_impact: string }
export interface CopilotResponse {
  answer: string
  key_metrics: Array<{ metric: string; value: string; significance: string }>
  root_causes: string[]
  strategic_recommendations: CopilotRecommendation[]
  risks: string[]; opportunities: string[]; executive_summary: string
}

export interface BenchmarkPeriod {
  month?: string; quarter?: string; year?: number
  revenue: number; orders: number; revenue_prev?: number; variance_pct?: number
}
export interface BenchmarkInsight { trend_explanation: string; key_drivers: string[]; outlook: string; recommendation: string }
export interface BenchmarkResult {
  comparison_type: string
  periods?: BenchmarkPeriod[]
  data?: Record<string, unknown>[]
  insight: BenchmarkInsight
}

export interface AlertRule {
  id: string; name: string; metric: string; condition: string
  threshold: number; severity: string; message: string; enabled?: boolean
}
export interface AlertNotification {
  id: string; name: string; severity: string; message: string
  actual_value: number; threshold: number; triggered_at: string
  notification_id: string; read?: boolean
}

export interface ReportSchedule {
  id: string; name: string; frequency: string; report_type: string
  recipients: string[]; enabled: boolean; created_at: string
  last_run: string | null; next_run: string; username: string
}

export interface RlsPolicy {
  datasets: string[]; region_filter: string | null; column_masks: string[]
}

export interface ObservabilityMetric { timestamp: string; value: number; labels: Record<string, string> }
export interface ObservabilitySummary {
  api_latency_avg_ms: number; api_latency_p95_ms: number
  sql_latency_avg_ms: number; sql_latency_p95_ms: number
  ai_latency_avg_ms: number; ai_latency_p95_ms: number
  forecast_latency_avg_ms: number; cache_hit_ratio_pct: number
  cache_hits: number; cache_misses: number; total_errors: number
  recent_errors: ObservabilityMetric[]; recent_api_calls: ObservabilityMetric[]
}
