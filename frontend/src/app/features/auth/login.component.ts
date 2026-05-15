import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth">
      <div class="card">
        <h2>Ingresa a Mass</h2>
        <p class="muted">Aprovecha los precios bajos del barrio.</p>
        <form (ngSubmit)="submit()">
          <label>
            <span>Email</span>
            <input type="email" [(ngModel)]="email" name="email" required autocomplete="email" placeholder="tu&#64;correo.com" />
          </label>
          <label>
            <span>Contrasena</span>
            <input type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" placeholder="********" />
          </label>
          <button class="primary block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
          <p class="err" *ngIf="error()">{{ error() }}</p>
          <p class="alt">Sin cuenta? <a routerLink="/register">Registrate aqui</a></p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .auth { max-width: 460px; margin: 2.5rem auto; }
    .card { border: 4px solid var(--mass-navy); padding: 1.8rem; }
    h2 { margin-top: 0; }
    form { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem; }
    label { display: flex; flex-direction: column; gap: 0.3rem; }
    label span { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    .block { width: 100%; padding: 0.85rem; font-size: 1rem; margin-top: 0.5rem; }
    .alt { text-align: center; font-weight: 600; margin-top: 0.5rem; }
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.loading.set(false); this.router.navigateByUrl('/catalog'); },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.detail || 'No se pudo iniciar sesion');
      },
    });
  }
}
