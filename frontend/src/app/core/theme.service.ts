import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'inventario.theme';
  private readonly darkSignal = signal(false);
  readonly isDark = this.darkSignal.asReadonly();

  constructor() {
    this.loadTheme();
  }

  toggle() {
    this.setTheme(!this.darkSignal());
  }

  label() {
    return this.darkSignal() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(savedTheme ? savedTheme === 'dark' : prefersDark, false);
  }

  private setTheme(isDark: boolean, persist = true) {
    this.darkSignal.set(isDark);
    document.body.classList.toggle('theme-dark', isDark);

    if (persist) {
      localStorage.setItem(this.key, isDark ? 'dark' : 'light');
    }
  }
}
