import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Store {
  id: number;
  code: string;
  name: string;
  district: string;
  address: string;
}

export interface ProductListItem {
  id: number;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: string;
  currency: string;
  image_url: string;
  unit: string;
  in_stock: boolean;
}

export interface InventoryEntry {
  store: Store;
  stock_qty: number;
  updated_at: string;
}

export interface ProductDetail {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: Category;
  price: string;
  currency: string;
  image_url: string;
  unit: string;
  is_active: boolean;
  inventory: InventoryEntry[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductFilters {
  category?: string;
  store?: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  categories() { return this.http.get<Category[]>('/api/categories'); }
  stores()     { return this.http.get<Store[]>('/api/stores'); }

  products(filters: ProductFilters = {}) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<Paginated<ProductListItem>>('/api/products', { params });
  }

  product(slug: string) {
    return this.http.get<ProductDetail>(`/api/products/${slug}`);
  }

  suggest(q: string) {
    return this.http.get<ProductListItem[]>('/api/search/suggest', { params: { q } });
  }
}
