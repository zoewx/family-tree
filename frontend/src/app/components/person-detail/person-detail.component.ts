import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PersonDTO, PhotoItem } from '../../services/api.service';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NzDrawerModule, NzButtonModule, NzAvatarModule, NzDescriptionsModule, NzCardModule, NzListModule, NzInputModule, NzFormModule, NzTypographyModule, NzPopconfirmModule, NzSpaceModule, NzDividerModule, NzUploadModule, NzIconModule, NzModalModule],
  template: `
    <nz-drawer [nzVisible]="true" nzPlacement="right" nzTitle="Person Details"
               (nzOnClose)="close.emit()" [nzWidth]="420">
      <ng-container *nzDrawerContent>

        <!-- === View Mode === -->
        <ng-container *ngIf="!showEdit">
          <!-- Photo & Name -->
          <div style="text-align:center;margin-bottom:24px;position:relative;">
            <div *ngIf="canEdit" style="position:absolute;top:0;right:0;display:flex;gap:4px;">
              <input #avatarInput type="file" accept="image/*" (change)="uploadPhoto($event)" style="display:none;">
              <button nz-button nzShape="circle" nzSize="small" nz-tooltip nzTooltipTitle="Change Avatar" (click)="avatarInput.click()">
                <span nz-icon nzType="user" nzTheme="outline"></span>
              </button>
              <input #galleryInput type="file" accept="image/*" (change)="uploadGalleryPhoto($event)" style="display:none;">
              <button nz-button nzShape="circle" nzSize="small" nz-tooltip nzTooltipTitle="Add Gallery Photo" (click)="galleryInput.click()">
                <span nz-icon nzType="picture" nzTheme="outline"></span>
              </button>
            </div>
            <nz-avatar [nzSize]="80"
                       [nzSrc]="person.photoUrl || ''"
                       [nzText]="person.gender === 'MALE' ? '👨' : '👩'"
                       style="margin-bottom:12px;">
            </nz-avatar>
            <h3 nz-typography style="margin:0;">{{ person.lastName }}{{ person.firstName }}</h3>
            <p *ngIf="person.englishName" nz-typography nzType="secondary" style="margin:0;font-size:13px;">{{ person.englishName }}</p>
            <p nz-typography nzType="secondary">
              {{ person.gender === 'MALE' ? 'Male' : 'Female' }}
              <span *ngIf="person.birthDate"> · Born {{ person.birthDate }}</span>
              <span *ngIf="person.deathDate"> · Died {{ person.deathDate }}</span>
            </p>
          </div>

          <!-- Gallery Photos -->
          <div *ngIf="person.galleryPhotos && person.galleryPhotos.length > 0" style="margin-bottom:16px;">
            <nz-divider nzText="Recent Photos" nzOrientation="left" style="margin:8px 0 12px;"></nz-divider>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              <div *ngFor="let photo of person.galleryPhotos" style="position:relative;">
                <img [src]="photo.url" (click)="previewImage(photo.url)"
                     style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #eee;" />
                <button *ngIf="canEdit" nz-button nzDanger nzSize="small" nzShape="circle"
                        style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;min-width:20px;padding:0;font-size:10px;line-height:20px;"
                        (click)="deleteGalleryPhotoItem(photo.id)">
                  <span nz-icon nzType="close" nzTheme="outline"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <p *ngIf="person.bio" nz-typography nzType="secondary" style="margin-bottom:16px;">{{ person.bio }}</p>

          <!-- Contact & Location -->
          <div *ngIf="person.phone || person.email || person.country || person.province || person.city" style="margin-bottom:16px;">
            <nz-divider nzText="Contact & Location" nzOrientation="center" style="margin:8px 0 12px;"></nz-divider>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              <div *ngIf="person.phone" style="display:flex;align-items:center;gap:8px;">
                <span nz-icon nzType="phone" nzTheme="outline" style="color:#007AFF;"></span> {{ person.phone }}
              </div>
              <div *ngIf="person.email" style="display:flex;align-items:center;gap:8px;">
                <span nz-icon nzType="mail" nzTheme="outline" style="color:#FF9500;"></span> {{ person.email }}
              </div>
              <div *ngIf="person.country || person.province || person.city" style="display:flex;align-items:center;gap:8px;">
                <span nz-icon nzType="environment" nzTheme="outline" style="color:#34C759;"></span>
                {{ person.city }}{{ person.city && person.province ? ', ' : '' }}{{ person.province }}{{ (person.city || person.province) && person.country ? ', ' : '' }}{{ person.country }}
              </div>
            </div>
          </div>

          <!-- Parents -->
          <nz-card *ngIf="person.fatherName || person.motherName" nzSize="small" nzTitle="Parents" style="margin-bottom:12px;">
            <div *ngIf="person.fatherName" class="relation-item" (click)="navigateToPerson.emit(person.fatherId)">
              <nz-avatar [nzSize]="32" nzIcon="man" style="background:linear-gradient(135deg,#007AFF,#5856D6);font-size:16px;display:flex;align-items:center;justify-content:center;"></nz-avatar>
              <div><div class="relation-name">{{ person.fatherName }}</div><div class="relation-role">Father</div></div>
            </div>
            <div *ngIf="person.motherName" class="relation-item" (click)="navigateToPerson.emit(person.motherId)">
              <nz-avatar [nzSize]="32" nzIcon="woman" style="background:linear-gradient(135deg,#FF2D55,#FF6482);font-size:16px;display:flex;align-items:center;justify-content:center;"></nz-avatar>
              <div><div class="relation-name">{{ person.motherName }}</div><div class="relation-role">Mother</div></div>
            </div>
          </nz-card>

          <!-- Spouse -->
          <nz-card *ngIf="person.spouseName" nzSize="small" nzTitle="Spouse" style="margin-bottom:12px;">
            <div class="relation-item" (click)="navigateToPerson.emit(person.spouseId)">
              <nz-avatar [nzSize]="32" nzIcon="heart" style="background:linear-gradient(135deg,#FF2D55,#FF6482);font-size:16px;display:flex;align-items:center;justify-content:center;"></nz-avatar>
              <div><div class="relation-name">{{ person.spouseName }}</div></div>
            </div>
          </nz-card>

          <!-- Siblings -->
          <nz-card *ngIf="person.siblings && person.siblings.length > 0" nzSize="small"
                   [nzTitle]="'Siblings (' + person.siblings.length + ')'" style="margin-bottom:12px;">
            <div *ngFor="let sibling of person.siblings" class="relation-item" (click)="navigateToPerson.emit(sibling.id)">
              <nz-avatar [nzSize]="32" [nzIcon]="sibling.gender === 'MALE' ? 'man' : 'woman'"
                         [style.background]="sibling.gender === 'MALE' ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'linear-gradient(135deg,#FF2D55,#FF6482)'"
                         style="font-size:16px;display:flex;align-items:center;justify-content:center;"></nz-avatar>
              <div><div class="relation-name">{{ sibling.lastName }}{{ sibling.firstName }}</div></div>
            </div>
          </nz-card>

          <!-- Children -->
          <nz-card *ngIf="person.children && person.children.length > 0" nzSize="small"
                   [nzTitle]="'Children (' + person.children.length + ')'" style="margin-bottom:12px;">
            <div *ngFor="let child of person.children" class="relation-item" (click)="navigateToPerson.emit(child.id)">
              <nz-avatar [nzSize]="32" [nzIcon]="child.gender === 'MALE' ? 'man' : 'woman'"
                         [style.background]="child.gender === 'MALE' ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'linear-gradient(135deg,#FF2D55,#FF6482)'"
                         style="font-size:16px;display:flex;align-items:center;justify-content:center;"></nz-avatar>
              <div><div class="relation-name">{{ child.lastName }}{{ child.firstName }}</div></div>
            </div>
          </nz-card>

          <nz-divider></nz-divider>

          <!-- Edit / Delete -->
          <nz-space *ngIf="canEdit" style="width:100%;">
            <button *nzSpaceItem nz-button nzBlock (click)="showEdit = true">
              <span nz-icon nzType="edit" nzTheme="outline"></span> Edit
            </button>
            <button *nzSpaceItem nz-button nzDanger nzBlock (click)="confirmDelete()">
              <span nz-icon nzType="delete" nzTheme="outline"></span> Delete
            </button>
          </nz-space>

          <!-- Link Account -->
          <div *ngIf="!person.linkedUserId" style="margin-top:12px;">
            <button *ngIf="isOwner" nz-button nzBlock (click)="linkAccount()">
              <span nz-icon nzType="user" nzTheme="outline"></span> This is me — Link my account
            </button>
            <button *ngIf="!isOwner" nz-button nzBlock (click)="requestLinkAccount()" [nzLoading]="linkRequesting">
              <span nz-icon nzType="user" nzTheme="outline"></span> This is me — Request to link
            </button>
          </div>
        </ng-container>

        <!-- === Edit Mode === -->
        <div *ngIf="showEdit && canEdit">
          <h4 nz-typography style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
            <span nz-icon nzType="edit" nzTheme="outline" style="color:var(--brand-color);"></span> Edit Person
          </h4>
          <nz-form-item>
            <nz-form-label>姓 (Family Name)</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.lastName" placeholder="e.g. 王"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>名 (Given Name)</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.firstName" placeholder="e.g. 小明"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>English Name</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.englishName" placeholder="e.g. Michael Wang"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Bio</nz-form-label>
            <nz-form-control><textarea nz-input [(ngModel)]="editData.bio" [nzAutosize]="{ minRows: 2 }"></textarea></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Birth Date</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.birthDate" type="date"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Death Date</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.deathDate" type="date"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Phone</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.phone" placeholder="e.g. +1 234-567-8900"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Email</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.email" placeholder="e.g. john@example.com"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Country</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.country" placeholder="e.g. Canada"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Province</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.province" placeholder="e.g. Ontario"></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>City</nz-form-label>
            <nz-form-control><input nz-input [(ngModel)]="editData.city" placeholder="e.g. Toronto"></nz-form-control>
          </nz-form-item>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <button nz-button nzBlock (click)="showEdit = false">
              <span nz-icon nzType="close" nzTheme="outline"></span> Cancel
            </button>
            <button nz-button nzType="primary" nzBlock (click)="saveEdit()">
              <span nz-icon nzType="save" nzTheme="outline"></span> Save
            </button>
          </div>
        </div>

      </ng-container>
    </nz-drawer>

    <!-- Image Preview Modal -->
    <nz-modal [(nzVisible)]="previewVisible" [nzFooter]="null" (nzOnCancel)="previewVisible = false" [nzWidth]="600">
      <ng-container *nzModalContent>
        <img [src]="previewUrl" style="width:100%;" />
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .relation-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .relation-item:hover {
      background: rgba(0,0,0,0.04);
    }
    :host-context(body.dark-theme) .relation-item:hover {
      background: rgba(255,255,255,0.06);
    }
    .relation-item + .relation-item {
      margin-top: 4px;
    }
    .relation-name {
      font-size: 14px;
      font-weight: 500;
    }
    .relation-role {
      font-size: 12px;
      opacity: 0.45;
    }
  `]
})
export class PersonDetailComponent {
  @Input() person!: PersonDTO;
  @Input() treeId = '';
  @Input() canEdit = false;
  @Input() isOwner = false;
  @Output() close = new EventEmitter<void>();
  @Output() personUpdated = new EventEmitter<void>();
  @Output() navigateToPerson = new EventEmitter<string>();

