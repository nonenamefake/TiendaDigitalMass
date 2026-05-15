import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Store } from './catalog.service';

export interface CartItem {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  slug: string;
  image_url: string;
  unit: string;
  qty: number;
  unit_price_snapshot: string;
  line_total: string;
}

export interface Cart {
  id: number;
  store: Store | null;
  items: CartItem[];
  subtotal: string;
  total_qty: number;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  readonly cart = signal<Cart | null>(null);
  readonly count = computed(() => this.cart()?.total_qty ?? 0);

  refresh() {
    return this.http.get<Cart>('/api/cart').pipe(tap((c) => this.cart.set(c)));
  }

  setStore(storeCode: string) {
    return this.http.post<Cart>('/api/cart/store', { store_code: storeCode }).pipe(tap((c) => this.cart.set(c)));
  }

  add(productId: number, qty = 1) {
    return this.http.post('/api/cart/items', { product_id: productId, qty }).pipe(
      tap(() => this.refresh().subscribe()),
    );
  }

  patch(itemId: number, qty: number) {
    return this.http.patch(`/api/cart/items/${itemId}`, { qty }).pipe(
      tap(() => this.refresh().subscribe()),
    );
  }

  remove(itemId: number) {
    return this.http.delete(`/api/cart/items/${itemId}`).pipe(
      tap(() => this.refresh().subscribe()),
    );
  }

  clear() {
    return this.http.delete<Cart>('/api/cart').pipe(tap((c) => this.cart.set(c)));
  }
}
