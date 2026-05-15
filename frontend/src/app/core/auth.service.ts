import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface LoginResponse { access: string; refresh: string; }

const ACCESS_KEY = 'cm_access';
const REFRESH_KEY = 'cm_refresh';
const USER_KEY = 'cm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<AuthUser | null>(this.readUser());

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(ACCESS_KEY, res.access);
        localStorage.setItem(REFRESH_KEY, res.refresh);
        this.fetchMe();
      }),
    );
  }

  register(payload: { email: string; password: string; first_name?: string; last_name?: string; phone?: string }) {
    return this.http.post<AuthUser>('/api/auth/register', payload);
  }

  fetchMe() {
    this.http.get<AuthUser>('/api/me').subscribe({
      next: (u) => {
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        this.user.set(u);
      },
      error: () => this.logout(),
    });
  }

  logout() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.router.navigateByUrl('/catalog');
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as AuthUser; } catch { return null; }
  }
}
