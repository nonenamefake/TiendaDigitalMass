import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from './catalog.service';

export interface OrderItem {
  id: number;
  product_slug: string;
  sku_snapshot: string;
  name_snapshot: string;
  image_snapshot: string;
  qty: number;
  unit_price: string;
  line_total: string;
}

export interface Payment {
  method: string;
  status: 'initiated' | 'approved' | 'rejected';
  amount: string;
  currency: string;
  mock_reference: string;
  paid_at: string | null;
}

export interface Order {
  id: number;
  status: 'pending_payment' | 'paid' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
  store: Store;
  delivery_mode: 'delivery' | 'pickup';
  delivery_date: string | null;
  delivery_slot: string;
  address: number | null;
  payment_method: 'card' | 'wallet' | 'cod';
  subtotal: string;
  discount: string;
  total: string;
  currency: string;
  payment: Payment | null;
  items: OrderItem[];
  is_cancelable: boolean;
  created_at: string;
  cancelled_at: string | null;
}

export interface CheckoutPayload {
  delivery_mode: 'delivery' | 'pickup';
  payment_method: 'card' | 'wallet' | 'cod';
  address_id?: number | null;
  delivery_date?: string | null;
  delivery_slot?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  list() { return this.http.get<Order[]>('/api/orders'); }
  detail(id: number) { return this.http.get<Order>(`/api/orders/${id}`); }
  checkout(payload: CheckoutPayload, idempotencyKey: string) {
    return this.http.post<Order>('/api/orders', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
  cancel(id: number) { return this.http.post<Order>(`/api/orders/${id}/cancel`, {}); }
  repeat(id: number) { return this.http.post(`/api/orders/${id}/repeat`, {}); }
  payMock(orderId: number) { return this.http.post<Order>(`/api/payments/${orderId}/mock`, {}); }
}
