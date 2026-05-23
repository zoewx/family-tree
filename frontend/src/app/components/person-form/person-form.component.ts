import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PersonDTO } from '../../services/api.service';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NzModalModule, NzInputModule, NzButtonModule, NzFormModule, NzSelectModule, NzAlertModule, NzInputNumberModule, NzGridModule],
  template: `
    <nz-modal [nzVisible]="true" nzTitle="Add New Person"
              (nzOnCancel)="close.emit()" (nzOnOk)="save()"
              nzOkText="Add Person" [nzOkLoading]="saving">
      <ng-container *nzModalContent>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>姓 (Family Name) *</nz-form-label>
              <nz-form-control>
                <input nz-input [(ngModel)]="formData.lastName" placeholder="e.g. 王">
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>名 (Given Name) *</nz-form-label>
              <nz-form-control>
                <input nz-input [(ngModel)]="formData.firstName" placeholder="e.g. 小明">
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-form-item>
          <nz-form-label>English Name</nz-form-label>
          <nz-form-control>
            <input nz-input [(ngModel)]="formData.englishName" placeholder="e.g. Michael Wang">
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Gender</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="formData.gender" nzPlaceHolder="Select gender" nzAllowClear>
              <nz-option nzValue="MALE" nzLabel="Male"></nz-option>
              <nz-option nzValue="FEMALE" nzLabel="Female"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>Birth Date</nz-form-label>
              <nz-form-control>
                <input nz-input [(ngModel)]="formData.birthDate" type="date">
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>Death Date</nz-form-label>
              <nz-form-control>
                <input nz-input [(ngModel)]="formData.deathDate" type="date">
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-form-item>
          <nz-form-label>Father</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="formData.fatherId" nzPlaceHolder="None" nzAllowClear>
              <nz-option *ngFor="let p of getMales()" [nzValue]="p.id"
                         [nzLabel]="(p.lastName || '') + (p.firstName || '') + (p.englishName ? ' (' + p.englishName + ')' : '')"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Mother</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="formData.motherId" nzPlaceHolder="None" nzAllowClear>
              <nz-option *ngFor="let p of getFemales()" [nzValue]="p.id"
                         [nzLabel]="(p.lastName || '') + (p.firstName || '') + (p.englishName ? ' (' + p.englishName + ')' : '')"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Spouse</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="formData.spouseId" nzPlaceHolder="None" nzAllowClear>
              <nz-option *ngFor="let p of persons" [nzValue]="p.id"
                         [nzLabel]="(p.lastName || '') + (p.firstName || '') + (p.englishName ? ' (' + p.englishName + ')' : '')"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Generation</nz-form-label>
          <nz-form-control>
            <nz-input-number [(ngModel)]="formData.generation" [nzMin]="0" style="width:100%;"></nz-input-number>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Bio</nz-form-label>
          <nz-form-control>
            <textarea nz-input [(ngModel)]="formData.bio" [nzAutosize]="{ minRows: 3 }"
                      placeholder="Short biography..."></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-alert *ngIf="error" nzType="error" [nzMessage]="error" nzShowIcon></nz-alert>
      </ng-container>
    </nz-modal>
  `
})
export class PersonFormComponent {
  @Input() treeId = '';
  @Input() persons: PersonDTO[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData: any = {
    firstName: '',
    lastName: '',
    englishName: '',
    gender: '',
    birthDate: null,
    deathDate: null,
    fatherId: null,
    motherId: null,
    spouseId: null,
    generation: 0,
    bio: ''
  };
  error = '';
  saving = false;

  constructor(private api: ApiService) {}

  getMales(): PersonDTO[] {
    return this.persons.filter(p => p.gender === 'MALE');
  }

  getFemales(): PersonDTO[] {
    return this.persons.filter(p => p.gender === 'FEMALE');
  }

  save(): void {
    if (!this.formData.lastName?.trim() && !this.formData.firstName?.trim()) {
      this.error = '姓或名至少填写一项 / Name is required';
      return;
    }
    this.saving = true;
    this.error = '';
    const data = { ...this.formData };
    if (!data.gender) delete data.gender;
    if (!data.birthDate) delete data.birthDate;
    if (!data.deathDate) delete data.deathDate;

    this.api.createPerson(this.treeId, data).subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create person';
        this.saving = false;
      }
    });
  }
}
