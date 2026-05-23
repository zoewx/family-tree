import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:dio/dio.dart';

class AuthResponse {
  final String userId;
  final String accessToken;
  final String refreshToken;
  final String username;
  final String displayName;
  final String email;

  AuthResponse({
    this.userId = '',
    this.accessToken = '',
    this.refreshToken = '',
    this.username = '',
    this.displayName = '',
    this.email = '',
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        userId: json['userId'] ?? '',
        accessToken: json['accessToken'] ?? '',
        refreshToken: json['refreshToken'] ?? '',
        username: json['username'] ?? '',
        displayName: json['displayName'] ?? '',
        email: json['email'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'username': username,
        'displayName': displayName,
        'email': email,
      };
}

class AuthService extends ChangeNotifier {
  static const _storageKey = 'currentUser';
  final _storage = const FlutterSecureStorage();
  final Dio _dio;
  AuthResponse? _currentUser;

  AuthResponse? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser?.accessToken.isNotEmpty == true;
  String? get token => _currentUser?.accessToken;
  String get userId => _currentUser?.userId ?? '';

  AuthService(this._dio);

  Future<void> init() async {
    final stored = await _storage.read(key: _storageKey);
    if (stored != null) {
      _currentUser = AuthResponse.fromJson(jsonDecode(stored));
      notifyListeners();
    }
  }

  Future<AuthResponse> login(String username, String password) async {
    final res = await _dio.post('/api/auth/login', data: {
      'username': username,
      'password': password,
    });
    final auth = AuthResponse.fromJson(res.data);
    await _setSession(auth);
    return auth;
  }

  Future<AuthResponse> register({
    required String username,
    required String email,
    required String password,
    String? displayName,
    String? invitationCode,
  }) async {
    final res = await _dio.post('/api/auth/register', data: {
      'username': username,
      'email': email,
      'password': password,
      if (displayName != null) 'displayName': displayName,
      if (invitationCode != null) 'invitationCode': invitationCode,
    });
    final auth = AuthResponse.fromJson(res.data);
    await _setSession(auth);
    return auth;
  }

  Future<void> logout() async {
    await _storage.delete(key: _storageKey);
    _currentUser = null;
    notifyListeners();
  }

  Future<void> updateDisplayName(String name) async {
    if (_currentUser != null) {
      _currentUser = AuthResponse(
        userId: _currentUser!.userId,
        accessToken: _currentUser!.accessToken,
        refreshToken: _currentUser!.refreshToken,
        username: _currentUser!.username,
        displayName: name,
        email: _currentUser!.email,
      );
      await _storage.write(
          key: _storageKey, value: jsonEncode(_currentUser!.toJson()));
      notifyListeners();
    }
  }

  Future<void> _setSession(AuthResponse auth) async {
    _currentUser = auth;
    await _storage.write(key: _storageKey, value: jsonEncode(auth.toJson()));
    notifyListeners();
  }
}
