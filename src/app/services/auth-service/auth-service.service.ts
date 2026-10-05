import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const BASE_URL = 'https://test.hackshack.me/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthServiceService {
  constructor(
    private _http: HttpClient,
    private _snack: MatSnackBar,
    private _router: Router
  ) {}

  loggedIn$ = new BehaviorSubject<boolean>(this.isLoggedIn());

  isLoggedIn$ = this.loggedIn$.asObservable();

  register(user: any) {
    return this._http.post(`${BASE_URL}/register`, user);
  }

  login(user: any) {
    return this._http.post(`${BASE_URL}/generate-token`, user);
  }

  forgotPassword(email: string) {
    return this._http
      .post(`${BASE_URL}/forgot-password`, null, {
        params: { email },
      })
      .subscribe({
        next: (res: any) => {
          this._snack.open(res.message, 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.log(err);
          this._snack.open(err.error?.message || 'Service Error!', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  validateResetToken(token: string): Observable<any> {
    return this._http.get(`${BASE_URL}/reset-password`, {
      params: { token },
    });
  }

  validateEmailToken(token: string): Observable<any> {
    return this._http.get(`${BASE_URL}/verify-email`, {
      params: { token },
    });
  }

  resetPassword(newPassword: string, token: string) {
    return this._http.post(`${BASE_URL}/reset-password`, null, {
      params: { token, newPassword },
    });
  }

  fetchUser(userId: any) {
    return this._http
      .get(`${BASE_URL}/get-user`, {
        params: { userId },
      })
      .pipe(
        tap((res: any) => {
          localStorage.setItem('user', JSON.stringify(res));
        })
      );
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRole() {
    return this.getUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.loggedIn$.next(false);
    this._snack.open('Logged Out', 'Close', { duration: 3000 });
  }
}