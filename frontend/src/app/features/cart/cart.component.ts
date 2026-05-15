import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { CatalogService, Store } from '../../core/catalog.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>Mi Carrito</h2>

    <div *ngIf="cart() as c; else empty" class="cart-grid">
      <section class="lines">
        <div class="store-picker card">
          <label>
            <span>Tienda donde recogeras o se enviara</span>
            <select [(ngModel)]="selectedStoreCode" (change)="changeStore()">
              <option [ngValue]="undefined" disabled>Selecciona una tienda...</option>
              <option *ngFor="let s of stores()" [value]="s.code">{{ s.name }} - {{ s.district }}</option>
            </select>
          </label>
        </div>

        <div *ngIf="c.items.length === 0" class="empty card">
          <p>Tu carrito esta vacio.</p>
          <a routerLink="/catalog"><button class="primary">Ir al catalogo</button></a>
        </div>

        <div *ngFor="let it of c.items" class="line card">
          <img [src]="it.image_url" [alt]="it.name" />
          <div class="info">
            <a [routerLink]="['/product', it.slug]" class="name">{{ it.name }}</a>
            <div class="unit muted">SKU {{ it.sku }} - {{ it.unit }}</div>
            <div class="price">
              <span class="currency">S/</span>
              <span class="whole">{{ whole(it.unit_price_snapshot) }}</span>
              <span class="cents">.{{ cents(it.unit_price_snapshot) }}</span>
            </div>
          </div>
          <div class="qty">
            <button class="ghost qbtn" (click)="patch(it.id, it.qty - 1)" [disabled]="it.qty <= 1">-</button>
            <span class="qty-num">{{ it.qty }}</span>
            <button class="ghost qbtn" (click)="patch(it.id, it.qty + 1)">+</button>
            <button class="link-danger" (click)="remove(it.id)">Quitar</button>
          </div>
          <div class="line-total">S/ {{ it.line_total }}</div>
        </div>
      </section>

      <aside class="summary card">
        <h3>Resumen</h3>
        <div class="row"><span>Productos</span><span>{{ c.total_qty }}</span></div>
        <div class="row"><span>Subtotal</span><span>S/ {{ c.subtotal }}</span></div>
        <div class="row total"><span>Total</span><span>S/ {{ c.subtotal }}</span></div>
        <button class="primary block" [disabled]="!c.store || c.items.length === 0" (click)="goCheckout()">
          Ir a pagar
        </button>
        <p class="muted" *ngIf="!c.store">Elige una tienda para continuar.</p>
      </aside>
    </div>

    <ng-template #empty>
      <p class="muted">Cargando...</p>
    </ng-template>
  `,
  styles: [`
    h2 { margin-bottom: 1.2rem; }
    .cart-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    @media (max-width: 900px) { .cart-grid { grid-template-columns: 1fr; } }

    .store-picker label { display: flex; flex-direction: column; gap: 0.4rem; }
    .store-picker span { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }

    .lines { display: flex; flex-direction: column; gap: 0.85rem; }
    .line {
      display: grid;
      grid-template-columns: 80px 1fr auto auto;
      gap: 1rem;
      align-items: center;
    }
    .line img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; background: #f5f1ff; }
    .name { font-weight: 700; color: var(--mass-navy); display: block; }
    .name:hover { color: var(--mass-red); }
    .unit { font-size: 0.78rem; }
    .price { margin-top: 0.3rem; }
    .price .whole { font-size: 1.25rem; }
    .price .cents { font-size: 0.85rem; }
    .price .currency { font-size: 0.7rem; }

    .qty { display: flex; align-items: center; gap: 0.5rem; }
    .qbtn { padding: 0.25rem 0.6rem; font-size: 1rem; }
    .qty-num { font-weight: 900; min-width: 1.5em; text-align: center; }
    .link-danger { background: none; color: var(--mass-red); padding: 0.2rem 0.4rem; text-transform: none; font-weight: 700; }

    .line-total { font-weight: 900; font-size: 1.1rem; color: var(--mass-navy); }

    .summary h3 { margin-top: 0; }
    .summary .row { display: flex; justify-content: space-between; padding: 0.35rem 0; }
    .summary .row.total { border-top: 2px solid var(--mass-navy); padding-top: 0.65rem; margin-top: 0.5rem; font-weight: 900; font-size: 1.1rem; }
    .block { width: 100%; margin-top: 1rem; padding: 0.85rem; font-size: 1rem; }
    .empty { text-align: center; padding: 2rem; }
  `],
})
export class CartComponent implements OnInit {
  private readonly cartSvc = inject(CartService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  cart = this.cartSvc.cart;
  stores = computed<Store[]>(() => this._stores);
  private _stores: Store[] = [];
  selectedStoreCode: string | undefined;

  ngOnInit() {
    this.cartSvc.refresh().subscribe(() => {
      this.selectedStoreCode = this.cart()?.store?.code;
    });
    this.catalog.stores().subscribe((ss) => (this._stores = ss));
  }

  changeStore() {
    if (!this.selectedStoreCode) return;
    this.cartSvc.setStore(this.selectedStoreCode).subscribe();
  }

  patch(id: number, qty: number) { if (qty >= 1) this.cartSvc.patch(id, qty).subscribe(); }
  remove(id: number) { this.cartSvc.remove(id).subscribe(); }

  goCheckout() { this.router.navigateByUrl('/checkout'); }

  whole(p: string) { return (p || '0').split('.')[0]; }
  cents(p: string) { return ((p || '0').split('.')[1] || '00').padEnd(2, '0').substring(0, 2); }
}
