/** @jsxImportSource react */
import React from 'react'

export function App({ children }: { children?: React.ReactNode }) {
  return (
    <html>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.7.2/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>IMG Render</title>
      </head>
      <body>{children}</body>
    </html>
  )
}
