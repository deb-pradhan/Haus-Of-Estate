"""Prepare Florence brochure selections locally; never uploads or copies full PDFs.

Requires Pillow and pypdfium2. Outputs must be new, outside the repository and
separate from both inputs. The original six-document workflow is retained.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import shutil
import sys

import pypdfium2 as pdfium
from PIL import Image


REPO = Path(__file__).resolve().parents[1]


def sha256(file):
    digest = hashlib.sha256()
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def clean_path(value):
    path = Path(value).absolute()
    for part in (path, *path.parents):
        if part.is_symlink() or (hasattr(part, 'is_junction') and part.is_junction()):
            raise ValueError(f'Linked paths are not allowed: {part}')
    return path.resolve()


def child(root, value):
    candidate = clean_path(root / value)
    if not candidate.is_relative_to(root) or candidate == root:
        raise ValueError('Path must stay inside its input directory')
    return candidate


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def rebase(value, old, new):
    if isinstance(value, dict):
        return {key: rebase(item, old, new) for key, item in value.items()}
    if isinstance(value, list):
        return [rebase(item, old, new) for item in value]
    if isinstance(value, str):
        for source, target in [(old.as_uri(), new.as_uri()), (old.as_posix(), new.as_posix()), (str(old), str(new))]:
            value = value.replace(source, target)
    return value


def prepare(source, base, output, manifest_path):
    source, base, output = map(clean_path, (source, base, output))
    if output.exists() or output.is_relative_to(REPO):
        raise ValueError('Output must be a new directory outside Git')
    for input_root in (source, base):
        if output.is_relative_to(input_root) or input_root.is_relative_to(output):
            raise ValueError('Output must be separate from both input directories')
    manifest = read_json(manifest_path)
    if manifest['schemaVersion'] != 1:
        raise ValueError('Unsupported variant manifest')
    report = read_json(child(base, 'preparation-report.json'))
    originals = [json.loads(line) for line in child(base, 'properties.staging-draft.ndjson').read_text(encoding='utf-8-sig').splitlines() if line.strip()]
    if report['status'] != 'complete' or len(originals) != 6:
        raise ValueError('A complete six-document base bundle is required')
    brochures = {}
    for item in manifest['brochures']:
        file = child(source, item['file'])
        if sha256(file) != item['sha256']:
            raise ValueError(f'Brochure changed: {item["file"]}')
        document = pdfium.PdfDocument(file)
        if len(document) != item['pageCount']:
            raise ValueError('Brochure page count changed')
        brochures[item['key']] = (item, document)
    # Check every copied image before creating an output directory.
    for item in report['images']:
        file = child(base, item['output']['relativePath'])
        if file.stat().st_size != item['output']['bytes'] or sha256(file) != item['output']['sha256']:
            raise ValueError(f'Base image changed: {file.name}')
    slugs = {item['slug']['current'] for item in originals}
    seen = set()
    for item in manifest['documents']:
        if item['slug'] not in slugs or item['slug'] in seen:
            raise ValueError('Unknown or repeated property slug')
        seen.add(item['slug'])
        for design in item['designVariants']:
            for page in design['photoPages'] + design['floorPlanPages'] + [design['areaEvidencePage']]:
                if not 1 <= page <= len(brochures[item['brochureKey']][1]):
                    raise ValueError('Page outside source brochure')
        for scheme in item['interiorSchemes']:
            page = scheme['photoPage']
            if type(page) is not int or not 1 <= page <= len(brochures[item['brochureKey']][1]):
                raise ValueError('Interior page outside source brochure')
    output.mkdir(parents=True)
    (output / 'images').mkdir()
    for item in report['images']:
        shutil.copyfile(child(base, item['output']['relativePath']), child(output, item['output']['relativePath']))
    report = rebase(report, base, output)
    originals = rebase(originals, base, output)
    assets = {}

    def render(brochure_key, page_number, kind):
        asset_id = f'florence-{brochure_key}-p{page_number:02d}-{kind}'
        if asset_id in assets:
            return asset_id
        evidence, document = brochures[brochure_key]
        page = document[page_number - 1]
        width, height = page.get_size()
        # Standard photo pages use a brochure margin. Plans remain whole pages.
        scale = 2560 / max(width, height)
        bitmap = page.render(scale=scale)
        picture = bitmap.to_pil().convert('RGB')
        if kind == 'photo':
            picture = picture.crop((round(picture.width * .05), round(picture.height * .075), round(picture.width * .95), round(picture.height * .84)))
        picture.thumbnail((2560, 2560), Image.Resampling.LANCZOS)
        relative = f'images/{asset_id}.jpg'
        file = child(output, relative)
        picture.save(file, 'JPEG', quality=90 if kind == 'plan' else 87, optimize=True, progressive=True)
        assets[asset_id] = {
            'id': asset_id,
            'source': {'file': evidence['file'], 'sha256': evidence['sha256'], 'page': page_number, 'kind': kind},
            'output': {'relativePath': relative, 'path': str(file), 'bytes': file.stat().st_size,
                       'sha256': sha256(file), 'width': picture.width, 'height': picture.height, 'format': 'jpeg'},
        }
        picture.close()
        bitmap.close()
        page.close()
        return asset_id

    documents = []
    for definition in manifest['documents']:
        key = definition['brochureKey']
        townhouse = key == 'townhouse-3-4br'
        prepared = {'slug': definition['slug'], 'brochureKey': key, 'designVariants': [], 'interiorSchemes': []}
        for design in definition['designVariants']:
            item = {name: value for name, value in design.items() if name not in ('photoPages', 'floorPlanPages', 'areaEvidencePage', 'areaNote')}
            item['sourceEvidence'] = json.dumps({'brochure': brochures[key][0], 'pages': {name: design[name] for name in ('photoPages', 'floorPlanPages', 'areaEvidencePage')}, 'plotNote': design.get('areaNote')}, ensure_ascii=False)
            scope = f'{design["family"]} {design["rowHomes"]}-home row' if townhouse else f'{definition["bedrooms"]}-bedroom villa {design["label"]}'
            item['images'] = [{'imageId': render(key, page, 'photo'), 'alt': f'Azizi Florence — {scope}, brochure exterior view {index + 1}', 'label': f'{scope} — shared row view' if townhouse else f'{scope} — exterior view {index + 1}'} for index, page in enumerate(design['photoPages'])]
            item['floorPlans'] = []
            for index, page in enumerate(design['floorPlanPages']):
                label = ('Ground floor — whole row' if index == 0 else 'First floor — whole row') if townhouse else ('Ground and first floors' if index == 0 else 'Roof floor and brochure area summary')
                item['floorPlans'].append({'imageId': render(key, page, 'plan'), 'alt': f'Azizi Florence — {scope} — {label}', 'label': label})
            prepared['designVariants'].append(item)
        for scheme in definition['interiorSchemes']:
            label = f'{definition["bedrooms"]}-bedroom townhouse — {scheme["label"]}'
            prepared['interiorSchemes'].append({'_key': scheme['_key'], 'label': scheme['label'], 'images': [{'imageId': render(key, scheme['photoPage'], 'photo'), 'alt': f'Azizi Florence — {label}, brochure interior illustration', 'label': label}]})
        documents.append(prepared)
    # Write a separate future-import candidate; historical draft identities must
    # be reconciled to the existing native Sanity drafts before any actual import.
    enriched = copy.deepcopy(originals)
    def native_image(image, index):
        file = Path(assets[image['imageId']]['output']['path'])
        return {'_type': 'image', '_key': f'{image["imageId"]}-{index}', '_sanityAsset': 'image@' + file.as_uri(), 'alt': image['alt'], 'label': image['label']}
    for definition in documents:
        target = next(item for item in enriched if item['slug']['current'] == definition['slug'])
        target['designVariants'] = []
        for design in definition['designVariants']:
            native = {key: value for key, value in design.items() if key not in ('images', 'floorPlans')}
            native['_type'] = 'propertyDesign'
            native['brochureKey'] = definition['brochureKey']
            native['brochureRevision'] = brochures[definition['brochureKey']][0]['sha256']
            for field in ('images', 'floorPlans'):
                native[field] = [native_image(image, index) for index, image in enumerate(design[field])]
            target['designVariants'].append(native)
        target['interiorSchemes'] = [{'_type': 'propertyInteriorScheme', '_key': scheme['_key'], 'label': scheme['label'], 'images': [native_image(image, index) for index, image in enumerate(scheme['images'])]} for scheme in definition['interiorSchemes']]
    save_json(output / 'variants.json', {'schemaVersion': 1, 'images': list(assets.values()), 'documents': documents})
    save_json(output / 'preparation-report.json', report)
    for name, content in [('properties.staging-draft.ndjson', originals), ('properties.variants.staging-draft.ndjson', enriched)]:
        (output / name).write_text('\n'.join(json.dumps(item, ensure_ascii=False) for item in content) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(output), 'properties': len(originals), 'designs': sum(len(item['designVariants']) for item in documents), 'newImages': len(assets), 'newImageBytes': sum(item['output']['bytes'] for item in assets.values())}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', required=True, type=Path)
    parser.add_argument('--base-bundle', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--manifest', type=Path, default=Path(__file__).with_name('azizi-florence.variants.json'))
    args = parser.parse_args()
    try:
        prepare(args.source_root, args.base_bundle, args.output, args.manifest)
    except (ValueError, OSError, KeyError) as error:
        print(f'Preparation refused: {error}', file=sys.stderr)
        sys.exit(1)
