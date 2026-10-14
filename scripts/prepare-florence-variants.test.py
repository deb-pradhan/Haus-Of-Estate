"""Filesystem preflight tests; synthetic inputs only, no PDF/image generation."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    'florence_variants', Path(__file__).with_name('prepare-florence-variants.py'))
GENERATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GENERATOR)


class PreparationSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='florence-safety-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.assertFalse(self.root.is_relative_to(GENERATOR.REPO))
        self.source = self.root / 'source'
        self.base = self.root / 'base'
        self.source.mkdir()
        self.base.mkdir()
        self.output = self.root / 'new-output'
        self.manifest = self.root / 'manifest.json'
        self.write_manifest()
        (self.base / 'preparation-report.json').write_text(
            json.dumps({'status': 'complete', 'images': []}), encoding='utf-8')
        (self.base / 'properties.staging-draft.ndjson').write_text(
            '\n'.join(json.dumps({'slug': {'current': f'property-{i}'}})
                      for i in range(6)), encoding='utf-8')
        # Every fixture must stop before opening a PDF, even if preflight regresses.
        self.pdf = patch.object(GENERATOR.pdfium, 'PdfDocument',
                                side_effect=AssertionError('PDF rendering is forbidden')).start()
        self.addCleanup(patch.stopall)

    def write_manifest(self, brochures=None):
        self.manifest.write_text(json.dumps({
            'schemaVersion': 1, 'brochures': brochures or [], 'documents': [],
        }), encoding='utf-8')

    def prepare(self, output=None):
        GENERATOR.prepare(self.source, self.base, output or self.output, self.manifest)

    def test_existing_output_is_untouched(self):
        self.output.mkdir()
        sentinel = self.output / 'keep.txt'
        sentinel.write_bytes(b'keep this output unchanged')
        with self.assertRaisesRegex(ValueError, 'new directory outside Git'):
            self.prepare()
        self.assertEqual(sentinel.read_bytes(), b'keep this output unchanged')
        self.assertEqual(list(self.output.iterdir()), [sentinel])

    def test_output_inside_repository_is_refused_before_write(self):
        repository = self.root / 'synthetic-repository'
        repository.mkdir()
        output = repository / 'new-output'
        with patch.object(GENERATOR, 'REPO', repository):
            with self.assertRaisesRegex(ValueError, 'outside Git'):
                self.prepare(output)
        self.assertFalse(output.exists())

    def test_output_inside_either_input_is_refused_before_write(self):
        for directory in (self.source, self.base):
            with self.subTest(directory=directory.name):
                output = directory / 'new-output'
                with self.assertRaisesRegex(ValueError, 'separate from both input'):
                    self.prepare(output)
                self.assertFalse(output.exists())

    def test_traversing_brochure_path_is_refused_before_write(self):
        outside = self.root / 'outside.pdf'
        outside.write_bytes(b'synthetic PDF source')
        self.write_manifest([{'key': 'test', 'file': '../outside.pdf',
                              'sha256': GENERATOR.sha256(outside), 'pageCount': 1}])
        with self.assertRaisesRegex(ValueError, 'stay inside its input directory'):
            self.prepare()
        self.assertFalse(self.output.exists())
        self.pdf.assert_not_called()

    def test_absolute_brochure_path_is_refused_before_write(self):
        outside = self.root / 'outside.pdf'
        outside.write_bytes(b'synthetic PDF source')
        self.write_manifest([{'key': 'test', 'file': str(outside),
                              'sha256': GENERATOR.sha256(outside), 'pageCount': 1}])
        with self.assertRaisesRegex(ValueError, 'stay inside its input directory'):
            self.prepare()
        self.assertFalse(self.output.exists())

    def test_traversing_base_asset_is_refused_before_write(self):
        (self.base / 'preparation-report.json').write_text(json.dumps({
            'status': 'complete', 'images': [{'output': {
                'relativePath': '../outside.jpg', 'bytes': 0, 'sha256': 'unused',
            }}],
        }), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'stay inside its input directory'):
            self.prepare()
        self.assertFalse(self.output.exists())

    def test_bad_source_hash_causes_no_writes(self):
        source = self.source / 'test.pdf'
        source.write_bytes(b'synthetic PDF source')
        self.write_manifest([{'key': 'test', 'file': source.name,
                              'sha256': '0' * 64, 'pageCount': 1}])
        before = {str(path.relative_to(self.root)): path.read_bytes()
                  for path in self.root.rglob('*') if path.is_file()}
        with self.assertRaisesRegex(ValueError, 'Brochure changed'):
            self.prepare()
        after = {str(path.relative_to(self.root)): path.read_bytes()
                 for path in self.root.rglob('*') if path.is_file()}
        self.assertEqual(after, before)
        self.assertFalse(self.output.exists())
        self.pdf.assert_not_called()

    def test_invalid_interior_page_causes_no_writes(self):
        source = self.source / 'test.pdf'
        source.write_bytes(b'synthetic source')
        self.write_manifest([{'key': 'test', 'file': source.name,
                              'sha256': GENERATOR.sha256(source), 'pageCount': 1}])
        manifest = GENERATOR.read_json(self.manifest)
        manifest['documents'] = [{'slug': 'property-0', 'brochureKey': 'test',
                                  'designVariants': [], 'interiorSchemes': [{'photoPage': 2}]}]
        self.manifest.write_text(json.dumps(manifest), encoding='utf-8')
        self.pdf.side_effect = None
        self.pdf.return_value = [None]
        with self.assertRaisesRegex(ValueError, 'Interior page outside source brochure'):
            self.prepare()
        self.assertFalse(self.output.exists())

    def make_directory_link(self, name, target):
        link = self.root / name
        try:
            link.symlink_to(target, target_is_directory=True)
        except OSError as error:
            if not hasattr(Path, 'is_junction'):
                self.skipTest(f'Directory symlinks unavailable: {error}')
            result = subprocess.run(
                ['cmd', '/c', 'mklink', '/J', str(link), str(target)],
                capture_output=True, text=True, check=False)
            if result.returncode:
                self.skipTest('Directory symlinks and junctions unavailable')
            self.assertTrue(link.is_junction())
        # Remove only the temporary link itself before TemporaryDirectory cleanup.
        self.addCleanup(lambda: link.unlink() if link.is_symlink() else link.rmdir())
        return link

    def test_linked_source_is_refused_before_write(self):
        self.source = self.make_directory_link('linked-source', self.source)
        with self.assertRaisesRegex(ValueError, 'Linked paths are not allowed'):
            self.prepare()
        self.assertFalse(self.output.exists())

    def test_output_with_linked_ancestor_is_refused_before_write(self):
        destination = self.root / 'destination'
        destination.mkdir()
        link = self.make_directory_link('linked-output', destination)
        with self.assertRaisesRegex(ValueError, 'Linked paths are not allowed'):
            self.prepare(link / 'new-output')
        self.assertEqual(list(destination.iterdir()), [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
