import { Policy, allPolicies } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import PolicyLayout from '@/layouts/PolicyLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Terms of Service' })

export default function Page() {
  const policy = allPolicies.find((p) => p.slug === 'terms') as Policy
  const mainContent = coreContent(policy)

  return (
    <>
      <PolicyLayout content={mainContent}>
        <MDXLayoutRenderer code={policy.body.code} />
      </PolicyLayout>
    </>
  )
}
