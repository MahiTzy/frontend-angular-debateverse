import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

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

  baseUrl: String = "https://backend-springboot-debateverse.onrender.com";

  register(user: any) {
    return this._http.post(`${this.baseUrl}`, user);
  }

  login(user: any) {
    return this._http.post(`${this.baseUrl}/auth/generate-token`, user);
  }

  forgotPassword(email: string) {
    return this._http
      .post(`${this.baseUrl}/auth/forgot-password`, null, {
        params: { email },
      })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this._snack.open(res.message, 'Close', {
              duration: 3000,
            });
          } else {
            this._snack.open(res.message, 'Close', {
              duration: 3000,
            });
          }
        },
        error: (err) => {
          console.log(err);
          this._snack.open(err.error.message || 'Service Error!', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  validateResetToken(token: string): Observable<any> {
    return this._http.get(
      `${this.baseUrl}/auth/reset-password?token=${token}`
    );
  }

  validateEmailToken(token: string): Observable<any> {
    return this._http.get(
      `${this.baseUrl}/auth/verify-email?token=${token}`
    );
  }

  resetPassword(newPassword: string, token: string) {
    return this._http.post(`${this.baseUrl}/auth/reset-password`, null, {
      params: {
        token,
        newPassword,
      },
    });
  }
  fetchUser(userId: any) {
    return this._http
      .get(`${this.baseUrl}/auth/get-user`, {
        params: { userId },
      })
      .pipe(
        tap((res: any) => {
          console.log(res);
          localStorage.setItem('user', JSON.stringify(res));
        })
      );
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRole() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }

  isLoggedIn() {
    const user = localStorage.getItem('user');
    if (user) {
      return true;
    }
    return false;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.loggedIn$.next(false);
    this._snack.open('Logged Out', 'Close', {
      duration: 3000,
    });
  }
}
