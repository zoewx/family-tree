import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService, FamilyTreeDTO, PersonDTO, PhotoItem } from '../../services/api.service';
import { OrgChart } from 'd3-org-chart';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalModule } from 'ng-zorro-antd/modal';

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
  selector: 'app-shared-tree',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTypographyModule, NzIconModule, NzButtonModule, NzDividerModule, NzTooltipModule, NzResultModule, NzSpinModule, NzDrawerModule, NzDescriptionsModule, NzAvatarModule, NzModalModule],
  template: `
    <div *ngIf="loading" style="display:flex;justify-content:center;align-items:center;height:100vh;">
      <nz-spin nzSize="large" nzTip="Loading family tree..."></nz-spin>
    </div>

    <div *ngIf="error" style="display:flex;justify-content:center;align-items:center;height:100vh;">
      <nz-result nzStatus="404" nzTitle="Link not found" nzSubTitle="This share link is invalid or has been revoked.">
        <div nz-result-extra>
          <a href="/login"><button nz-button nzType="primary">Go to Login</button></a>
        </div>
      </nz-result>
    </div>

    <div *ngIf="!loading && !error" style="padding:24px;">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;display:flex;align-items:center;gap:8px;">
            <span nz-icon nzType="apartment" nzTheme="outline" style="color:var(--brand-color);font-size:22px;"></span>
            {{ tree?.name }}
          </h2>
          <p *ngIf="tree?.description" style="margin:4px 0 0;opacity:0.5;font-size:13px;">{{ tree?.description }}</p>
          <p style="margin:4px 0 0;font-size:12px;opacity:0.4;">
            <span nz-icon nzType="eye" nzTheme="outline"></span> Read-only shared view
          </p>
        </div>
      </div>

      <!-- Tree -->
      <nz-card [nzBodyStyle]="{ padding: '0', overflow: 'hidden' }" style="min-height:600px;position:relative;">
        <div #treeContainer style="width:100%;height:600px;"></div>
        <div class="chart-toolbar" *ngIf="chart"
             style="position:absolute;bottom:16px;right:16px;display:flex;align-items:center;gap:4px;z-index:10;background:rgba(255,255,255,0.9);border-radius:8px;padding:6px 10px;backdrop-filter:blur(10px);box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Zoom -->
          <button nz-button nzSize="small" nzShape="circle" nz-tooltip nzTooltipTitle="Zoom In" (click)="chartZoomIn()">+</button>
          <button nz-button nzSize="small" nzShape="circle" nz-tooltip nzTooltipTitle="Zoom Out" (click)="chartZoomOut()">−</button>
          <button nz-button nzSize="small" nzShape="circle" nz-tooltip nzTooltipTitle="Fit to Screen" (click)="chartFit()">⬜</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Expand / Collapse -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Expand All" (click)="chartExpandAll()">⊞</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Collapse All" (click)="chartCollapseAll()">⊟</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Layout Direction -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Top" (click)="chartLayout('top')" [nzType]="currentLayout==='top'?'primary':'default'">↑</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Bottom" (click)="chartLayout('bottom')" [nzType]="currentLayout==='bottom'?'primary':'default'">↓</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Left" (click)="chartLayout('left')" [nzType]="currentLayout==='left'?'primary':'default'">←</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Right" (click)="chartLayout('right')" [nzType]="currentLayout==='right'?'primary':'default'">→</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Compact toggle -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Compact Mode" (click)="chartToggleCompact()" [nzType]="isCompact?'primary':'default'">▣</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Export -->
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Export PNG" (click)="chartExportPng()">🖼️</button>
          <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Export SVG" (click)="chartExportSvg()">SVG</button>
          <nz-divider nzType="vertical"></nz-divider>
          <!-- Fullscreen -->
          <button nz-button nzSize="small" nz-tooltip [nzTooltipTitle]="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'" (click)="chartFullscreen()"
                  [nzType]="isFullscreen ? 'primary' : 'default'">{{ isFullscreen ? '✕' : '⛶' }}</button>
        </div>
      </nz-card>

      <!-- Person Detail Drawer (read-only) -->
      <nz-drawer *ngIf="selectedPerson" [nzVisible]="true" nzPlacement="right" nzTitle="Person Details"
                 (nzOnClose)="selectedPerson = null" [nzWidth]="380">
        <ng-container *nzDrawerContent>
          <div style="text-align:center;margin-bottom:24px;">
            <nz-avatar [nzSize]="80" [nzSrc]="selectedPerson.photoUrl || ''"
                       [nzText]="selectedPerson.gender === 'MALE' ? '👨' : '👩'"
                       style="margin-bottom:12px;"></nz-avatar>
            <h3 nz-typography style="margin:0;">{{ selectedPerson.lastName }}{{ selectedPerson.firstName }}</h3>
            <p *ngIf="selectedPerson.englishName" nz-typography nzType="secondary" style="margin:0;font-size:13px;">{{ selectedPerson.englishName }}</p>
            <p nz-typography nzType="secondary">
              {{ selectedPerson.gender === 'MALE' ? 'Male' : 'Female' }}
              <span *ngIf="selectedPerson.birthDate"> · Born {{ selectedPerson.birthDate }}</span>
              <span *ngIf="selectedPerson.deathDate"> · Died {{ selectedPerson.deathDate }}</span>
            </p>
          </div>

          <!-- Gallery Photos -->
          <div *ngIf="galleryPhotos && galleryPhotos.length > 0" style="margin-bottom:16px;">
            <nz-divider nzText="Recent Photos" nzOrientation="left" style="margin:8px 0 12px;"></nz-divider>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              <img *ngFor="let photo of galleryPhotos" [src]="photo.url" (click)="previewUrl=photo.url;previewVisible=true"
                   style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #eee;" />
            </div>
          </div>

          <div *ngIf="selectedPerson.bio">
            <nz-divider nzText="Bio"></nz-divider>
            <p>{{ selectedPerson.bio }}</p>
          </div>
        </ng-container>
      </nz-drawer>

      <!-- Image Preview -->
      <nz-modal [(nzVisible)]="previewVisible" [nzFooter]="null" (nzOnCancel)="previewVisible=false" [nzWidth]="600">
        <ng-container *nzModalContent><img [src]="previewUrl" style="width:100%;" /></ng-container>
      </nz-modal>
    </div>
  `
})
export class SharedTreeComponent implements OnInit, AfterViewInit {
  @ViewChild('treeContainer', { static: false }) treeContainer!: ElementRef;

