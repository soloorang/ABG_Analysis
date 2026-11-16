import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AbgRange } from '../abg.model';
import { AbgService } from '../abg.service';

@Component({
  selector: 'app-abg-field',
  templateUrl: './abg-field.component.html',
  styleUrls: ['./abg-field.component.css']
})
export class AbgFieldComponent {
  @Input() range!: AbgRange;
  @Input() value: number | null = null;

  @Output() valueChange = new EventEmitter<number | null>();

  constructor(private abgService: AbgService) {}

  onTyped(newValue: number | null): void {
    this.valueChange.emit(newValue);
  }

  getFlag(): string {
    return this.abgService.getFlag(this.value, this.range);
  }

  getError(): string {
    return this.abgService.getError(this.value, this.range);
  }
}
