# koishi-steam-family-bot

[![npm](https://img.shields.io/npm/v/koishi-plugin-steam-family-bot?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-steam-family-bot)

[check doc here](https://koishi-steam-family-bot.ktlab.io/)

这是一个 Steam 新版家庭的库存监控插件

## 主要功能使用：

1. 通过指令`slm.login` 扫描二维码登陆steam账号。

2. 通过指令`slm.sub` 进行订阅。

通过 cron 定时检查 steam 家庭共享库存，如果出现库存变动的情况，会自动在群聊内播报，适合 steam 家庭群聊。

![img.png](/docs/public/img-1.png)

## 其他指令

1. `slm.stats`，登陆 steam 账号后，该指令会生成库存统计信息。
   ![img.png](/docs/public/img.png)
2. `slm.unsub`，取消订阅。

