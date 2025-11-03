import './globals.css'
import '@membranehq/react/styles.css'
import { RootLayout } from '@/components/root-layout'
import { IntegrationProvider } from './integration-provider'
import { Instrument_Sans } from 'next/font/google'
import { jetbrainsMono } from './fonts'
import { AuthProvider } from '@/contexts/auth-context'
import { AuthenticatedContent } from '@/lib/authenticated-content'
import { AuthModal } from '@/components/auth-modal'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
})

export const metadata = {
  title: {
    default: 'Workflow Builder Example',
    template: '%s | Workflow Builder Example',
  },
  description: 'Build workflow with membrane and temporal',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={`h-full ${jetbrainsMono.variable}`}>
      <body className={`${instrumentSans.className} antialiased bg-white text-gray-900 h-full`}>
        <AuthProvider>
          <IntegrationProvider>
            <AuthenticatedContent>
              <RootLayout>{children}</RootLayout>
            </AuthenticatedContent>
          </IntegrationProvider>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  )
}
