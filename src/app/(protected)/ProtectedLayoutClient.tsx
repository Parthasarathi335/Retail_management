'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { 
  Cake, LayoutDashboard, CalendarDays, ClipboardList, 
  CircleDollarSign, LogOut, ShieldCheck, UserCheck, Menu, X
} from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard / Orders', icon: LayoutDashboard },
  { href: '/calendar', label: 'Baking Calendar', icon: CalendarDays },
  { href: '/records', label: 'Order Records', icon: ClipboardList },
  { href: '/earned', label: 'Revenue & Earned', icon: CircleDollarSign },
]

export default function ProtectedLayoutClient({
  children,
  userEmail
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-amber-950 text-amber-50 px-4 py-3 flex items-center justify-between border-b border-amber-900 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center text-amber-300">
            <Cake className="w-5 h-5" />
          </div>
          <span className="font-bold font-serif text-base tracking-tight">CakeZone</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-amber-200 hover:text-white rounded-lg bg-amber-900/60 transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-amber-950 text-amber-100 flex flex-col justify-between
        border-r border-amber-900 transition-transform duration-300 transform
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-2xl md:shadow-none
      `}>
        {/* Brand */}
        <div>
          <div className="p-5 border-b border-amber-900/60 hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-800/80 rounded-lg flex items-center justify-center text-amber-300 shadow">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-amber-50 font-serif leading-tight tracking-tight">CakeZone</h1>
              <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin Studio
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 text-sm font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-amber-800 text-amber-50 font-semibold shadow-sm ring-1 ring-amber-700'
                      : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-amber-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-amber-400'}`} />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-300" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User & Logout */}
        <div className="p-4 border-t border-amber-900/60 space-y-3">
          <div className="flex items-center gap-2.5 px-2 text-xs text-amber-300">
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <p className="font-medium text-amber-100 truncate">{userEmail}</p>
              <p className="text-[10px] text-amber-400/80 uppercase tracking-wider">Administrator</p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-900/80 hover:bg-rose-900/80 text-amber-100 hover:text-rose-100 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm border border-amber-800 hover:border-rose-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Secure Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
              <Cake className="w-3.5 h-3.5 text-amber-800" />
            </div>
            <h2 className="text-xs font-bold text-gray-600 tracking-wider uppercase">
              Private Admin Cake Order Management System
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Session Active
          </span>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
