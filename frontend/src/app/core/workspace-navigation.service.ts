import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WorkspaceNavigationService {
  private readonly activeTabSignal = signal(0);
  readonly activeTab = this.activeTabSignal.asReadonly();

  go(index: number) {
    this.activeTabSignal.set(index);
  }
}
