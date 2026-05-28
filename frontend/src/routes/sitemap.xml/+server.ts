import { supabase } from '$lib/api/supabase';
import { env } from '$env/dynamic/public';

export async function GET(event: any) {
  const origin = event.url.origin;

  try {

    // static pages
    const staticUrls = [
      { loc: `${origin}/`, lastmod: new Date().toISOString() },
      { loc: `${origin}/produtos`, lastmod: new Date().toISOString() },
      { loc: `${origin}/sobre`, lastmod: new Date().toISOString() },
      { loc: `${origin}/faq`, lastmod: new Date().toISOString() },
      { loc: `${origin}/contato`, lastmod: new Date().toISOString() },
    ];

    // fetch published products
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('published', true)
      .order('display_order');

    if (error) throw error;

    const productUrls = (products ?? []).map((p: any) => ({
      loc: `${origin}/produtos/${p.slug}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString(),
    }));

    const allUrls = [...staticUrls, ...productUrls];

    const urlset = allUrls
      .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[sitemap] unexpected error:', err?.message ?? err);
    // In dev return the error details to help debugging; in production keep generic
    const isDev = process.env.NODE_ENV !== 'production';
    const body = isDev ? JSON.stringify({ message: 'sitemap error', error: String(err) }) : JSON.stringify({ message: 'Internal Error' });
    return new Response(body, { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
