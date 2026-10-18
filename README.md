# Theater / Personal Archive

个人 GitHub 主页与 Markdown 博客。v10 使用黑银定制导航、深蓝海面、独立悬挂几何体与浅色编辑版面；文字、项目切换、搜索、文章均为原生组件。

## 本地预览

需要 Node.js 22 或更新版本，在项目目录运行：

```powershell
npm ci
npm run build
npm test
npm run preview
```

打开 [主页](http://127.0.0.1:4174/)。预览器绑定本机，支持原片 MP4 Range 请求。浏览器无需框架或远程运行库；`dist` 是生成目录。

## 内容与代码

- `site.json` 与 `posts/*.md`：真实介绍、三项项目及文章。两篇示例文章保留示例标志；项目图片为实际产品截图。
- `build.mjs`：共享页面壳、首页四区、归档与文章详情，使用相对路径。
- `public/archive-v10.css`：完整布局、定制组件、阅读排版和响应式。
- `public/archive-v10.js`：三维投影几何开场、前后图形层、视差和章节动画。
- `public/app.js`：项目/锚点、移动导航、开场跳过与焦点。
- `public/navigation.js`：可选原生跨页面转场，保留浏览器链接、历史记录和滚动恢复；支持关闭动效与减少动态偏好。
- `public/experience.js` 与 `public/experience.css`：章节几何仪器、指针局部光、阅读进度和常驻音乐控制。
- `public/soundtrack.js`：原创氛围配乐，完全本地合成、无下载音轨或自动播放。
- `public/terminal.js`：本地搜索、键盘、动效偏好、默认静音的合成音效与时钟。
- `public/v10/`：新生成背景、透明主体、透明边框和原生纸面纹理。
- `public/fonts/`：本地 Bodoni Moda、Noto Serif SC 及各自 OFL。中文为当前内容子集，新增字可重新生成或回退系统宋体，见 `artifacts/redesign-v10/fonts.md`。

新增文章时在 `posts` 添加 Markdown，在 `site.json.posts` 填写唯一 slug、title、date、category、summary。Markdown 是作者维护的受信任源码并支持 HTML，不接受未审阅的访客输入；日期用于展示排序，不会定时发布。

## 交互

4.4 秒开场支持跳过、Escape、重播及会话记忆。默认遵循系统减少动态；点击“播放序章”可明确为本站开启完整动效。关闭后保留静态图形和全部内容，音效默认关闭。新增独立背景音乐 TIDAL ARCHIVE 为本地原创合成，点击后播放，可暂停与调节音量；离开页面即暂停，返回不会自动恢复。

项目支持鼠标、方向键、Home/End及首屏深链接；Ctrl/Cmd+K搜索支持命中、无结果、上下键、Enter和一次Escape关闭。手机抽屉管理焦点、遮罩、滚动及inert。无JavaScript仍可导航、顺序查看项目和阅读文章。没有后台、登录、评论或访问追踪。

## 原片对照

[A 对照](http://127.0.0.1:4174/assets/motion-study/index.html?sequence=a&t=6.1&compare=1) · [B 对照](http://127.0.0.1:4174/assets/motion-study/index.html?sequence=b&t=7.5&compare=1)

左侧Canvas/DOM，右侧用户MP4，共用10秒时间轴、逐秒/逐帧、暂停及分镜定位。两片1280×720、24fps。构图与时序经过多轮校准，文字和身份标识经过适配，未宣称逐像素一致。

## 参考与资产

本轮实际播放及复核八支官方影片：Echoism、Voices、概念PV-3与PV-4、四周年、2023感谢庆典、追迹日落以西概念PV、生路。保留两轮记录与第三次重点段复看、截图及观察。观看是静音视觉研究；续播、抓图缺口与时间边界见 `artifacts/research/`。

重新核对了alchemaniac、WLOP、ASK、lack的六组指定作品。新方法参考是[Linux DO 2891689](https://linux.do/t/topic/2891689)与[Codefather](https://ai.codefather.cn/library/2026205153777963010)。来源→组件见 `artifacts/redesign-v10/research-to-design.md`。

v10概念图、海景、悬挂物和侧栏由内置image_gen生成，源PNG和无损WebP分别保存，透明素材保留alpha。提示词、原文件、尺寸与SHA-256见 `artifacts/redesign-v10/`。它们不是官方画作裁图。概念稿中的错误项目描述没有进入正式页面，正式内容以site.json为准。

用户名、头像、项目与截图沿用[Theater-ahyeon](https://github.com/Theater-ahyeon)及其[零点契约](https://github.com/Theater-ahyeon/midnight-contract)、[skin-craft](https://github.com/Theater-ahyeon/skin-craft)、[Harness中文教材](https://github.com/Theater-ahyeon/deepseek-harness-textbook)的现有资料。第三方素材与代码使用范围分别处理；AI生成和技术检查不等于权利核验。

## 验证与发布

`npm test`检查五个页面的资源、标题和锚点。真实浏览器功能、动效、尺寸与截图记录在 `artifacts/redesign-v10/`；研究页验证单独保存，不能互相替代。旧版备份在 `artifacts/before-homepage-v10/`。

独立源码仓库：[theater-personal-archive](https://github.com/Theater-ahyeon/theater-personal-archive)。GitHub Pages 工作流在推送 main 后构建、检查并发布，站点地址为 https://theater-ahyeon.github.io/theater-personal-archive/ 。原个人主页仓库独立保留。artifacts、node_modules、日志与研究截图不提交；本文中的 artifacts 路径指本地研究记录。

## 体验增强检查

本轮改动与验证边界见 [REVIEW.md](./REVIEW.md)。`npm test` 同时运行音频生命周期模拟测试；模拟测试不替代真实浏览器布局或实际听感评估。
