'use client'

import { useState, useEffect, useMemo } from 'react'
import { Order } from '@/types/order'
import { fetchOrdersFromSupabase } from '@/lib/orders/actions'
import OrderDetailsModal from '@/components/orders/OrderDetailsModal'
import { LoadingState, ErrorState, SetupNotice } from '@/components/orders/StateViews'
import { 
  CircleDollarSign, CheckCircle2, Clock, TrendingUp,
  Calendar, Eye, RefreshCw, Sparkles, BarChart3, FileCheck, PackageCheck
} from 'lucide-react'

export default function EarnedPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const currentMonthStr = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthStr)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const loadOrders = async () => {
    setLoading(true)
    const result = await fetchOrdersFromSupabase()
    setOrders(result.data)
    setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders()
  }, [])

  // Only DELIVERED orders count as completed sales.
  const deliveredOrders = useMemo(() => orders.filter(o => o.order_status === 'Delivered'), [orders])

  // All-Time Summary Cards (delivered sales only; cancelled orders are excluded)
  const overallMetrics = useMemo(() => {
    const totalSales = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
    const totalCollected = deliveredOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0)
    const totalPendingAmount = orders
      .filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled')
      .reduce((sum, o) => {
        const paid = Number(o.paid_amount) || 0
        const total = Number(o.total_amount) || 0
        return sum + Math.max(total - paid, 0)
      }, 0)
    return {
      totalDeliveredOrders: deliveredOrders.length,
      totalCakesDelivered: deliveredOrders.reduce((sum, o) => sum + (Number(o.quantity) || 1), 0),
      totalCakesKg: deliveredOrders.reduce((sum, o) => sum + (Number(o.weight_kg) || 0), 0),
      totalSales,
      totalCollected,
      totalPendingAmount,
    }
  }, [deliveredOrders, orders])

  // Month options for dropdown
  const monthOptions = useMemo(() => {
    const s = new Set<string>()
    for (let m = 1; m <= 12; m++) {
      s.add(`${currentYear}-${String(m).padStart(2, '0')}`)
    }
    orders.forEach(o => { if (o.delivery_date) s.add(o.delivery_date.substring(0, 7)) })
    return Array.from(s).sort().reverse()
  }, [orders, currentYear])

  // Selected month delivered orders
  const selectedMonthOrders = useMemo(() =>
    deliveredOrders.filter(o => o.delivery_date?.startsWith(selectedMonthKey)),
    [deliveredOrders, selectedMonthKey]
  )

  // Selected month metrics
  const selectedMonthMetrics = useMemo(() => {
    const totalSales = selectedMonthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
    const collected = selectedMonthOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0)
    return {
      ordersCount: selectedMonthOrders.length,
      cakesCount: selectedMonthOrders.reduce((sum, o) => sum + (Number(o.quantity) || 1), 0),
      cakesKg: selectedMonthOrders.reduce((sum, o) => sum + (Number(o.weight_kg) || 0), 0),
      totalSales,
      collected,
      pending: Math.max(totalSales - collected, 0)
    }
  }, [selectedMonthOrders])

  // Annual monthly breakdown
  const annualBreakdown = useMemo(() => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return months.map((name, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`
      const monthOrders = deliveredOrders.filter(o => o.delivery_date?.startsWith(monthKey))
      return {
        monthKey, name,
        ordersCount: monthOrders.length,
        kgCount: monthOrders.reduce((sum, o) => sum + (Number(o.weight_kg) || 0), 0),
        revenue: monthOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0)
      }
    })
  }, [deliveredOrders, currentYear])

  const formatMonthLabel = (yyyyMm: string) => {
    try {
      const [y, m] = yyyyMm.split('-')
      return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } catch { return yyyyMm }
  }

  const maxRevenue = Math.max(...annualBreakdown.map(r => r.revenue), 1)

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Page Header */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full text-xs font-semibold text-amber-800 border border-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Bakery Financial Performance
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <CircleDollarSign className="w-7 h-7 text-amber-700" /> Revenue & Earned
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Delivered-order revenue, collections, and pending balances.
          </p>
        </div>
        <button onClick={loadOrders} className="px-4 py-2.5 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!isSupabaseConfigured && <SetupNotice />}
      {error && !loading && <ErrorState message={error} onRetry={loadOrders} />}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Delivered Orders', value: `${overallMetrics.totalDeliveredOrders}`, icon: FileCheck, color: 'bg-emerald-100 text-emerald-900' },
          { label: 'Cakes Delivered', value: `${overallMetrics.totalCakesDelivered} cakes`, icon: PackageCheck, color: 'bg-amber-100 text-amber-900' },
          { label: 'Total Sales', value: `$${overallMetrics.totalSales.toFixed(2)}`, icon: TrendingUp, color: 'bg-blue-100 text-blue-900' },
          { label: 'Total Collected', value: `$${overallMetrics.totalCollected.toFixed(2)}`, icon: CircleDollarSign, color: 'bg-emerald-100 text-emerald-900' },
          { label: 'Total Pending', value: `$${overallMetrics.totalPendingAmount.toFixed(2)}`, icon: Clock, color: 'bg-rose-100 text-rose-900' },
        ].map(m => (
          <div key={m.label} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
              <m.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider truncate">{m.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Selector & Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-7 space-y-6">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              Monthly Breakdown
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 mt-1">
              {formatMonthLabel(selectedMonthKey)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="px-4 py-2.5 text-sm bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold text-amber-950"
            >
              {monthOptions.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
            </select>
          </div>
        </div>

        {/* Monthly Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {[
            { label: 'Orders Delivered', value: selectedMonthMetrics.ordersCount.toString(), color: 'bg-amber-50/60 border-amber-100 text-amber-800', wide: false },
            { label: 'Cakes Delivered', value: `${selectedMonthMetrics.cakesCount}`, color: 'bg-amber-50/60 border-amber-100 text-amber-800', wide: false },
            { label: 'Total Sales', value: `$${selectedMonthMetrics.totalSales.toFixed(2)}`, color: 'bg-blue-50/60 border-blue-100 text-blue-800', wide: false },
            { label: 'Collected Revenue', value: `$${selectedMonthMetrics.collected.toFixed(2)}`, color: 'bg-emerald-50/60 border-emerald-100 text-emerald-800', wide: false },
            { label: 'Pending Amount', value: `$${selectedMonthMetrics.pending.toFixed(2)}`, color: 'bg-gray-50/60 border-gray-200 text-gray-600', wide: true },
          ].map(m => (
            <div key={m.label} className={`p-4 rounded-xl border ${m.color} ${m.wide ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}>
              <p className="text-[11px] font-semibold uppercase">{m.label}</p>
              <p className="text-xl font-bold font-mono mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Selected Month Orders Table */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 font-serif flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Delivered Orders — {formatMonthLabel(selectedMonthKey)}
          </h3>

          {loading ? (
            <LoadingState label="Loading earnings…" />
          ) : selectedMonthOrders.length === 0 ? (
            <div className="p-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
              No delivered orders in {formatMonthLabel(selectedMonthKey)}.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Cake</th>
                    <th className="px-4 py-3">KG</th>
                    <th className="px-4 py-3">Delivered</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {selectedMonthOrders.map(ord => {
                    const paid = Number(ord.paid_amount || 0)
                    const balance = Number(ord.total_amount) - paid
                    return (
                      <tr key={ord.id} className="hover:bg-amber-50/20 transition">
                        <td className="px-4 py-3 font-mono font-bold text-amber-950 text-xs">{ord.id}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 text-xs">{ord.customer_name}</td>
                        <td className="px-4 py-3 text-xs">{ord.cake_type}</td>
                        <td className="px-4 py-3 text-xs font-semibold">{ord.weight_kg} KG</td>
                        <td className="px-4 py-3 text-xs">{ord.delivery_date}</td>
                        <td className="px-4 py-3 font-mono font-bold text-xs">${Number(ord.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-xs">${paid.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-rose-600">${balance > 0 ? balance.toFixed(2) : '0.00'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { setSelectedOrder(ord); setIsDetailsOpen(true) }}
                            className="p-1 text-gray-500 hover:text-amber-800 hover:bg-amber-100 rounded transition">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Annual Monthly Performance Table + Visual Bars */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-700" /> {currentYear} Annual Performance
            </h3>
            <p className="text-xs text-gray-500">Month-by-month collected revenue from delivered orders.</p>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Year {currentYear}</span>
        </div>

        <div className="space-y-2">
          {annualBreakdown.map(row => (
            <div key={row.monthKey} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600 w-24 shrink-0">{row.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-5 bg-amber-700/80 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                >
                  {row.revenue > 0 && (
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">
                      ${row.revenue.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gray-800 w-20 text-right shrink-0">
                {row.ordersCount > 0 ? `${row.ordersCount} orders` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
      />
    </div>
  )
}