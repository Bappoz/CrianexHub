import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';
import type { HomeProduct } from './home';

export const load: PageServerLoad = async ({ url, locals, fetch }) => {
  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const key = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const origin = url.origin;
  const selectedLang = locals.lang ?? 'pt';

  if (!supabaseUrl || !key) {
    return { products: [] as HomeProduct[], origin, selectedLang };
  }

  const supabase = createClient(supabaseUrl, key, {
    global: { fetch },
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('products')
    .select(
      'slug, name_pt, name_en, tagline_pt, tagline_en, category_pt, category_en, image_url, product_url'
    )
    .eq('published', true)
    .order('display_order');

  if (error) {
    // Fallback sem product_url caso a migração ainda não tenha sido aplicada
    const { data: fallback } = await supabase
      .from('products')
      .select('slug, name_pt, name_en, tagline_pt, tagline_en, category_pt, category_en, image_url')
      .eq('published', true)
      .order('display_order');

    return { products: (fallback ?? []) as HomeProduct[], origin, selectedLang };
  }

  return { products: (data ?? []) as HomeProduct[], origin, selectedLang };
};
