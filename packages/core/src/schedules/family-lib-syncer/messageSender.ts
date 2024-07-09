import { Session } from '@/interface'
import _ from 'lodash'

interface Msg {
  text: string
  img: string
}

export const sendMessages = async (msgs: Msg[], session: Session) => {
  const send = (msg: Msg) => {
    session.send(msg.text)
    session.sendImgUrl(msg.img)
  }
  if (msgs.length > 5) {
    msgs.slice(0, 3).forEach((msg) => send(msg))
    const size = msgs.length - 3
    const t = size > 30 ? 30 : size
    await session.sendQueued(
      session.text('schedule.lib-syncer.big-change', {
        totalCount: msgs.length,
        shortSize: t,
      })
    )
    const chunkedText = _.chunk(msgs.slice(3), 10)
      .slice(0, 3)
      .map((appTexts, index) =>
        appTexts
          .map((appText, idx) => `${index * 10 + idx + 1}. ${appText.text}`)
          .join('\n')
      )
    chunkedText.forEach(session.send)
  } else {
    msgs.forEach((msg) => send(msg))
  }
}
