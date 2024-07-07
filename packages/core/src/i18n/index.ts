const i18n = (lang: string) => {}

const i18nObj = {}

init().then((_) => console.log('i18n loaded'))

async function init() {
  // @ts-expect-error
  const zh = await import('./zh-cn.json')
  i18nObj['zh-cn'] = zh
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

function merge(target, ...sources) {
  if (!sources.length) return target
  const source = sources.shift()
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        merge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  return merge(target, ...sources)
}

export function loadI18nConfig(lang: string, obj: any) {
  const raw = i18nObj[lang]
  i18nObj[lang] = merge(raw, obj)
  console.log(`overwrite i18n ${lang} `)
}

function safeEval(expr, context) {
  try {
    const fn = new Function(...Object.keys(context), `return ${expr}`)
    return fn(...Object.values(context))
  } catch (e) {
    console.error(expr, context, e)
    return expr
  }
}

export function tran(path: string, params = {}, lang = 'zh-cn'): string {
  const keys = path.split('.')
  let result = i18nObj[lang]

  for (const key of keys) {
    if (result[key] !== undefined) {
      result = result[key]
    } else {
      return null
    }
  }

  if (typeof result === 'string') {
    return interpolateString(result, params)
  }

  return null
}

function interpolateString(str, context) {
  // 正则表达式匹配三元表达式
  const regex = /\{\{(.*?)\?\s*'(.*?)'\s*:\s*'(.*?)'\s*\}\}/
  let match

  // 递归解析
  while ((match = regex.exec(str)) !== null) {
    const [fullMatch, condition, trueValue, falseValue] = match

    // 递归解析 trueValue 和 falseValue 以处理嵌套情况
    const resolvedTrueValue = interpolateString(trueValue, context)
    const resolvedFalseValue = interpolateString(falseValue, context)

    // 计算条件表达式
    let result = safeEval(condition, context)
    if (typeof result === 'string') {
      result = false
    }
    const replacement = result ? resolvedTrueValue : resolvedFalseValue

    // 替换匹配到的三元表达式
    str = str.replace(fullMatch, replacement)
  }

  // 替换变量插值
  const variableRegex = /\{\{(.*?)\}\}/g
  str = str.replace(variableRegex, (match, expr) => safeEval(expr, context))

  return str
}
