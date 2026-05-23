import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/models.dart';
import '../widgets/responsive.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  UserProfileDTO? _profile;
  bool _loading = true;

  // Display name
  final _displayNameCtrl = TextEditingController();
  bool _savingProfile = false;

  // Password
  final _currentPwCtrl = TextEditingController();
  final _newPwCtrl = TextEditingController();
  final _confirmPwCtrl = TextEditingController();
  bool _savingPw = false;

  // Email
  final _newEmailCtrl = TextEditingController();
  final _emailPwCtrl = TextEditingController();
  bool _savingEmail = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await context.read<ApiService>().getProfile();
      if (mounted) {
        setState(() {
          _profile = p;
          _displayNameCtrl.text = p.displayName;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateProfile() async {
    setState(() => _savingProfile = true);
    try {
      final p = await context
          .read<ApiService>()
          .updateProfile(_displayNameCtrl.text.trim());
      context.read<AuthService>().updateDisplayName(p.displayName);
      setState(() => _profile = p);
      _msg('Display name updated');
    } catch (e) {
      _msg('Failed to update', isError: true);
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPwCtrl.text != _confirmPwCtrl.text) {
      _msg('Passwords do not match', isError: true);
      return;
    }
    if (_newPwCtrl.text.length < 6) {
      _msg('Password must be at least 6 characters', isError: true);
      return;
    }
    setState(() => _savingPw = true);
    try {
      await context
          .read<ApiService>()
          .changePassword(_currentPwCtrl.text, _newPwCtrl.text);
      _currentPwCtrl.clear();
      _newPwCtrl.clear();
      _confirmPwCtrl.clear();
      _msg('Password changed');
    } catch (e) {
      _msg('Failed to change password', isError: true);
    } finally {
      if (mounted) setState(() => _savingPw = false);
    }
  }

  Future<void> _changeEmail() async {
    setState(() => _savingEmail = true);
    try {
      final p = await context
          .read<ApiService>()
          .changeEmail(_newEmailCtrl.text.trim(), _emailPwCtrl.text);
      setState(() => _profile = p);
      _newEmailCtrl.clear();
      _emailPwCtrl.clear();
      _msg('Email changed');
    } catch (e) {
      _msg('Failed to change email', isError: true);
    } finally {
      if (mounted) setState(() => _savingEmail = false);
    }
  }

  void _msg(String text, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(text),
      backgroundColor: isError ? Colors.red : null,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Account Settings')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: ContentConstraint(
                maxWidth: 600,
                child: Column(
                children: [
                  // Profile Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundColor:
                                const Color(0xFF667EEA).withOpacity(0.15),
                            child: Text(
                              (_profile?.displayName ?? '?')
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: const TextStyle(
                                  fontSize: 28, fontWeight: FontWeight.w700),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(_profile?.displayName ?? '',
                              style: const TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.w700)),
                          Text('@${_profile?.username ?? ''}',
                              style: TextStyle(
                                  color: cs.onSurface.withOpacity(0.4))),
                          const SizedBox(height: 4),
                          Text(_profile?.email ?? '',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: cs.onSurface.withOpacity(0.5))),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Display Name
                  _sectionCard(
                    title: 'Display Name',
                    icon: Icons.edit,
                    children: [
                      TextField(
                        controller: _displayNameCtrl,
                        decoration: const InputDecoration(
                            labelText: 'New Display Name'),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed:
                              _savingProfile ? null : _updateProfile,
                          child: _savingProfile
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2))
                              : const Text('Save'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Change Password
                  _sectionCard(
                    title: 'Change Password',
                    icon: Icons.lock_outline,
                    children: [
                      TextField(
                        controller: _currentPwCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Current Password'),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newPwCtrl,
                        obscureText: true,
                        decoration:
                            const InputDecoration(labelText: 'New Password'),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _confirmPwCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Confirm New Password'),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _savingPw ? null : _changePassword,
                          style: FilledButton.styleFrom(
                              backgroundColor: Colors.red),
                          child: _savingPw
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white))
                              : const Text('Change Password'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Change Email
                  _sectionCard(
                    title: 'Change Email',
                    icon: Icons.email_outlined,
                    children: [
                      TextField(
                        controller: _newEmailCtrl,
                        decoration:
                            const InputDecoration(labelText: 'New Email'),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _emailPwCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Confirm Password'),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _savingEmail ? null : _changeEmail,
                          child: _savingEmail
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2))
                              : const Text('Change Email'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
              ),
            ),
    );
  }

  Widget _sectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _displayNameCtrl.dispose();
    _currentPwCtrl.dispose();
    _newPwCtrl.dispose();
    _confirmPwCtrl.dispose();
    _newEmailCtrl.dispose();
    _emailPwCtrl.dispose();
    super.dispose();
  }
}
