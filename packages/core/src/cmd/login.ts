import { EAuthTokenPlatformType, LoginSession } from 'steam-session'
import { CommandBuilder } from '@/cmd/builder'

export default () =>
  new CommandBuilder()
    .setName('login')
    .setDescription('login to steam via qrcode')
    .addAlias('sblogin')
    .setExecutor(async (c) => {
      const { steamService, logger, session } = c
      const loginSession = new LoginSession(EAuthTokenPlatformType.SteamClient)
      loginSession.loginTimeout = 115 * 1000
      const startResult = await loginSession.startWithQR()
      const qrUrl =
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
        encodeURIComponent(startResult.qrChallengeUrl)
      const buf = await fetch(qrUrl).then((res) => res.arrayBuffer())
      await session.sendImgBuffer(Buffer.from(buf))
      await session.send(session.text('commands.login.start-login'))
      let status = 'wait'
      loginSession.on('authenticated', async () => {
        status = 'success'
        await steamService
          .addAccountInfoByLoginSession(loginSession, session.getSessionInfo())
          .catch((e) => {
            logger.error('login error', e)
            session.send(
              session.text('commands.login.login-success-but-add-failed')
            )
          })
        await session.send(
          session.text('commands.login.login-success', {
            accountName: loginSession.accountName,
          })
        )
      })

      loginSession.on('timeout', async () => {
        await session.send(session.text('commands.login.timeout'))
        status = 'failed'
      })

      loginSession.on('error', async (err) => {
        await session.send(session.text('commands.login.error'))
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
