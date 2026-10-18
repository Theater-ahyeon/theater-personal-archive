# Theater 视觉设计记录

## 2026-10-10：v10 完整重设计

当前页面采用黑银定制边框、深蓝海面、独立悬挂几何体及浅色编辑内容面。生成概念在 `artifacts/redesign-v10/concept.png`，真实运行截图另存 `artifacts/redesign-v10/preview/`。生图的错误项目说明没有进入正式页面，所有事实以 `site.json` 和 `posts` 为准。

已对八支官方 MV/PV 执行两轮实际浏览器播放，并第三次回看关键段；逐图观察、续播与抓图缺口在 `artifacts/research/`。静音研究，没有推断音轨节拍。六组指定画作也重新核对，来源边界见 `artifacts/homepage-art-reference-review.md`。本轮 Linux.do 方法页是 **2891689**，旧的 847468 不作为当前方法来源。

来源→组件映射见 `artifacts/redesign-v10/research-to-design.md`：单一几何焦点、实体厚度与边缘受光、局部材料强度、深浅章节节奏、固定文字层级、分段显现及前后遮挡。减少人物特写，签名只保留在资料区，不把装饰读数写成实时数据。

三个独立 image_gen 运行资产保存源 PNG 和无损 WebP；主体和边框保留 alpha。尺寸、哈希、提示词见 `artifacts/redesign-v10/assets.json` 与 `asset-prompts.json`。本地 Bodoni Moda/Noto Serif SC 保留 OFL；这是工程字体选择，未声称原片使用这些字体。

当前页面只加载 `archive-v10.css`、`terminal.js`、`app.js`、`archive-v10.js`，旧视觉文件保留而不叠加。首页四区、归档、两篇文章及独立对照页均保留。开场与图形为原生绘制/WAAPI，内容和操作为 DOM。当前构建证据保存在 `artifacts/redesign-v10/`；隐藏页分支模拟不冒称真实后台合成验证。当前仅本地，用户最终审美接受和发布尚未发生。原片复刻仍不宣称逐像素完全一致。

以下是历史版本记录，不能用历史截图和检查替代 v10 验证。

## 2026-10-08：第六版全组件定制

用户明确全站 UI 必须高度定制并使用生图；补充三段 `E:/webdownload/gemini_generated_video_*.mp4`，每段 10.005 秒、1280×720/24fps。本轮实际抽取每段 0–7 秒的逐秒画面，读出薄荷青圆环收束、切角板组装、网格与线框碎片的动态语法；未将参考视频直接嵌为网页交互。

艺术参考由用户再次明确：alchemaniac《Voices》与「红女爵」的人物，WLOP《Throne2》《Golden》的金属光影，ASK 音律联觉的舞台编排。前一轮已核对作者原页，本轮将《Voices》与《Throne2》原图、后来补充的「红女爵」原图下载到仅供参考的 artifacts 并实际查看。原作未放入 public。原页链接见 `artifacts/ui-v6-assets.json`。

内置 image_gen 生成六组最终运行素材：工业侧栏外壳、面板框、切角导航铭牌、几何徽记、深色晶体材质、银发黑红人物。人物前两稿被用户明确指出偏离方舟概念，已弃用；最终稿以《Voices》中心斯卡蒂和「红女爵」原图为直接参考重新生成，标为非官方生成同人素材。宫廷花饰侧栏也未采用。AI 生成和出处记录不等于官方授权或版权核验。

运行 PNG 源图位于 `public/ui-*-v6.png`，WebP 仅无损编码并保留 alpha。完整初始与修改提示词、服务、用途在 `artifacts/ui-v6-assets.json`；最终人物提示词在 `artifacts/ui-v6-keeper-final-prompt.txt`。生成框采用 CSS nine-slice 保持边角；文案、项目截图、文章、输入框与操作依然使用真实 DOM。

覆盖首页、项目、手记、关于、归档、两篇文章，以及共享导航、按钮、搜索命中/无结果、移动抽屉、FX/音效、页脚。项目与文章的真实数据和原生交互保留。无框架或新动画库；avatar 无灰度，签名仍由 site.json 统一提供。

构建/站内资源检查通过；实际 dist 的 1440/390/320 宽度、图片解码、3 项目切换、搜索/抽屉/键盘、full/off/reduce 检查通过，0 浏览器异常和资源 4xx。结果 `artifacts/ui-v6-results.json`，真实截图 `ui-v6-*.png`，录屏 `ui-v6-walkthrough.webm`。另在已登录 Edge 1912×901 核对新图/样式/头像原色与首屏构图。用户最终视觉接受与发布仍未发生。

以下为之前版本的历史记录。

