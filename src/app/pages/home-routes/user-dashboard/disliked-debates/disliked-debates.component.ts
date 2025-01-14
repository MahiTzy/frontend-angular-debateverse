import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../../../services/auth-service/auth-service.service';
import { DebateService } from '../../../../services/debate-service/debate.service';

@Component({
  selector: 'app-disliked-debates',
  templateUrl: './disliked-debates.component.html',
  styleUrl: './disliked-debates.component.css'
})
export class DislikedDebatesComponent {
  constructor(
    private _debate: DebateService,
    private _auth: AuthServiceService,
    private _router: Router,
    private _snack: MatSnackBar
  ) {
    this._auth.isLoggedIn$.subscribe((res) => {
      if (!res) {
        this._router.navigate(['/login']);
        this._snack.open('Please login to continue', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  debates: any = [];

  userId: any;

  ngOnInit(): void {
    this.userId = this._auth.getUser().id;
    this._debate.getDislikedDebatesByUser(this.userId).subscribe((res: any) => {
      console.log(res);
      this.debates = res.filter((debate: any) => debate.public);
    });
  }
}
