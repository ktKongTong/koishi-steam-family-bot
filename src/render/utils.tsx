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

export const renderImg = (ctx: Context, child: React.ReactNode) => {
  let res = ReactDOMServer.renderToString(<App>{child}</App>)
  res = ` <!DOCTYPE html>` + res


  return ctx.puppeteer.render(res, async (page, next) => {
    console.log('start render')
    await new Promise<void>((resolve, reject)=> {
      console.log('start wait 3s')
      setTimeout(resolve,3000)
    })
    console.log('wait finished')
    console.log('start screenshot')
    return page.$('body').then(next)
  })
}