  showEdit = false;
  editData: any = {};
  previewVisible = false;
  previewUrl = '';
  linkRequesting = false;

  constructor(private api: ApiService, private message: NzMessageService, private modal: NzModalService) {}

  ngOnChanges(): void {
    this.showEdit = false;
    this.editData = {
      firstName: this.person.firstName,
      lastName: this.person.lastName,
      englishName: this.person.englishName,
      gender: this.person.gender,
      birthDate: this.person.birthDate,
      deathDate: this.person.deathDate,
      bio: this.person.bio,
      phone: this.person.phone,
      email: this.person.email,
      country: this.person.country,
      province: this.person.province,
      city: this.person.city,
      fatherId: this.person.fatherId,
      motherId: this.person.motherId,
      spouseId: this.person.spouseId,
      generation: this.person.generation
    };
  }

  uploadPhoto(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.api.uploadPhoto(this.treeId, this.person.id, file).subscribe({
      next: () => this.personUpdated.emit()
    });
  }

  saveEdit(): void {
    this.api.updatePerson(this.treeId, this.person.id, this.editData).subscribe({
      next: () => {
        this.showEdit = false;
        this.personUpdated.emit();
      }
    });
  }

  confirmDelete(): void {
    this.modal.confirm({
      nzTitle: 'Delete this person?',
      nzContent: 'Are you sure you want to remove this person?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => this.doDelete()
    });
  }

