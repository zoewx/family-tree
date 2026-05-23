import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/models.dart';
import '../theme.dart';
import '../widgets/responsive.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  List<FamilyTreeDTO> _trees = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTrees();
  }

  Future<void> _loadTrees() async {
    setState(() => _loading = true);
    try {
      _trees = await context.read<ApiService>().getMyTrees();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _showCreateDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create New Family Tree'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Name',
                hintText: 'e.g. The Smith Family',
              ),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                final tree = await context.read<ApiService>().createTree(
                      nameCtrl.text.trim(),
                      descCtrl.text.trim().isNotEmpty
                          ? descCtrl.text.trim()
                          : null,
                    );
                if (mounted) {
                  Navigator.pushNamed(context, '/tree/${tree.id}');
                }
              } catch (_) {}
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'OWNER':
        return Colors.amber;
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
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Family Trees'),
        actions: [
          IconButton(
            icon: const Icon(Icons.brightness_6),
            onPressed: () => context.read<ThemeProvider>().toggle(),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.pushNamed(context, '/account'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        icon: const Icon(Icons.add),
        label: const Text('New Tree'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _trees.isEmpty
              ? _buildEmptyState(cs)
              : RefreshIndicator(
                  onRefresh: _loadTrees,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final cols = responsiveColumns(context);
                      if (cols > 1) {
                        // Tablet/desktop: grid layout
                        return GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: cols,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.8,
                          ),
                          itemCount: _trees.length,
                          itemBuilder: (ctx, i) => _buildTreeCard(_trees[i], cs),
                        );
                      }
                      // Phone: list layout
                      return ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _trees.length,
                        itemBuilder: (ctx, i) => _buildTreeCard(_trees[i], cs),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(Icons.account_tree_rounded,
                color: Colors.white, size: 40),
          ),
          const SizedBox(height: 20),
          Text('No family trees yet',
              style: TextStyle(
                  fontSize: 18, color: cs.onSurface.withOpacity(0.5))),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _showCreateDialog,
            icon: const Icon(Icons.add),
            label: const Text('Create Your First Tree'),
          ),
        ],
      ),
    );
  }

  Widget _buildTreeCard(FamilyTreeDTO tree, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.pushNamed(context, '/tree/${tree.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.account_tree_rounded,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(tree.name,
                        style: const TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w600)),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _roleColor(tree.myRole).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_roleIcon(tree.myRole),
                            size: 14, color: _roleColor(tree.myRole)),
                        const SizedBox(width: 4),
                        Text(tree.myRole,
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _roleColor(tree.myRole))),
                      ],
                    ),
                  ),
                ],
              ),
              if (tree.description.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(tree.description,
                      style: TextStyle(
                          fontSize: 13,
                          color: cs.onSurface.withOpacity(0.5)),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.person_outline,
                      size: 16, color: cs.onSurface.withOpacity(0.4)),
                  const SizedBox(width: 4),
                  Text('${tree.personCount} people',
                      style: TextStyle(
                          fontSize: 13,
                          color: cs.onSurface.withOpacity(0.5))),
                  const SizedBox(width: 16),
                  Icon(Icons.group_outlined,
                      size: 16, color: cs.onSurface.withOpacity(0.4)),
                  const SizedBox(width: 4),
                  Text('${tree.memberCount} members',
                      style: TextStyle(
                          fontSize: 13,
                          color: cs.onSurface.withOpacity(0.5))),
                  const Spacer(),
                  Icon(Icons.workspace_premium,
                      size: 14, color: cs.onSurface.withOpacity(0.3)),
                  const SizedBox(width: 4),
                  Text(tree.creatorName,
                      style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurface.withOpacity(0.3))),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
