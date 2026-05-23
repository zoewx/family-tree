import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, FamilyTreeDTO, PersonDTO } from '../../services/api.service';
import { PersonDetailComponent } from '../../components/person-detail/person-detail.component';
import { PersonFormComponent } from '../../components/person-form/person-form.component';
import { ThemeService } from '../../services/theme.service';
import { OrgChart } from 'd3-org-chart';
import { Subscription } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzMessageService } from 'ng-zorro-antd/message';

interface ChartNode {
  id: string;
  parentId: string;
  chineseName: string;
  englishName: string;
  gender: string;
  photoUrl: string;
  birthDate: string;
  generation: number;
  spouseId: string;
  spouseChineseName: string;
  spouseEnglishName: string;
  spouseGender: string;
  spousePhotoUrl: string;
}

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, PersonDetailComponent, PersonFormComponent,
    NzButtonModule, NzCardModule, NzInputModule, NzModalModule, NzSpaceModule,
    NzAlertModule, NzTagModule, NzTypographyModule, NzUploadModule, NzTooltipModule,
    NzDividerModule, NzSwitchModule, NzIconModule, NzTableModule
  ],
  template: `
    <div style="padding:32px;">
      <!-- Header -->
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <button nz-button routerLink="/dashboard">
            <span nz-icon nzType="arrow-left" nzTheme="outline"></span> Back
          </button>
          <div>
            <h2 style="display:flex;align-items:center;gap:8px;margin:0;">
              <span nz-icon nzType="apartment" nzTheme="outline" style="color:var(--brand-color);font-size:22px;"></span>
              {{ tree?.name }}
            </h2>
            <p *ngIf="tree?.description" style="margin:2px 0 0;opacity:0.5;font-size:13px;">{{ tree?.description }}</p>
          </div>
        </div>
        <nz-space [nzSize]="10">
          <span *nzSpaceItem>
            <nz-input-group nzPrefixIcon="search" style="width:220px;">
              <input nz-input [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search people..." nzSize="small">
            </nz-input-group>
          </span>
          <ng-container *ngIf="canEdit">
            <span *nzSpaceItem>
              <button nz-button (click)="showImportModal = true">
                <span nz-icon nzType="upload" nzTheme="outline"></span> Import
              </button>
            </span>
            <span *nzSpaceItem>
              <button nz-button nzType="primary" (click)="showAddPerson = true" style="font-weight:600;">
                <span nz-icon nzType="plus" nzTheme="outline"></span> Add Person
              </button>
            </span>
            <span *nzSpaceItem>
              <button nz-button (click)="showShareModal = true" nz-tooltip nzTooltipTitle="Share">
                <span nz-icon nzType="share-alt" nzTheme="outline"></span>
              </button>
            </span>
            <span *nzSpaceItem>
              <button nz-button [routerLink]="['/tree', treeId, 'manage']" nz-tooltip nzTooltipTitle="Manage Tree">
                <span nz-icon nzType="setting" nzTheme="outline"></span>
              </button>
            </span>
          </ng-container>
        </nz-space>
      </div>

      <!-- Search Results -->
      <div *ngIf="searchResults.length > 0" style="margin-bottom:12px;">
        <nz-card nzSize="small">
          <span nz-typography nzType="secondary" style="font-size:12px;">Search results ({{ searchResults.length }})</span>
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
            <nz-tag *ngFor="let r of searchResults" nzMode="checkable" [nzChecked]="false"
                    (click)="selectPersonById(r.id); searchQuery=''; searchResults=[]"
                    style="cursor:pointer;">
              {{ r.lastName }}{{ r.firstName }}
              <span *ngIf="r.englishName" style="opacity:0.6;margin-left:4px;">{{ r.englishName }}</span>
            </nz-tag>
          </div>
        </nz-card>
      </div>

      <!-- Tree Visualization -->
      <nz-card [nzBodyStyle]="{ padding: '0', overflow: 'hidden' }" style="min-height:600px;position:relative;">
        <div #treeContainer class="tree-container" style="width:100%;height:600px;"></div>
        <div class="chart-toolbar" *ngIf="chart"
             [style.background]="isDark ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)'"
             [style.box-shadow]="isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)'">
          <!-- Zoom -->
          <button nz-button nzSize="small" nzShape="circle" nz-tooltip nzTooltipTitle="Zoom In" (click)="chartZoomIn()"
                  [nzGhost]="isDark">+</button>
          <button nz-button nzSize="small" nzShape="circle" nz-tooltip nzTooltipTitle="Zoom Out" (click)="chartZoomOut()"
                  [nzGhost]="isDark">−</button>
          <button nz-button nzSize="small" nzShape="circle" nz-tooltip nzTooltipTitle="Fit to Screen" (click)="chartFit()"
                  [nzGhost]="isDark">⬜</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Expand / Collapse -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Expand All" (click)="chartExpandAll()"
                  [nzGhost]="isDark">⊞</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Collapse All" (click)="chartCollapseAll()"
                  [nzGhost]="isDark">⊟</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Layout Direction -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Top" (click)="chartLayout('top')"
                  [nzType]="currentLayout==='top'?'primary':'default'" [nzGhost]="isDark && currentLayout!=='top'">↑</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Bottom" (click)="chartLayout('bottom')"
                  [nzType]="currentLayout==='bottom'?'primary':'default'" [nzGhost]="isDark && currentLayout!=='bottom'">↓</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Left" (click)="chartLayout('left')"
                  [nzType]="currentLayout==='left'?'primary':'default'" [nzGhost]="isDark && currentLayout!=='left'">←</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Right" (click)="chartLayout('right')"
                  [nzType]="currentLayout==='right'?'primary':'default'" [nzGhost]="isDark && currentLayout!=='right'">→</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Compact toggle -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Compact Mode" (click)="chartToggleCompact()"
                  [nzType]="isCompact?'primary':'default'" [nzGhost]="isDark && !isCompact">▣</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Export -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Export PNG" (click)="chartExportPng()"
                  [nzGhost]="isDark">🖼️</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Export SVG" (click)="chartExportSvg()"
                  [nzGhost]="isDark">SVG</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Fullscreen -->
          <button nz-button nzSize="small" nz-tooltip [nzTooltipTitle]="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'" (click)="chartFullscreen()"
                  [nzType]="isFullscreen ? 'primary' : 'default'" [nzGhost]="isDark && !isFullscreen">{{ isFullscreen ? '✕' : '⛶' }}</button>
        </div>
      </nz-card>

      <!-- Person Detail Sidebar -->
      <app-person-detail
        *ngIf="selectedPerson"
        [person]="selectedPerson"
        [treeId]="treeId"
        [canEdit]="canEditPerson(selectedPerson)"
        [isOwner]="tree?.myRole === 'OWNER'"
        (close)="selectedPerson = null"
        (personUpdated)="onPersonUpdated()"
        (navigateToPerson)="selectPersonById($event)">
      </app-person-detail>

      <!-- Add Person Form -->
      <app-person-form
        *ngIf="showAddPerson"
        [treeId]="treeId"
        [persons]="persons"
        (close)="showAddPerson = false"
        (saved)="onPersonAdded()">
      </app-person-form>

      <!-- Import Modal -->
      <nz-modal [(nzVisible)]="showImportModal" nzTitle="Import from Excel" nzWidth="680"
                (nzOnCancel)="showImportModal = false" (nzOnOk)="importFile()"
                nzOkText="Import" [nzOkDisabled]="!selectedFile" [nzOkLoading]="importing">
        <ng-container *nzModalContent>
          <!-- Drag & Drop Area -->
          <div class="import-drop-zone"
               [class.drag-over]="isDragOver"
               [class.file-selected]="!!selectedFile"
               (dragover)="onDragOver($event)" (dragleave)="isDragOver = false"
               (drop)="onDrop($event)" (click)="fileInput.click()">
            <input #fileInput type="file" accept=".xlsx,.xls" (change)="onFileSelected($event)" style="display:none;">
            <ng-container *ngIf="!selectedFile">
              <span nz-icon nzType="upload" nzTheme="outline" style="font-size:36px;color:var(--brand-color);margin-bottom:8px;"></span>
              <p style="margin:0;font-size:15px;font-weight:500;">Click or drag Excel file here</p>
              <p style="margin:4px 0 0;font-size:12px;opacity:0.5;">Supports .xlsx, .xls</p>
            </ng-container>
            <ng-container *ngIf="selectedFile">
              <span nz-icon nzType="file-excel" nzTheme="outline" style="font-size:36px;color:#34C759;margin-bottom:8px;"></span>
              <p style="margin:0;font-size:15px;font-weight:500;color:#34C759;">{{ selectedFile.name }}</p>
              <p style="margin:4px 0 0;font-size:12px;opacity:0.5;">Click to change file</p>
            </ng-container>
          </div>

          <nz-alert *ngIf="importResult" [nzType]="importResult.startsWith('Success') ? 'success' : 'error'" [nzMessage]="importResult" nzShowIcon
                    style="margin-top:12px;"></nz-alert>

          <!-- Column Descriptions -->
          <nz-divider nzText="Excel Column Guide" nzOrientation="center" style="margin:16px 0 8px;"></nz-divider>
          <nz-table [nzData]="excelColumns" nzSize="small" [nzShowPagination]="false" [nzBordered]="true" [nzScroll]="{ y: '240px' }">
            <thead><tr>
              <th nzWidth="40px">Col</th>
              <th nzWidth="130px">Field</th>
              <th>Description</th>
            </tr></thead>
            <tbody><tr *ngFor="let col of excelColumns">
              <td>{{ col.col }}</td>
              <td><code>{{ col.field }}</code></td>
              <td>{{ col.desc }}</td>
            </tr></tbody>
          </nz-table>
        </ng-container>
      </nz-modal>

      <!-- Share Modal -->
      <nz-modal [(nzVisible)]="showShareModal" nzTitle="Share Family Tree"
                (nzOnCancel)="showShareModal = false" [nzFooter]="null" [nzWidth]="480">
        <ng-container *nzModalContent>
          <div *ngIf="!tree?.shareToken" style="text-align:center;padding:24px 0;">
            <p nz-typography>Generate a public link to share this family tree with anyone. They can view it without logging in.</p>
            <button nz-button nzType="primary" (click)="generateShareLink()" style="margin-top:12px;">
              <span nz-icon nzType="link" nzTheme="outline"></span> Generate Share Link
            </button>
          </div>
          <div *ngIf="tree?.shareToken">
            <p nz-typography nzType="secondary" style="margin-bottom:12px;">Anyone with this link can view the family tree (read-only):</p>
            <nz-input-group nzSuffix="copyBtn" style="margin-bottom:16px;">
              <input nz-input [value]="shareUrl" readonly #shareInput>
            </nz-input-group>
            <ng-template #copyBtn>
              <span nz-icon nzType="copy" nzTheme="outline" style="cursor:pointer;" nz-tooltip nzTooltipTitle="Copy"
                    (click)="copyShareLink(shareInput)"></span>
            </ng-template>
            <div style="display:flex;gap:8px;">
              <button nz-button nzType="primary" (click)="copyShareLink(shareInput)">
                <span nz-icon nzType="copy" nzTheme="outline"></span> Copy Link
              </button>
              <button nz-button nzDanger (click)="revokeShareLink()">
                <span nz-icon nzType="stop" nzTheme="outline"></span> Revoke Link
              </button>
            </div>
          </div>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [`
    :host ::ng-deep .tree-container svg {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    }
    :host ::ng-deep .tree-container svg path.link,
    :host ::ng-deep .tree-container svg path[fill="none"] {
      stroke-width: 1.5 !important;
      stroke-opacity: 1 !important;
      fill: none !important;
    }
    body.dark-theme :host ::ng-deep .tree-container svg path.link,
    body.dark-theme :host ::ng-deep .tree-container svg path[fill="none"] {
      stroke: #48484A !important;
    }
    body:not(.dark-theme) :host ::ng-deep .tree-container svg path.link,
    body:not(.dark-theme) :host ::ng-deep .tree-container svg path[fill="none"] {
      stroke: #D2D2D7 !important;
    }
    :host ::ng-deep .node-rect {
      cursor: pointer;
    }
    body.dark-theme :host ::ng-deep .node-button-foreign-object div {
      background-color: #2C2C2E !important;
      color: #F5F5F7 !important;
      border-color: #48484A !important;
    }
    body:not(.dark-theme) :host ::ng-deep .node-button-foreign-object div {
      background-color: #FFFFFF !important;
      color: #1D1D1F !important;
      border-color: #D2D2D7 !important;
    }
    .chart-toolbar {
      position: absolute;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 4px;
      z-index: 10;
      border-radius: 8px;
      padding: 6px 10px;
      backdrop-filter: blur(10px);
      transition: background 0.3s, box-shadow 0.3s;
    }
    .chart-toolbar :host ::ng-deep .ant-divider-vertical {
      height: 20px;
      margin: 0 4px;
    }
    .import-drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed #d9d9d9;
      border-radius: 12px;
      padding: 32px 16px;
      cursor: pointer;
      transition: border-color 0.3s, background 0.3s;
      text-align: center;
    }
    .import-drop-zone:hover, .import-drop-zone.drag-over {
      border-color: var(--brand-color, #007AFF);
      background: rgba(0, 122, 255, 0.04);
    }
    .import-drop-zone.file-selected {
      border-color: #34C759;
      border-style: solid;
      background: rgba(52, 199, 89, 0.04);
    }
  `]
})
export class TreeViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private themeSub?: Subscription;
  @ViewChild('treeContainer', { static: false }) treeContainer!: ElementRef;

  treeId = '';
  tree: FamilyTreeDTO | null = null;
  persons: PersonDTO[] = [];
  selectedPerson: PersonDTO | null = null;
  showAddPerson = false;
  showImportModal = false;
  showShareModal = false;
  selectedFile: File | null = null;
  importing = false;
  importResult = '';
  isDragOver = false;
  canEdit = false;
  excelColumns = [
    { col: 'A', field: 'row_id', desc: 'Unique row ID (e.g. 1, 2, 3) — used to reference parents/spouse' },
    { col: 'B', field: 'firstName', desc: 'First name (required)' },
    { col: 'C', field: 'lastName', desc: 'Last name / family name' },
    { col: 'D', field: 'gender', desc: 'MALE or FEMALE' },
    { col: 'E', field: 'birthDate', desc: 'Birth date (yyyy-MM-dd or date cell)' },
    { col: 'F', field: 'deathDate', desc: 'Death date (optional)' },
    { col: 'G', field: 'bio', desc: 'Short biography (optional)' },
    { col: 'H', field: 'father_row_id', desc: 'Father\'s row_id from column A (optional)' },
    { col: 'I', field: 'mother_row_id', desc: 'Mother\'s row_id from column A (optional)' },
    { col: 'J', field: 'spouse_row_id', desc: 'Spouse\'s row_id from column A (optional)' },
    { col: 'K', field: 'generation', desc: 'Generation number (0 = root, optional)' },
    { col: 'L', field: 'englishName', desc: 'English name (optional)' },
    { col: 'M', field: 'phone', desc: 'Phone number (optional)' },
    { col: 'N', field: 'email', desc: 'Email address (optional)' },
    { col: 'O', field: 'country', desc: 'Country (optional)' },
    { col: 'P', field: 'province', desc: 'Province / State (optional)' },
    { col: 'Q', field: 'city', desc: 'City (optional)' },
  ];
  searchQuery = '';
  searchResults: PersonDTO[] = [];
  chart: OrgChart<ChartNode> | null = null;
  currentLayout = 'top';
  isCompact = true;
  private currentUserId = '';

  get shareUrl(): string {
    return this.tree?.shareToken ? `${location.origin}/share/${this.tree.shareToken}` : '';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private themeService: ThemeService,
    private message: NzMessageService
  ) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.currentUserId = parsed.userId || '';
      } catch {}
    }
  }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  ngOnInit(): void {
    this.treeId = this.route.snapshot.paramMap.get('treeId') || '';
    this.loadTree();
    this.themeSub = this.themeService.themeChanged$.subscribe(() => {
      setTimeout(() => this.renderTree(), 200);
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  loadTree(): void {
    this.api.getTree(this.treeId).subscribe({
      next: (tree) => {
        this.tree = tree;
        this.canEdit = tree.myRole === 'OWNER' || tree.myRole === 'ADMIN';
        this.loadPersons();
      },
      error: () => this.router.navigate(['/dashboard'])
    });
  }

  loadPersons(): void {
    this.api.getPersons(this.treeId).subscribe({
      next: (persons) => {
        this.persons = persons;
        setTimeout(() => this.renderTree(), 100);
      }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      return;
    }
    this.searchResults = this.persons.filter(p => {
      const cn = `${p.lastName || ''}${p.firstName || ''}`.toLowerCase();
      const fn = `${p.firstName || ''}${p.lastName || ''}`.toLowerCase();
      const en = (p.englishName || '').toLowerCase();
      return cn.includes(q) || fn.includes(q) || en.includes(q);
    });
  }

  private getCN(p: { firstName: string; lastName: string }): string {
    return `${p.lastName || ''}${p.firstName || ''}`.trim();
  }

  renderTree(): void {
    if (!this.treeContainer || this.persons.length === 0) return;

    const chartData = this.buildChartData();
    if (chartData.length === 0) return;

    const container = this.treeContainer.nativeElement;
    container.innerHTML = '';

    // Click listener to detect which person was clicked (supports spouse nodes)
    container.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const personArea = target.closest('.person-click-area') as HTMLElement;
      if (personArea) {
        const personId = personArea.getAttribute('data-person-id');
        if (personId && personId !== '__root__') {
          this.selectPersonById(personId);
        }
      }
    });

    const isDark = this.isDark;
    const cardBg = isDark ? '#1C1C1E' : 'white';
    const textColor = isDark ? '#F5F5F7' : '#1D1D1F';
    const subTextColor = isDark ? '#98989D' : '#86868B';
    const dateColor = isDark ? '#636366' : '#AEAEB2';
    const linkColor = isDark ? '#48484A' : '#D2D2D7';
    const shadowLight = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)';
    const shadowHover = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)';

    const hasSpouse = chartData.some(n => n.id !== '__root__' && n.spouseChineseName);

    this.chart = new OrgChart<ChartNode>()
      .container(container)
      .data(chartData)
      .nodeWidth((d: any) => {
        const data = d?.data as ChartNode;
        return data?.spouseChineseName ? 295 : 155;
      })
      .nodeHeight(() => 65)
      .compactMarginBetween(() => 25)
      .compactMarginPair(() => 50)
      .neighbourMargin(() => 25)
      .childrenMargin(() => 60)
      .linkUpdate(function (this: any, d: any) {
        const el = this as SVGElement;
        if (el && el.setAttribute) {
          el.setAttribute('stroke', linkColor);
          el.setAttribute('stroke-width', '1.5');
          el.setAttribute('fill', 'none');
          el.setAttribute('stroke-opacity', '1');
        }
      })
      .nodeContent((d: any) => {
        const data = d.data as ChartNode;
        if (data.id === '__root__') {
          return `<div style="display:none;"></div>`;
        }

        const renderPerson = (personId: string, name: string, enName: string, gender: string, photoUrl: string, birth: string) => {
          const isMale = gender === 'MALE';
          const color = isMale ? '#007AFF' : '#FF2D55';
          const bgColor = isMale ? 'rgba(0,122,255,0.08)' : 'rgba(255,45,85,0.08)';
          const icon = isMale ? '♂' : gender === 'FEMALE' ? '♀' : '';
          const emoji = isMale ? '👨' : '👩';
          const photo = photoUrl
            ? `<img src="${photoUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid ${color};" />`
            : `<div style="width:28px;height:28px;border-radius:50%;background:${bgColor};border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:12px;">${emoji}</div>`;
          const enLine = enName
            ? `<div style="font-size:9px;color:${subTextColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">${enName}</div>`
            : '';
          return `
            <div class="person-click-area" data-person-id="${personId}" style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;cursor:pointer;">
              ${photo}
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:600;color:${textColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">
                  ${name} <span style="font-size:9px;color:${color};">${icon}</span>
                </div>
                ${enLine}
              </div>
            </div>
          `;
        };

        const mainColor = data.gender === 'MALE' ? '#007AFF' : '#FF2D55';
        const mainPerson = renderPerson(data.id, data.chineseName, data.englishName, data.gender, data.photoUrl, data.birthDate);

        let content = mainPerson;
        if (data.spouseChineseName) {
          const spousePerson = renderPerson(data.spouseId, data.spouseChineseName, data.spouseEnglishName, data.spouseGender, data.spousePhotoUrl, '');
          content = `
            ${mainPerson}
            <div style="width:1px;height:32px;background:${isDark ? '#48484A' : '#E8E8ED'};margin:0 2px;"></div>
            ${spousePerson}
          `;
        }

        return `
          <div style="
            background:${cardBg};
            border-radius:10px;
            border:1px solid ${mainColor}22;
            padding:6px 10px;
            display:flex;
            align-items:center;
            gap:6px;
            height:${d.height}px;
            box-shadow:0 2px 12px ${shadowLight};
            cursor:pointer;
            transition:box-shadow 0.2s;
            font-family:'Montserrat',-apple-system,BlinkMacSystemFont,sans-serif;
          " onmouseover="this.style.boxShadow='0 4px 20px ${shadowHover}'"
             onmouseout="this.style.boxShadow='0 2px 12px ${shadowLight}'">
            ${content}
          </div>
        `;
      })
      .onNodeClick((d: any) => {
        // handled by container click listener for spouse support
      })
      .render()
      .expandAll();
  }

  private buildChartData(): ChartNode[] {
    const nodes: ChartNode[] = [];
    const VIRTUAL_ROOT = '__root__';

    // Determine which spouse should be "absorbed" into their partner's node
    const absorbed = new Set<string>();

    for (const p of this.persons) {
      if (!p.spouseId || absorbed.has(p.id)) continue;
      const spouse = this.persons.find(s => s.id === p.spouseId);
      if (!spouse || absorbed.has(spouse.id)) continue;

      const pIsFather = this.persons.some(c => c.fatherId === p.id);
      const spouseIsFather = this.persons.some(c => c.fatherId === spouse.id);

      if (pIsFather && !spouseIsFather) {
        absorbed.add(spouse.id);
      } else if (spouseIsFather && !pIsFather) {
        absorbed.add(p.id);
      } else {
        const pHasParents = !!(p.fatherId || p.motherId);
        const spouseHasParents = !!(spouse.fatherId || spouse.motherId);
        if (pHasParents && !spouseHasParents) {
          absorbed.add(spouse.id);
        } else if (spouseHasParents && !pHasParents) {
          absorbed.add(p.id);
        } else {
          if (p.gender === 'MALE') {
            absorbed.add(spouse.id);
          } else {
            absorbed.add(p.id);
          }
        }
      }
    }

    // Virtual hidden root
    nodes.push({
      id: VIRTUAL_ROOT,
      parentId: '',
      chineseName: '',
      englishName: '',
      gender: '',
      photoUrl: '',
      birthDate: '',
      generation: -1,
      spouseId: '',
      spouseChineseName: '',
      spouseEnglishName: '',
      spouseGender: '',
      spousePhotoUrl: ''
    });

    for (const p of this.persons) {
      if (absorbed.has(p.id)) continue;

      const spouseP = p.spouseId ? this.persons.find(s => s.id === p.spouseId) : null;
      let parentId = p.fatherId || p.motherId || VIRTUAL_ROOT;

      if (absorbed.has(parentId)) {
        const absorbedParent = this.persons.find(x => x.id === parentId);
        if (absorbedParent?.spouseId) {
          parentId = absorbedParent.spouseId;
        }
      }

      nodes.push({
        id: p.id,
        parentId,
        chineseName: this.getCN(p),
        englishName: p.englishName || '',
        gender: p.gender,
        photoUrl: p.photoUrl,
        birthDate: p.birthDate || '',
        generation: p.generation,
        spouseId: spouseP?.id || '',
        spouseChineseName: spouseP ? this.getCN(spouseP) : '',
        spouseEnglishName: spouseP?.englishName || '',
        spouseGender: spouseP?.gender || '',
        spousePhotoUrl: spouseP?.photoUrl || ''
      });
    }

    return nodes;
  }

  selectPersonById(personId: string): void {
    this.api.getPerson(this.treeId, personId).subscribe({
      next: (person) => this.selectedPerson = person
    });
  }

  canEditPerson(person: PersonDTO): boolean {
    if (this.canEdit) return true;
    return person.linkedUserId === this.currentUserId;
  }

  onPersonUpdated(): void {
    this.loadPersons();
    if (this.selectedPerson) {
      this.selectPersonById(this.selectedPerson.id);
    }
  }

  onPersonAdded(): void {
    this.showAddPerson = false;
    this.loadPersons();
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.importResult = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      this.selectedFile = file;
      this.importResult = '';
    }
  }

  importFile(): void {
    if (!this.selectedFile) return;
    this.importing = true;
    this.api.importExcel(this.treeId, this.selectedFile).subscribe({
      next: (res) => {
        this.importing = false;
        this.message.success(`Successfully imported ${res.imported} people`);
        this.showImportModal = false;
        this.selectedFile = null;
        this.importResult = '';
        this.loadPersons();
      },
      error: (err) => {
        this.importResult = 'Import failed: ' + (err.error?.message || 'Unknown error');
        this.importing = false;
      }
    });
  }

  chartZoomIn(): void {
    this.chart?.zoomIn();
  }

  chartZoomOut(): void {
    this.chart?.zoomOut();
  }

  chartFit(): void {
    this.chart?.fit();
  }

  chartExpandAll(): void {
    this.chart?.expandAll();
  }

  chartCollapseAll(): void {
    this.chart?.collapseAll();
  }

  chartLayout(direction: string): void {
    if (!this.chart) return;
    this.currentLayout = direction;
    (this.chart as any).layout(direction).render().fit();
  }

  chartToggleCompact(): void {
    if (!this.chart) return;
    this.isCompact = !this.isCompact;
    (this.chart as any).compact(this.isCompact).render().fit();
  }

  chartExportPng(): void {
    (this.chart as any)?.exportImg?.({
      full: true,
      scale: 3,
      backgroundColor: this.isDark ? '#141414' : '#FAFAFA'
    });
  }

  chartExportSvg(): void {
    (this.chart as any)?.exportSvg?.();
  }

  chartFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      const container = this.treeContainer?.nativeElement;
      if (!container) return;
      const card = container.closest('nz-card') || container.parentElement;
      if (card) {
        (this.chart as any)?.fullscreen?.(card);
      }
    }
  }

  get isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  generateShareLink(): void {
    this.api.generateShareToken(this.treeId).subscribe({
      next: (tree) => {
        this.tree = tree;
        this.message.success('Share link generated!');
      }
    });
  }

  revokeShareLink(): void {
    this.api.revokeShareToken(this.treeId).subscribe({
      next: (tree) => {
        this.tree = tree;
        this.message.success('Share link revoked');
      }
    });
  }

  copyShareLink(input: HTMLInputElement): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.message.success('Link copied to clipboard!');
    });
  }
}