## 2026-10-08 更新：第五版内容区与选图

用户要求换人物网图、恢复头像原色、签名改为“一万年太久，只争朝夕”，并让所有章节承接明日方舟 MV 式几何动效。随后用户明确要求先给参考图选择、提供 Banana 提示词，所以当前运行人物仍是第四版素材，没有擅自采用候选图。

候选及可复制提示词在 `artifacts/portrait-candidates-v5/index.html`。三个方向是 alchemaniac 的银发斯卡蒂（作者公开媒体与原帖索引）、冷織的黑发塑心（Pixiv 118583859）、Horn/wood 的锏（Pixiv 合集 109770543 第 7 张，即 p6）。后两项已在真实登录 Edge 核对作者与作品页。X 原帖未成功读取，原媒体可访问；未声称核对过 X 当前页面。网图仅保留在不发布的参考目录，使用许可未知。桃蹊白底平涂候选已被用户拒绝，Gawako 112195788 原页显示“尚无此页”，两者不进入候选板。

本次视觉 review 发现：侧栏辅助文字过小、手记/关于重复拱门、文章头缺少主题动效、项目灰白大底与放大的截图脱节。已降低侧栏饰框强度、提高功能小字字号、手记改为暗色线纹平面、文章头增加低对比 NOTES 字标；项目区改为深色展柜、限定真实截图的预览范围、加强项目标题与介绍。头像两处移除灰度与压暗，签名由 site.json 统一提供。

章节动效用原生 Web Animations API：细线定位、菱形聚合、短暂斜切片、标题与信息错峰；项目、手记行、档案、归档及文章头分别编排，正文仅首次轻显。关闭动效即取消，系统减少动态与键盘静态可读路径保留，离屏或隐藏时暂停。未新增动画库。

真实 Edge 发现旧 CSS/JS 被缓存：新签名与旧灰度、旧项目配色同时出现。构建现为七个样式/脚本添加内容哈希查询参数；已在 Edge 再核对灰度为 none、项目深色背景、章节模块及新资源 URL。构建/站内资源检查通过，真实 dist 的十项动态/可访问性/签名/头像检查通过。桌面与390px手机构图、关键章节截图及21.32秒实际录屏位于 `artifacts/chapter-motion-*`、`chapters-motion.webm`；`edge-v5-state.json` 和 `versioned-preview-confirmation.json` 记录最后状态。当前仅本地预览，尚未发布，人物选择与最终审美接受由用户决定。

2026-10-08。用户要求高度定制化、华丽而优雅的个人主页，并明确要求真实观看明日方舟 PV / MV、优先使用已登录 Edge、尽可能使用生图。旧版保留在 `artifacts/rejected-v1/`、`reference-v2/`、`reference-v3/`。

## 实际参考

