import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "koishi-plugin-steam-family-bot",
  description: "a koishi bot plugin for steam family library",
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '快速开始', link: '/guide' },
      { text: '升级', link: '/upgrade' },
    ],

    sidebar: [
      { text: '快速开始', link: '/guide' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ktkongtong/koishi-steam-family-bot' }
    ]
  }
})
