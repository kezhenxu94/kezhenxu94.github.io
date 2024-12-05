/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: `kezhenxu94's blog`,
  author: 'kezhenxu94',
  headerTitle: 'kezhenxu94',
  description: `Blogging about dev, tips & tricks, tutorials and more`,
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://kezhenxu94.me',
  siteRepo: 'https://github.com/kezhenxu94/kezhenxu94.github.io',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/avatar.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  email: 'kezhenxu94@apache.org',
  github: 'https://github.com/kezhenxu94',
  x: 'https://twitter.com/kezhenxu94',
  linkedin: 'https://linkedin.com/in/kezhenxu94',
  locale: 'en-US',
  stickyNav: false,
  analytics: {
    googleAnalytics: {
      googleAnalyticsId: process.env.NEXT_GA_ID,
    },
  },
  newsletter: {
    // supports mailchimp, buttondown, convertkit, klaviyo, revue, emailoctopus, beehive
    // Please add your .env file and modify it according to your selection
    provider: 'emailoctopus',
  },
  comments: {
    // If you want to use an analytics provider you have to add it to the
    // content security policy in the `next.config.js` file.
    // Select a provider and use the environment variables associated to it
    // https://vercel.com/docs/environment-variables
    provider: 'giscus', // supported providers: giscus, utterances, disqus
    giscusConfig: {
      // Visit the link below, and follow the steps in the 'configuration' section
      // https://giscus.app/
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
      mapping: 'pathname', // supported options: pathname, url, title
      reactions: '1', // Emoji reactions: 1 = enable / 0 = disable
      // Send discussion metadata periodically to the parent window: 1 = enable / 0 = disable
      metadata: '0',
      // theme example: light, dark, dark_dimmed, dark_high_contrast
      // transparent_dark, preferred_color_scheme, custom
      theme: 'light',
      // theme when dark mode
      darkTheme: 'transparent_dark',
      // If the theme option above is set to 'custom`
      // please provide a link below to your custom theme css file.
      // example: https://giscus.app/themes/custom_example.css
      themeURL: '',
      // This corresponds to the `data-lang="en"` in giscus's configurations
      lang: 'en',
    },
  },
  search: {
    provider: 'kbar', // kbar or algolia
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`, // path to load documents to search
    },
    // provider: 'algolia',
    // algoliaConfig: {
    //   // The application ID provided by Algolia
    //   appId: 'R2IYF7ETH7',
    //   // Public API key: it is safe to commit it
    //   apiKey: '599cec31baffa4868cae4e79f180729b',
    //   indexName: 'docsearch',
    // },
  },
  showDiscussOnTwitter: false,
}

module.exports = siteMetadata
