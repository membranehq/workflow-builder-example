import './globals.css'
import '@membranehq/react/styles.css'

import { AuthProvider } from './auth-provider'
import { RootLayout } from '@/components/root-layout'
import { IntegrationProvider } from './integration-provider'
import { Instrument_Sans } from "next/font/google";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: 'Integration App',
    template: '%s | Integration App',
  },
  description: 'Integration App',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${instrumentSans.className} antialiased bg-white text-gray-900`}
      >
        <AuthProvider>
          <IntegrationProvider>
            <RootLayout>{children}</RootLayout>
          </IntegrationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
