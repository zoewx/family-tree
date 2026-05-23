import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/models.dart';
import '../widgets/responsive.dart';

class PersonDetailPage extends StatefulWidget {
  final String treeId;
  final String personId;
  final bool canEdit;
  final bool isOwner;

  const PersonDetailPage({
    super.key,
    required this.treeId,
    required this.personId,
    this.canEdit = false,
    this.isOwner = false,
  });

  @override
  State<PersonDetailPage> createState() => _PersonDetailPageState();
}

class _PersonDetailPageState extends State<PersonDetailPage> {
  PersonDTO? _person;
  bool _loading = true;
  bool _linkRequesting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await context
          .read<ApiService>()
          .getPerson(widget.treeId, widget.personId);
      if (mounted) setState(() { _person = p; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _uploadPhoto() async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (xfile == null) return;
    try {
      await context
          .read<ApiService>()
          .uploadPhoto(widget.treeId, widget.personId, File(xfile.path));
      _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Upload failed')));
      }
    }
  }

  Future<void> _uploadGalleryPhoto() async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (xfile == null) return;
    try {
      await context
          .read<ApiService>()
          .uploadGalleryPhoto(widget.treeId, widget.personId, File(xfile.path));
      _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Upload failed')));
      }
    }
  }

  Future<void> _deleteGalleryPhoto(String photoId) async {
    try {
      await context
          .read<ApiService>()
          .deleteGalleryPhoto(widget.treeId, widget.personId, photoId);
      _load();
    } catch (_) {}
  }

  Future<void> _linkAccount() async {
    try {
      await context
          .read<ApiService>()
          .linkUserToPerson(widget.treeId, widget.personId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account linked successfully')));
      }
      _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Link failed')));
      }
    }
  }

  Future<void> _requestLink() async {
    setState(() => _linkRequesting = true);
    try {
      await context
          .read<ApiService>()
          .requestLink(widget.treeId, widget.personId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Link request sent. Waiting for owner approval.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Request failed')));
      }
    } finally {
      if (mounted) setState(() => _linkRequesting = false);
    }
  }

  Future<void> _deletePerson() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Person'),
        content: const Text('Are you sure? This cannot be undone.'),
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
    if (confirmed != true) return;
    try {
      await context
          .read<ApiService>()
          .deletePerson(widget.treeId, widget.personId);
      if (mounted) Navigator.pop(context, true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Delete failed')));
      }
    }
  }

  void _openEditPage() async {
    if (_person == null) return;
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _EditPersonPage(
          treeId: widget.treeId,
          person: _person!,
        ),
      ),
    );
    if (result == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final p = _person;

    return Scaffold(
      appBar: AppBar(
        title: Text(p?.displayName ?? 'Person'),
        actions: [
          if (widget.canEdit && p != null) ...[
            IconButton(icon: const Icon(Icons.edit), onPressed: _openEditPage),
            IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                onPressed: _deletePerson),
          ],
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : p == null
              ? const Center(child: Text('Person not found'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: ContentConstraint(
                      maxWidth: 600,
                      child: Column(
                      children: [
                        _buildHeader(p, cs),
                        const SizedBox(height: 16),
                        if (p.bio != null && p.bio!.isNotEmpty)
                          _buildBio(p, cs),
                        _buildContactInfo(p, cs),
                        _buildRelations(p, cs),
                        _buildGallery(p, cs),
                        _buildLinkSection(p, cs),
                        const SizedBox(height: 32),
                      ],
                    ),
                    ),
                  ),
                ),
    );
  }

  Widget _buildHeader(PersonDTO p, ColorScheme cs) {
    final isMale = p.gender == 'MALE';
    final colors = isMale
        ? [const Color(0xFF007AFF), const Color(0xFF5856D6)]
        : [const Color(0xFFFF2D55), const Color(0xFFFF6482)];

    return Column(
      children: [
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            CircleAvatar(
              radius: 50,
              backgroundImage:
                  p.photoUrl != null ? NetworkImage(p.photoUrl!) : null,
              backgroundColor: colors[0].withOpacity(0.15),
              child: p.photoUrl == null
                  ? Icon(isMale ? Icons.man : Icons.woman,
                      color: colors[0], size: 40)
                  : null,
            ),
            if (widget.canEdit)
              Positioned(
                bottom: 0,
                right: 0,
                child: GestureDetector(
                  onTap: _uploadPhoto,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: cs.primary,
                      shape: BoxShape.circle,
                    ),
                    child:
                        const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Text(p.displayName,
            style:
                const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        if (p.englishName.isNotEmpty && p.displayName != p.englishName)
          Text(p.englishName,
              style: TextStyle(
                  fontSize: 14, color: cs.onSurface.withOpacity(0.5))),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isMale ? Icons.man : Icons.woman,
                size: 16, color: colors[0]),
            const SizedBox(width: 4),
            Text(isMale ? 'Male' : 'Female',
                style: TextStyle(fontSize: 13, color: colors[0])),
            if (p.birthDate != null) ...[
              const SizedBox(width: 16),
              Icon(Icons.cake, size: 14, color: cs.onSurface.withOpacity(0.4)),
              const SizedBox(width: 4),
              Text(p.birthDate!,
                  style: TextStyle(
                      fontSize: 13, color: cs.onSurface.withOpacity(0.5))),
            ],
            if (p.deathDate != null) ...[
              const SizedBox(width: 8),
              Text('— ${p.deathDate}',
                  style: TextStyle(
                      fontSize: 13, color: cs.onSurface.withOpacity(0.4))),
            ],
          ],
        ),
        Text('Gen ${p.generation}',
            style: TextStyle(
                fontSize: 12, color: cs.onSurface.withOpacity(0.35))),
      ],
    );
  }

  Widget _buildBio(PersonDTO p, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(p.bio!,
          textAlign: TextAlign.center,
          style:
              TextStyle(fontSize: 14, color: cs.onSurface.withOpacity(0.6))),
    );
  }

  Widget _buildContactInfo(PersonDTO p, ColorScheme cs) {
    final hasContact = (p.phone?.isNotEmpty == true) ||
        (p.email?.isNotEmpty == true) ||
        (p.country?.isNotEmpty == true) ||
        (p.province?.isNotEmpty == true) ||
        (p.city?.isNotEmpty == true);
    if (!hasContact) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Contact & Location',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: cs.primary)),
            const SizedBox(height: 12),
            if (p.phone?.isNotEmpty == true)
              _infoRow(Icons.phone_outlined, p.phone!, const Color(0xFF007AFF)),
            if (p.email?.isNotEmpty == true)
              _infoRow(Icons.email_outlined, p.email!, const Color(0xFFFF9500)),
            if (p.country?.isNotEmpty == true ||
                p.province?.isNotEmpty == true ||
                p.city?.isNotEmpty == true)
              _infoRow(
                Icons.location_on_outlined,
                [p.city, p.province, p.country]
                    .where((s) => s?.isNotEmpty == true)
                    .join(', '),
                const Color(0xFF34C759),
              ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildRelations(PersonDTO p, ColorScheme cs) {
    final items = <_RelItem>[];
    if (p.fatherName != null)
      items.add(_RelItem('Father', p.fatherName!, p.fatherId!, 'MALE'));
    if (p.motherName != null)
      items.add(_RelItem('Mother', p.motherName!, p.motherId!, 'FEMALE'));
    if (p.spouseName != null)
      items.add(_RelItem('Spouse', p.spouseName!, p.spouseId!, ''));
    for (final c in p.children) {
      items.add(_RelItem('Child', c.displayName, c.id, c.gender));
    }
    for (final s in p.siblings) {
      items.add(_RelItem('Sibling', s.displayName, s.id, s.gender));
    }
    if (items.isEmpty) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Relations',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: cs.primary)),
            const SizedBox(height: 8),
            ...items.map((r) => ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    radius: 16,
                    backgroundColor: r.gender == 'MALE'
                        ? const Color(0xFF007AFF).withOpacity(0.15)
                        : r.gender == 'FEMALE'
                            ? const Color(0xFFFF2D55).withOpacity(0.15)
                            : cs.surfaceContainerHighest,
                    child: Icon(
                      r.gender == 'MALE'
                          ? Icons.man
                          : r.gender == 'FEMALE'
                              ? Icons.woman
                              : Icons.person,
                      size: 18,
                      color: r.gender == 'MALE'
                          ? const Color(0xFF007AFF)
                          : r.gender == 'FEMALE'
                              ? const Color(0xFFFF2D55)
                              : cs.onSurface,
                    ),
                  ),
                  title: Text(r.name,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w500)),
                  subtitle: Text(r.role,
                      style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurface.withOpacity(0.4))),
                  trailing: const Icon(Icons.chevron_right, size: 18),
                  onTap: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PersonDetailPage(
                          treeId: widget.treeId,
                          personId: r.id,
                          canEdit: widget.canEdit,
                          isOwner: widget.isOwner,
                        ),
                      ),
                    );
                    if (result == true) _load();
                  },
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildGallery(PersonDTO p, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Gallery',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: cs.primary)),
                const Spacer(),
                if (widget.canEdit)
                  IconButton(
                    icon: Icon(Icons.add_photo_alternate_outlined,
                        color: cs.primary, size: 20),
                    onPressed: _uploadGalleryPhoto,
                  ),
              ],
            ),
            if (p.galleryPhotos.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Center(
                    child: Text('No photos',
                        style: TextStyle(
                            color: cs.onSurface.withOpacity(0.35)))),
              )
            else
              SizedBox(
                height: 120,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: p.galleryPhotos.length,
                  itemBuilder: (ctx, i) {
                    final photo = p.galleryPhotos[i];
                    return GestureDetector(
                      onTap: () => _showPhotoViewer(photo),
                      onLongPress: widget.canEdit
                          ? () => _confirmDeletePhoto(photo)
                          : null,
                      child: Container(
                        width: 120,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: DecorationImage(
                            image: CachedNetworkImageProvider(photo.url),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showPhotoViewer(PhotoItem photo) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        child: CachedNetworkImage(imageUrl: photo.url, fit: BoxFit.contain),
      ),
    );
  }

  void _confirmDeletePhoto(PhotoItem photo) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Photo'),
        content: const Text('Remove this photo?'),
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
    if (confirmed == true) _deleteGalleryPhoto(photo.id);
  }

  Widget _buildLinkSection(PersonDTO p, ColorScheme cs) {
    if (p.linkedUserId != null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: SizedBox(
        width: double.infinity,
        child: widget.isOwner
            ? OutlinedButton.icon(
                onPressed: _linkAccount,
                icon: const Icon(Icons.person_pin),
                label: const Text('This is me — Link my account'),
              )
            : OutlinedButton.icon(
                onPressed: _linkRequesting ? null : _requestLink,
                icon: _linkRequesting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.person_pin),
                label: const Text('This is me — Request to link'),
              ),
      ),
    );
  }
}

