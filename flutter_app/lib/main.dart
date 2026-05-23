import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'theme.dart';
import 'pages/login_page.dart';
import 'pages/register_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/tree_view_page.dart';
import 'pages/tree_manage_page.dart';
import 'pages/account_page.dart';
import 'pages/invite_page.dart';

// ⚠️ IMPORTANT: Change this to your actual backend API URL
// For Android emulator use: http://10.0.2.2:8080
// For iOS simulator use: http://localhost:8080
// For real device use: http://<your-server-ip>:8080
const String apiBaseUrl = 'http://localhost:5010';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final dio = Dio(BaseOptions(
    baseUrl: apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ));

  final authService = AuthService(dio);
  await authService.init();

  // Add auth interceptor
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      final token = authService.token;
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onError: (error, handler) {
      if (error.response?.statusCode == 401) {
        authService.logout();
      }
      handler.next(error);
    },
  ));

  final apiService = ApiService(dio);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authService),
        Provider.value(value: apiService),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const FamilyTreeApp(),
    ),
  );
}

class FamilyTreeApp extends StatelessWidget {
  const FamilyTreeApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final authService = context.watch<AuthService>();

    return MaterialApp(
      title: 'Family Tree',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeProvider.mode,
      home: authService.isLoggedIn
          ? const DashboardPage()
          : const LoginPage(),
      onGenerateRoute: (settings) {
        final uri = Uri.parse(settings.name ?? '');
        final segments = uri.pathSegments;

        // /login
        if (settings.name == '/login') {
          return MaterialPageRoute(builder: (_) => const LoginPage());
        }
        // /register
        if (settings.name == '/register') {
          return MaterialPageRoute(builder: (_) => const RegisterPage());
        }
        // /dashboard
        if (settings.name == '/dashboard') {
          return MaterialPageRoute(builder: (_) => const DashboardPage());
        }
        // /account
        if (settings.name == '/account') {
          return MaterialPageRoute(builder: (_) => const AccountPage());
        }
        // /tree/:treeId/manage
        if (segments.length == 3 &&
            segments[0] == 'tree' &&
            segments[2] == 'manage') {
          return MaterialPageRoute(
            builder: (_) => TreeManagePage(treeId: segments[1]),
          );
        }
        // /tree/:treeId
        if (segments.length == 2 && segments[0] == 'tree') {
          return MaterialPageRoute(
            builder: (_) => TreeViewPage(treeId: segments[1]),
          );
        }
        // /invite/:code
        if (segments.length == 2 && segments[0] == 'invite') {
          return MaterialPageRoute(
            builder: (_) => InvitePage(code: segments[1]),
          );
        }

        return MaterialPageRoute(builder: (_) => const DashboardPage());
      },
    );
  }
}
