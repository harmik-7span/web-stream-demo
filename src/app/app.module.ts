import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { SignalrService } from './signalr.service';
import { DataService } from './data.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainLayoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
    
  ],
  providers: [
    SignalrService,
    {
      provide: APP_INITIALIZER,
      useFactory: (signalrService: SignalrService) => () => signalrService.initiateSignalrConnection(),
      deps: [SignalrService],
      multi: true,
    },
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
