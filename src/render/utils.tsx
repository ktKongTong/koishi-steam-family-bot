/** @jsxImportSource react */
import React from "react";
import * as ReactDOMServer from 'react-dom/server';
import {Context} from "koishi";

function App({
               children
             }:{
  children?:React.ReactNode
}) {
  return (
    <html>
    <head>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.7.2/dist/full.min.css" rel="stylesheet" type="text/css"/>
      <script src="https://cdn.tailwindcss.com"></script>
      <title>IMG Render</title>
    </head>
    <body>
    {children}
    </body>
    </html>
  )
}

export default App;

export const renderImg = async (ctx: Context, child: React.ReactNode, onStart?: ()=> void, onError?:()=>void) => {
  let res = ReactDOMServer.renderToString(<App>{child}</App>)
  res = ` <!DOCTYPE html>` + res


  const buf = await ctx.puppeteer.render(res, async (page, next) => {
    onStart?.()
    await new Promise<void>((resolve, reject)=> {
      setTimeout(resolve,5000)
    })
    return page.$('body').then(next).catch(e=> {onError?.(); return ""})
  })
  return buf
}


