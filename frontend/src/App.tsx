import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Forecast from './pages/Forecast'
import Anomalies from './pages/Anomalies'
import Reports from './pages/Reports'
import SchemaIntelligence from './pages/enterprise/SchemaIntelligence'
import QueryHistory from './pages/enterprise/QueryHistory'
import DataQuality from './pages/enterprise/DataQuality'
import Copilot from './pages/enterprise/Copilot'
import Benchmarking from './pages/enterprise/Benchmarking'
import AlertsPage from './pages/enterprise/AlertsPage'
import ScheduledReports from './pages/enterprise/ScheduledReports'
import SecurityPolicies from './pages/enterprise/SecurityPolicies'
import Observability from './pages/enterprise/Observability'
import { useAuthStore } from './store'

const qc = new QueryClient()

function ProtectedLayout() {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 p-6 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/"                element={<Dashboard />} />
            <Route path="/chat"            element={<Chat />} />
            <Route path="/forecast"        element={<Forecast />} />
            <Route path="/anomalies"       element={<Anomalies />} />
            <Route path="/reports"         element={<Reports />} />
            <Route path="/schema"          element={<SchemaIntelligence />} />
            <Route path="/history"         element={<QueryHistory />} />
            <Route path="/data-quality"    element={<DataQuality />} />
            <Route path="/copilot"         element={<Copilot />} />
            <Route path="/benchmarking"    element={<Benchmarking />} />
            <Route path="/alerts"          element={<AlertsPage />} />
            <Route path="/schedules"       element={<ScheduledReports />} />
            <Route path="/security"        element={<SecurityPolicies />} />
            <Route path="/observability"   element={<Observability />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
