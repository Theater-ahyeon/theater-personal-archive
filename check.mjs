import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const site = JSON.parse(readFileSync(new URL('./site.json', import.meta.url), 'utf8'));
const pages = readdirSync(root, { recursive: true }).filter(path => path.endsWith('.html'));
assert.equal(pages.length, site.posts.length + 3, '首页、归档、每篇文章及原生动效复刻页均应生成');
for (const page of pages) {
  const source = readFileSync(resolve(root, page), 'utf8');
  assert.match(source, /<html lang="zh-CN">/);
  assert.equal((source.match(/<h1\b/g) || []).length, 1, `${page}: 唯一页面标题`);
  assert(!source.includes('undefined'), `${page}: 不应有缺失字段`);
  for (const [, value] of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^https:\/\//.test(value)) continue;
    assert(!/^(?:\/|[a-z]+:)/i.test(value), `${page}: 站内资源必须使用相对路径 ${value}`);
    const [path, hash] = value.split('#');
    const target = path ? resolve(root, page, '..', decodeURIComponent(path.split('?')[0])) : resolve(root, page);
    assert(!relative(root, target).startsWith('..'), `${page}: 链接不可越出生成目录`);
    assert(existsSync(target), `${page}: 缺失资源 ${value}`);
    if (hash) assert(readFileSync(target, 'utf8').includes(`id="${hash}"`), `${page}: 锚点不存在 ${value}`);
  }
}
assert.match(readFileSync(resolve(root, 'assets/app.js'), 'utf8'), /prefers-reduced-motion/);
console.log(`PASS: ${pages.length} 个页面，全部站内链接、资源、锚点与标题检查通过。`);
for (const page of pages.filter(page => !page.startsWith('assets/'))) {
  const html = readFileSync(resolve(root, page), 'utf8');
  for (const id of ['archive-music', 'music-toggle', 'music-volume', 'music-status', 'intro-phase']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${page}: ${id} should exist exactly once`);
  }
  assert(html.indexOf('class="skip-link"') < html.indexOf('id="archive-music"'), `${page}: skip link precedes player controls in keyboard order`);
  assert.match(html, /id="archive-music"[^>]*hidden/, `${page}: music must be progressive enhancement`);
  assert.match(html, /id="music-toggle"[^>]*aria-pressed="false"/, `${page}: music starts paused`);
  assert.match(html, /assets\/soundtrack\.js\?v=/, `${page}: soundtrack cache version`);
}
console.log('PASS: progressive music controls and opening phase labels on every archive page.');
