import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { CatalogService, ProductDetail } from '../../core/catalog.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/catalog" class="back">&larr; Volver al catalogo</a>

    <div *ngIf="loading()" class="msg">Cargando...</div>
    <div *ngIf="error()" class="err msg">{{ error() }}</div>

    <article *ngIf="product() as p" class="detail">
      <div class="image">
        <img [src]="p.image_url" [alt]="p.name" />
      </div>
      <div class="info">
        <div class="brand">{{ p.brand }}</div>
        <h1>{{ p.name }}</h1>

        <div class="price-row">
          <span class="price big">
            <span class="currency">S/</span>
            <span class="whole">{{ priceWhole(p.price) }}</span>
            <span class="cents">.{{ priceCents(p.price) }}</span>
          </span>
          <span class="unit">/ {{ p.unit || 'un' }}</span>
        </div>

        <p class="desc">{{ p.description }}</p>

        <div class="meta">
          <div><span class="meta-label">SKU</span> {{ p.sku }}</div>
          <div><span class="meta-label">Categoria</span> {{ p.category.name }}</div>
        </div>

        <h3>Disponibilidad por tienda</h3>
        <div class="stock-list">
          <div class="stock-row" *ngFor="let inv of p.inventory">
            <div>
              <div class="store-name">{{ inv.store.name }}</div>
              <div class="store-district">{{ inv.store.district }}</div>
            </div>
            <span class="tag" [class.gray]="inv.stock_qty === 0">
              {{ inv.stock_qty > 0 ? inv.stock_qty + ' un' : 'AGOTADO' }}
            </span>
          </div>
        </div>

        <button class="primary big-cta" (click)="addToCart()" [disabled]="busy()">
          {{ busy() ? 'Agregando...' : 'Agregar al carrito' }}
        </button>
        <p class="muted" *ngIf="added()">Agregado al carrito.</p>
      </div>
    </article>
  `,
  styles: [`
    .back {
      display: inline-block;
      margin-bottom: 1rem;
      background: var(--mass-navy);
      color: #fff;
      padding: 0.4rem 0.85rem;
      border-radius: 4px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
    }
    .back:hover { background: var(--mass-red); color: #fff; text-decoration: none; }

    .msg { background: #fff; padding: 2rem; border-radius: 6px; text-align: center; font-weight: 700; }

    .detail {
      background: #fff;
      border-radius: 6px;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 2rem;
    }
    @media (max-width: 800px) { .detail { grid-template-columns: 1fr; } }

    .image {
      background: #fff;
      border: 2px solid var(--mass-navy);
      border-radius: 6px;
      overflow: hidden;
    }
    .image img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; background: #f5f1ff; }

    .brand { text-transform: uppercase; font-size: 0.78rem; font-weight: 800; color: var(--mass-red); letter-spacing: 0.05em; }
    h1 { margin: 0.3rem 0 0.5rem; font-size: 2rem; }

    .price-row { display: flex; align-items: baseline; gap: 0.6rem; margin: 1rem 0 1.2rem; }
    .price.big .whole { font-size: 4rem; }
    .price.big .cents { font-size: 1.6rem; }
    .price.big .currency { font-size: 1.2rem; }
    .unit { font-weight: 700; color: var(--muted); }

    .desc { color: var(--mass-navy); line-height: 1.55; font-weight: 500; }
    .meta {
      display: flex;
      gap: 0.6rem;
      margin: 1rem 0 1.5rem;
      flex-wrap: wrap;
    }
    .meta > div {
      background: var(--mass-yellow);
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .meta-label { text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; opacity: 0.7; margin-right: 0.3rem; }

    h3 { margin: 1rem 0 0.6rem; }
    .stock-list { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.5rem; }
    .stock-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.9rem;
      border: 2px solid var(--mass-navy);
      border-radius: 4px;
      background: #fff;
    }
    .store-name { font-weight: 700; }
    .store-district { font-size: 0.8rem; color: var(--muted); }
    .tag.gray { background: #999; }

    .big-cta { font-size: 1.05rem; padding: 0.9rem 1.6rem; }
  `],
})
export class ProductDetailComponent implements OnInit {
  private readonly api = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @Input({ required: true }) slug = '';
  product = signal<ProductDetail | null>(null);
  loading = signal(false);
  busy = signal(false);
  added = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    if (!this.slug) return;
    this.loading.set(true);
    this.api.product(this.slug).subscribe({
      next: (p) => { this.product.set(p); this.loading.set(false); },
      error: () => { this.error.set('Producto no encontrado'); this.loading.set(false); },
    });
  }

  addToCart() {
    if (!this.auth.user()) { this.router.navigateByUrl('/login'); return; }
    const p = this.product();
    if (!p) return;
    this.busy.set(true);
    this.cart.add(p.id, 1).subscribe({
      next: () => { this.busy.set(false); this.added.set(true); setTimeout(() => this.added.set(false), 2500); },
      error: () => this.busy.set(false),
    });
  }

  priceWhole(price: string): string { return (price || '0').split('.')[0]; }
  priceCents(price: string): string {
    const parts = (price || '0').split('.');
    return (parts[1] || '00').padEnd(2, '0').substring(0, 2);
  }
}