| 官方作品 | 实际查看的画面 | 对本页的转译 |
| --- | --- | --- |
| [2023 感谢庆典 PV](https://www.bilibili.com/video/BV1ow41167CS/) | 银白粒子徽章、层叠菱形建筑、衬线字、白底角色与巨大 EPOQUE 底字；Edge 中另核验 37 / 96 / 162 秒的 1080p 画面 | 原创金属侧栏、银金徽记、几何揭幕、银白项目展页、超大衬线主标题 |
| [四周年《孤星》PV](https://ak.hypergryph.com/special/4th-anniversary/index.html) | 1:42–1:47 的光束、透视切片和文字落稳；米白科研版式 | 分层显影和内容展示的疏密关系 |
| [Echoism](https://www.youtube.com/watch?v=n--yUlyoQPk) | 0:55 的角色大构图；2:44–2:45 的前后景细丝与服装材质 | 角色占据首屏主体、黑银衣装与金属细节、前后层光带、阅读区保持稳定 |
| [Infected 概念片](https://www.youtube.com/watch?v=_fHizOtMLnM) | 3:10–3:11 的亮粒子菱形到暗色标记 | 中央徽记与侧栏徽记之间的同形状连续转场 |

不是仅看封面或文字介绍。PV 研究保留 53 张跨片取样、21 张连续转场帧；MV 保留 17 张实际播放帧。观看方式是跨片取样与关键动态复看，不声称连续逐帧看完所有视频。两支 YouTube 连播约 59 秒报错，后段用播放器正常 seek 检查。未分析音频，也未将官方视频或帧截图放入运行素材。

本地证据：`artifacts/references/pv-visual-study.md`、`mv-sources-and-observations.txt`，以及 `artifacts/reference-v4/edge-pv-evidence.json`。Edge UA、播放器时长、时间点、截图都在记录中。Chrome DevTools MCP 没有返回可用页面列表，实际 Edge 连接使用 kimi-webbridge/CDP。

### 用户提供的两篇参考

原消息将两个网址连在一起，按两个独立页面读取。早先普通抓取未能打开 Codefather；2026-10-08 收尾时，已在用户登录的真实 Edge 中正常打开并读完《[7个神级技巧，彻底去除网站的 AI 味儿！](https://ai.codefather.cn/library/2026205153777963010)》。正文与可见页面留在 `artifacts/reference-v4/codefather-edge-content.json`、`codefather-edge-visible.jpg`。文章内嵌配图显示加载占位，未将这些配图计作已看视觉参考。

该文强调实际参考、先确定视觉、充实图片、明确设计约束、使用设计技能、特色交互组件、自定配色。当前实现对应真实 PV/MV 取样、统一的银金档案概念、四组生成素材与真实项目图、不对称大构图和衬线字体、定制侧栏，以及粒子/光带/视差/几何动画。文中的组件库是实现选项；本页复用已有原生 CSS、SVG、WebGL，不为同一效果再引入组件库。文章中的示例命令及 AGENTS.md 模板仅作为引用阅读，未作为本项目指令执行。

另一篇《[秘密花园园丁邀请函](https://linux.do/t/topic/847468)》已读正文，讨论知识长期积累与关联的“数字花园”概念，没有提供动画技术或视觉样式。它作为个人手记的内容方向参考；不把它冒称为特效教程，也不据此添加用户未要求的社区系统。

## 原创素材与提示词

以下四组运行素材全部由内置 imagegen 生成，未使用付费 API CLI。原图保持不变，复制到项目；角色、饰框与徽记保留透明通道。用户公开头像只是角色气质参考。

| 文件 | 用途 | 最终提示词 / 生成记录 |
| --- | --- | --- |
| `public/archive-keeper-v4.png` | 银发、黑色礼装、白银披风、细金属饰件的原创档案守望者 | `artifacts/references/keeper-prompt.txt` |
| `public/archive-sanctum-v4.png` | 黑曜石档案圣殿，右侧拱环、左侧留白 | `artifacts/references/generated-assets-v4.txt` 中的对应提示词路径 |
| `public/sidebar-reliquary-v4.png` | 真透明金属叶饰框，承载真实导航文字与按钮 | 同上，含一次定向净边记录 |
| `public/archive-sigil-v4.png` | 银黑晶叶与金属菱形徽记，开场飞入侧栏 | `artifacts/references/sigil-prompt.txt` |

生成图的透明区域在部分图像查看器中出现红黄底色；实际 Edge 合成已检查，未见可见红黄杂边。Edge 截图外围白青色光框来自扩展的提示层，不是网页素材。

真实头像与项目来源沿用 README。项目运行截图没有伪造成生成图；两篇文章明确标为写作示例。原创角色仅为视觉概念，不虚构个人履历或官方关联。

## 动态与交互

3.05 秒开场：纹章显影 → 衬线字标 → 八片菱形幕面展开 → 同一纹章落入侧栏（手机落入可见页码）→ 角色与标题显影。支持跳过、Escape、重播、焦点恢复和会话播放记忆。

常驻层包含前景金丝、微量尘点、三层鼠标视差、滚动深度变化；项目含遮罩显影、倾斜与光泽，按钮有轻微磁吸。WebGL 晶体提供实际几何、光照与旋转，关闭动效或离屏时停止绘制，丢失上下文时显示后备图形并尝试恢复。颜色为银灰表面与香槟金棱线。

默认尊重系统减少动态效果；明确点击“播放开场”或“开启完整动效”才启用本站 `full` 偏好，不更改操作系统。再次关闭可恢复静态。声音默认关闭，仅在手势开启后合成轻点击声，无自动音乐。检索面板内均为真实页面、项目和文章链接。

## 验证与边界

自动构建及站内资源/链接检查通过。真实 Edge 已验证主视觉、银白项目区、侧栏、完整开场与动态状态；用户原有系统减少动态效果设置不变。辅助 Chromium 检查响应式布局、键盘/焦点、无 JS、检索、偏好切换、音效、WebGL 像素与上下文恢复。

截图与结果在 `artifacts/`：`browser-results.json`、`terminal-results.json`、`scene-results.json`、`edge-v4-results.json`、`edge-v4-motion-results.json`。收尾再次检查真实 Edge 的当前页面状态，记录于 `edge-v4-final-state.json`。另附实际 Chromium 页面录屏 `homepage-motion-v4.webm`（1440×900，15.6 秒），展示完整开场、视差与项目切换。审美接受仍由用户判断；尚未提交、推送或部署 GitHub Pages。Safari、Firefox 与实际慢网加载没有测试。
