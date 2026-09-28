'use client'

import { useState, useEffect, useMemo } from 'react'
import { Order } from '@/types/order'
import { fetchOrdersFromSupabase } from '@/lib/orders/actions'
import OrderDetailsModal from '@/components/orders/OrderDetailsModal'
import { LoadingState, ErrorState, EmptyState, SetupNotice } from '@/components/orders/StateViews'
import { 
  ClipboardList, Search, CheckCircle2,
  Cake, DollarSign, Phone, MapPin, Clock, Eye, RefreshCw,
  FileCheck
} from 'lucide-react'

function getPaymentBadge(status: string) {
  switch (status) {
    case 'Fully Paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Partially Paid': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Pending': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function RecordsPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [monthFilter, setMonthFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const loadOrders = async () => {
    setLoading(true)
    const result = await fetchOrdersFromSupabase()
    setAllOrders(result.data)
    setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders()
  }, [])

  const deliveredOrders = useMemo(() => {
    return allOrders.filter(o => o.order_status === 'Delivered')
  }, [allOrders])

  const metrics = useMemo(() => ({
    totalDelivered: deliveredOrders.length,
    totalKg: deliveredOrders.reduce((sum, o) => sum + (Number(o.weight_kg) || 0), 0),
    totalCollected: deliveredOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0)
  }), [deliveredOrders])

  const availableMonths = useMemo(() => {
    const s = new Set<string>()
    deliveredOrders.forEach(o => { if (o.delivery_date) s.add(o.delivery_date.substring(0, 7)) })
    return Array.from(s).sort().reverse()
  }, [deliveredOrders])

  const filteredRecords = useMemo(() => {
    const result = deliveredOrders.filter(order => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.phone_number.toLowerCase().includes(query) ||
        order.cake_type.toLowerCase().includes(query) ||
        (order.flavour || '').toLowerCase().includes(query)
      const matchesMonth = monthFilter === 'All' || (order.delivery_date && order.delivery_date.startsWith(monthFilter))
      return matchesSearch && matchesMonth
    })
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime()
      if (sortBy === 'oldest') return new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime()
      if (sortBy === 'highest') return Number(b.total_amount) - Number(a.total_amount)
      return Number(a.total_amount) - Number(b.total_amount)
    })
  }, [deliveredOrders, searchQuery, monthFilter, sortBy])

  const formatMonthLabel = (yyyyMm: string) => {
    try {
      const [y, m] = yyyyMm.split('-')
      return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } catch { return yyyyMm }
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed Transactions Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-amber-700" /> Delivered Records
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Fulfilled orders, collected revenue, and cake recipe archive.
          </p>
        </div>
        <button onClick={loadOrders} className="px-4 py-2.5 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!isSupabaseConfigured && <SetupNotice />}
      {error && !loading && <ErrorState message={error} onRetry={loadOrders} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Delivered Orders', value: `${metrics.totalDelivered} Orders`, icon: FileCheck, color: 'bg-emerald-100 text-emerald-900' },
          { label: 'Cakes Delivered (KG)', value: `${metrics.totalKg.toFixed(1)} KG`, icon: Cake, color: 'bg-amber-100 text-amber-900' },
          { label: 'Total Collected', value: `$${metrics.totalCollected.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-100 text-blue-900' },
        ].map((m) => (
          <div key={m.label} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
              <m.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{m.label}</p>
              <p className="text-xl font-bold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <LoadingState label="Loading delivered records…" />
        </div>
      ) : deliveredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <EmptyState
            title="No delivered orders yet"
            description="Orders automatically appear here once their status is set to Delivered."
          />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, phone, order ID, or cake type..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium text-gray-700"
            >
              <option value="All">All Months</option>
              {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest' | 'lowest')}
              className="px-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium text-gray-700"
            >
              <option value="newest">Newest Delivered</option>
              <option value="oldest">Oldest Delivered</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>

          {/* Records Table / Cards */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base font-serif flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Delivered Archive ({filteredRecords.length})
              </h3>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Fully Delivered
              </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Order ID</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Cake & Flavour</th>
                    <th className="px-5 py-3.5">KG</th>
                    <th className="px-5 py-3.5">Delivered</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Paid</th>
                    <th className="px-5 py-3.5">Balance</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400 text-sm">No delivered records found.</td></tr>
                  ) : (
                    filteredRecords.map((ord) => {
                      const paid = Number(ord.paid_amount || 0)
                      const balance = Number(ord.total_amount) - paid
                      return (
                        <tr key={ord.id} className="hover:bg-emerald-50/20 transition">
                          <td className="px-5 py-4 font-mono font-bold text-gray-900">{ord.id}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900 text-xs">{ord.customer_name}</div>
                            <div className="text-xs text-gray-500">{ord.phone_number}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-800 text-xs">{ord.cake_type}</div>
                            {ord.flavour && <div className="text-xs text-gray-500">{ord.flavour}</div>}
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold">{ord.weight_kg} KG</td>
                          <td className="px-5 py-4 text-xs">{ord.delivery_date}</td>
                          <td className="px-5 py-4 font-mono font-bold text-xs">${Number(ord.total_amount).toFixed(2)}</td>
                          <td className="px-5 py-4 font-mono font-bold text-emerald-700 text-xs">${paid.toFixed(2)}</td>
                          <td className="px-5 py-4 font-mono text-xs text-rose-600 font-bold">${balance > 0 ? balance.toFixed(2) : '0.00'}</td>
                          <td className="px-5 py-4">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getPaymentBadge(ord.payment_status)}`}>
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => { setSelectedOrder(ord); setIsDetailsOpen(true) }}
                              className="p-1.5 text-gray-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No delivered records found.</div>
              ) : (
                filteredRecords.map((ord) => {
                  const paid = Number(ord.paid_amount || 0)
                  const balance = Number(ord.total_amount) - paid
                  return (
                    <div key={ord.id} className="p-4 space-y-3 hover:bg-emerald-50/10">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{ord.id}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getPaymentBadge(ord.payment_status)}`}>
                          {ord.payment_status}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{ord.customer_name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-amber-700" /> {ord.phone_number}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
                        <p className="font-semibold text-gray-900">{ord.cake_type} {ord.flavour ? `– ${ord.flavour}` : ''} ({ord.weight_kg} KG)</p>
                        <p className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Delivered: {ord.delivery_date}</p>
                        <p className="text-gray-500 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {ord.delivery_address}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-xs space-y-0.5">
                          <p>Total: <strong className="font-mono">${Number(ord.total_amount).toFixed(2)}</strong></p>
                          <p>Paid: <strong className="font-mono text-emerald-700">${paid.toFixed(2)}</strong></p>
                          {balance > 0 && <p>Balance: <strong className="font-mono text-rose-600">${balance.toFixed(2)}</strong></p>}
                        </div>
                        <button onClick={() => { setSelectedOrder(ord); setIsDetailsOpen(true) }}
                          className="px-3 py-1.5 bg-amber-800 text-amber-50 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Receipt
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
      />
    </div>
  )
}