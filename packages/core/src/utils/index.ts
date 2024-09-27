export * from './preferImg'
export * from './jwt'
export * from './puppeteer'
export * from './s3'
export const cooldownDurationTostring = (duration: number) => {
  if (duration == 0) return '暂无冷静期'
  if (duration < 24 * 3600) {
    return '冷静期剩余' + (duration / 3600).toFixed(0) + '小时'
  }
  return '冷静期剩余' + (duration / (24 * 3600)).toFixed(0) + '天'
}

export const sleep = async (millsec: number = 5000) => {
  await new Promise<void>((resolve, reject) => {
    setTimeout(resolve, millsec)
  })
}
