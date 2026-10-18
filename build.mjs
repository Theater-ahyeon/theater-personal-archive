import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { marked } from 'marked';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(root, 'dist');
const site = JSON.parse(readFileSync(join(root, 'site.json'), 'utf8'));
const assetHash = createHash('sha256');
for (const file of ['archive-v10.css', 'terminal.js', 'app.js', 'archive-v10.js', 'experience.js', 'experience.css', 'soundtrack.js', 'navigation.js']) assetHash.update(readFileSync(join(root, 'public', file)));
const assetVersion = assetHash.digest('hex').slice(0, 10);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const external = value => {
  if (new URL(value).protocol !== 'https:') throw new Error(`链接必须使用 HTTPS: ${value}`);
  return escape(value);
};
const github = external(site.github);
if (!/^assets\/[a-z0-9._-]+$/i.test(site.avatar)) throw new Error('头像必须位于 assets 目录');
const slugs = new Set();
const posts = site.posts.map(post => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error(`文章路径无效或重复: ${post.slug}`);
  slugs.add(post.slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || new Date(post.date).toISOString().slice(0, 10) !== post.date) throw new Error(`文章日期无效: ${post.date}`);
  const source = readFileSync(join(root, 'posts', `${post.slug}.md`), 'utf8');
  // Author-owned Markdown is trusted site source, never visitor input.
  return { ...post, html: marked.parse(source), minutes: Math.max(1, Math.ceil(source.length / 500)) };
}).sort((a, b) => b.date.localeCompare(a.date));
const number = value => String(value).padStart(2, '0');
const arrow = '<span class="link-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 19 19 5M5 5h14v14"/></svg></span>';
const sections = [['about', 'INDEX', '首页'], ['projects', 'WORKS', '项目'], ['journal', 'NOTES', '手记'], ['profile', 'PROFILE', '关于']];
const mark = '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 7h30v6H23v23h-6V13H5zM29 20h6v16h-6zM5 20h6v16H5z" fill="currentColor"/></svg>';

function intro() {
  return `<div id="intro" class="intro" hidden role="dialog" aria-modal="true" aria-label="进入个人档案">
    <div class="intro-field" aria-hidden="true"><canvas id="intro-canvas"></canvas><div class="intro-cross"></div>
      <div class="intro-center"><svg viewBox="0 0 80 80"><path d="M40 6 72 63H8ZM40 22 58 54H22Z"/><path d="m8 18 32 55 32-55"/></svg><span>THEATER</span><small>PERSONAL ARCHIVE</small></div>
      <div class="intro-corners"><span>THEATER / PERSONAL ARCHIVE</span><span>CODE · PROJECTS · NOTES</span><span>记录，让探索继续。</span><span id="intro-percent">00</span></div>
    </div>
    <div class="intro-aperture" aria-hidden="true">${Array.from({ length: 8 }, (_, index) => `<i style="--i:${index}"></i>`).join('')}</div>
    <div class="intro-stage-label" aria-hidden="true"><span id="intro-phase">ASSEMBLE / 结构显影</span><span>序章 · 01</span></div>
    <div class="intro-progress" aria-hidden="true"><span></span></div>
    <button id="skip-intro">跳过开场 <span aria-hidden="true">↗</span></button>
  </div>`;
}

