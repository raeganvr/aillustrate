import "./globals.css"
import type React from "react"

export const metadata = {
  title: "AIllustrate - Build and Explore Neural Networks",
  description: "Interactive platform for building and exploring neural networks",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

