import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Order, OrdersService } from '../../core/orders.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/orders" class="back">&larr; Mis pedidos</a>

    <div *ngIf="order() as o" class="layout">
      <section class="main">
        <div class="hdr card">
          <div>
            <div class="id">Pedido #{{ o.id }}</div>
            <div class="muted">{{ o.created_at | date:'medium' }}</div>
          </div>
          <span class="status" [attr.data-status]="o.status">{{ statusLabel(o.status) }}</span>
        </div>

        <div class="ship card">
          <h3>Entrega</h3>
          <div><strong>Modo:</strong> {{ o.delivery_mode === 'delivery' ? 'Delivery' : 'Recojo en tienda' }}</div>
          <div><strong>Tienda:</strong> {{ o.store.name }} ({{ o.store.district }})</div>
          <div *ngIf="o.delivery_date"><strong>Fecha:</strong> {{ o.delivery_date }} - {{ o.delivery_slot }}</div>
        </div>

        <div class="items card">
          <h3>Productos</h3>
          <div *ngFor="let it of o.items" class="line">
            <img [src]="it.image_snapshot" [alt]="it.name_snapshot" />
            <div class="info">
              <a [routerLink]="['/product', it.product_slug]" class="name">{{ it.name_snapshot }}</a>
              <div class="muted">SKU {{ it.sku_snapshot }}</div>
              <div class="meta">{{ it.qty }} x S/ {{ it.unit_price }}</div>
            </div>
            <div class="line-total">S/ {{ it.line_total }}</div>
          </div>
        </div>
      </section>

      <aside class="side">
        <div class="summary card">
          <h3>Pago</h3>
          <div><strong>Metodo:</strong> {{ paymentLabel(o.payment_method) }}</div>
          <div *ngIf="o.payment"><strong>Estado:</strong> {{ o.payment.status }}</div>
          <div *ngIf="o.payment?.mock_reference">
            <span class="muted">Ref:</span> {{ o.payment?.mock_reference }}
          </div>
          <div class="row total"><span>Total</span><span>S/ {{ o.total }}</span></div>

          <button *ngIf="o.status === 'pending_payment'" class="primary block" (click)="payMock()" [disabled]="busy()">
            {{ busy() ? 'Procesando...' : 'Confirmar pago (mock)' }}
          </button>
          <button *ngIf="o.is_cancelable" class="ghost block" (click)="cancel()" [disabled]="busy()">
            Cancelar pedido
          </button>
          <button *ngIf="o.status !== 'pending_payment'" class="yellow block" (click)="repeat()">
            Repetir compra
          </button>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 1rem; background: var(--mass-navy); color: #fff; padding: 0.4rem 0.85rem; border-radius: 4px; font-weight: 800; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.04em; }
    .layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

    .main { display: flex; flex-direction: column; gap: 1rem; }
    .hdr { display: flex; justify-content: space-between; align-items: center; }
    .id { font-weight: 900; font-size: 1.3rem; }
    h3 { margin: 0 0 0.7rem; }

    .status { display: inline-block; padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; background: var(--mass-navy); color: #fff; }
    .status[data-status="paid"] { background: var(--ok); }
    .status[data-status="cancelled"] { background: #999; }
    .status[data-status="delivered"] { background: var(--mass-red); }

    .ship div { margin: 0.2rem 0; }

    .items .line { display: grid; grid-template-columns: 70px 1fr auto; gap: 0.85rem; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--gray-line); }
    .items .line:last-child { border-bottom: none; }
    .items img { width: 70px; height: 70px; object-fit: cover; border-radius: 4px; background: #f5f1ff; }
    .name { font-weight: 700; color: var(--mass-navy); }
    .meta { margin-top: 0.2rem; font-weight: 600; }
    .line-total { font-weight: 900; }

    .summary div { margin: 0.3rem 0; }
    .row.total { display: flex; justify-content: space-between; border-top: 2px solid var(--mass-navy); padding-top: 0.6rem; margin-top: 0.7rem; font-weight: 900; font-size: 1.15rem; }
    .block { width: 100%; margin-top: 0.6rem; padding: 0.75rem; }
  `],
})
export class OrderDetailComponent implements OnInit {
  private readonly svc = inject(OrdersService);
  private readonly router = inject(Router);

  @Input({ required: true }) id!: string;
  order = signal<Order | null>(null);
  busy = signal(false);

  ngOnInit() { this.load(); }

  private load() { this.svc.detail(+this.id).subscribe((o) => this.order.set(o)); }

  payMock() {
    this.busy.set(true);
    this.svc.payMock(+this.id).subscribe({
      next: (o) => { this.order.set(o); this.busy.set(false); },
      error: () => this.busy.set(false),
    });
  }

  cancel() {
    if (!confirm('Cancelar este pedido?')) return;
    this.busy.set(true);
    this.svc.cancel(+this.id).subscribe({
      next: (o) => { this.order.set(o); this.busy.set(false); },
      error: () => this.busy.set(false),
    });
  }

  repeat() {
    this.svc.repeat(+this.id).subscribe(() => this.router.navigateByUrl('/cart'));
  }

  statusLabel(s: string): string {
    return {
      pending_payment: 'Pendiente pago',
      paid: 'Pagado',
      preparing: 'Preparando',
      dispatched: 'Despachado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    }[s] || s;
  }
  paymentLabel(m: string): string {
    return { card: 'Tarjeta', wallet: 'Billetera digital', cod: 'Contra entrega' }[m] || m;
  }
}
