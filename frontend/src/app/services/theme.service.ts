import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = false;
  private linkEl: HTMLLinkElement | null = null;

  /** Emits after every theme change */
  readonly themeChanged$ = new Subject<boolean>();

  get isDark(): boolean {
    return this._isDark;
  }

  init(): void {
    const saved = localStorage.getItem('theme');
    this._isDark = saved === 'dark';
    this.applyTheme();
  }

  toggle(): void {
    this._isDark = !this._isDark;
    localStorage.setItem('theme', this._isDark ? 'dark' : 'light');
    this.applyTheme();
    this.themeChanged$.next(this._isDark);
  }

  private applyTheme(): void {
    const href = this._isDark
      ? 'ng-zorro-antd.dark.min.css'
      : 'ng-zorro-antd.min.css';

    if (!this.linkEl) {
      this.linkEl = document.createElement('link');
      this.linkEl.rel = 'stylesheet';
      this.linkEl.id = 'nz-theme';
      document.head.appendChild(this.linkEl);
    }
    this.linkEl.href = href;

    if (this._isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
