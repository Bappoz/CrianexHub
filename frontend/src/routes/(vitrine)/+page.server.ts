import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';
import type { HomeProduct } from './home';

export const load: PageServerLoad = async () => {
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return { products: [] as HomeProduct[] };

  const supabase = createClient(url, key);

  const { data } = await supabase
    .from('products')
    .select('slug, name_pt, name_en, tagline_pt, tagline_en, category_pt, category_en, image_url')
    .eq('published', true)
    .order('display_order');

  return { products: (data ?? []) as HomeProduct[] };
};
