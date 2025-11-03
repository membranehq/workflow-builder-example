'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Workflow, History } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function Header() {
  const pathname = usePathname()
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const navRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { href: '/workflows', label: 'Workflows', icon: Workflow },
    { href: '/runs', label: 'Runs', icon: History },
  ]

  const isActive = (href: string) => {
    // Special case: root path redirects to /workflows, so treat both as workflows
    if (href === '/workflows') {
      return pathname === '/' || pathname.startsWith('/workflows')
    }
    return pathname.startsWith(href)
  }

  const activeIndex = navItems.findIndex((item) => isActive(item.href))

  useEffect(() => {
    if (navRef.current && activeIndex !== -1) {
      const activeLink = navRef.current.children[activeIndex] as HTMLElement
      if (activeLink) {
        setIndicatorStyle({
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
        })
      }
    }
  }, [activeIndex])

  return (
    <header className='bg-white dark:bg-gray-800 py-4'>
      <nav className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-center items-center'>
          {/* Centered Navigation */}
          <div className='relative inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-full'>
            {/* Sliding indicator */}
            <div
              className='absolute bg-gray-900 dark:bg-gray-100 rounded-full h-[calc(100%-8px)] transition-all duration-300 ease-out'
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                top: '4px',
              }}
            />

            {/* Nav items */}
            <div ref={navRef} className='relative flex items-center gap-2'>
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
                      active
                        ? 'text-white dark:text-gray-900'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
