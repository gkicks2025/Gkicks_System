import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AIChatbot } from "@/components/ai-chatbot"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <AIChatbot />
        </Providers>
      </body>
    </html>
  )
}
