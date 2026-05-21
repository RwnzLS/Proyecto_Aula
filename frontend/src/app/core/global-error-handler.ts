import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('[GlobalErrorHandler]', error);
    const msg = error?.message ?? String(error);
    const stack = error?.stack;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#b03832;color:#fff;padding:16px;font:14px/1.5 monospace;white-space:pre-wrap;max-height:50vh;overflow:auto;';
    el.textContent = `ERROR NO CAPTURADO: ${msg}${stack ? '\n\n' + stack : ''}`;
    document.body?.prepend(el);
  }
}
