# Family Tree - Flutter App

Flutter mobile version of the Family Tree web app. Supports both Android and iOS.

## Features

- **Login / Register** — Authentication with JWT tokens stored in secure storage
- **Dashboard** — View and create family trees
- **Tree View** — Browse people grouped by generation, search, view details
- **Person Detail** — View/edit personal info, contact, relations, gallery photos
- **Add Person** — Create new person with all fields and relationships
- **Tree Management** — Members, invitations, link request approval, share, settings
- **Account Settings** — Update display name, change password/email
- **Dark Mode** — System + manual toggle support

## Setup

### 1. Configure API URL

Edit `lib/main.dart` and set `apiBaseUrl` to your backend server:

```dart
const String apiBaseUrl = 'http://your-server:8080';
```

- **Android emulator**: `http://10.0.2.2:8080`
- **iOS simulator**: `http://localhost:8080`
- **Real device**: `http://<server-ip>:8080`

### 2. Install Dependencies

```bash
cd flutter_app
flutter pub get
```

### 3. Run

```bash
# iOS
flutter run -d ios

# Android
flutter run -d android
```

### 4. Build for Release

```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS
flutter build ios --release
```

## Project Structure

```
lib/
├── main.dart              # Entry point, DI, routing
├── theme.dart             # Light/dark Material 3 themes
├── models/
│   └── models.dart        # All data models (DTOs)
├── services/
│   ├── auth_service.dart  # Authentication & token management
│   └── api_service.dart   # REST API calls
└── pages/
    ├── login_page.dart
    ├── register_page.dart
    ├── dashboard_page.dart
    ├── tree_view_page.dart
    ├── tree_manage_page.dart
    ├── person_detail_page.dart
    ├── person_form_page.dart
    ├── account_page.dart
    └── invite_page.dart
```