class _RelItem {
  final String role;
  final String name;
  final String id;
  final String gender;
  _RelItem(this.role, this.name, this.id, this.gender);
}

// ─── Edit Person Page ───
class _EditPersonPage extends StatefulWidget {
  final String treeId;
  final PersonDTO person;
  const _EditPersonPage({required this.treeId, required this.person});

  @override
  State<_EditPersonPage> createState() => _EditPersonPageState();
}

class _EditPersonPageState extends State<_EditPersonPage> {
  late TextEditingController _firstName;
  late TextEditingController _lastName;
  late TextEditingController _englishName;
  late TextEditingController _bio;
  late TextEditingController _phone;
  late TextEditingController _email;
  late TextEditingController _country;
  late TextEditingController _province;
  late TextEditingController _city;
  late TextEditingController _birthDate;
  late TextEditingController _deathDate;
  String _gender = 'MALE';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.person;
    _firstName = TextEditingController(text: p.firstName);
    _lastName = TextEditingController(text: p.lastName);
    _englishName = TextEditingController(text: p.englishName);
    _bio = TextEditingController(text: p.bio ?? '');
    _phone = TextEditingController(text: p.phone ?? '');
    _email = TextEditingController(text: p.email ?? '');
    _country = TextEditingController(text: p.country ?? '');
    _province = TextEditingController(text: p.province ?? '');
    _city = TextEditingController(text: p.city ?? '');
    _birthDate = TextEditingController(text: p.birthDate ?? '');
    _deathDate = TextEditingController(text: p.deathDate ?? '');
    _gender = p.gender;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await context.read<ApiService>().updatePerson(
        widget.treeId,
        widget.person.id,
        {
          'firstName': _firstName.text,
          'lastName': _lastName.text,
          'englishName': _englishName.text,
          'gender': _gender,
          'birthDate': _birthDate.text.isNotEmpty ? _birthDate.text : null,
          'deathDate': _deathDate.text.isNotEmpty ? _deathDate.text : null,
          'bio': _bio.text,
          'phone': _phone.text,
          'email': _email.text,
          'country': _country.text,
          'province': _province.text,
          'city': _city.text,
          'fatherId': widget.person.fatherId,
          'motherId': widget.person.motherId,
          'spouseId': widget.person.spouseId,
          'generation': widget.person.generation,
        },
      );
      if (mounted) Navigator.pop(context, true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Save failed')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Person'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: ContentConstraint(
          maxWidth: 600,
          child: Column(
          children: [
            _field('First Name', _firstName),
            _field('Last Name', _lastName),
            _field('English Name', _englishName),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'MALE', label: Text('Male'), icon: Icon(Icons.man)),
                ButtonSegment(value: 'FEMALE', label: Text('Female'), icon: Icon(Icons.woman)),
              ],
              selected: {_gender},
              onSelectionChanged: (s) => setState(() => _gender = s.first),
            ),
            const SizedBox(height: 12),
            _field('Birth Date (yyyy-MM-dd)', _birthDate),
            _field('Death Date (yyyy-MM-dd)', _deathDate),
            _field('Bio', _bio, maxLines: 3),
            const Divider(height: 32),
            _field('Phone', _phone),
            _field('Email', _email),
            _field('Country', _country),
            _field('Province', _province),
            _field('City', _city),
            const SizedBox(height: 32),
          ],
        ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _englishName.dispose();
    _bio.dispose();
    _phone.dispose();
    _email.dispose();
    _country.dispose();
    _province.dispose();
    _city.dispose();
    _birthDate.dispose();
    _deathDate.dispose();
    super.dispose();
  }
}
