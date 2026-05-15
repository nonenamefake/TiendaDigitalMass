import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CatalogService,
  Category,
  Paginated,
  ProductFilters,
  ProductListItem,
  Store,
} from '../../core/catalog.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-content">
        <span class="tag">PROMOCION DEL DIA</span>
        <h1>!LOS MEJORES<br />PRECIOS DEL<br />BARRIO!</h1>
        <p>Aprovecha los precios bajos todos los dias en Mass. Mas de 70 productos al alcance de tu canasta.</p>
        <button class="primary">Comprar ahora</button>
      </div>
      <div class="hero-art">
        <div class="badge">
          <span class="badge-label">Hasta</span>
          <span class="badge-num">30<span class="pct">%</span></span>
          <span class="badge-label">OFF</span>
        </div>
      </div>
    </section>

    <section class="layout">
      <aside class="filters">
        <h3>Filtros</h3>

        <div class="group">
          <label>Buscar</label>
          <input type="search" placeholder="Arroz, leche, palta..." [(ngModel)]="q" (ngModelChange)="qChanged$.next($event)" />
        </div>

        <div class="group">
          <label>Categoria</label>
          <select [(ngModel)]="filters.category" (change)="reload()">
            <option [ngValue]="undefined">Todas</option>
            <option *ngFor="let c of categories()" [value]="c.slug">{{ c.name }}</option>
          </select>
        </div>

        <div class="group">
          <label>Tienda</label>
          <select [(ngModel)]="filters.store" (change)="reload()">
            <option [ngValue]="undefined">Cualquiera</option>
            <option *ngFor="let s of stores()" [value]="s.code">{{ s.name }}</option>
          </select>
        </div>

        <div class="group">
          <label>Precio</label>
          <div class="row">
            <input type="number" placeholder="Min" [(ngModel)]="filters.min_price" (change)="reload()" />
            <input type="number" placeholder="Max" [(ngModel)]="filters.max_price" (change)="reload()" />
          </div>
        </div>

        <div class="group">
          <label>Ordenar</label>
          <select [(ngModel)]="filters.ordering" (change)="reload()">
            <option value="-created_at">Mas recientes</option>
            <option value="price">Precio: menor a mayor</option>
            <option value="-price">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>

        <button class="ghost" (click)="reset()">Limpiar filtros</button>
      </aside>

      <section class="results">
        <header class="results-header">
          <h2>Productos Mass</h2>
          <span class="count" *ngIf="page()">{{ page()?.count }} productos</span>
        </header>

        <div *ngIf="loading()" class="msg">Cargando productos...</div>
        <div *ngIf="!loading() && page()?.results?.length === 0" class="msg">Sin resultados.</div>

        <div class="grid">
          <a *ngFor="let p of page()?.results" [routerLink]="['/product', p.slug]" class="product">
            <div class="img-wrap">
              <img [src]="p.image_url" [alt]="p.name" loading="lazy" />
              <span class="tag offer" *ngIf="!p.in_stock">AGOTADO</span>
            </div>
            <div class="info">
              <div class="brand">{{ p.brand || '&nbsp;' }}</div>
              <div class="name">{{ p.name }}</div>
              <div class="bottom">
                <span class="price">
                  <span class="currency">S/</span>
                  <span class="whole">{{ priceWhole(p.price) }}</span>
                  <span class="cents">.{{ priceCents(p.price) }}</span>
                </span>
                <span class="unit muted">/ {{ p.unit }}</span>
              </div>
            </div>
          </a>
        </div>

        <nav class="pager" *ngIf="page() as pg">
          <button class="ghost" [disabled]="!pg.previous" (click)="goto(currentPage - 1)">Anterior</button>
          <span class="page-num">Pagina {{ currentPage }}</span>
          <button class="ghost" [disabled]="!pg.next" (click)="goto(currentPage + 1)">Siguiente</button>
        </nav>
      </section>
    </section>
  `,
  styles: [`
    .hero {
      background: var(--mass-yellow);
      border: 4px solid var(--mass-navy);
      border-radius: 6px;
      padding: 2rem;
      margin-bottom: 2rem;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2rem;
      align-items: center;
    }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.4rem);
      line-height: 0.95;
      margin: 0.5rem 0;
    }
    .hero-content p {
      max-width: 460px;
      font-weight: 500;
      margin: 0.5rem 0 1.2rem;
    }
    .hero-art {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge {
      background: var(--mass-red);
      color: #fff;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: rotate(-8deg);
      border: 6px solid var(--mass-navy);
    }
    .badge-label { font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    .badge-num { font-size: 3.6rem; font-weight: 900; line-height: 1; display: inline-flex; align-items: flex-start; }
    .badge-num .pct { font-size: 1.4rem; margin-top: 0.4rem; }
    @media (max-width: 720px) {
      .hero { grid-template-columns: 1fr; text-align: left; }
      .hero-art { justify-content: flex-start; }
      .badge { width: 130px; height: 130px; }
      .badge-num { font-size: 2.6rem; }
    }

    .layout { display: grid; grid-template-columns: 260px 1fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

    .filters {
      background: #fff;
      padding: 1.25rem;
      border-radius: 6px;
      border: 3px solid var(--mass-navy);
    }
    .filters h3 { margin-top: 0; }
    .group { margin-bottom: 0.85rem; }
    .group > label { display: block; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

    .results-header {
      display: flex; align-items: baseline; justify-content: space-between;
      background: var(--mass-navy);
      color: #fff;
      padding: 0.65rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .results-header h2 { color: #fff; margin: 0; font-size: 1.1rem; }
    .count { font-size: 0.85rem; font-weight: 700; color: var(--mass-yellow); }

    .msg { background: #fff; padding: 2rem; border-radius: 6px; text-align: center; font-weight: 600; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.9rem; }

    .product {
      background: #fff;
      border-radius: 6px;
      padding: 0;
      overflow: hidden;
      color: var(--mass-navy);
      display: flex;
      flex-direction: column;
      border: 2px solid transparent;
      transition: border-color 0.12s;
    }
    .product:hover { border-color: var(--mass-navy); text-decoration: none; }
    .img-wrap {
      position: relative;
      background: #fff;
      aspect-ratio: 1 / 1;
    }
    .product img { width: 100%; height: 100%; object-fit: cover; display: block; background: #f5f1ff; }
    .img-wrap .tag.offer {
      position: absolute; top: 0.5rem; left: 0.5rem; background: #999;
    }
    .info { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
    .brand { font-size: 0.7rem; text-transform: uppercase; color: var(--muted); font-weight: 700; letter-spacing: 0.04em; }
    .name { font-weight: 700; font-size: 0.92rem; line-height: 1.2; min-height: 2.4em; color: var(--mass-navy); }
    .bottom { display: flex; align-items: baseline; justify-content: space-between; margin-top: auto; padding-top: 0.4rem; gap: 0.4rem; }
    .unit { font-size: 0.75rem; font-weight: 700; }

    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
    .page-num { font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.85rem; }
  `],
})
export class CatalogComponent implements OnInit {
  private readonly api = inject(CatalogService);

  categories = signal<Category[]>([]);
  stores = signal<Store[]>([]);
  page = signal<Paginated<ProductListItem> | null>(null);
  loading = signal(false);

  q = '';
  qChanged$ = new Subject<string>();
  filters: ProductFilters = { ordering: '-created_at', page: 1 };
  currentPage = 1;

  ngOnInit() {
    this.api.categories().subscribe((cs) => this.categories.set(cs));
    this.api.stores().subscribe((ss) => this.stores.set(ss));
    this.reload();
    this.qChanged$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => {
      this.filters.q = q || undefined;
      this.filters.page = 1;
      this.currentPage = 1;
      this.reload();
    });
  }

  reload() {
    this.loading.set(true);
    this.api.products(this.filters).subscribe({
      next: (pg) => { this.page.set(pg); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goto(p: number) {
    if (p < 1) return;
    this.currentPage = p;
    this.filters.page = p;
    this.reload();
  }

  reset() {
    this.q = '';
    this.filters = { ordering: '-created_at', page: 1 };
    this.currentPage = 1;
    this.reload();
  }

  priceWhole(price: string): string {
    return (price || '0').split('.')[0];
  }
  priceCents(price: string): string {
    const parts = (price || '0').split('.');
    return (parts[1] || '00').padEnd(2, '0').substring(0, 2);
  }
}
