export type OrderStatus = 
  | 'New'
  | 'Confirmed'
  | 'In Progress'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled'

export type PaymentStatus = 
  | 'Pending'
  | 'Partially Paid'
  | 'Fully Paid'

export interface Order {
  id: string // e.g. CAKE-1001
  order_number?: number
  created_at: string
  updated_at: string
  delivered_at?: string | null
  
  // Customer details
  customer_name: string
  phone_number: string // mapped from phone / phone_number
  
  // Cake specifications
  cake_type: string
  flavour?: string
  weight_kg: number
  quantity?: number
  cake_message?: string | null
  
  // Logistics
  order_date?: string
  delivery_date: string
  delivery_time: string
  delivery_address: string // mapped from address / delivery_address
  
  // Financials & Payment
  total_amount: number
  paid_amount?: number
  payment_status: PaymentStatus
  
  // Management & Status
  order_status: OrderStatus
  additional_notes?: string | null // mapped from notes / additional_notes
}

export type OrderFormData = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'delivered_at'> & {
  id?: string
}

export interface OrderSummaryMetrics {
  todaysOrdersCount: number
  upcomingOrdersCount: number
  inProgressCount: number
  todaysExpectedCollection: number
}
