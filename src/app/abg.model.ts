export interface AbgValues {
  ph: number | null;
  paco2: number | null;// mmHg
  pao2: number | null;// mmHg
  hco3: number | null; // mEq/L
  sao2: number | null;// %
}

export interface AbgRange {
  label: string;
  low: number;
  high: number;
  min: number;
  max: number;
}

export interface AbgResult {
  phStatus: string;
  disorder: string;
  compensation: string;
  oxygenation: string;
  treatment: string[];
}

export interface AbgRanges {
  ph: AbgRange;
  paco2: AbgRange;
  pao2: AbgRange;
  hco3: AbgRange;
  sao2: AbgRange;
}
