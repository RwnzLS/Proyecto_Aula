import { ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { credentialsInterceptor, errorInterceptor } from './app/core/interceptors';
import { GlobalErrorHandler } from './app/core/global-error-handler';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAnimations(),
    provideHttpClient(withInterceptors([credentialsInterceptor, errorInterceptor])),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
