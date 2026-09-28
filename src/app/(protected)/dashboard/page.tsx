'use client'

import { useState, useEffect, useMemo } from 'react'
import { Order, OrderFormData, OrderStatus } from '@/types/order'
import { fetchOrdersFromSupabase, saveOrderToSupabase, deleteOrderFromSupabase } from '@/lib/orders/actions'
import OrderFormModal from '@/components/orders/OrderFormModal'
import OrderDetailsModal from '@/components/orders/OrderDetailsModal'
import DeleteConfirmModal from '@/components/orders/DeleteConfirmModal'
import { LoadingState, ErrorState, EmptyState, SetupNotice } from '@/components/orders/StateViews'

import {
  Plus, Search, Filter, Calendar as CalendarIcon, Cake, Clock,
  ShoppingBag, TrendingUp, Phone, MapPin, Eye,
  Edit, Trash2, Database, Sparkles
} from 'lucide-react'

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'New': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'In Progress': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Delivered': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getPaymentBadge(status: string) {
  switch (status) {
    case 'Fully Paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Partially Paid': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Pending': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [dateFilter, setDateFilter] = useState<string>('')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return {
      todaysOrdersCount: orders.filter(o => o.delivery_date === todayStr).length,
      upcomingOrdersCount: orders.filter(o => o.delivery_date > todayStr && o.order_status !== 'Cancelled').length,
      inProgressCount: orders.filter(o => o.order_status === 'In Progress' || o.order_status === 'New').length,
      todaysExpectedCollection: orders
        .filter(o => o.delivery_date === todayStr && o.order_status !== 'Cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount), 0)
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.phone_number.toLowerCase().includes(query) ||
        order.cake_type.toLowerCase().includes(query) ||
        (order.flavour || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All' || order.order_status === statusFilter
      const matchesDate = !dateFilter || order.delivery_date === dateFilter
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [orders, searchQuery, statusFilter, dateFilter])

  const handleFormSubmit = async (formData: OrderFormData, editId?: string) => {
    const res = await saveOrderToSupabase(formData, editId)
    if (res.success && res.order) {
      if (editId) {
        setOrders(prev => prev.map(o => o.id === editId ? res.order! : o))
      } else {
        setOrders(prev => [res.order!, ...prev])
      }
      return
    }
    throw new Error(res.error || 'Failed to save order.')
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return
    setDeleteLoading(true)
    const res = await deleteOrderFromSupabase(deletingOrder.id)
    if (res.success) {
      setOrders(prev => prev.filter(o => o.id !== deletingOrder.id))
    } else {
      setError(res.error || 'Failed to delete order.')
    }
    setDeleteLoading(false)
    setIsDeleteModalOpen(false)
    setDeletingOrder(null)
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-850 to-amber-800 rounded-2xl p-5 sm:p-7 text-amber-50 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-800/80 rounded-full text-xs font-semibold text-amber-200 border border-amber-700/60">
            <Sparkles className="w-3.5 h-3.5" /> Phone Order Intake Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">Bakery Order Control Center</h1>
          <p className="text-amber-200/90 text-xs sm:text-sm">
            Log customer phone orders, manage baking status, track deliveries, and review daily earnings.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => { setEditingOrder(null); setIsFormModalOpen(true) }}
            className="w-full md:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>+ Add New Order (Phone)</span>
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && <SetupNotice />}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: `${metrics.todaysOrdersCount} Orders`, icon: ShoppingBag, color: 'bg-amber-100 text-amber-900' },
          { label: 'Upcoming Orders', value: `${metrics.upcomingOrdersCount} Cakes`, icon: Clock, color: 'bg-blue-100 text-blue-900' },
          { label: 'In Progress', value: `${metrics.inProgressCount} Baking`, icon: Cake, color: 'bg-purple-100 text-purple-900' },
          { label: "Expected Today", value: `$${metrics.todaysExpectedCollection.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-900' },
        ].map((m) => (
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

      {/* Error state */}
      {error && !loading && <ErrorState message={error} onRetry={loadOrders} />}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <LoadingState label="Loading orders from Supabase…" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <EmptyState
            title="No orders yet"
            description="Tap “+ Add New Order” to record your first phone order. It will appear here, on the calendar, and in your records."
          />
        </div>
      ) : (
        <>
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID, customer, phone, cake type..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium text-gray-700"
              >
                <option value="All">All Statuses</option>
                {['New','Confirmed','In Progress','Ready','Delivered','Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium text-gray-700"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-xs text-rose-600 font-semibold underline shrink-0">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base font-serif flex items-center gap-2">
                <Cake className="w-5 h-5 text-amber-700" /> Orders ({filteredOrders.length})
              </h3>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Supabase Live
              </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Cake & Flavour</th>
                    <th className="px-5 py-3.5">Weight</th>
                    <th className="px-5 py-3.5">Delivery</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No orders match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-amber-50/30 transition">
                        <td className="px-5 py-4 font-mono font-bold text-amber-950">{ord.id}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 text-xs">{ord.customer_name}</div>
                          <div className="text-xs text-gray-500">{ord.phone_number}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-800 text-xs max-w-[180px] truncate">{ord.cake_type}</div>
                          {ord.flavour && <div className="text-xs text-gray-500 truncate">{ord.flavour}</div>}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-gray-600">{ord.weight_kg} KG</td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-semibold text-gray-800">{ord.delivery_date}</div>
                          <div className="text-xs text-gray-500">{ord.delivery_time}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 font-mono text-xs">${Number(ord.total_amount).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Paid: ${Number(ord.paid_amount || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getPaymentBadge(ord.payment_status)}`}>
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(ord.order_status)}`}>
                            {ord.order_status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-1">
                          <button onClick={() => { setViewingOrder(ord); setIsDetailsModalOpen(true) }}
                            className="p-1.5 text-gray-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingOrder(ord); setIsFormModalOpen(true) }}
                            className="p-1.5 text-gray-500 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeletingOrder(ord); setIsDeleteModalOpen(true) }}
                            className="p-1.5 text-gray-500 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No orders found.</div>
              ) : (
                filteredOrders.map((ord) => (
                  <div key={ord.id} className="p-4 space-y-3 hover:bg-amber-50/20 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          {ord.id}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(ord.order_status)}`}>
                          {ord.order_status}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getPaymentBadge(ord.payment_status)}`}>
                          {ord.payment_status}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900 font-mono">${Number(ord.total_amount).toFixed(2)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{ord.customer_name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-700" /> {ord.phone_number}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
                      <p className="font-semibold text-gray-900">{ord.cake_type} {ord.flavour ? `– ${ord.flavour}` : ''} ({ord.weight_kg} KG)</p>
                      <p className="text-gray-500">{ord.delivery_date} at {ord.delivery_time}</p>
                      <p className="text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {ord.delivery_address}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button onClick={() => { setViewingOrder(ord); setIsDetailsModalOpen(true) }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => { setEditingOrder(ord); setIsFormModalOpen(true) }}
                        className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => { setDeletingOrder(ord); setIsDeleteModalOpen(true) }}
                        className="px-3 py-1.5 bg-rose-100 text-rose-900 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <OrderFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialOrder={editingOrder}
      />
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={viewingOrder}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        orderId={deletingOrder?.id || ''}
        customerName={deletingOrder?.customer_name || ''}
        loading={deleteLoading}
      />
    </div>
  )
}