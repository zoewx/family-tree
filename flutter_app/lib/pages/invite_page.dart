import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/models.dart';

class InvitePage extends StatefulWidget {
  final String code;
  const InvitePage({super.key, required this.code});

  @override
  State<InvitePage> createState() => _InvitePageState();
}

class _InvitePageState extends State<InvitePage> {
  InvitationDTO? _invitation;
  bool _loading = true;
  bool _accepting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _validate();
  }

  Future<void> _validate() async {
    try {
      final inv =
          await context.read<ApiService>().validateInvitation(widget.code);
      if (mounted) setState(() { _invitation = inv; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Invalid or expired invitation';
          _loading = false;
        });
      }
    }
  }

  Future<void> _accept() async {
    setState(() => _accepting = true);
    try {
      await context.read<ApiService>().acceptInvitation(widget.code);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invitation accepted!')));
        Navigator.pushReplacementNamed(context, '/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _accepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isLoggedIn = context.watch<AuthService>().isLoggedIn;

    return Scaffold(
      appBar: AppBar(title: const Text('Invitation')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text(_error!,
                          style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: () => Navigator.pushReplacementNamed(
                            context, '/dashboard'),
                        child: const Text('Go to Dashboard'),
                      ),
                    ],
                  ),
                )
              : Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.mail_outline, size: 48),
                            const SizedBox(height: 16),
                            Text('You\'re invited!',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall),
                            const SizedBox(height: 8),
                            Text(
                              '${_invitation!.invitedByName} invited you to',
                              style: TextStyle(
                                  color: cs.onSurface.withOpacity(0.6)),
                            ),
                            Text(
                              _invitation!.familyTreeName,
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 24),
                            if (isLoggedIn)
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  onPressed: _accepting ? null : _accept,
                                  child: _accepting
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2))
                                      : const Text('Accept Invitation'),
                                ),
                              )
                            else
                              Column(
                                children: [
                                  const Text(
                                      'Please log in or register first'),
                                  const SizedBox(height: 12),
                                  FilledButton(
                                    onPressed: () =>
                                        Navigator.pushReplacementNamed(
                                            context, '/login'),
                                    child: const Text('Go to Login'),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
    );
  }
}
