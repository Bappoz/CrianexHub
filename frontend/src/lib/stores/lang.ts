import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type AvailableLang = 'pt' | 'en';
const LANG_KEY = 'crianex_lang';

function createLangStore() {
  const initial: AvailableLang = browser
    ? ((localStorage.getItem(LANG_KEY) as AvailableLang) ?? 'pt')
    : 'pt';

  const { subscribe, set } = writable<AvailableLang>(initial);

  return {
    subscribe,
    set(tag: AvailableLang) {
      if (browser) localStorage.setItem(LANG_KEY, tag);
      set(tag);
    },
  };
}

export const lang = createLangStore();
