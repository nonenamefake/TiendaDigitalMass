import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <a routerLink="/" class="brand">
          <span class="logo">mass<span class="dot">.</span></span>
          <span class="claim">Caser&#64;, a mi nadie me gana</span>
        </a>
        <nav class="primary-nav">
          <a routerLink="/catalog" routerLinkActive="active">Precios Mass</a>
          <a href="#">Conoceme</a>
          <a href="#">Ubicame</a>
          <a href="#">Trabaja Conmigo</a>
          <a href="#">Alquila tu local</a>
        </nav>
        <div class="user-area">
          <a routerLink="/cart" class="cart-link" routerLinkActive="active" *ngIf="auth.user()">
            <span class="cart-icon">🛒</span>
            <span *ngIf="cart.count() > 0" class="cart-badge">{{ cart.count() }}</span>
          </a>
          <ng-container *ngIf="auth.user(); else anon">
            <a routerLink="/orders" routerLinkActive="active" class="orders-link">Pedidos</a>
            <span class="user-pill">{{ auth.user()?.email }}</span>
            <button class="ghost" (click)="auth.logout()">Salir</button>
          </ng-container>
          <ng-template #anon>
            <a routerLink="/login" class="login-link">Ingresar</a>
            <a routerLink="/register"><button class="primary">Registrate</button></a>
          </ng-template>
        </div>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer>
      <div class="foot-inner">
        <span class="foot-logo">mass.</span>
        <span class="foot-claim">CASER&#64;, A MI NADIE ME GANA</span>
        <span class="foot-meta">&copy; 2026 - Compania Hard Discount</span>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .topbar { background: var(--mass-yellow); border-bottom: 4px solid var(--mass-navy); }
    .topbar-inner {
      max-width: 1280px; margin: 0 auto; padding: 0.6rem 1.5rem;
      display: flex; align-items: center; justify-content: space-between;
      gap: 1.5rem; flex-wrap: wrap;
    }

    .brand { display: flex; flex-direction: column; gap: 0; line-height: 1; }
    .logo { font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; color: var(--mass-navy); }
    .logo .dot { color: var(--mass-red); }
    .claim { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; color: var(--mass-navy); text-transform: uppercase; }

    .primary-nav { display: flex; gap: 1.4rem; flex-wrap: wrap; }
    .primary-nav a {
      color: var(--mass-navy); font-weight: 800; text-transform: uppercase;
      font-size: 0.85rem; letter-spacing: 0.04em; padding: 0.4rem 0;
      border-bottom: 3px solid transparent;
    }
    .primary-nav a.active, .primary-nav a:hover { border-bottom-color: var(--mass-red); color: var(--mass-navy); }

    .user-area { display: flex; align-items: center; gap: 0.75rem; }

    .cart-link {
      position: relative;
      background: var(--mass-navy); color: #fff;
      width: 38px; height: 38px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 800;
    }
    .cart-link:hover { background: var(--mass-red); }
    .cart-badge {
      position: absolute; top: -6px; right: -6px;
      background: var(--mass-red); color: #fff;
      min-width: 20px; height: 20px; border-radius: 999px;
      font-size: 0.7rem; font-weight: 900;
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0 0.35rem; border: 2px solid var(--mass-yellow);
    }
    .orders-link { font-size: 0.9rem; }
    .login-link { font-size: 0.9rem; }
    .user-pill { background: var(--mass-navy); color: #fff; padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    main { max-width: 1280px; margin: 0 auto; padding: 1.5rem; }

    footer { background: var(--mass-navy); color: #fff; margin-top: 3rem; }
    .foot-inner { max-width: 1280px; margin: 0 auto; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .foot-logo { font-weight: 900; font-size: 1.4rem; color: var(--mass-yellow); }
    .foot-claim { font-weight: 800; letter-spacing: 0.06em; }
    .foot-meta { font-size: 0.8rem; opacity: 0.7; }
  `],
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.cart.refresh().subscribe({ error: () => {} });
      }
    });
  }
}
