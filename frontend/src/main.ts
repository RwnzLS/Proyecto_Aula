import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_INITIALIZER } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { credentialsInterceptor, errorInterceptor } from './app/core/interceptors';
import { AuthService } from './app/core/auth.service';

// Antes de levantar el router, si localStorage sugiere una sesion se revalida contra la
// cookie HttpOnly. Asi el roleGuard parte de un estado coherente y se evita entrar a una
// ruta protegida con una cookie ya expirada (lo que disparaba la cascada de 401 -> login).
function verifySessionOnBootstrap(auth: AuthService): () => Promise<unknown> {
  return () => (auth.isLoggedIn() ? firstValueFrom(auth.verifySession()) : Promise.resolve());
}

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([credentialsInterceptor, errorInterceptor])),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: verifySessionOnBootstrap,
      deps: [AuthService]
    }
  ]
}).catch(err => console.error(err));
