import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient } from './patient.model';
import { AbgValues, AbgResult, AbgRange, AbgRanges } from './abg.model';

@Injectable({
  providedIn: 'root'
})

export class AbgService {
  private patient$ = new BehaviorSubject<Patient>(this.getSamplePatient());
  private abg$ = new BehaviorSubject<AbgValues>(this.getSampleAbg());
  private result$ = new BehaviorSubject<AbgResult | null>(null);

  private ranges: AbgRanges = {
    ph:    { label: 'pH',           low: 7.35, high: 7.45, min: 6.8, max: 7.8 },
    paco2: { label: 'PaCO2 (mmHg)', low: 35,   high: 45,   min: 10,  max: 150 },
    pao2:  { label: 'PaO2 (mmHg)',  low: 80,   high: 100,  min: 20,  max: 600 },
    hco3:  { label: 'HCO3 (mEq/L)', low: 22,   high: 26,   min: 3,   max: 60 },
    sao2:  { label: 'SaO2 (%)',     low: 95,   high: 100,  min: 30,  max: 100 }
  };

  private advice = {
    respAcidosis: 'Respiratory acidosis: improve ventilation. Treat the cause (e.g. COPD, opioids or sedation) and consider BiPAP if severe.',
    respAlkalosis: 'Respiratory alkalosis: treat the cause of hyperventilation (pain, anxiety, hypoxia, sepsis).',
    metAcidosis: 'Metabolic acidosis: calculate the anion gap and treat the cause (e.g. DKA, lactic acidosis, kidney failure).',
    metAlkalosis: 'Metabolic alkalosis: correct fluid, chloride and potassium loss (e.g. vomiting, diuretics).'
  };

  getPatient(): Observable<Patient> {
    return this.patient$.asObservable();
  }

  getAbg(): Observable<AbgValues> {
    return this.abg$.asObservable();
  }

  getResult(): Observable<AbgResult | null> {
    return this.result$.asObservable();
  }

  getRanges(): AbgRanges {
    return this.ranges;
  }

  updatePatient(patient: Patient): void {
    this.patient$.next(patient);
  }

  loadExample(): void {
    this.patient$.next(this.getSamplePatient());
    this.abg$.next(this.getSampleAbg());
    this.result$.next(null);
  }

  clearAll(): void {
    this.patient$.next({ age: null, gender: '', heightCm: null, weightKg: null });
    this.abg$.next({ ph: null, paco2: null, pao2: null, hco3: null, sao2: null });
    this.result$.next(null);
  }

  getError(value: number | null, range: AbgRange): string {
    if (value === null) {
      return '';
    }
    if (value < range.min) {
      return range.label + ' of ' + value + ' is too low to be physiologically possible (min ' + range.min + ').';
    }
    if (value > range.max) {
      return range.label + ' of ' + value + ' is too high to be physiologically possible (max ' + range.max + ').';
    }
    return '';
  }

  getFlag(value: number | null, range: AbgRange): string {
    if (value === null) {
      return '';
    }
    if (this.getError(value, range) !== '') {
      return 'impossible';
    }
    if (value < range.low) {
      return 'low';
    }
    if (value > range.high) {
      return 'high';
    }
    return 'normal';
  }

  canInterpret(): boolean {
    const a = this.abg$.value;
    if (a.ph === null || a.paco2 === null || a.pao2 === null || a.hco3 === null) {
      return false;
    }
    return this.getError(a.ph, this.ranges.ph) === ''
      && this.getError(a.paco2, this.ranges.paco2) === ''
      && this.getError(a.pao2, this.ranges.pao2) === ''
      && this.getError(a.hco3, this.ranges.hco3) === ''
      && this.getError(a.sao2, this.ranges.sao2) === '';
  }

  interpret(): void {
    const abg = this.abg$.value;
    if (abg.ph === null || abg.paco2 === null || abg.hco3 === null || abg.pao2 === null) {
      this.result$.next(null);
      return;
    }

    const phStatus = this.getPhStatus(abg.ph);                                       // Step 1
    const disorder = this.getDisorder(phStatus, abg.ph, abg.paco2, abg.hco3);        // Step 2
    const compensation = this.getCompensation(phStatus, disorder, abg.paco2, abg.hco3); // Step 3
    const oxygenation = this.getOxygenation(abg.pao2);                               // Step 4
    const treatment = this.getTreatment(disorder, oxygenation);

    this.result$.next({ phStatus, disorder, compensation, oxygenation, treatment });
  }

  //1)is the blood too acidic too basic or normal
  private getPhStatus(ph: number): string {
    if (ph < 7.35) {
      return 'Acidemia';
    }
    if (ph > 7.45) {
      return 'Alkalemia';
    }
    return 'Normal';
  }

