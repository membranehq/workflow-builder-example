'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'
import { PageWrapper } from '@/components/page-wrapper'

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!pathname) {
    return <>{children}</>
  }

  const isWorkflowPage = pathname.match(/^\/workflows\/[^/]+$/) || pathname === '/notes'

  return (
    <div className='h-full flex flex-col'>
      {!isWorkflowPage && <Header />}
      <main className='flex-1 flex flex-col items-center'>
        <div className={
          isWorkflowPage
            ? 'w-full h-full'
            : 'w-full py-6'
        }>
          {isWorkflowPage ? (
            children
          ) : (
            <PageWrapper>
              {children}
            </PageWrapper>
          )}
        </div>
      </main>
    </div>
  )
}
