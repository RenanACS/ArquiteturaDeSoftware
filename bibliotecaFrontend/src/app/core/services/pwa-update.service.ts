import { Injectable, inject, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private toast = inject(ToastService);
  private appRef = inject(ApplicationRef);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    // Detecta nova versão disponível e recarrega automaticamente
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.info('Nova versão disponível — atualizando...');
        setTimeout(() => {
          this.swUpdate.activateUpdate().then(() => location.reload());
        }, 1500);
      });

    // Verifica atualização quando o app estabiliza
    this.appRef.isStable
      .pipe(filter(stable => stable))
      .subscribe(() => this.swUpdate.checkForUpdate());
  }
}
