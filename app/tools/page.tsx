import toolsData from '@/data/toolsData'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tools' })

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Online Tools
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Useful online tools that I deployed (some of them are developed by myself, not
            necessarily all, though) for my personal use. Feel free to bookmark them and add them to
            your toolkit!
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          {toolsData.map((tool, index) => (
            <div
              key={index}
              className="col-span-2 rounded-md border-2 border-gray-200 border-opacity-60 dark:border-gray-700 xl:col-span-1"
            >
              <div className="flex h-full w-full flex-col justify-between p-6">
                <h2 className="mb-3 text-2xl font-bold leading-8 tracking-tight">
                  <a href={tool.href} aria-label={`Link to ${tool.title}`} target="_blank">
                    {tool.title}
                  </a>
                </h2>
                <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">
                  {tool.description}
                </p>
                {tool.href && (
                  <a
                    href={tool.href}
                    className="text-base font-medium leading-6 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                    aria-label={`Link to ${tool.title}`}
                  >
                    Use tool &rarr;
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
