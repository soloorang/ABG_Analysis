import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AbgResult } from '../abg.model';
import { Patient } from '../patient.model';
import { AbgService } from '../abg.service';

@Component({
  selector: 'app-abg-result',
  templateUrl: './abg-result.component.html',
  styleUrls: ['./abg-result.component.css']
})
export class AbgResultComponent implements OnInit, OnDestroy {



  
  result: AbgResult | null = null;
  patient!: Patient;
  bmi: number | null = null;

  private resultSub!: Subscription;
  private patientSub!: Subscription;

  constructor(private abgService: AbgService, private router: Router) {}

  ngOnInit(): void {
    this.patientSub = this.abgService.getPatient().subscribe(patient => {
      this.patient = patient;
      this.bmi = this.abgService.getBmi();
    });

    this.resultSub = this.abgService.getResult().subscribe(result => {
      this.result = result;
      if (result === null) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    this.resultSub.unsubscribe();
    this.patientSub.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