function shell(title, content, { prefix = './', page = 'home', description = site.bio } = {}) {
  const home = page === 'home' ? '' : `${prefix}index.html`;
  const sectionHref = id => id === 'journal' && page !== 'home' ? `${prefix}blog/index.html` : `${home}#${id}`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#080d12"><meta name="description" content="${escape(description)}">
  <title>${escape(title)} · theater</title>
  <link rel="icon" type="image/svg+xml" href="${prefix}assets/favicon.svg">
  <link rel="preload" href="${prefix}assets/fonts/bodoni-moda.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${prefix}assets/fonts/noto-serif-sc.woff2" as="font" type="font/woff2" crossorigin>
  <script src="${prefix}assets/navigation.js?v=${assetVersion}"></script>
  <link rel="stylesheet" href="${prefix}assets/archive-v10.css?v=${assetVersion}">
  <link rel="stylesheet" href="${prefix}assets/experience.css?v=${assetVersion}">
  <script src="${prefix}assets/experience.js?v=${assetVersion}" defer></script>
  <script src="${prefix}assets/soundtrack.js?v=${assetVersion}" defer></script>
  <script src="${prefix}assets/terminal.js?v=${assetVersion}" defer></script>
  <script src="${prefix}assets/app.js?v=${assetVersion}" defer></script>
  <script src="${prefix}assets/archive-v10.js?v=${assetVersion}" defer></script>
</head>
<body data-page="${page}">
  ${intro()}
  <div id="site-shell">
    <div class="reading-progress" aria-hidden="true"><span></span></div>
    <div id="archive-music" class="archive-music" hidden>
      <div class="music-track"><span class="music-disc" aria-hidden="true">✧</span><span>TIDAL ARCHIVE<small>THEATER / ORIGINAL AMBIENT</small></span></div>
      <button id="music-toggle" type="button" aria-pressed="false" aria-label="背景音乐" aria-describedby="music-status"><span aria-hidden="true">♫</span><span id="music-label">播放氛围音乐</span></button>
      <button id="music-settings" type="button" aria-expanded="false" aria-controls="music-options"><span>音量</span><span id="music-volume-summary">35%</span><span class="music-settings-caret" aria-hidden="true">⌃</span></button>
      <div id="music-options">
      <label class="music-volume-label" for="music-volume">音量 <span id="music-volume-value">35%</span></label>
      <input id="music-volume" type="range" min="0" max="100" value="35" step="1" aria-label="背景音乐音量">
      <p id="music-status" role="status" aria-live="polite">原创合成 · 点击播放</p>
      </div>
    </div>
    <a class="skip-link" href="#main">跳到正文</a>
    <button id="sidebar-shade" hidden tabindex="-1" aria-label="关闭导航"></button>
    <aside id="sidebar" class="sidebar" aria-label="个人档案导航">
      <button id="sidebar-close" type="button" aria-label="关闭导航"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <a class="brand" href="${prefix}index.html" aria-label="theater 首页">${mark}<span>THEATER<small>PERSONAL ARCHIVE</small></span></a>
      <p class="brand-caption" aria-hidden="true">CODE<br>BUILDS<br>MEMORIES</p>
      <nav class="main-nav" aria-label="主导航">
        ${sections.map(([id, en, zh], index) => `<a href="${sectionHref(id)}"${(page === 'home' && id === 'about') || (page !== 'home' && id === 'journal') ? ' aria-current="page"' : ''}><span class="nav-copy"><b>${zh}</b><small>${en}</small></span><span class="nav-number">${number(index + 1)}</span><i class="nav-notch" aria-hidden="true"></i></a>`).join('')}
      </nav>
      <div class="sidebar-bottom">
        <a class="operator-card" href="${home}#profile"><span class="operator-avatar"><img src="${prefix}${escape(site.avatar)}" width="48" height="48" alt="${escape(site.name)} 的头像"></span><span class="operator-copy"><strong>${escape(site.name)}</strong><small>BUPT / CS</small></span>${arrow}</a>
        <p class="sidebar-motto">记录，构建，<br>持续前行。</p>
        <div class="terminal-controls"><button id="sound-toggle" aria-pressed="false"><span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound-label">音效关闭</span><span aria-hidden="true">♪</span></button></div>
        <div class="sidebar-clock"><span>LOCAL / UTC+8</span><time id="local-clock">--:--:--</time></div>
        <span class="sidebar-colophon" aria-hidden="true">A PERSONAL ARCHIVE<br>OF CODE &amp; THOUGHTS</span>
      </div>
    </aside>
    <header class="topbar">
      <button id="menu-toggle" aria-controls="sidebar" aria-expanded="false" aria-label="展开导航"><span></span><span></span><span></span></button>
      <a class="topbar-identity" href="${prefix}index.html"><b>THEATER</b><span>/</span><small>A PERSONAL TECH &amp; THOUGHT ARCHIVE</small></a>
      <button class="command-trigger" aria-label="搜索项目、手记和页面"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><span>搜索项目、手记或关键词…</span><kbd>Ctrl K</kbd></button>
      <button id="effects-toggle" class="effects-control" aria-pressed="true"><span class="effects-label">动效开启</span><span class="control-indicator" aria-hidden="true"></span></button>
      <a class="header-github" href="${github}" aria-label="GitHub 个人主页">GITHUB ${arrow}</a>
    </header>
    <aside class="section-rail" aria-label="章节索引">
      <div class="rail-counter"><strong id="section-number">${page === 'home' ? '01' : '03'}</strong><span>/ 04</span><small id="section-label">${page === 'home' ? 'INDEX' : 'NOTES'}</small></div>
      <nav>${sections.map(([id, , zh], index) => `<a href="${home}#${id}" data-section="${id}" aria-label="${zh}"><span>${number(index + 1)}</span><i></i></a>`).join('')}</nav>
      <span class="rail-coordinate" aria-hidden="true">SCROLL TO EXPLORE</span>
    </aside>
    <main id="main">${content}</main>
    <footer class="footer">
      <a class="footer-brand" href="${prefix}index.html">THEATER<span aria-hidden="true"> / </span></a>
      <p class="footer-note">记录尚未结束。<small>STAY CURIOUS. KEEP EXPLORING.</small></p>
      <div class="footer-links"><a class="motion-study-link" href="${prefix}assets/motion-study/index.html">动效放映室 ${arrow}</a><button id="replay-intro" class="text-button" hidden>重播开场 ↺</button><a href="${github}">GITHUB ${arrow}</a></div>
      <p class="footer-legal">© ${new Date().getUTCFullYear()} ${escape(site.name)}<br>个人创作 / 非官方游戏站点</p>
    </footer>
    <dialog id="command-dialog" aria-labelledby="command-title">
      <div class="command-header"><span id="command-title">ARCHIVE / 档案检索</span><button id="command-close" aria-label="关闭检索">ESC ×</button></div>
      <label class="command-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><input id="command-input" type="search" placeholder="搜索项目、手记或页面…" autocomplete="off" aria-label="搜索档案"></label>
      <div id="command-results">
        ${sections.map(([id, en, zh]) => `<a data-command data-search="${en} ${zh}" href="${sectionHref(id)}"><span>${zh}<small>${en}</small></span><b>PAGE ↗</b></a>`).join('')}
        ${site.projects.map(project => `<a data-command data-search="${escape(project.name)} ${escape(project.code)}" href="${external(project.url)}"><span>${escape(project.name)}<small>${escape(project.code)}</small></span><b>PROJECT ↗</b></a>`).join('')}
        ${posts.map(post => `<a data-command data-search="${escape(post.title)} ${escape(post.category)}" href="${prefix}blog/${post.slug}/index.html"><span>${escape(post.title)}<small>${escape(post.category)} · ${escape(post.label || '手记')}</small></span><b>NOTE ↗</b></a>`).join('')}
        <a data-command data-search="motion 动效 放映室 视频 复刻" href="${prefix}assets/motion-study/index.html"><span>动效放映室<small>两段视频的原生前端重构</small></span><b>STUDY ↗</b></a>
      </div>
      <p id="command-empty" hidden>没有找到匹配的档案，试试“项目”或“手记”。</p>
      <div class="command-hint"><span>↑ ↓ 选择 / ENTER 打开</span><span>THEATER ARCHIVE</span></div>
    </dialog>
  </div>
  <div id="cursor-reticle" aria-hidden="true"><i></i></div>
</body>
</html>`;
}

function postList(items, prefix, heading = 'h3') {
  return items.length ? items.map((post, index) => `<a class="journal-row reveal" href="${prefix}${post.slug}/index.html">
    <div class="journal-date"><time datetime="${escape(post.date)}">${escape(post.date.slice(0, 7).replace('-', ' / '))}</time><strong>${escape(post.date.slice(8))}</strong></div>
    <div class="journal-copy"><div class="post-meta"><span>${escape(post.category)}</span>${post.label ? `<span class="sample-label">${escape(post.label)}</span>` : ''}<span>ENTRY / ${number(index + 1)}</span></div><${heading}>${escape(post.title)}</${heading}><p>${escape(post.summary)}</p></div>
    <span class="journal-read">READ ENTRY ${arrow}</span>
  </a>`).join('') : '<p class="empty-state">手记正在整理，先去看看项目吧。</p>';
}

function projectImage(project) {
  if (project.image) {
    if (!/^assets\/[a-z0-9._-]+$/i.test(project.image)) throw new Error('项目图片必须位于 assets 目录');
    return `<img src="./${escape(project.image)}" loading="lazy" alt="${escape(project.imageAlt || project.name)}"><figcaption class="preview-caption">${escape(project.imageCaption || 'PROJECT / 项目预览')}</figcaption>`;
  }
  return `<div class="workflow-visual"><span class="workflow-overline">${escape(project.code)}</span><strong>FROM VISION.<br><em>TO INTERFACE.</em></strong><ol class="workflow-steps">${(project.workflow || project.tags).map((step, index) => `<li><b>${number(index + 1)}</b><span>${escape(step)}</span></li>`).join('')}</ol></div><figcaption class="preview-caption">WORKFLOW / 工作流程示意</figcaption>`;
}

const projects = site.projects.map((project, index) => `<article class="project-pane" id="work-${index}" aria-labelledby="project-title-${index}">
  <div class="project-exhibit-bar"><span>PROJECT / ${number(index + 1)}</span><span>${escape(project.code)}</span></div>
  <div class="project-body">
    <div class="project-caption"><p class="eyebrow">${escape(project.code)}</p><h3 id="project-title-${index}">${escape(project.name)}</h3><p class="project-description">${escape(project.description)}</p><div class="tags">${project.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div><a class="action-link" href="${external(project.url)}"><span>查看项目<small>VIEW REPOSITORY</small></span>${arrow}</a></div>
    <figure class="project-preview" data-tilt>${projectImage(project)}<span class="preview-glare" aria-hidden="true"></span></figure>
  </div>
</article>`).join('');

const home = `<section class="stage hero" id="about" aria-labelledby="hero-title">
  <div class="hero-scenery" aria-hidden="true"><img class="hero-backdrop" src="./assets/v10/sea.webp" width="1672" height="941" alt="" fetchpriority="high"></div>
  <div class="hero-sculpture" aria-hidden="true"><img class="hero-relic" src="./assets/v10/relic.webp" width="1254" height="1254" alt=""></div><canvas id="hero-field" aria-hidden="true"></canvas>
  <div class="hero-content">
    <p class="hero-kicker">CODE / PROJECTS / NOTES</p>
    <h1 id="hero-title">THEATER</h1>
    <div class="hero-subtitle"><p>在代码与思考之间，把探索留下来。<em>A PERSONAL ARCHIVE OF THINGS IN THE MAKING.</em></p></div>
    <div class="hero-actions"><a class="action-link primary" href="#projects"><span>查看项目<small>EXPLORE PROJECTS</small></span><span aria-hidden="true">→</span></a><a class="action-link" href="./blog/index.html"><span>阅读手记<small>READ THE NOTES</small></span><span aria-hidden="true">→</span></a></div>
    <p class="hero-note">记录，构建，持续前行。<br>这里是一场尚未结束的探索。<small>SOME IDEAS DESERVE<br>TO BECOME SOMETHING REAL.</small></p>
    <div class="hero-tools"><button id="experience-intro" class="experience-trigger" aria-label="播放完整开场动画，启用动态效果"><span aria-hidden="true">▷</span> 播放序章</button><a class="hero-study" href="./assets/motion-study/index.html">动效放映室 ${arrow}</a></div>
  </div>
  <aside class="hero-aside"><p>从一个想法开始，<br>在实践中留下痕迹。</p><small>${number(site.projects.length)} PROJECTS<br>${number(posts.length)} FIELD NOTES</small></aside>
  <nav class="hero-project-index hero-summary" aria-label="精选项目索引">
    ${site.projects.map((project, index) => `<a href="#work-${index}"><span class="hero-project-number">${number(index + 1)}</span><strong>${escape(project.name)}</strong><small>${escape(project.code)}</small><span class="hero-project-arrow" aria-hidden="true">↗</span></a>`).join('')}
  </nav>
</section>
<section class="stage works-stage paper-section" id="projects" aria-labelledby="works-title">
  <header class="section-heading reveal"><div><p class="section-label"><span>01 / 项目档案</span><small>PROJECT ARCHIVE</small></p><h2 id="works-title" class="section-title" aria-label="项目档案 / Selected Works">SELECTED<br>WORKS</h2></div><p>一些想法，已经有了形状。<br>关于代码、设计，<br>和持续发生的探索。<small>BUILT FROM CURIOSITY.<br>KEPT FOR THE NEXT QUESTION.</small></p></header>
  <div class="work-layout"><div class="work-directory"><nav class="project-tabs" aria-label="选择项目">${site.projects.map((project, index) => `<a href="#work-${index}" data-project="work-${index}"><span class="tab-index">${number(index + 1)}</span><span><b>${escape(project.name)}</b><small>${escape(project.code)}</small></span><span class="tab-arrow" aria-hidden="true">↗</span></a>`).join('')}</nav><a class="quiet-link all-projects" href="${github}?tab=repositories">全部公开项目 ${arrow}</a></div><div class="project-stage">${projects || '<p class="empty-state">项目正在整理中。</p>'}</div></div>
  <div class="stage-footer"><span>CODE / DESIGN / OPEN SOURCE</span><span>${number(site.projects.length)} PROJECTS</span></div>
</section>
<section class="stage journal-stage" id="journal" aria-labelledby="journal-title">
  <div class="notes-heading reveal"><p class="section-label"><span>02 / 探索手记</span><small>FIELD NOTES</small></p><h2 id="journal-title" class="section-title">NOTES<br>IN PROGRESS</h2><p>把问题、发现与理解，<br>留给下一次探索。</p><a class="quiet-link" href="./blog/index.html">全部手记 ${arrow}</a></div>
  <div class="journal-feed"><div class="feed-topline"><span>LATEST ENTRIES</span><span>${number(posts.length)} RECORDS</span></div>${postList(posts.slice(0, 3), './blog/')}<p class="feed-end">记录仍在继续。<span aria-hidden="true">—</span></p></div>
</section>
<section class="stage profile-stage paper-section" id="profile" aria-labelledby="profile-title">
  <div class="profile-intro reveal"><p class="section-label"><span>03 / 关于我</span><small>THE PERSON BEHIND</small></p><h2 id="profile-title">保持好奇。<br>继续探索。</h2><p>${escape(site.bio)}</p><p class="profile-aside">代码之外，也有音乐和生活。</p><a class="action-link" href="${github}"><span>在 GitHub 找到我<small>${escape(site.handle)}</small></span>${arrow}</a></div>
  <div class="profile-dossier reveal"><div class="dossier-heading"><span>PERSONAL ARCHIVE</span><b>THEATER</b></div><div class="profile-image"><img src="./${escape(site.avatar)}" width="240" height="240" loading="lazy" alt="${escape(site.name)} 的头像"></div><dl><div><dt>NAME / 名称</dt><dd>${escape(site.name)}</dd></div><div><dt>LEARNING / 正在学习</dt><dd>BUPT · 计算机</dd></div><div><dt>EXPLORING / 探索方向</dt><dd>代码 · 设计 · AI</dd></div></dl><p class="dossier-caption">${escape(site.tagline)}</p></div>
</section>`;

const archive = `<header class="archive-header"><p class="section-label"><span>探索手记</span><small>THE JOURNAL / ${number(posts.length)} ENTRIES</small></p><h1>FIELD<br>NOTES</h1><p>记录从问题到理解的过程。</p><a class="quiet-link" href="../index.html#journal">← 返回首页手记</a><span class="archive-wordmark" aria-hidden="true">THEATER / JOURNAL</span></header><section class="archive-list" aria-label="全部文章"><div class="feed-topline"><span>ALL ENTRIES</span><span>${number(posts.length)} RECORDS</span></div>${postList(posts, './', 'h2')}</section>`;

const pages = new Map([
  ['index.html', shell('个人主页', home)],
  ['blog/index.html', shell('探索手记', archive, { prefix: '../', page: 'blog' })]
]);
for (const post of posts) {
  pages.set(`blog/${post.slug}/index.html`, shell(post.title, `<article class="post-page">
    <header class="post-header"><a class="quiet-link" href="../index.html">← 返回全部手记</a><p class="post-overline">THEATER / FIELD NOTES</p><div class="post-meta"><span>${escape(post.category)}</span><time datetime="${escape(post.date)}">${escape(post.date.replaceAll('-', ' / '))}</time><span>${post.minutes} MIN READ</span>${post.label ? `<span class="sample-label">${escape(post.label)}</span>` : ''}</div><h1>${escape(post.title)}</h1><p>${escape(post.summary)}</p></header>
    <div class="prose">${post.html}</div><div class="post-end"><span>END OF ENTRY / 保持好奇</span><a class="quiet-link" href="../index.html">更多手记 ${arrow}</a></div>
  </article>`, { prefix: '../../', page: 'post', description: post.summary }));
}

// Clear only this fixed generated directory; refuse replacement symlinks.
if (output !== join(resolve(root), 'dist') || (existsSync(output) && lstatSync(output).isSymbolicLink())) throw new Error('拒绝清理异常输出目录');
console.log(`生成目录: ${output}`);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(join(root, 'public'), join(output, 'assets'), { recursive: true });
for (const [path, html] of pages) {
  const target = join(output, path);
  mkdirSync(resolve(target, '..'), { recursive: true });
  writeFileSync(target, html);
}
writeFileSync(join(output, '.nojekyll'), '');
console.log(`已生成 ${pages.size} 个页面、${posts.length} 篇文章。`);
