// One-shot publisher: reads content/blog/property-jargon-decoded.md and
// creates a published Post document in Sanity. Requires SANITY_WRITE_TOKEN
// in the env when invoked. Safe to re-run — uses createOrReplace by slug.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@sanity/client');

const TOKEN = process.env.SANITY_WRITE_TOKEN;
if (!TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN env var');
  process.exit(1);
}

const PROJECT_ID = 'jdxbkry4';
const DATASET = 'production';
const MD_PATH = path.resolve(__dirname, '../content/blog/property-jargon-decoded.md');

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
});

const key = () => crypto.randomBytes(6).toString('hex');

// ── Parse frontmatter + body ────────────────────────────────────────────
const raw = fs.readFileSync(MD_PATH, 'utf8');
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!fmMatch) {
  console.error('Could not parse frontmatter from markdown file');
  process.exit(1);
}
const fmText = fmMatch[1];
const bodyMd = fmMatch[2].trim();

function parseFm(text) {
  const out = {};
  const lines = text.split(/\n/);
  let curList = null;
  for (const ln of lines) {
    if (/^\s*#/.test(ln) || !ln.trim()) {
      curList = null;
      continue;
    }
    const m = ln.match(/^(\w+):\s*(.*)$/);
    if (m) {
      const [, k, vRaw] = m;
      // Strip inline " # comment" tails before trimming quotes
      const v = vRaw.replace(/\s+#.*$/, '').trim();
      if (v === '') {
        out[k] = [];
        curList = k;
      } else {
        out[k] = v.replace(/^"|"$/g, '');
        curList = null;
      }
    } else if (curList && /^\s*-\s+(.+)$/.test(ln)) {
      const raw = ln.match(/^\s*-\s+(.+)$/)[1];
      out[curList].push(raw.replace(/\s+#.*$/, '').trim());
    }
  }
  return out;
}

const fm = parseFm(fmText);
console.log('Frontmatter parsed:', {
  title: fm.title,
  slug: fm.slug,
  status: fm.status,
  featured: fm.featured,
  categories: fm.categories,
});

// ── Markdown → Portable Text ────────────────────────────────────────────
function spansFromInline(text) {
  // Handles **bold** segments. No other inline marks needed.
  const spans = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      spans.push({ _key: key(), _type: 'span', marks: [], text: text.slice(last, m.index) });
    }
    spans.push({ _key: key(), _type: 'span', marks: ['strong'], text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    spans.push({ _key: key(), _type: 'span', marks: [], text: text.slice(last) });
  }
  return spans.length ? spans : [{ _key: key(), _type: 'span', marks: [], text }];
}

function mdToPortableText(md) {
  const blocks = [];
  const lines = md.split(/\n/);
  let para = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').trim();
    if (!text) { para = []; return; }
    blocks.push({
      _key: key(),
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: spansFromInline(text),
    });
    para = [];
  };

  for (const raw of lines) {
    const ln = raw.replace(/\r$/, '');
    if (!ln.trim()) { flushPara(); continue; }
    if (ln.startsWith('## ')) {
      flushPara();
      blocks.push({
        _key: key(),
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: spansFromInline(ln.slice(3).trim()),
      });
      continue;
    }
    if (ln.startsWith('# ')) {
      // Title-level — skip (title is a separate field)
      flushPara();
      continue;
    }
    para.push(ln.trim());
  }
  flushPara();
  return blocks;
}

const body = mdToPortableText(bodyMd);
console.log(`Portable Text: ${body.length} blocks (${body.filter(b => b.style === 'h2').length} h2s)`);

// ── Author + categories ────────────────────────────────────────────────
async function ensureAuthor() {
  const existing = await client.fetch(`*[_type=="author"] | order(_createdAt asc)[0]{_id,name}`);
  if (existing?._id) {
    console.log(`Using existing author: ${existing.name} (${existing._id})`);
    return existing._id;
  }
  const doc = await client.create({
    _type: 'author',
    name: 'Haus of Estate Editorial',
    slug: { _type: 'slug', current: 'haus-of-estate-editorial' },
    bio: 'Editorial team at Haus of Estate.',
  });
  console.log(`Created author: ${doc._id}`);
  return doc._id;
}

async function ensureCategory(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = await client.fetch(
    `*[_type=="category" && (title==$t || slug.current==$s)][0]{_id,title}`,
    { t: title, s: slug },
  );
  if (existing?._id) return existing._id;
  const doc = await client.create({
    _type: 'category',
    title,
    slug: { _type: 'slug', current: slug },
  });
  console.log(`Created category: ${title} (${doc._id})`);
  return doc._id;
}

// ── Build + upsert ─────────────────────────────────────────────────────
(async () => {
  // Sanity ping via projects request
  const me = await client.request({ uri: '/users/me' }).catch((e) => {
    console.error('Token check failed:', e.message);
    process.exit(1);
  });
  console.log(`Authenticated as: ${me?.name || me?.email || me?.id}`);

  const authorId = await ensureAuthor();
  const catNames = Array.isArray(fm.categories) ? fm.categories : [];
  const catIds = [];
  for (const c of catNames) {
    catIds.push(await ensureCategory(c));
  }

  const docId = `post.${fm.slug}`;
  const doc = {
    _id: docId,
    _type: 'post',
    title: fm.title,
    subtitle: fm.subtitle,
    slug: { _type: 'slug', current: fm.slug },
    body,
    author: { _type: 'reference', _ref: authorId },
    categories: catIds.map((id) => ({
      _key: key(),
      _type: 'reference',
      _ref: id,
    })),
    publishedAt: new Date().toISOString(),
    status: 'published',
    featured: fm.featured === 'true' || fm.featured === true,
    seo: {
      _type: 'object',
      seoTitle: fm.seoTitle,
      seoDesc: fm.seoDesc,
    },
  };

  const result = await client.createOrReplace(doc);
  console.log('\nPublished:');
  console.log(`  _id:   ${result._id}`);
  console.log(`  slug:  ${result.slug?.current}`);
  console.log(`  title: ${result.title}`);
  console.log(`  url:   http://localhost:3000/blog/${result.slug?.current}`);
})().catch((e) => {
  console.error('Publish failed:', e.message);
  if (e.responseBody) console.error(e.responseBody);
  process.exit(1);
});
