'use client'

import { Order, PaymentStatus } from '@/types/order'
import { X, User, Phone, Cake, MapPin, Calendar, Scale, Printer } from 'lucide-react'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

function getPaymentBadge(status: PaymentStatus) {
  switch (status) {
    case 'Fully Paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Partially Paid':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Pending':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'New': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'In Progress': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Delivered': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null

  const paidAmount = Number(order.paid_amount) || 0
  const totalAmount = Number(order.total_amount) || 0
  const remaining = totalAmount - paidAmount

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-amber-100">
        
        {/* Header */}
        <div className="bg-amber-900 text-amber-50 px-6 py-5 flex items-center justify-between">
          <div>
            <span className="bg-amber-800 text-amber-300 font-mono text-xs px-2.5 py-1 rounded font-bold">
              {order.id}
            </span>
            <h2 className="text-xl font-bold font-serif mt-1">Cake Order Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-800 hover:bg-amber-700 text-amber-200 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-gray-800">
          
          {/* Status Row */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(order.order_status)}`}>
                {order.order_status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPaymentBadge(order.payment_status)}`}>
                {order.payment_status}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono">{order.created_at?.split('T')[0]}</span>
          </div>

          {/* Customer Details */}
          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">{order.customer_name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-400" /> {order.phone_number}
              </p>
            </div>
          </div>

          {/* Cake Details */}
          <div className="flex items-start gap-2.5">
            <Cake className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">{order.cake_type}</p>
              {order.flavour && (
                <p className="text-xs text-gray-500">Flavour: {order.flavour}</p>
              )}
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-gray-400" /> {order.weight_kg} KG
                </p>
                {order.quantity && order.quantity > 1 && (
                  <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-800">
                {order.delivery_date} at {order.delivery_time}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" /> {order.delivery_address}
              </p>
            </div>
          </div>

          {/* Cake Message */}
          {order.cake_message && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/60">
              <p className="text-xs font-semibold text-amber-900 uppercase">Cake Inscription</p>
              <p className="text-sm font-medium text-amber-950 italic mt-0.5">&quot;{order.cake_message}&quot;</p>
            </div>
          )}

          {/* Additional Notes */}
          {order.additional_notes && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase">Bakery Notes</p>
              <p className="text-xs text-gray-700 mt-0.5">{order.additional_notes}</p>
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Total Order Amount</span>
              <span className="font-mono font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Amount Paid</span>
              <span className="font-mono font-bold text-emerald-700">${paidAmount.toFixed(2)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Remaining Balance</span>
                <span className="font-mono font-bold text-rose-700">${remaining.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-900">Payment Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPaymentBadge(order.payment_status)}`}>
                {order.payment_status}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-800 text-amber-50 rounded-lg text-xs font-semibold hover:bg-amber-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
