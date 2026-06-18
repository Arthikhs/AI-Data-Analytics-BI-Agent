import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart2, MessageSquare, TrendingUp, AlertTriangle, FileText, Moon, Sun, LogOut } from 'lucide-react'
import { useAuthStore, useThemeStore } from '../store'
import clsx from 'clsx'

const NAV = [
  { to: '/',           icon: BarChart2,    label: 'Dashboard'  },
  { to: '/chat',       icon: MessageSquare, label: 'Ask AI'    },
  { to: '/forecast',   icon: TrendingUp,   label: 'Forecast'   },
  { to: '/anomalies',  icon: AlertTriangle, label: 'Anomalies' },
  { to: '/reports',    icon: FileText,      label: 'Reports'   },
]

export function Sidebar() {
  const { username, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">AI BI Agent</p>
            <p className="text-xs text-gray-400">Analytics Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <p className="px-3 text-xs text-gray-400 truncate">Signed in as <span className="font-medium">{username}</span></p>
        <button onClick={toggle} className="btn-ghost w-full flex items-center gap-3 text-sm">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="btn-ghost w-full flex items-center gap-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut size={15} />Logout
        </button>
      </div>
    </aside>
  )
}
