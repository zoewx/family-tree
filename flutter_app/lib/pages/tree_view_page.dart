import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/models.dart';
import 'person_detail_page.dart';
import 'person_form_page.dart';
import '../widgets/responsive.dart';

class TreeViewPage extends StatefulWidget {
  final String treeId;
  const TreeViewPage({super.key, required this.treeId});

  @override
  State<TreeViewPage> createState() => _TreeViewPageState();
}

class _TreeViewPageState extends State<TreeViewPage> {
  FamilyTreeDTO? _tree;
  List<PersonDTO> _persons = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final tree = await api.getTree(widget.treeId);
      final persons = await api.getPersons(widget.treeId);
      if (mounted) {
        setState(() {
          _tree = tree;
          _persons = persons;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool get _canEdit =>
      _tree?.myRole == 'OWNER' || _tree?.myRole == 'ADMIN';

  bool get _isOwner => _tree?.myRole == 'OWNER';

  String get _currentUserId => context.read<AuthService>().userId;

  bool _canEditPerson(PersonDTO p) {
    if (_canEdit) return true;
    return p.linkedUserId == _currentUserId;
  }

  List<PersonDTO> get _filteredPersons {
    if (_search.isEmpty) return _persons;
    final q = _search.toLowerCase();
    return _persons.where((p) {
      final cn = '${p.lastName}${p.firstName}'.toLowerCase();
      final fn = '${p.firstName}${p.lastName}'.toLowerCase();
      final en = p.englishName.toLowerCase();
      return cn.contains(q) || fn.contains(q) || en.contains(q);
    }).toList();
  }

  // Build tree hierarchy for display
  List<PersonDTO> get _rootPersons {
    return _persons.where((p) => p.fatherId == null && p.motherId == null).toList();
  }

  void _openPersonDetail(PersonDTO person) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PersonDetailPage(
          treeId: widget.treeId,
          personId: person.id,
          canEdit: _canEditPerson(person),
          isOwner: _isOwner,
        ),
      ),
    );
    if (result == true) _load();
  }

  void _openAddPerson() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PersonFormPage(
          treeId: widget.treeId,
          persons: _persons,
        ),
      ),
    );
    if (result == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(_tree?.name ?? 'Family Tree'),
        actions: [
          if (_canEdit)
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () =>
                  Navigator.pushNamed(context, '/tree/${widget.treeId}/manage')
                      .then((_) => _load()),
            ),
        ],
      ),
      floatingActionButton: _canEdit
          ? FloatingActionButton(
              onPressed: _openAddPerson,
              child: const Icon(Icons.person_add),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search bar
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search people...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _search.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () => setState(() => _search = ''),
                            )
                          : null,
                    ),
                    onChanged: (v) => setState(() => _search = v),
                  ),
                ),

                // Stats bar
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    children: [
                      Icon(Icons.people_outline,
                          size: 16, color: cs.onSurface.withOpacity(0.4)),
                      const SizedBox(width: 4),
                      Text('${_persons.length} people',
                          style: TextStyle(
                              fontSize: 13,
                              color: cs.onSurface.withOpacity(0.5))),
                      const Spacer(),
                      if (_tree?.myRole != null)
                        Chip(
                          label: Text(_tree!.myRole,
                              style: const TextStyle(fontSize: 11)),
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                        ),
                    ],
                  ),
                ),

                const Divider(height: 1),

                // Person list
                Expanded(
                  child: _filteredPersons.isEmpty
                      ? Center(
                          child: Text(
                            _search.isNotEmpty
                                ? 'No results for "$_search"'
                                : 'No people added yet',
                            style: TextStyle(
                                color: cs.onSurface.withOpacity(0.4)),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: _buildTreeList(cs),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildTreeList(ColorScheme cs) {
    // Group by generation
    final byGen = <int, List<PersonDTO>>{};
    for (final p in _filteredPersons) {
      byGen.putIfAbsent(p.generation, () => []).add(p);
    }
    final gens = byGen.keys.toList()..sort();
    final cols = responsiveColumns(context);
    final useGrid = cols > 1;

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 80),
      itemCount: gens.length,
      itemBuilder: (ctx, gi) {
        final gen = gens[gi];
        final people = byGen[gen]!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text('Generation ${gen}',
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: cs.primary)),
            ),
            if (useGrid)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: people.map((p) => SizedBox(
                    width: (MediaQuery.of(context).size.width - 24 - (cols - 1) * 8) / cols,
                    child: _buildPersonTile(p, cs),
                  )).toList(),
                ),
              )
            else
              ...people.map((p) => _buildPersonTile(p, cs)),
          ],
        );
      },
    );
  }

  Widget _buildPersonTile(PersonDTO p, ColorScheme cs) {
    final isMale = p.gender == 'MALE';
    final colors = isMale
        ? [const Color(0xFF007AFF), const Color(0xFF5856D6)]
        : [const Color(0xFFFF2D55), const Color(0xFFFF6482)];

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: CircleAvatar(
          radius: 22,
          backgroundImage:
              p.photoUrl != null ? NetworkImage(p.photoUrl!) : null,
          backgroundColor: colors[0].withOpacity(0.15),
          child: p.photoUrl == null
              ? Icon(isMale ? Icons.man : Icons.woman,
                  color: colors[0], size: 22)
              : null,
        ),
        title: Text(p.displayName,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (p.englishName.isNotEmpty && p.displayName != p.englishName)
              Text(p.englishName,
                  style: TextStyle(
                      fontSize: 12, color: cs.onSurface.withOpacity(0.5))),
            if (p.birthDate != null)
              Text(p.birthDate!,
                  style: TextStyle(
                      fontSize: 11, color: cs.onSurface.withOpacity(0.4))),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (p.spouseName != null)
              Icon(Icons.favorite, size: 14, color: Colors.pink.shade200),
            if (p.linkedUserId != null)
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Icon(Icons.link, size: 14, color: cs.primary),
              ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 20),
          ],
        ),
        onTap: () => _openPersonDetail(p),
      ),
    );
  }
}
