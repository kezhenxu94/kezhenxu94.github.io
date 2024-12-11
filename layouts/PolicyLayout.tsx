import { ReactNode } from 'react'
import type { Policy } from 'contentlayer/generated'

interface Props {
  children: ReactNode
  content: Omit<Policy, '_id' | '_raw' | 'body'>
}

export default function PolicyLayout({ children, content }: Props) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            {content.title}
          </h1>
        </div>
        <div className="prose max-w-none pb-8 pt-8 dark:prose-invert xl:col-span-2">{children}</div>
      </div>
    </>
  )
}
