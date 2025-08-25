import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "GKicks - Premium Sneaker Store",
  description:
    "Discover the latest and greatest sneakers from top brands. Shop Nike, Adidas, Jordan, and more at GKicks.",
  keywords: "sneakers, shoes, Nike, Adidas, Jordan, basketball shoes, running shoes",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://elfsightcdn.com/platform.js" async></script>
      </head>
      <body className="font-sans">
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <div className="elfsight-app-1645323a-e0ed-4f5c-a082-273ee0550c9c" data-elfsight-app-lazy></div>
        </Providers>
      </body>
    </html>
  )
}