  shareToken = '';
  tree: FamilyTreeDTO | null = null;
  persons: PersonDTO[] = [];
  selectedPerson: PersonDTO | null = null;
  chart: OrgChart<ChartNode> | null = null;
  loading = true;
  error = false;
  currentLayout = 'top';
  isCompact = true;
  galleryPhotos: PhotoItem[] = [];
  previewVisible = false;
  previewUrl = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.shareToken = this.route.snapshot.paramMap.get('shareToken') || '';
    this.loadData();
  }

  ngAfterViewInit(): void {}

  loadData(): void {
    this.api.getSharedTree(this.shareToken).subscribe({
      next: (tree) => {
        this.tree = tree;
        this.api.getSharedPersons(this.shareToken).subscribe({
          next: (persons) => {
            this.persons = persons;
            this.loading = false;
            setTimeout(() => this.renderTree(), 100);
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  renderTree(): void {
    if (!this.treeContainer?.nativeElement || this.persons.length === 0) return;
    const container = this.treeContainer.nativeElement;
    const chartData = this.buildChartData();

    container.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const personArea = target.closest('.person-click-area') as HTMLElement;
      if (personArea) {
        const personId = personArea.getAttribute('data-person-id');
        if (personId && personId !== '__root__') {
          const p = this.persons.find(x => x.id === personId);
          if (p) {
            this.selectedPerson = p;
            this.loadGallery(p.id);
          }
        }
      }
    });

    const cardBg = 'white';
    const textColor = '#1D1D1F';
    const subTextColor = '#86868B';
    const dateColor = '#AEAEB2';
    const shadowLight = 'rgba(0,0,0,0.04)';

    this.chart = (new OrgChart<ChartNode>() as any)
      .container(container)
      .data(chartData)
      .nodeWidth((d: any) => {
        const data = d?.data as ChartNode;
        if (data?.id === '__root__') return 0;
        return data?.spouseChineseName ? 295 : 155;
      })
      .nodeHeight((d: any) => {
        const data = d?.data as ChartNode;
        return data?.id === '__root__' ? 0 : 65;
      })
      .childrenMargin(() => 40)
      .compactMarginBetween(() => 20)
      .compactMarginPair(() => 40)
      .siblingsMargin(() => 30)
      .neighbourMargin(() => 30)
      .nodeContent((d: any) => {
        const data = d.data as ChartNode;
        if (data.id === '__root__') {
          return `<div style="display:none;"></div>`;
        }

        const renderPerson = (personId: string, name: string, enName: string, gender: string, photoUrl: string, birth: string) => {
          const isMale = gender === 'MALE';
          const color = isMale ? '#007AFF' : '#FF2D55';
          const bgColor = isMale ? 'rgba(0,122,255,0.08)' : 'rgba(255,45,85,0.08)';
          const emoji = isMale ? '👨' : '👩';
          const icon = isMale ? '♂' : gender === 'FEMALE' ? '♀' : '';
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
            <div style="width:1px;height:32px;background:#E8E8ED;margin:0 2px;"></div>
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
            font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
          ">${content}</div>
        `;
      })
      .onNodeClick(() => {})
      .compact(true)
      .render()
      .expandAll();

    setTimeout(() => (this.chart as any)?.fit(), 300);
  }

  private buildChartData(): ChartNode[] {
    const spouseMap = new Map<string, PersonDTO>();
    const absorbed = new Set<string>();

    for (const p of this.persons) {
      if (p.spouseId) {
        const spouse = this.persons.find(s => s.id === p.spouseId);
        if (spouse && !absorbed.has(p.id)) {
          spouseMap.set(p.id, spouse);
          absorbed.add(spouse.id);
        }
      }
    }

    const nodes: ChartNode[] = [];
    const rootIds = this.persons.filter(p => !p.fatherId && !p.motherId && !absorbed.has(p.id)).map(p => p.id);

    if (rootIds.length > 1) {
      nodes.push({
        id: '__root__', parentId: '', chineseName: '', englishName: '', gender: '', photoUrl: '',
        birthDate: '', generation: -1, spouseId: '', spouseChineseName: '', spouseEnglishName: '',
        spouseGender: '', spousePhotoUrl: ''
      });
    }

    for (const p of this.persons) {
      if (absorbed.has(p.id)) continue;
      const spouseP = spouseMap.get(p.id);
      let parentId = p.fatherId || p.motherId || '';
      if (!parentId && rootIds.length > 1) parentId = '__root__';
      if (absorbed.has(parentId)) {
        const actualParent = this.persons.find(x => x.spouseId === parentId);
        if (actualParent) parentId = actualParent.id;
      }

      const cn = (person: PersonDTO) => (person.lastName || '') + (person.firstName || '');

      nodes.push({
        id: p.id,
        parentId,
        chineseName: cn(p),
        englishName: p.englishName || '',
        gender: p.gender,
        photoUrl: p.photoUrl,
        birthDate: p.birthDate || '',
        generation: p.generation,
        spouseId: spouseP?.id || '',
        spouseChineseName: spouseP ? cn(spouseP) : '',
        spouseEnglishName: spouseP?.englishName || '',
        spouseGender: spouseP?.gender || '',
        spousePhotoUrl: spouseP?.photoUrl || ''
      });
    }

    return nodes;
  }

  loadGallery(personId: string): void {
    this.galleryPhotos = [];
    this.api.getSharedGallery(this.shareToken, personId).subscribe({
      next: (photos) => this.galleryPhotos = photos
    });
  }

  // Toolbar methods
  chartZoomIn(): void { this.chart?.zoomIn(); }
  chartZoomOut(): void { this.chart?.zoomOut(); }
  chartFit(): void { this.chart?.fit(); }
  chartExpandAll(): void { this.chart?.expandAll(); }
  chartCollapseAll(): void { this.chart?.collapseAll(); }

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
    (this.chart as any)?.exportImg?.({ full: true, scale: 3, backgroundColor: '#FAFAFA' });
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
      if (card) { (this.chart as any)?.fullscreen?.(card); }
    }
  }

  get isFullscreen(): boolean { return !!document.fullscreenElement; }
}
