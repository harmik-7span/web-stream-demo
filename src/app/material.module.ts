import {NgModule} from "@angular/core";
import { CommonModule } from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatInputModule} from '@angular/material/input';
import { MatFormFieldModule } from "@angular/material/form-field";
import {MatGridListModule} from '@angular/material/grid-list';


@NgModule({
  imports: [
  CommonModule, 
  MatButtonModule, 
  MatCardModule,
  MatInputModule,
  MatIconModule,
  MatProgressSpinnerModule,
  MatFormFieldModule,
  MatGridListModule
  ],
  exports: [
    CommonModule, 
    MatButtonModule, 
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatGridListModule
   ],
})
export class MaterialModule { }