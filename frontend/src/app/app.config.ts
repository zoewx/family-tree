import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  SearchOutline, ExclamationCircleOutline, CheckCircleOutline, CloseCircleOutline, InfoCircleOutline,
  UserOutline, LockOutline, MailOutline, SettingOutline, LogoutOutline,
  PlusOutline, ImportOutline, DownloadOutline, UploadOutline,
  HomeOutline, TeamOutline, ApartmentOutline, EditOutline,
  DeleteOutline, ArrowLeftOutline, SaveOutline, EyeOutline, EyeInvisibleOutline,
  BulbOutline, BulbFill, SunOutline, MoonOutline, MoonFill,
  ProfileOutline, SafetyOutline, KeyOutline, IdcardOutline,
  AppstoreOutline, PictureOutline, FullscreenOutline, FullscreenExitOutline,
  ZoomInOutline, ZoomOutOutline, ExpandOutline, CompressOutline,
  FileExcelOutline, CrownOutline, ShareAltOutline,
  CalendarOutline, HeartOutline, ManOutline, WomanOutline,
  PhoneOutline, EnvironmentOutline, CloseOutline
} from '@ant-design/icons-angular/icons';

registerLocaleData(en);

const icons = [
  SearchOutline, ExclamationCircleOutline, CheckCircleOutline, CloseCircleOutline, InfoCircleOutline,
  UserOutline, LockOutline, MailOutline, SettingOutline, LogoutOutline,
  PlusOutline, ImportOutline, DownloadOutline, UploadOutline,
  HomeOutline, TeamOutline, ApartmentOutline, EditOutline,
  DeleteOutline, ArrowLeftOutline, SaveOutline, EyeOutline, EyeInvisibleOutline,
  BulbOutline, BulbFill, SunOutline, MoonOutline, MoonFill,
  ProfileOutline, SafetyOutline, KeyOutline, IdcardOutline,
  AppstoreOutline, PictureOutline, FullscreenOutline, FullscreenExitOutline,
  ZoomInOutline, ZoomOutOutline, ExpandOutline, CompressOutline,
  FileExcelOutline, CrownOutline, ShareAltOutline,
  CalendarOutline, HeartOutline, ManOutline, WomanOutline,
  PhoneOutline, EnvironmentOutline, CloseOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    { provide: NZ_I18N, useValue: en_US },
    provideNzIcons(icons),
  ]
};
