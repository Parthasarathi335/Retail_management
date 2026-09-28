'use client'

import { useState, useEffect } from 'react'
import { Order, OrderFormData, OrderStatus, PaymentStatus } from '@/types/order'
import { X, Phone, User, Cake, Calendar, Clock, MapPin, MessageSquare, DollarSign, Loader2, AlertCircle } from 'lucide-react'

interface OrderFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: OrderFormData, editId?: string) => Promise<void>
  initialOrder?: Order | null
}

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'New',
  'Confirmed',
  'In Progress',
  'Ready',
  'Delivered',
  'Cancelled'
]

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'Pending',
  'Partially Paid',
  'Fully Paid'
]

export default function OrderFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialOrder
}: OrderFormModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    customer_name: '',
    phone_number: '',
    cake_type: '',
    flavour: 'Vanilla',
    weight_kg: 1.5,
    quantity: 1,
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '12:00',
    delivery_address: '',
    cake_message: '',
    total_amount: 0,
    paid_amount: 0,
    payment_status: 'Pending',
    order_status: 'New',
    additional_notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(initialOrder)
  const displayId = initialOrder?.id || null

  useEffect(() => {
    if (initialOrder) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        customer_name: initialOrder.customer_name,
        phone_number: initialOrder.phone_number,
        cake_type: initialOrder.cake_type,
        flavour: initialOrder.flavour || 'Vanilla',
        weight_kg: initialOrder.weight_kg,
        quantity: initialOrder.quantity || 1,
        delivery_date: initialOrder.delivery_date,
        delivery_time: initialOrder.delivery_time,
        delivery_address: initialOrder.delivery_address,
        cake_message: initialOrder.cake_message || '',
        total_amount: initialOrder.total_amount,
        paid_amount: initialOrder.paid_amount || 0,
        payment_status: initialOrder.payment_status || 'Pending',
        order_status: initialOrder.order_status,
        additional_notes: initialOrder.additional_notes || '',
      })
    } else {
      setFormData({
        customer_name: '',
        phone_number: '',
        cake_type: '',
        flavour: 'Vanilla Berry',
        weight_kg: 1.5,
        quantity: 1,
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time: '14:00',
        delivery_address: '',
        cake_message: '',
        total_amount: 150.00,
        paid_amount: 50.00,
        payment_status: 'Partially Paid',
        order_status: 'New',
        additional_notes: '',
      })
    }
    setError(null)
  }, [initialOrder, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.customer_name.trim()) {
      setError('Customer name is required.')
      return
    }
    if (!formData.phone_number.trim()) {
      setError('Customer phone number is required.')
      return
    }
    if (!formData.cake_type.trim()) {
      setError('Cake type description is required.')
      return
    }
    if (!formData.delivery_address.trim()) {
      setError('Delivery address or pickup location is required.')
      return
    }
    if (formData.total_amount <= 0) {
      setError('Total amount must be greater than $0.00.')
      return
    }

    setLoading(true)

    try {
      // On new orders, omit id — the database trigger generates CAKE-XXXX.
      await onSubmit({ ...formData }, initialOrder?.id)
      setLoading(false)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save order.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-amber-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-amber-900 text-amber-50 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-800 text-amber-300 font-mono text-xs px-2.5 py-1 rounded-md font-bold tracking-wider border border-amber-700">
                {displayId || 'AUTO'}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {isEditing ? 'Edit Cake Order' : 'Phone Order Entry'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif mt-1">
              {isEditing ? `Modify Order #${displayId}` : 'Take New Phone Cake Order'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-800/80 hover:bg-amber-800 text-amber-200 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer Info */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-700" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cake Specifications */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Cake className="w-4 h-4 text-amber-700" /> Cake Specifications
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cake Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cake_type}
                  onChange={(e) => setFormData({ ...formData, cake_type: e.target.value })}
                  placeholder="e.g. 3-Tier Wedding Cake"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Flavour / Recipe
                </label>
                <input
                  type="text"
                  value={formData.flavour || ''}
                  onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
                  placeholder="e.g. Belgian Dark Chocolate"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Weight (KG) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="50"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.quantity || 1}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cake Inscription / Message
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.cake_message || ''}
                  onChange={(e) => setFormData({ ...formData, cake_message: e.target.value })}
                  placeholder="e.g. Happy 25th Birthday Sarah!"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Delivery & Timing */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-700" /> Delivery & Timing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Delivery Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Delivery Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="time"
                    required
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Delivery Address or Store Pickup *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  placeholder="e.g. 124 Bakery Lane or 'Store Pickup'"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payment & Status */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-700" /> Payment & Order Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="150.00"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Paid Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paid_amount || 0}
                  onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="50.00"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Status *
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as PaymentStatus })}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 font-medium"
                >
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Order Status *
              </label>
              <select
                value={formData.order_status}
                onChange={(e) => setFormData({ ...formData, order_status: e.target.value as OrderStatus })}
                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 font-medium"
              >
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                rows={2}
                value={formData.additional_notes || ''}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="e.g. Customer requested extra chocolate frosting."
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-amber-50 font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                  <span>Saving Order...</span>
                </>
              ) : (
                <span>{initialOrder ? 'Update Order' : 'Save Phone Order'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