  //2 what caused it? ROME
  private getDisorder(phStatus: string, ph: number, paco2: number, hco3: number): string {
    const co2High = paco2 > 45;
    const co2Low = paco2 < 35;
    const hco3High = hco3 > 26;
    const hco3Low = hco3 < 22;

    if (phStatus === 'Acidemia') {
      if (co2High && hco3Low) {
        return 'Mixed respiratory and metabolic acidosis';
      }
      if (co2High) {
        return 'Respiratory acidosis';
      }
      if (hco3Low) {
        return 'Metabolic acidosis';
      }
      return 'Acidemia with normal PaCO2 and HCO3 (check the values)';
    }

    if (phStatus === 'Alkalemia') {
      if (co2Low && hco3High) {
        return 'Mixed respiratory and metabolic alkalosis';
      }
      if (co2Low) {
        return 'Respiratory alkalosis';
      }
      if (hco3High) {
        return 'Metabolic alkalosis';
      }
      return 'Alkalemia with normal PaCO2 and HCO3 (check the values)';
    }

    if (co2High && hco3High) {
      return ph < 7.40 ? 'Respiratory acidosis' : 'Metabolic alkalosis';
    }
    if (co2Low && hco3Low) {
      return ph < 7.40 ? 'Metabolic acidosis' : 'Respiratory alkalosis';
    }
    if (co2High || co2Low || hco3High || hco3Low) {
      return 'Possible mixed disorder (pH normal but values abnormal)';
    }
    return 'Normal acid-base balance';
  }

  // 3) is the OTHER value moving the opposite way to fix the  pH
  private getCompensation(phStatus: string, disorder: string, paco2: number, hco3: number): string {
    let otherValueIsFixing: boolean;

    if (disorder === 'Respiratory acidosis') {
      otherValueIsFixing = hco3 > 26;
    } else if (disorder === 'Metabolic acidosis') {
      otherValueIsFixing = paco2 < 35;
    } else if (disorder === 'Respiratory alkalosis') {
      otherValueIsFixing = hco3 < 22;
    } else if (disorder === 'Metabolic alkalosis') {
      otherValueIsFixing = paco2 > 45;
    } else {
      return 'Not applicable';
    }

    if (phStatus === 'Normal') {
      return 'Fully compensated';
    }
    if (otherValueIsFixing) {
      return 'Partially compensated';
    }
    return 'Uncompensated';
  }

  // 4 how low is the oxygen
  private getOxygenation(pao2: number): string {
    if (pao2 < 40) {
      return 'Severe hypoxemia';
    }
    if (pao2 < 60) {
      return 'Moderate hypoxemia';
    }
    if (pao2 < 80) {
      return 'Mild hypoxemia';
    }
    return 'Normal oxygenation';
  }

  private getTreatment(disorder: string, oxygenation: string): string[] {
    const treatment: string[] = [];

    if (disorder === 'Respiratory acidosis') {
      treatment.push(this.advice.respAcidosis);
    } else if (disorder === 'Metabolic acidosis') {
      treatment.push(this.advice.metAcidosis);
    } else if (disorder === 'Respiratory alkalosis') {
      treatment.push(this.advice.respAlkalosis);
    } else if (disorder === 'Metabolic alkalosis') {
      treatment.push(this.advice.metAlkalosis);
    } else if (disorder === 'Mixed respiratory and metabolic acidosis') {
      treatment.push(this.advice.respAcidosis, this.advice.metAcidosis);
    } else if (disorder === 'Mixed respiratory and metabolic alkalosis') {
      treatment.push(this.advice.respAlkalosis, this.advice.metAlkalosis);
    } else if (disorder === 'Possible mixed disorder (pH normal but values abnormal)') {
      treatment.push('Look for a mixed disorder: calculate the anion gap and review the history.');
    } else if (disorder === 'Normal acid-base balance') {
      treatment.push('No acid-base treatment needed.');
    } else {
      treatment.push('Repeat the sample and check the values.');
    }

    if (oxygenation !== 'Normal oxygenation') {
      treatment.push('Give oxygen: target SpO2 94-98% (88-92% if at risk of CO2 retention, e.g. COPD).');
    }
    if (oxygenation === 'Severe hypoxemia') {
      treatment.push('Severe hypoxemia: escalate urgently and consider high-flow oxygen or ventilation.');
    }

    return treatment;
  }

  getBmi(): number | null {
    const patient = this.patient$.value;
    if (patient.heightCm === null || patient.weightKg === null) {
      return null;
    }
    const heightM = patient.heightCm / 100;
    const bmi = patient.weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  }

  private getSamplePatient(): Patient {
    return { age: 65, gender: 'Male', heightCm: 175, weightKg: 80 };
  }

  private getSampleAbg(): AbgValues {
    return { ph: 7.28, paco2: 55, pao2: 62, hco3: 25, sao2: 90 };
  }
}
