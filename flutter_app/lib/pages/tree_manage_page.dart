import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import '../widgets/responsive.dart';

class TreeManagePage extends StatefulWidget {
  final String treeId;
  const TreeManagePage({super.key, required this.treeId});

  @override
  State<TreeManagePage> createState() => _TreeManagePageState();
}

class _TreeManagePageState extends State<TreeManagePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  FamilyTreeDTO? _tree;
  List<MemberDTO> _members = [];
  List<InvitationDTO> _invitations = [];
  List<LinkRequestDTO> _linkRequests = [];
  bool _loading = true;
  bool _isOwner = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final tree = await api.getTree(widget.treeId);
      _isOwner = tree.myRole == 'OWNER';
      final members = await api.getMembers(widget.treeId);
      final invitations = await api.getTreeInvitations(widget.treeId);
      final requests =
          _isOwner ? await api.getLinkRequests(widget.treeId) : <LinkRequestDTO>[];
      if (mounted) {
        setState(() {
          _tree = tree;
          _members = members;
          _invitations = invitations;
          _linkRequests = requests;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _invite() async {
    final emailCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Invite Member'),
        content: TextField(
          controller: emailCtrl,
          decoration: const InputDecoration(
            labelText: 'Email',
            hintText: 'user@example.com',
          ),
          keyboardType: TextInputType.emailAddress,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Send')),
        ],
      ),
    );
    if (ok != true || emailCtrl.text.trim().isEmpty) return;
    try {
      await context
          .read<ApiService>()
          .createInvitation(widget.treeId, emailCtrl.text.trim());
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Invitation sent')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _updateRole(MemberDTO member, String role) async {
    try {
      await context
          .read<ApiService>()
          .updateMemberRole(widget.treeId, member.id, role);
      _load();
    } catch (_) {}
  }

  Future<void> _removeMember(MemberDTO member) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Member'),
        content: Text('Remove ${member.displayName}?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (ok == true) {
      try {
        await context
            .read<ApiService>()
            .removeMember(widget.treeId, member.id);
        _load();
      } catch (_) {}
    }
  }

  Future<void> _approveLink(LinkRequestDTO req) async {
    try {
      await context
          .read<ApiService>()
          .approveLinkRequest(widget.treeId, req.id);
      _load();
    } catch (_) {}
  }

  Future<void> _rejectLink(LinkRequestDTO req) async {
    try {
      await context
          .read<ApiService>()
          .rejectLinkRequest(widget.treeId, req.id);
      _load();
    } catch (_) {}
  }

  Future<void> _deleteTree() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Family Tree'),
        content: const Text(
            'This will permanently delete the tree and all data. Continue?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await context.read<ApiService>().deleteTree(widget.treeId);
      if (mounted) {
        Navigator.popUntil(context, (route) => route.isFirst);
      }
    } catch (_) {}
  }

  Future<void> _generateShareLink() async {
    try {
      final tree =
          await context.read<ApiService>().generateShareToken(widget.treeId);
      setState(() => _tree = tree);
    } catch (_) {}
  }

  Future<void> _revokeShareLink() async {
    try {
      final tree =
          await context.read<ApiService>().revokeShareToken(widget.treeId);
      setState(() => _tree = tree);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Tree'),
        bottom: TabBar(
          controller: _tabCtrl,
          tabs: const [
            Tab(text: 'Members'),
            Tab(text: 'Invites'),
            Tab(text: 'Requests'),
            Tab(text: 'Settings'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabCtrl,
              children: [
                _buildMembers(cs),
                _buildInvitations(cs),
                _buildLinkRequests(cs),
                _buildSettings(cs),
              ],
            ),
    );
  }

  Widget _buildMembers(ColorScheme cs) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Text('${_members.length} Members',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              if (_isOwner)
                FilledButton.icon(
                  onPressed: _invite,
                  icon: const Icon(Icons.person_add, size: 18),
                  label: const Text('Invite'),
                ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _members.length,
            itemBuilder: (ctx, i) {
              final m = _members[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: _roleColor(m.role).withOpacity(0.15),
                  child: Icon(_roleIcon(m.role), color: _roleColor(m.role)),
                ),
                title: Text(m.displayName),
                subtitle: Text(m.role,
                    style: TextStyle(
                        fontSize: 12, color: _roleColor(m.role))),
                trailing: _isOwner && m.role != 'OWNER'
                    ? PopupMenuButton<String>(
                        itemBuilder: (_) => [
                          const PopupMenuItem(
                              value: 'ADMIN', child: Text('Set Admin')),
                          const PopupMenuItem(
                              value: 'MEMBER', child: Text('Set Member')),
                          const PopupMenuItem(
                              value: 'remove',
                              child: Text('Remove',
                                  style: TextStyle(color: Colors.red))),
                        ],
                        onSelected: (v) {
                          if (v == 'remove') {
                            _removeMember(m);
                          } else {
                            _updateRole(m, v);
                          }
                        },
                      )
                    : null,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildInvitations(ColorScheme cs) {
    if (_invitations.isEmpty) {
      return const Center(child: Text('No invitations'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _invitations.length,
      itemBuilder: (ctx, i) {
        final inv = _invitations[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.mail_outline),
            title: Text(inv.inviteeEmail ?? ''),
            subtitle: Text('Status: ${inv.status}'),
            trailing: inv.status == 'PENDING'
                ? IconButton(
                    icon: const Icon(Icons.close, color: Colors.red),
                    onPressed: () async {
                      await context
                          .read<ApiService>()
                          .cancelInvitation(inv.id);
                      _load();
                    },
                  )
                : null,
          ),
        );
      },
    );
  }

  Widget _buildLinkRequests(ColorScheme cs) {
    if (!_isOwner) {
      return const Center(child: Text('Only the owner can manage link requests'));
    }
    if (_linkRequests.isEmpty) {
      return const Center(child: Text('No pending link requests'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _linkRequests.length,
      itemBuilder: (ctx, i) {
        final req = _linkRequests[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.link),
            title: Text('${req.requesterName} → ${req.personName}'),
            subtitle: Text(req.status),
            trailing: req.status == 'PENDING'
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.check_circle,
                            color: Colors.green),
                        onPressed: () => _approveLink(req),
                      ),
                      IconButton(
                        icon: const Icon(Icons.cancel, color: Colors.red),
                        onPressed: () => _rejectLink(req),
                      ),
                    ],
                  )
                : null,
          ),
        );
      },
    );
  }

  Widget _buildSettings(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ContentConstraint(
        maxWidth: 600,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Share section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Share',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  if (_tree?.shareToken == null)
                    FilledButton.icon(
                      onPressed: _generateShareLink,
                      icon: const Icon(Icons.share),
                      label: const Text('Generate Share Link'),
                    )
                  else ...[
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _tree!.shareToken!,
                            style: const TextStyle(fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          onPressed: () {
                            Clipboard.setData(
                                ClipboardData(text: _tree!.shareToken!));
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Copied!')));
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _revokeShareLink,
                      style:
                          OutlinedButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Revoke Link'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Danger zone
          if (_isOwner)
            Card(
              color: Colors.red.withOpacity(0.05),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Danger Zone',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.red)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _deleteTree,
                        style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red),
                        child: const Text('Delete Family Tree'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'OWNER':
        return Colors.amber.shade700;
      case 'ADMIN':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _roleIcon(String role) {
    switch (role) {
      case 'OWNER':
        return Icons.workspace_premium;
      case 'ADMIN':
        return Icons.shield_outlined;
      default:
        return Icons.person_outline;
    }
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }
}
