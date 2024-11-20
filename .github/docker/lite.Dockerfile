FROM node:lts-alpine
ARG TARGETPLATFORM

COPY ./boilerplate /koishi
RUN apk add fontconfig
RUN cd /koishi && yarn install

USER root

VOLUME ["/koishi"]
WORKDIR "/koishi"
EXPOSE 5140
CMD ["yarn", "start"]

