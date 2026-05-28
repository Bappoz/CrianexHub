import type { PageServerLoad } from './$types';
import { supabase } from '$lib/api/supabase';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const { params, url, request } = event;
  const { slug } = params;
  if (!slug) throw error(404, 'Produto não encontrado');

  const { data, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (fetchError || !data) {
    throw error(404, 'Produto não encontrado');
  }

  // Determine language: ?lang=en overrides, else Accept-Language header, default pt
  const langParam = url.searchParams.get('lang');
  let selectedLang: 'pt' | 'en' = 'pt';
  if (langParam === 'en') selectedLang = 'en';
  else {
    const accept = request.headers.get('accept-language') ?? '';
    if (accept.includes('en')) selectedLang = 'en';
  }

  const canonicalBase = `${url.origin}/produtos/${slug}`;
  const canonical = selectedLang === 'en' ? `${canonicalBase}?lang=en` : canonicalBase;

  return {
    product: data,
    canonical,
    selectedLang,
    canonicalBase,
  };
};
