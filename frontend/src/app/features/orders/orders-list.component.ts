import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Order, OrdersService } from '../../core/orders.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Mis Pedidos</h2>
    <div *ngIf="loading()" class="muted">Cargando...</div>
    <div *ngIf="!loading() && orders().length === 0" class="empty card">
      <p>Aun no tienes pedidos.</p>
      <a routerLink="/catalog"><button class="primary">Ir al catalogo</button></a>
    </div>
    <div class="list">
      <a *ngFor="let o of orders()" [routerLink]="['/orders', o.id]" class="order card">
        <div class="left">
          <div class="id">Pedido #{{ o.id }}</div>
          <div class="meta muted">{{ o.created_at | date:'medium' }} - {{ o.store.name }}</div>
          <div class="items-mini">{{ o.items.length }} producto{{ o.items.length === 1 ? '' : 's' }}</div>
        </div>
        <div class="right">
          <span class="status" [attr.data-status]="o.status">{{ statusLabel(o.status) }}</span>
          <div class="total">S/ {{ o.total }}</div>
        </div>
      </a>
    </div>
  `,
  styles: [`
    h2 { margin-bottom: 1.2rem; }
    .list { display: flex; flex-direction: column; gap: 0.7rem; }
    .order {
      display: flex; justify-content: space-between; align-items: center;
      color: var(--mass-navy);
      border: 2px solid var(--mass-navy);
    }
    .order:hover { background: var(--mass-yellow); text-decoration: none; }
    .id { font-weight: 900; font-size: 1.1rem; }
    .meta { font-size: 0.82rem; }
    .items-mini { font-size: 0.85rem; font-weight: 600; }
    .right { text-align: right; }
    .total { font-weight: 900; font-size: 1.1rem; margin-top: 0.3rem; }
    .status {
      display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px;
      font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
      background: var(--mass-navy); color: #fff;
    }
    .status[data-status="paid"] { background: var(--ok); }
    .status[data-status="cancelled"] { background: #999; }
    .status[data-status="delivered"] { background: var(--mass-red); }
    .empty { text-align: center; padding: 2rem; }
  `],
})
export class OrdersListComponent implements OnInit {
  private readonly svc = inject(OrdersService);
  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.svc.list().subscribe({
      next: (rs) => { this.orders.set(rs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: string): string {
    return {
      pending_payment: 'Pendiente',
      paid: 'Pagado',
      preparing: 'Preparando',
      dispatched: 'Despachado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    }[s] || s;
  }
}