  doDelete(): void {
    this.api.deletePerson(this.treeId, this.person.id, false).subscribe({
      next: () => {
        this.close.emit();
        this.personUpdated.emit();
      },
      error: (err) => {
        const msg = err?.error?.message || '';
        if (msg.startsWith('PERSON_HAS_CHILDREN:')) {
          const count = msg.split(':')[1];
          this.modal.confirm({
            nzTitle: 'This person has children',
            nzContent: `This person has ${count} child(ren). Deleting will also remove all descendants. Are you sure?`,
            nzOkText: 'Delete All',
            nzOkDanger: true,
            nzCancelText: 'Cancel',
            nzOnOk: () => {
              this.api.deletePerson(this.treeId, this.person.id, true).subscribe({
                next: () => {
                  this.close.emit();
                  this.personUpdated.emit();
                },
                error: (e2) => {
                  this.message.error(e2?.error?.message || 'Failed to delete');
                }
              });
            }
          });
        } else if (msg.includes('Access denied')) {
          this.message.error('You do not have permission to delete this person.');
        } else {
          this.message.error(msg || 'Failed to delete person');
        }
      }
    });
  }

  uploadGalleryPhoto(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.api.uploadGalleryPhoto(this.treeId, this.person.id, file).subscribe({
      next: () => this.personUpdated.emit()
    });
  }

  deleteGalleryPhotoItem(photoId: string): void {
    this.modal.confirm({
      nzTitle: 'Delete this photo?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.api.deleteGalleryPhoto(this.treeId, this.person.id, photoId).subscribe({
          next: () => this.personUpdated.emit()
        });
      }
    });
  }

  previewImage(url: string): void {
    this.previewVisible = true;
    this.previewUrl = url;
  }

  requestLinkAccount(): void {
    this.linkRequesting = true;
    this.api.requestLink(this.treeId, this.person.id).subscribe({
      next: () => {
        this.linkRequesting = false;
        this.message.success('Link request sent! Waiting for owner approval.');
      },
      error: (err) => {
        this.linkRequesting = false;
        this.message.error(err?.error?.message || 'Failed to send link request');
      }
    });
  }

  linkAccount(): void {
    this.api.linkUserToPerson(this.treeId, this.person.id).subscribe({
      next: () => this.personUpdated.emit()
    });
  }
}
