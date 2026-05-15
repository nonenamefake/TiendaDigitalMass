import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth">
      <div class="card">
        <h2>Crea tu cuenta</h2>
        <p class="muted">!Caser&#64;, a mi nadie me gana!</p>
        <form (ngSubmit)="submit()">
          <label>
            <span>Email</span>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="tu&#64;correo.com" />
          </label>
          <div class="row">
            <label>
              <span>Nombres</span>
              <input type="text" [(ngModel)]="form.first_name" name="first_name" />
            </label>
            <label>
              <span>Apellidos</span>
              <input type="text" [(ngModel)]="form.last_name" name="last_name" />
            </label>
          </div>
          <label>
            <span>Telefono</span>
            <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="999111222" />
          </label>
          <label>
            <span>Contrasena</span>
            <input type="password" [(ngModel)]="form.password" name="password" required minlength="8" placeholder="Minimo 8 caracteres" />
          </label>
          <button class="primary block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creando...' : 'Crear cuenta' }}
          </button>
          <p class="err" *ngIf="error()">{{ error() }}</p>
          <p class="alt">Ya tienes cuenta? <a routerLink="/login">Inicia sesion</a></p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .auth { max-width: 520px; margin: 2.5rem auto; }
    .card { border: 4px solid var(--mass-navy); padding: 1.8rem; }
    h2 { margin-top: 0; }
    form { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem; }
    label { display: flex; flex-direction: column; gap: 0.3rem; }
    label span { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .block { width: 100%; padding: 0.85rem; font-size: 1rem; margin-top: 0.5rem; }
    .alt { text-align: center; font-weight: 600; margin-top: 0.5rem; }
  `],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = { email: '', first_name: '', last_name: '', phone: '', password: '' };
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.loading.set(true);
    this.auth.register(this.form).subscribe({
      next: () => {
        this.auth.login(this.form.email, this.form.password).subscribe({
          next: () => { this.loading.set(false); this.router.navigateByUrl('/catalog'); },
          error: () => this.loading.set(false),
        });
      },
      error: (e) => {
        this.loading.set(false);
        const errs = e?.error || {};
        const msg = Object.entries(errs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        this.error.set(msg || 'No se pudo crear la cuenta');
      },
    });
  }
}
