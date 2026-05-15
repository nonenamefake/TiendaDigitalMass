import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { CheckoutPayload, OrdersService } from '../../core/orders.service';

interface AddressDto {
  id: number;
  label: string;
  line1: string;
  district: string;
  city: string;
  is_default: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Checkout</h2>

    <div *ngIf="cart() as c" class="layout">
      <section class="form-area card">
        <h3>Entrega</h3>
        <div class="seg">
          <button class="seg-btn" [class.active]="form.delivery_mode === 'delivery'" (click)="form.delivery_mode = 'delivery'">Delivery a domicilio</button>
          <button class="seg-btn" [class.active]="form.delivery_mode === 'pickup'" (click)="form.delivery_mode = 'pickup'">Recojo en {{ c.store?.name || 'tienda' }}</button>
        </div>

        <ng-container *ngIf="form.delivery_mode === 'delivery'">
          <h4>Direccion</h4>
          <div *ngIf="addresses().length === 0" class="muted">No tienes direcciones. Crea una a continuacion:</div>

          <div class="addresses">
            <label *ngFor="let a of addresses()" class="address" [class.active]="form.address_id === a.id">
              <input type="radio" name="address" [value]="a.id" [(ngModel)]="form.address_id" />
              <div>
                <div class="addr-label">{{ a.label }}</div>
                <div class="muted">{{ a.line1 }} - {{ a.district }}</div>
              </div>
            </label>
          </div>

          <details class="new-addr">
            <summary>+ Agregar nueva direccion</summary>
            <div class="row">
              <input placeholder="Etiqueta (Casa, Oficina)" [(ngModel)]="newAddr.label" />
              <input placeholder="Distrito" [(ngModel)]="newAddr.district" />
            </div>
            <input placeholder="Direccion exacta" [(ngModel)]="newAddr.line1" />
            <button class="ghost" (click)="saveAddress()" [disabled]="!newAddr.line1 || !newAddr.district || !newAddr.label">Guardar direccion</button>
          </details>
        </ng-container>

        <h3>Fecha y horario</h3>
        <div class="row">
          <label><span>Fecha</span>
            <input type="date" [(ngModel)]="form.delivery_date" [min]="today" />
          </label>
          <label><span>Horario</span>
            <select [(ngModel)]="form.delivery_slot">
              <option value="">(Selecciona)</option>
              <option value="09-12">9:00 - 12:00</option>
              <option value="12-15">12:00 - 15:00</option>
              <option value="15-18">15:00 - 18:00</option>
              <option value="18-21">18:00 - 21:00</option>
            </select>
          </label>
        </div>

        <h3>Metodo de pago</h3>
        <div class="seg three">
          <button class="seg-btn" [class.active]="form.payment_method === 'card'" (click)="form.payment_method = 'card'">Tarjeta</button>
          <button class="seg-btn" [class.active]="form.payment_method === 'wallet'" (click)="form.payment_method = 'wallet'">Billetera</button>
          <button class="seg-btn" [class.active]="form.payment_method === 'cod'" (click)="form.payment_method = 'cod'">Contra entrega</button>
        </div>
        <p class="muted">Pago mock - no se realiza ningun cobro real.</p>

        <p class="err" *ngIf="error()">{{ error() }}</p>

        <button class="primary block" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Procesando...' : 'Confirmar pedido' }}
        </button>
      </section>

      <aside class="summary card">
        <h3>Resumen</h3>
        <div class="summary-store muted" *ngIf="c.store">Tienda: {{ c.store.name }}</div>
        <div class="row"><span>Productos</span><span>{{ c.total_qty }}</span></div>
        <div class="row"><span>Subtotal</span><span>S/ {{ c.subtotal }}</span></div>
        <div class="row total"><span>Total</span><span>S/ {{ c.subtotal }}</span></div>
      </aside>
    </div>
  `,
  styles: [`
    h2 { margin-bottom: 1.2rem; }
    h3 { margin: 1.2rem 0 0.5rem; }
    h4 { margin: 0.5rem 0; font-size: 0.95rem; }
    .layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

    .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
    .seg.three { grid-template-columns: 1fr 1fr 1fr; }
    .seg-btn { background: #fff; color: var(--mass-navy); border: 2px solid var(--mass-navy); padding: 0.7rem 0.5rem; }
    .seg-btn.active { background: var(--mass-navy); color: #fff; }

    .addresses { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
    .address { display: flex; gap: 0.6rem; padding: 0.6rem 0.85rem; border: 2px solid var(--mass-navy); border-radius: 4px; cursor: pointer; }
    .address.active { background: var(--mass-yellow); }
    .addr-label { font-weight: 800; }

    .new-addr { margin-top: 0.5rem; }
    .new-addr summary { cursor: pointer; font-weight: 700; color: var(--mass-red); }
    .new-addr .row, .new-addr input, .new-addr button { margin-top: 0.5rem; }

    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
    .row label { display: flex; flex-direction: column; gap: 0.3rem; }
    .row label span { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }

    .block { width: 100%; margin-top: 1rem; padding: 0.95rem; font-size: 1.05rem; }

    .summary h3 { margin-top: 0; }
    .summary .row { display: flex; justify-content: space-between; grid-template-columns: unset; padding: 0.3rem 0; margin: 0; }
    .summary .row.total { border-top: 2px solid var(--mass-navy); padding-top: 0.6rem; margin-top: 0.5rem; font-weight: 900; font-size: 1.1rem; }
    .summary-store { margin-bottom: 0.5rem; }
  `],
})
export class CheckoutComponent implements OnInit {
  private readonly cartSvc = inject(CartService);
  private readonly orders = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  cart = this.cartSvc.cart;
  addresses = signal<AddressDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  today = new Date().toISOString().substring(0, 10);

  form: CheckoutPayload & { address_id: number | null; delivery_date: string } = {
    delivery_mode: 'delivery',
    payment_method: 'card',
    address_id: null,
    delivery_date: this.today,
    delivery_slot: '09-12',
  };

  newAddr = { label: '', line1: '', district: '' };

  ngOnInit() {
    this.cartSvc.refresh().subscribe();
    this.http.get<AddressDto[]>('/api/me/addresses').subscribe((r) => {
      const list = Array.isArray(r) ? r : ((r as { results?: AddressDto[] }).results ?? []);
      this.addresses.set(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) this.form.address_id = def.id;
    });
  }

  saveAddress() {
    this.http.post<AddressDto>('/api/me/addresses/', { ...this.newAddr, is_default: this.addresses().length === 0 }).subscribe((a) => {
      this.addresses.set([...this.addresses(), a]);
      this.form.address_id = a.id;
      this.newAddr = { label: '', line1: '', district: '' };
    });
  }

  submit() {
    this.error.set(null);
    this.loading.set(true);
    const idem = crypto.randomUUID();
    this.orders.checkout(this.form as CheckoutPayload, idem).subscribe({
      next: (o) => {
        this.loading.set(false);
        this.cartSvc.refresh().subscribe();
        this.router.navigateByUrl(`/orders/${o.id}`);
      },
      error: (e) => {
        this.loading.set(false);
        const det = e?.error?.detail || e?.error;
        this.error.set(typeof det === 'string' ? det : JSON.stringify(det));
      },
    });
  }
}
