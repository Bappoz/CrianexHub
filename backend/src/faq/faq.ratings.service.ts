import { createHash } from 'crypto';
import { getSupabaseClient } from '../config/supabase.js';

export type RatingInput = {
  article_id: string;
  rating: 'y' | 'n';
  ip: string;
  userAgent: string;
};

export type RatingTotals = {
  helpful: number;
  not_helpful: number;
};

export type RatingAction = 'created' | 'changed' | 'cancelled';

export type RatingResult =
  | { success: true; action: RatingAction; totals: RatingTotals }
  | { success: false; error: string };

function buildSessionHash(ip: string, userAgent: string): string {
  const dateString = new Date().toDateString();
  return createHash('sha256')
    .update(ip + userAgent + dateString)
    .digest('hex');
}

async function getArticleTotals(articleId: string): Promise<RatingTotals> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('faq_articles')
    .select('helpful_count, not_helpful_count')
    .eq('id', articleId)
    .single();

  if (error) throw error;
  return {
    helpful: (data as { helpful_count: number; not_helpful_count: number }).helpful_count,
    not_helpful: (data as { helpful_count: number; not_helpful_count: number }).not_helpful_count,
  };
}

export async function submitRating(input: RatingInput): Promise<RatingResult> {
  const supabase = getSupabaseClient();
  const session_hash = buildSessionHash(input.ip, input.userAgent);

  // 1. Verify article exists and is published
  const { data: article, error: articleError } = await supabase
    .from('faq_articles')
    .select('id, helpful_count, not_helpful_count')
    .eq('id', input.article_id)
    .eq('published', true)
    .maybeSingle();

  if (articleError) throw articleError;
  if (!article) throw Object.assign(new Error('Artigo não encontrado.'), { code: 'NOT_FOUND' });

  const art = article as { helpful_count: number; not_helpful_count: number };

  // 2. Check for existing rating
  const { data: existing, error: checkError } = await supabase
    .from('faq_ratings')
    .select('id, rating')
    .eq('article_id', input.article_id)
    .eq('session_hash', session_hash)
    .maybeSingle();

  if (checkError) throw checkError;

  if (!existing) {
    // No prior rating — insert and increment
    const { error: insertError } = await supabase
      .from('faq_ratings')
      .insert([{ article_id: input.article_id, session_hash, rating: input.rating }]);
    if (insertError) throw insertError;

    const field = input.rating === 'y' ? 'helpful_count' : 'not_helpful_count';
    const { error: updateError } = await supabase
      .from('faq_articles')
      .update({ [field]: (input.rating === 'y' ? art.helpful_count : art.not_helpful_count) + 1 })
      .eq('id', input.article_id);
    if (updateError) throw updateError;

    return { success: true, action: 'created', totals: await getArticleTotals(input.article_id) };
  }

  const prev = existing as { id: string; rating: string };

  if (prev.rating === input.rating) {
    // Same button clicked — cancel (delete rating, decrement counter)
    const { error: deleteError } = await supabase.from('faq_ratings').delete().eq('id', prev.id);
    if (deleteError) throw deleteError;

    const field = input.rating === 'y' ? 'helpful_count' : 'not_helpful_count';
    const current = input.rating === 'y' ? art.helpful_count : art.not_helpful_count;
    const { error: updateError } = await supabase
      .from('faq_articles')
      .update({ [field]: Math.max(0, current - 1) })
      .eq('id', input.article_id);
    if (updateError) throw updateError;

    return { success: true, action: 'cancelled', totals: await getArticleTotals(input.article_id) };
  }

  // Different button — change rating, swap counters
  const { error: updateRatingError } = await supabase
    .from('faq_ratings')
    .update({ rating: input.rating })
    .eq('id', prev.id);
  if (updateRatingError) throw updateRatingError;

  const oldField = prev.rating === 'y' ? 'helpful_count' : 'not_helpful_count';
  const newField = input.rating === 'y' ? 'helpful_count' : 'not_helpful_count';
  const { error: updateError } = await supabase
    .from('faq_articles')
    .update({
      [oldField]: Math.max(
        0,
        (prev.rating === 'y' ? art.helpful_count : art.not_helpful_count) - 1
      ),
      [newField]: (input.rating === 'y' ? art.helpful_count : art.not_helpful_count) + 1,
    })
    .eq('id', input.article_id);
  if (updateError) throw updateError;

  return { success: true, action: 'changed', totals: await getArticleTotals(input.article_id) };
}
