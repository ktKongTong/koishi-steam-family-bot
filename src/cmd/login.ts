import {Context, h, sleep} from "koishi";
import {Config} from "../config";
import {APIService} from "../service";
import {EAuthTokenPlatformType, LoginSession} from "steam-session";

export function LoginCmd(ctx:Context,cfg:Config) {
  const subcmd = ctx
    .command('slm.login')
    .alias('sblogin')
    .action(async ({ session, options }, input) => {

      let loginSession = new LoginSession(EAuthTokenPlatformType.SteamClient);
      loginSession.loginTimeout = 120 * 1000;
      // session.
      let startResult = await loginSession.startWithQR();
      let qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(startResult.qrChallengeUrl);
      const buffer = (await ctx.http.get(qrUrl))
      session.send(h.image(buffer, 'image/png'))
      session.send(h('message', "请在 120s 内通过 steam 手机验证器扫描二维码，并确认登陆"))
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
          lastRefreshTime: (new Date()).getTime().toFixed(),
        }
        status = 'success'
        const api = new APIService(ctx,cfg,account)
        const family = await api.Steam.getSteamFamily()
         ctx.database.upsert('SteamAccount',[{
          familyId: family.data?.familyGroupid,
          ...account
        }])

        let webCookies = await loginSession.getWebCookies();
      });

      loginSession.on('timeout', () => {
        session.send('登陆失败，已超时')
        status = 'failed'
      });

      loginSession.on('error', (err) => {
        session.send('登陆出错，暂时无法登陆')
        status = 'failed'
      });
      await new Promise(async (resolve, reject)=> {
        let time = 0
        while (status != 'success' && time < 120) {
          await sleep(3 * 1000)
          time += 3
        }
        if(status != 'success') {
          loginSession.cancelLoginAttempt()
          reject(status)
        }else {
          resolve(status)
        }
      })
      return
    })
}
