import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import swup from "@swup/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { oddmisc } from "oddmisc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";

import { siteConfig } from "./src/config/index.ts";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.js";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { rehypeImageWidth } from "./src/plugins/rehype-image-width.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { rehypeWrapTable } from "./src/plugins/rehype-wrap-table.mjs";
import { remarkContent } from "./src/plugins/remark-content.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkFixGithubAdmonitions } from "./src/plugins/remark-fix-github-admonitions.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";

// https://astro.build/config
export default defineConfig({
  site: siteConfig.siteURL,
  base: "/",
  trailingSlash: "always",

  output: "static",

  image: {
    layout: "constrained",
  },

  server: {
    port: 3000,
  },

  integrations: [
    oddmisc({
      umami: {
        shareUrl: "https://cloud.umami.is/share/Mk4vzeyvYYPiaGfd",
      },
    }),
    swup({
      theme: false,
      animationClass: "transition-swup-",
      containers: ["main"],
      smoothScrolling: false, // 禁用平滑滚动以提升性能，避免与锚点导航冲突
      cache: true,
      preload: false, // 禁用预加载以提升性能
      accessibility: true,
      updateHead: process.env.NODE_ENV === "production",
      updateBodyClass: false,
      globalInstance: true,
      // 滚动相关配置优化
      resolveUrl: (url) => url,
      animateHistoryBrowsing: false,
      skipPopStateHandling: (event) => {
        // 跳过锚点链接的处理，让浏览器原生处理
        return event.state && event.state.url && event.state.url.includes("#");
      },
    }),
    icon(),
    expressiveCode({
      themes: ["github-light", "github-dark"],
      plugins: [
        pluginCollapsibleSections(),
        pluginLineNumbers(),
        pluginLanguageBadge(),
        pluginCustomCopyButton(),
      ],
      defaultProps: {
        wrap: true,
        overridesByLang: {
          shellsession: { showLineNumbers: false },
          bash: { frame: "code" },
          shell: { frame: "code" },
          sh: { frame: "code" },
          zsh: { frame: "code" },
        },
      },
      styleOverrides: {
        codeBackground: "var(--codeblock-bg)",
        borderRadius: "0.75rem",
        borderColor: "none",
        codeFontSize: "0.875rem",
        codeFontFamily:
          "'JetBrains Mono Variable', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', 'Microsoft JhengHei', '微軟正黑體', 'Microsoft YaHei', '微软雅黑', 'Noto Sans HK', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans KR', ui-monospace, monospace",
        codeLineHeight: "1.5rem",
        frames: {
          editorBackground: "var(--codeblock-bg)",
          terminalBackground: "var(--codeblock-bg)",
          terminalTitlebarBackground: "var(--codeblock-bg)",
          editorTabBarBackground: "var(--codeblock-bg)",
          editorActiveTabBackground: "none",
          editorActiveTabIndicatorBottomColor: "var(--primary)",
          editorActiveTabIndicatorTopColor: "none",
          editorTabBarBorderBottomColor: "var(--codeblock-bg)",
          terminalTitlebarBorderBottomColor: "none",
        },
        textMarkers: {
          delHue: 0,
          insHue: 180,
          markHue: 250,
        },
      },
      frames: {
        showCopyToClipboardButton: false,
      },
    }),
    svelte({
      preprocess: vitePreprocess(),
    }),
    sitemap(),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkContent,
      remarkFixGithubAdmonitions,
      remarkDirective,
      remarkSectionize,
      parseDirectiveNode,
      remarkMermaid,
    ],
    rehypePlugins: [
      rehypeKatex,
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["nofollow", "noopener", "noreferrer"],
        },
      ],
      rehypeSlug,
      rehypeWrapTable,
      rehypeMermaid,
      [
        rehypeComponents,
        {
          components: {
            github: GithubCardComponent,
            note: (x, y) => AdmonitionComponent(x, y, "note"),
            tip: (x, y) => AdmonitionComponent(x, y, "tip"),
            important: (x, y) => AdmonitionComponent(x, y, "important"),
            caution: (x, y) => AdmonitionComponent(x, y, "caution"),
            warning: (x, y) => AdmonitionComponent(x, y, "warning"),
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["anchor"],
          },
          content: {
            type: "element",
            tagName: "span",
            properties: {
              className: ["anchor-icon"],
              "data-pagefind-ignore": true,
            },
            children: [{ type: "text", value: "#" }],
          },
        },
      ],
      rehypeImageWidth,
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    // 开发环境预打包优化：将常用依赖提前编译，避免首次页面加载时 on-demand 编译导致 8s+ 的等待
    optimizeDeps: {
      include: [
        "@iconify/svelte",
        "svelte",
        "svelte/transition",
        "svelte/easing",
        "overlayscrollbars",
        "@fancyapps/ui",
        "marked",
        "sanitize-html",
        "qrcode",
      ],
    },
    // 预热常用入口文件，让 Vite 在服务器启动后立即开始转换，而不是等到浏览器请求
    server: {
      warmup: {
        clientFiles: [
          "src/layouts/Layout.astro",
          "src/pages/index.astro",
          "src/components/widgets/music-player/MusicPlayer.svelte",
          "src/components/organisms/navigation/Search.svelte",
          "src/components/control/ThemeSwitch.svelte",
          "src/components/features/settings/DisplaySettings.svelte",
          "src/scripts/swup-manager.ts",
        ],
      },
    },
    build: {
      // 构建目标：现代浏览器 ES2020，减小产物体积
      target: "es2020",
      // 静态资源处理优化，防止小图片转 base64 导致 HTML 体积过大
      assetsInlineLimit: 4096,
      // CSS 代码分割
      cssCodeSplit: true,
      // CSS 压缩：使用 LightningCSS（Vite 5+ 默认，比 esbuild 更快）
      cssMinify: "lightningcss",
      // 内联小型 CSS 文件以减少网络请求
      inlineStylesheets: "auto",
      // 生产环境禁用 sourcemap，防止源代码泄露
      sourcemap: false,
      // JS 压缩：使用 Terser，完全移除注释和 legal comments
      minify: "terser",
      terserOptions: {
        format: {
          comments: false, // 移除所有注释（包括 /*! 许可证注释 */）
        },
      },
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.message.includes("is dynamically imported by") &&
            warning.message.includes("but also statically imported by")
          ) {
            return;
          }
          warn(warning);
        },
        output: {
          // 手动分包：将大型第三方库拆分为独立 chunk，提升浏览器缓存命中率
          // 只有库更新时对应 chunk 才会失效，避免所有依赖重新下载
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            // Svelte 运行时（框架核心）
            if (id.includes("/svelte/") || id.includes("/svelte-")) return "vendor-svelte";
            // Markdown 文本处理（Markdown 渲染 + HTML 净化）
            if (id.includes("marked") || id.includes("sanitize-html")) return "vendor-markdown";
            // UI 组件库（Fancybox 灯箱 + OverlayScrollbars 滚动条）
            if (id.includes("@fancyapps") || id.includes("overlayscrollbars")) return "vendor-ui";
            // 图标库（Iconify Svelte 组件 + 图标数据）
            if (id.includes("@iconify")) return "vendor-icons";
            // Live2D 看板娘（体积较大，独立拆分避免影响其他缓存）
            if (id.includes("l2d-widget")) return "vendor-live2d";
            // 其他工具库（二维码、日期、HTTP 等小依赖合并）
            if (id.includes("qrcode") || id.includes("dayjs") || id.includes("axios")) return "vendor-utils";
          },
        },
      },
    },
    // 生产环境移除 console 和 debugger（esbuild 转换阶段处理）
    esbuild: {
      drop:
        process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  },
});
