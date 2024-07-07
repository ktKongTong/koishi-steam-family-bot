# 参与开发贡献 OR 魔改

> [!TIP]
> 当前代码正处于重构期，因此结构显得比较混乱。

下面简单介绍当前代码结构以方便各位进行魔改。

本repo 采用 monorepo 结构。

`core` 包含主要的业务逻辑，不包含数据存储，消息收发的实现，仅定义供业务逻辑调用的相关接口。
```text
packages/core/src
├── api       # steam api 相关封装
├── cmd       # cmd，指令定义
├───── builder   # 指令的 builder 工具类
├───── interface # 一些类型定义
├───── login     # 登陆指令，登陆 steam 账号，从而可以进行后续操作
├───── clear     # 清除账号消息，对于通过 login 指令登陆的账号，清除数据库中的账号数据
├───── bind      # 绑定指令，提供给那些没有通过 login 登陆的用户，认证为家庭成员，从而可以使用其他指令，如query, info
├───── unbind    # 对应 bind 指令，清除绑定信息
├───── sub       # 订阅指令，订阅家庭信息更新
├───── unsub     # 取消订阅家庭信息更新
├───── info      # 查看当前消息订阅信息，如是否订阅愿望单更新、库存数量
├───── query     # 查询家庭内库存
├───── refresh   # 刷新库存信息
├───── statistic # 统计库存信息，生成数据统计图
├── db        # 定义与存储层dao接口，不包含具体实现
├── errors    # 错误定义，暂时没用上
├── i18n      # i18n 国际化
├── index.ts
├── interface # 部分接口定义
├── render    # 图片渲染相关，react相关组件
├── schedules # 定时任务
├───── familyLibSyncer # 定时抓取 steam 家庭库存、愿望单信息
├───── libInfoSyncer # 定时同步库存基本信息，如中文名，标签
└── utils     # 工具函数

```

`koishi`, `discord` 包是最终可用的产物，主要实现消息收发、数据存储功能。
```text
packages/koishi/src
├── api          # 用 koishi http 包装的 steam api
├── config.ts
├── db           # koishi db，数据存储相关实现
├── index.ts
├── interface
├── locales      # i18n 暂时无用
├── schedules    # 注册 core 包中的定时任务
├── services     # 对 steam db/api 的封装
├── session-impl # koishi 平台消息收发包装
└── utils        # 工具函数
```

### 结构性缺陷
目前的结构下，koishi 并不能直接 debug，koishi 需要在构建产物 lib 目录下进行 debug。且无法热重载，core 的更新不能及时反映到 koishi 中，需要先手动 build
