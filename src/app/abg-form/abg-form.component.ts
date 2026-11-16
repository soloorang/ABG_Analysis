import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AbgValues, AbgRanges } from '../abg.model';
import { AbgService } from '../abg.service';

@Component({
  selector: 'app-abg-form',
  templateUrl: './abg-form.component.html',
  styleUrls: ['./abg-form.component.css']
})
export class AbgFormComponent implements OnInit, OnDestroy {
  genders: string[] = ['Female', 'Male', 'Other'];

  patientForm = new FormGroup({
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(120)]),
    gender: new FormControl('', { nonNullable: true, validators: Validators.required }),
    heightCm: new FormControl<number | null>(null, [Validators.required, Validators.min(50), Validators.max(250)]),
    weightKg: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(300)])
  });

  abg!: AbgValues;
  ranges!: AbgRanges;

  private patientSub!: Subscription;
  private abgSub!: Subscription;

  constructor(private abgService: AbgService, private router: Router) {}

  ngOnInit(): void {
    this.ranges = this.abgService.getRanges();

    this.patientSub = this.abgService.getPatient().subscribe(patient => {
      this.patientForm.reset(patient);
    });
    this.abgSub = this.abgService.getAbg().subscribe(abg => {
      this.abg = abg;
    });
  }

  ngOnDestroy(): void {
    this.patientSub.unsubscribe();
    this.abgSub.unsubscribe();
  }

  loadExample(): void {
    this.abgService.loadExample();
  }

  clearAll(): void {
    this.abgService.clearAll();
  }

  canInterpret(): boolean {
    return this.abgService.canInterpret();
  }

  interpret(): void {
    this.abgService.updatePatient(this.patientForm.getRawValue());
    this.abgService.interpret();
    this.router.navigate(['/result']);
  }
}
