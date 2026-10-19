# Theater / Personal Archive

一个可阅读、可操作的个人项目与手记档案。新版以石墨黑、冷薄荷与象牙白构成终端界面，将原有两段动效放映章的空间卡片、线框装配、径向扫描与折叠菱形转场融入真实首页。

## 本地运行

需要 Node.js 22 或更新版本：

```sh
npm ci
npm run build
npm test
npm run preview
```

打开 http://127.0.0.1:4174/ 。`dist/` 为生成目录。

## 结构

- `site.json`：个人资料、真实项目、文章目录。
- `posts/*.md`：作者维护的 Markdown；两篇示例文章保留示例标志。
- `build.mjs`：首页、文章归档与文章页。
- `public/reconstruction.css`：新版定制布局、终端组件与响应式。
- `public/cinematic-integration.js`：首页的双章序幕、空间卡片入场与项目折叠转场。
- `public/motion-study/`：原有 A/B 动效放映章与共享原生几何绘制模块。
- `public/app.js`、`terminal.js`：导航、项目选择、搜索、键盘与动效偏好。
- `public/navigation.js`：可选原生跨文档转场，保留浏览器历史与滚动恢复。
- `public/soundtrack.js`：原创本地合成氛围配乐，无外部音轨请求。

新增文章时，在 `posts/` 添加 Markdown，在 `site.json.posts` 填写唯一 slug、title、date、category、summary。Markdown 是作者维护的受信任源码，支持 HTML，不接受未审阅的访客输入。日期用于展示排序，不会定时发布。

## 操作

开场可跳过、按 Escape 或 Enter 退出，并可手动重播。动画遵循系统减少动态偏好，也可通过站内动效开关调整；静态内容始终可读。项目支持方向键与 Home/End；Ctrl/Cmd+K 打开搜索。移动导航提供明确关闭按钮、焦点管理与遮罩。

背景音乐需点击播放，可暂停与调节音量。离开页面会暂停，返回不会自动播放。浏览器历史恢复的静音值与界面、合成增益保持一致。鼠标局部光效不要求触摸设备模拟悬停。

没有后台、登录、评论或访问追踪。未启用 JavaScript 时仍可导航、顺序查看项目与阅读文章。

## 资产

保留用户现有头像、项目截图、字体、背景和动效放映章资产。新版增加一张原创生成的无文字石墨蚀刻底纹，仅作低对比背景；文字、按钮、几何图形和布局均为原生 HTML/CSS/SVG/Canvas。没有新增生成角色。

项目来自 [Theater-ahyeon](https://github.com/Theater-ahyeon) 的真实公开仓库。字体许可随文件保留于 `public/fonts/`。本站为个人创作，非官方游戏站点。

## 测试与部署

`npm test` 包含生成页面资源/链接检查，以及音频生命周期、动效调度、界面状态和导航偏好的确定性回归测试。模拟测试不等于真实设备渲染或主观听感测试。

GitHub Pages 工作流在 main 推送后构建、检查并发布到：
https://theater-ahyeon.github.io/theater-personal-archive/

本仓库与原个人主页、其他视觉档案仓库相互独立。
