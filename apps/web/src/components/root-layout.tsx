'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'
import { PageWrapper } from '@/components/page-wrapper'

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!pathname) {
    return <>{children}</>
  }

  const isWorkflowPage = pathname.match(/^\/workflows\/[^/]+$/)
  const isRunPage = pathname.match(/^\/runs\/[^/]+$/)

  return (
    <div className='h-full flex flex-col'>
      {!isWorkflowPage && !isRunPage && <Header />}
      <main className='flex-1 flex flex-col items-center'>
        {isWorkflowPage || isRunPage ? (
          children
        ) : (
          <PageWrapper>
            {children}
          </PageWrapper>
        )}
      </main>
    </div>
  )
}
