# 0.0.3 to 0.0.5 升级指南（TEMP)

## 1. 切换docker 镜像

将 docker compose 中的image 行进行变更。

```yaml

services:
  koishi-steam:
    image: koishijs/koishi:latest // [!code --]
    image: aktdocker/koishi:v1.20.1 // [!code ++]
    tty: true
    container_name: koishi_steam
    restart: always
    environment:
      - TZ:"Asia/Shanghai"
    volumes:
      - koishi_steam:/koishi
    ports:
      - "5140:5140"
    networks:
      - steam-bot
```

## 2. 重新部署该 compose

```shell
docker-compose up -d
```
或在 portainer 中手动变更

## 3. 更新插件

选择 0.0.5 版本进行更新即可。

