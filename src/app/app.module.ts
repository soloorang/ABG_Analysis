import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AbgResultComponent } from './abg-result/abg-result.component';
import { AbgFormComponent } from './abg-form/abg-form.component';
import { AbgFieldComponent } from './abg-field/abg-field.component';

const routes: Routes = [
  { path: '', component: AbgFormComponent },
  { path: 'result', component: AbgResultComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    AbgResultComponent,
    AbgFormComponent,
    AbgFieldComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
