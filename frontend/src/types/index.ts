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
