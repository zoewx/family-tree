import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import '../widgets/responsive.dart';

class PersonFormPage extends StatefulWidget {
  final String treeId;
  final List<PersonDTO> persons;

  const PersonFormPage({
    super.key,
    required this.treeId,
    required this.persons,
  });

  @override
  State<PersonFormPage> createState() => _PersonFormPageState();
}

class _PersonFormPageState extends State<PersonFormPage> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _englishName = TextEditingController();
  final _bio = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _country = TextEditingController();
  final _province = TextEditingController();
  final _city = TextEditingController();
  final _birthDate = TextEditingController();
  final _deathDate = TextEditingController();
  String _gender = 'MALE';
  String? _fatherId;
  String? _motherId;
  String? _spouseId;
  int _generation = 0;
  bool _saving = false;

  Future<void> _save() async {
    if (_firstName.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('First name is required')));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<ApiService>().createPerson(widget.treeId, {
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'englishName': _englishName.text.trim(),
        'gender': _gender,
        'birthDate':
            _birthDate.text.isNotEmpty ? _birthDate.text : null,
        'deathDate':
            _deathDate.text.isNotEmpty ? _deathDate.text : null,
        'bio': _bio.text,
        'phone': _phone.text,
        'email': _email.text,
        'country': _country.text,
        'province': _province.text,
        'city': _city.text,
        'fatherId': _fatherId,
        'motherId': _motherId,
        'spouseId': _spouseId,
        'generation': _generation,
      });
      if (mounted) Navigator.pop(context, true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Failed to create person')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  List<DropdownMenuItem<String?>> _personDropdown(String hint) {
    return [
      DropdownMenuItem<String?>(value: null, child: Text(hint)),
      ...widget.persons.map((p) => DropdownMenuItem<String?>(
            value: p.id,
            child: Text(p.displayName),
          )),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Person'),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _field('First Name *', _firstName),
            _field('Last Name', _lastName),
            _field('English Name', _englishName),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(
                    value: 'MALE', label: Text('Male'), icon: Icon(Icons.man)),
                ButtonSegment(
                    value: 'FEMALE',
                    label: Text('Female'),
                    icon: Icon(Icons.woman)),
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
            const Divider(height: 32),
            _label('Father'),
            DropdownButton<String?>(
              isExpanded: true,
              value: _fatherId,
              items: _personDropdown('No father'),
              onChanged: (v) => setState(() => _fatherId = v),
            ),
            const SizedBox(height: 8),
            _label('Mother'),
            DropdownButton<String?>(
              isExpanded: true,
              value: _motherId,
              items: _personDropdown('No mother'),
              onChanged: (v) => setState(() => _motherId = v),
            ),
            const SizedBox(height: 8),
            _label('Spouse'),
            DropdownButton<String?>(
              isExpanded: true,
              value: _spouseId,
              items: _personDropdown('No spouse'),
              onChanged: (v) => setState(() => _spouseId = v),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _label('Generation'),
                const SizedBox(width: 12),
                SizedBox(
                  width: 80,
                  child: TextField(
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: '0'),
                    onChanged: (v) =>
                        _generation = int.tryParse(v) ?? 0,
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

  Widget _label(String text) {
    return Text(text,
        style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)));
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
