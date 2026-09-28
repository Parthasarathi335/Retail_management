'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Order, OrderStatus } from '@/types/order'
import { fetchCalendarOrdersFromSupabase } from '@/lib/orders/actions'
import OrderDetailsModal from '@/components/orders/OrderDetailsModal'
import { LoadingState, ErrorState, SetupNotice } from '@/components/orders/StateViews'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Cake, 
  Phone, 
  MapPin, 
  Eye, 
  Sparkles, 
  RefreshCw
} from 'lucide-react'

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export default function CalendarPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date selection state
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  // Details modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const loadOrders = useCallback(async () => {
    setLoading(true)
    const result = await fetchCalendarOrdersFromSupabase(monthKey)
    setOrders(result.data)
    setError(result.error)
    setLoading(false)
  }, [monthKey])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders()
  }, [loadOrders])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDateKey(now.toISOString().split('T')[0])
  }

  // Days calculation for current month grid
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sun

  // Map orders by delivery date key
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {}
    orders.forEach(order => {
      if (!map[order.delivery_date]) {
        map[order.delivery_date] = []
      }
      map[order.delivery_date].push(order)
    })
    return map
  }, [orders])

  // If the selected date is not in the current month, fall back to the first day
  useEffect(() => {
    if (!selectedDateKey.startsWith(monthKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDateKey(formatDateKey(year, month, 1))
    }
  }, [monthKey, selectedDateKey, year, month])

  // Get orders for the selected date
  const selectedDateOrders = useMemo(() => {
    return ordersByDate[selectedDateKey] || []
  }, [ordersByDate, selectedDateKey])

  // Selected date financial & cake summary metrics
  const selectedDateSummary = useMemo(() => {
    const totalOrders = selectedDateOrders.length
    const totalKg = selectedDateOrders.reduce((sum, o) => sum + (Number(o.weight_kg) || 0), 0)
    const totalExpected = selectedDateOrders
      .filter(o => o.order_status !== 'Cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0)

    const collectedAmount = selectedDateOrders
      .filter(o => o.order_status === 'Delivered' || o.order_status === 'Ready')
      .reduce((sum, o) => sum + Number(o.total_amount), 0)

    const pendingAmount = totalExpected - collectedAmount

    return {
      totalOrders,
      totalKg,
      totalExpected,
      collectedAmount,
      pendingAmount
    }
  }, [selectedDateOrders])

  // Workload level styling helper
  const getWorkloadInfo = (count: number) => {
    if (count === 0) return { label: 'FREE', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', cellBg: 'hover:bg-amber-50/50' }
    if (count <= 2) return { label: 'LOW', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold', cellBg: 'bg-amber-50/40 hover:bg-amber-100/60' }
    if (count <= 4) return { label: 'BUSY', badgeBg: 'bg-orange-100 text-orange-950 border-orange-300 font-bold', cellBg: 'bg-orange-50/60 hover:bg-orange-100/80' }
    return { label: 'VERY BUSY', badgeBg: 'bg-rose-100 text-rose-950 border-rose-300 font-bold', cellBg: 'bg-rose-50/70 hover:bg-rose-100/90' }
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'New': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'In Progress': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Delivered': return 'bg-gray-100 text-gray-700 border-gray-200 line-through opacity-75'
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format header date string
  const formatSelectedHeaderDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full text-xs font-semibold text-amber-800 border border-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Live Supabase Workload View
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-amber-700" /> Baking & Delivery Calendar
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Visual daily baking capacity, scheduled cake deliveries, and date financial breakdown.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="px-4 py-2.5 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {!isSupabaseConfigured && <SetupNotice />}
      {error && !loading && <ErrorState message={error} onRetry={loadOrders} />}

      {/* Calendar Card Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        
        {/* Month Header Controls */}
        <div className="p-4 sm:p-6 bg-amber-950 text-amber-50 flex flex-wrap items-center justify-between gap-4 border-b border-amber-900">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-wide text-amber-50">
              {monthNames[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 hover:text-white transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-xs font-bold text-amber-100 transition border border-amber-700"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 hover:text-white transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workload Legend Bar */}
        <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">Workload Capacity Legend:</span>
          <div className="flex items-center gap-3 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Free (0)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Light (1-2)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Busy (3-4)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Very Busy (5+)</span>
          </div>
        </div>

        {/* Calendar Days Header */}
        <div className="grid grid-cols-7 text-center bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {loading ? (
          <LoadingState label={`Loading ${monthNames[month]} schedule…`} />
        ) : (
          <>
            {/* Month Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 text-sm">
              
              {/* Blank padding cells before day 1 */}
              {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                <div key={`blank-${index}`} className="min-h-[75px] sm:min-h-[95px] bg-gray-50/40" />
              ))}

              {/* Actual Month Days */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNum = index + 1
                const dateKey = formatDateKey(year, month, dayNum)
                const dayOrders = ordersByDate[dateKey] || []
                const orderCount = dayOrders.length
                
                const isSelected = selectedDateKey === dateKey
                const isToday = new Date().toISOString().split('T')[0] === dateKey
                const workload = getWorkloadInfo(orderCount)

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDateKey(dateKey)}
                    className={`
                      min-h-[80px] sm:min-h-[105px] p-1.5 sm:p-2.5 cursor-pointer transition flex flex-col justify-between relative group
                      ${workload.cellBg}
                      ${isSelected ? 'ring-2 ring-amber-800 ring-inset bg-amber-100/70' : ''}
                    `}
                  >
                    {/* Top Row: Date Number */}
                    <div className="flex items-center justify-between">
                      <span className={`
                        w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition
                        ${isToday ? 'bg-amber-900 text-amber-50 shadow-sm' : isSelected ? 'bg-amber-800 text-white' : 'text-gray-800'}
                      `}>
                        {dayNum}
                      </span>

                      {orderCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${workload.badgeBg}`}>
                          {workload.label}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Workload indicator badge */}
                    <div className="mt-2 space-y-1">
                      {orderCount > 0 ? (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-gray-900 flex items-center gap-1">
                            <Cake className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>{orderCount} {orderCount === 1 ? 'Order' : 'Orders'}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium truncate hidden sm:block">
                            {dayOrders.map(o => o.customer_name).slice(0, 1).join(', ')}{orderCount > 1 ? ` +${orderCount - 1} more` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-normal italic hidden sm:inline-block">
                          Free Day
                        </span>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      {/* Selected Date Summary & Order List Below Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden space-y-6 p-5 sm:p-7">
        
        {/* Selected Date Overview Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              Selected Baking Date
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 mt-1">
              {formatSelectedHeaderDate(selectedDateKey)}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${getWorkloadInfo(selectedDateSummary.totalOrders).badgeBg}`}>
              Workload Level: {getWorkloadInfo(selectedDateSummary.totalOrders).label}
            </span>
          </div>
        </div>

        {/* Date Financial Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 text-amber-950">
            <p className="text-[11px] font-semibold uppercase text-amber-800">Total Orders</p>
            <p className="text-xl font-bold font-mono mt-0.5">{selectedDateSummary.totalOrders}</p>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 text-amber-950">
            <p className="text-[11px] font-semibold uppercase text-amber-800">Total Cake KG</p>
            <p className="text-xl font-bold font-mono mt-0.5">{selectedDateSummary.totalKg.toFixed(1)} KG</p>
          </div>

          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-blue-950">
            <p className="text-[11px] font-semibold uppercase text-blue-800">Total Expected</p>
            <p className="text-xl font-bold font-mono mt-0.5">${selectedDateSummary.totalExpected.toFixed(2)}</p>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-emerald-950">
            <p className="text-[11px] font-semibold uppercase text-emerald-800">Collected / Ready</p>
            <p className="text-xl font-bold font-mono mt-0.5">${selectedDateSummary.collectedAmount.toFixed(2)}</p>
          </div>

          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 text-rose-950 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase text-rose-800">Pending Balance</p>
            <p className="text-xl font-bold font-mono mt-0.5">${selectedDateSummary.pendingAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Selected Date Orders List */}
        <div className="space-y-4 pt-2">
          <h4 className="font-bold text-gray-800 text-base font-serif flex items-center gap-2">
            <Cake className="w-5 h-5 text-amber-700" /> Scheduled Orders for {selectedDateKey}
          </h4>

          {selectedDateOrders.length === 0 ? (
            <div className="p-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
              No cake orders scheduled for this date.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:border-amber-300 transition space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-950 bg-amber-100 px-2.5 py-1 rounded border border-amber-200">
                      {ord.id}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(ord.order_status)}`}>
                      {ord.order_status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-900 text-base">{ord.customer_name}</h5>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-700" /> {ord.phone_number}
                    </p>
                  </div>

                  <div className="bg-amber-50/50 p-3 rounded-lg space-y-1 text-xs text-gray-700 border border-amber-100">
                    <p className="font-semibold text-gray-900">{ord.cake_type} ({ord.weight_kg} KG)</p>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" /> Delivery Time: <strong>{ord.delivery_time}</strong>
                    </p>
                    <p className="text-gray-600 flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" /> {ord.delivery_address}
                    </p>
                  </div>

                  {ord.cake_message && (
                    <p className="text-xs text-amber-900 italic bg-amber-50/80 px-2.5 py-1.5 rounded border border-amber-100">
                      &quot;{ord.cake_message}&quot;
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Order Amount:</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-700 text-base font-mono">${Number(ord.total_amount).toFixed(2)}</span>
                      <button
                        onClick={() => {
                          setSelectedOrder(ord)
                          setIsDetailsOpen(true)
                        }}
                        className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
      />

    </div>
  )
}