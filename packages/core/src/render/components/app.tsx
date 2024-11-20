/** @jsxImportSource react */
import React from 'react'

export function App({ children }: { children?: React.ReactNode }) {
  return (
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <title>IMG Render</title>
      </head>
      <body>{children}</body>
    </html>
  )
}
