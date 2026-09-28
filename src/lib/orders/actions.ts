import { Order, OrderFormData } from '@/types/order'
import { createClient } from '@/lib/supabase/client'

// The Supabase `orders` table is the single source of truth for the whole
// application. No mock/hardcoded fallback data is used in production.

export interface FetchOrdersResult {
  data: Order[]
  error: string | null
}

function normalizeTime(value: string | null | undefined): string {
  if (!value) return '12:00'
  return value.slice(0, 5)
}

function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    order_number: row.order_number ? Number(row.order_number) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    delivered_at: row.delivered_at ? String(row.delivered_at) : null,
    customer_name: String(row.customer_name ?? ''),
    phone_number: String((row.phone ?? row.phone_number) ?? ''),
    cake_type: String(row.cake_type ?? ''),
    flavour: String(row.flavour || 'Vanilla'),
    weight_kg: Number(row.weight_kg) || 1,
    quantity: Number(row.quantity) || 1,
    order_date: row.order_date ? String(row.order_date) : undefined,
    delivery_date: String(row.delivery_date ?? ''),
    delivery_time: normalizeTime(row.delivery_time as string),
    delivery_address: String((row.address ?? row.delivery_address) ?? ''),
    cake_message: row.cake_message ? String(row.cake_message) : null,
    total_amount: Number(row.total_amount) || 0,
    paid_amount: Number(row.paid_amount) || 0,
    payment_status: (row.payment_status as Order['payment_status']) || 'Pending',
    order_status: (row.order_status as Order['order_status']) || 'New',
    additional_notes: row.notes ? String(row.notes) : null,
  }
}

export async function fetchOrdersFromSupabase(): Promise<FetchOrdersResult> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return {
      data: (data ?? []).map((row) => mapOrderRow(row as Record<string, unknown>)),
      error: null,
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect to the database.'
    return { data: [], error: message }
  }
}

// Fetch only the orders whose delivery_date falls inside a given month
// (YYYY-MM). Keeps calendar loads small instead of downloading every order.
export async function fetchCalendarOrdersFromSupabase(
  yearMonth: string
): Promise<FetchOrdersResult> {
  try {
    const [year, month] = yearMonth.split('-').map(Number)
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0)
    const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('delivery_date', start)
      .lte('delivery_date', end)
      .order('delivery_date', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    return {
      data: (data ?? []).map((row) => mapOrderRow(row as Record<string, unknown>)),
      error: null,
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect to the database.'
    return { data: [], error: message }
  }
}

interface SaveResult {
  success: boolean
  id?: string
  order?: Order
  error?: string
}

function buildPayload(formData: OrderFormData): Record<string, unknown> {
  return {
    customer_name: formData.customer_name,
    phone: formData.phone_number,
    cake_type: formData.cake_type,
    flavour: formData.flavour || 'Vanilla',
    weight_kg: formData.weight_kg,
    quantity: formData.quantity || 1,
    order_date: formData.order_date || new Date().toISOString().slice(0, 10),
    delivery_date: formData.delivery_date,
    delivery_time: formData.delivery_time,
    address: formData.delivery_address,
    cake_message: formData.cake_message || null,
    total_amount: formData.total_amount,
    paid_amount: Math.min(formData.paid_amount || 0, formData.total_amount),
    payment_status: formData.payment_status || 'Pending',
    order_status: formData.order_status || 'New',
    notes: formData.additional_notes || null,
  }
}

export async function saveOrderToSupabase(
  formData: OrderFormData,
  editId?: string
): Promise<SaveResult> {
  try {
    const supabase = createClient()
    const payload = buildPayload(formData)

    if (editId) {
      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', editId)
        .select('*')
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        id: String(data.id),
        order: mapOrderRow(data as Record<string, unknown>),
      }
    }

    // Insert WITHOUT an id — the database trigger generates the next
    // CAKE-XXXX id and sequential order_number automatically.
    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      id: String(data.id),
      order: mapOrderRow(data as Record<string, unknown>),
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Database operation failed.'
    return { success: false, error: message }
  }
}

export async function deleteOrderFromSupabase(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to delete order.'
    return { success: false, error: message }
  }
}