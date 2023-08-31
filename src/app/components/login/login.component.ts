import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SignalrService } from 'src/app/signalr.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  streamKey: string | undefined;
  password: string | undefined;
  loginForm!:FormGroup;
  constructor(private router: Router,
    private signalrService:SignalrService) { }

  
  
    ngOnInit() {
      this.loginForm = new FormGroup({
        streamKey :new FormControl('',Validators.required),
      })
    }
  
    onSubmit() : void {
      console.log(this.loginForm);
      if(this.loginForm.invalid){
        this.loginForm.markAllAsTouched()
      }else{
        this.signalrService.createRoom(this.loginForm.get('streamKey')?.value)
        this.router.navigate(['main-layout'])
      }
    }
    
}
