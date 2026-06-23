import { getServerSideSitemap, type ISitemapField } from 'next-sitemap';

const SITE_URL = process.env.SITE_URL ?? 'https://meandmine.shop';
const API_URL  = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

export const revalidate = 3600; // regenerate at most once per hour

export async function GET() {
  const fields: ISitemapField[] = [];

  try {
    // Fetch all published products — one big page (products rarely exceed a few hundred)
    const res = await fetch(`${API_URL}/products?limit=1000&sort=newest`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const products: Array<{ slug: string; updatedAt?: string; status?: string }> =
        json?.data ?? [];

      for (const p of products) {
        // Skip anything that isn't publicly listed
        if (p.status && p.status !== 'active' && p.status !== 'low_stock') continue;
        if (!p.slug) continue;

        fields.push({
          loc:        `${SITE_URL}/products/${p.slug}`,
          lastmod:    p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
          changefreq: 'weekly',
          priority:   0.8,
        });
      }
    }
  } catch {
    // Return an empty sitemap rather than a 500 — Google will retry later
  }

  return getServerSideSitemap(fields);
}
