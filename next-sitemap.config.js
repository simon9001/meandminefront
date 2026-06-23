/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://meandmine.shop',

  generateRobotsTxt: true,
  generateIndexSitemap: true,

  // Static routes to exclude — private, auth, transient pages, and asset files
  exclude: [
    '/account',
    '/account/*',
    '/admin',
    '/admin/*',
    '/auth/*',
    '/cart',
    '/checkout',
    '/checkout/*',
    '/orders/*',
    '/server-sitemap.xml', // generated separately (dynamic products)
    // Next.js App Router auto-generates icon routes — exclude them
    '/*.png',
    '/*.svg',
    '/*.ico',
    '/*.jpg',
    '/*.webp',
    '/*.xml',
    '/*.txt',
  ],

  // Per-path overrides for priority and changefreq
  transform: async (_config, path) => {
    const overrides = {
      '/':         { priority: 1.0, changefreq: 'daily' },
      '/products': { priority: 0.9, changefreq: 'daily' },
      '/track':    { priority: 0.4, changefreq: 'monthly' },
      '/terms':    { priority: 0.2, changefreq: 'yearly' },
      '/privacy':  { priority: 0.2, changefreq: 'yearly' },
    };
    const override = overrides[path] ?? { priority: 0.5, changefreq: 'monthly' };
    return {
      loc:        path,
      lastmod:    new Date().toISOString(),
      changefreq: override.changefreq,
      priority:   override.priority,
    };
  },

  robotsTxtOptions: {
    // Product sitemap is served live so it always reflects current catalogue
    additionalSitemaps: ['https://meandmine.shop/server-sitemap.xml'],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/admin',
          '/auth',
          '/cart',
          '/checkout',
          '/orders',
          '/api',
        ],
      },
    ],
  },
};
