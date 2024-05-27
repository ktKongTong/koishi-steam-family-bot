import { Context, h, Logger, sleep } from 'koishi'
import { Config } from '../config'
import { EAuthTokenPlatformType, LoginSession } from 'steam-session'
import { libApi } from '../service/api'

export function LoginCmd(ctx: Context, cfg: Config, logger: Logger) {
  const loginCmd = ctx
    .command('slm.login')
    .alias('sblogin')
    .action(async ({ session, options }, input) => {
      const loginSession = new LoginSession(EAuthTokenPlatformType.SteamClient)
      loginSession.loginTimeout = 115 * 1000
      const startResult = await loginSession.startWithQR()
      const qrUrl =
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
        encodeURIComponent(startResult.qrChallengeUrl)
      const buffer = await ctx.http.get(qrUrl)
      session.send(h.image(buffer, 'image/png'))
      session.send(
        h('message', '请在 120s 内通过 steam 手机验证器扫描二维码，并确认登陆')
      )
      // loginSession.on('remoteInteraction', () => {
      //   // session.send(`做得好👍，你已成功扫描二维码，现在只需确认登陆就可以成功绑定 steam 账户，预计有效期为六个月`)
      // });
      let status = 'wait'
      loginSession.on('authenticated', async () => {
        session.send(`登陆成功，你好 ${loginSession.accountName}`)
        const account = {
          uid: session.uid,
          steamId: loginSession.steamID.toString(),
          accountName: loginSession.accountName,
          steamAccessToken: loginSession.accessToken,
          steamRefreshToken: loginSession.refreshToken,
          lastRefreshTime: new Date().getTime().toFixed(),
        }
        status = 'success'
        // raw access without token check
        const api = libApi(ctx, cfg, loginSession.accessToken)
        const family = await api.getSteamFamilyGroup()
        const res = await ctx.database.get('SteamAccount', {
          steamId: account.steamId,
          uid: account.uid,
        })
        if (res.length > 0) {
          // replace previous account
          ctx.database.upsert('SteamAccount', [
            {
              id: res[0]?.id,
              familyId: String(family.data?.familyGroupid),
              valid: 'valid',
              ...account,
            },
          ])
        } else {
          ctx.database.upsert('SteamAccount', [
            {
              familyId: String(family.data?.familyGroupid),
              valid: 'valid',
              ...account,
            },
          ])
        }

        const webCookies = await loginSession.getWebCookies()
      })

      loginSession.on('timeout', () => {
        session.send('登陆失败，已超时')
        status = 'failed'
      })

      loginSession.on('error', (err) => {
        session.send('登陆出错，暂时无法登陆')
        status = 'failed'
      })

      await new Promise((resolve, reject) => {
        let time = 0
        const intervalId = setInterval(() => {
          if (status !== 'success' && time < 120) {
            time += 3
          } else if (status !== 'success') {
            clearInterval(intervalId)
            loginSession.cancelLoginAttempt()
            reject(status)
          } else {
            clearInterval(intervalId)
            resolve(status)
          }
        }, 3000)
      }).catch((e) => {
        logger.error(e)
      })
      return
    })
}
