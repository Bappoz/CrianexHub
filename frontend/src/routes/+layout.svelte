<script lang="ts">
  import { ParaglideJS } from '@inlang/paraglide-sveltekit';
  import { i18n } from '$lib/i18n';
  import { lang } from '$lib/stores/lang';

  let { children } = $props();
</script>

<ParaglideJS {i18n} languageTag={$lang}>
  {@render children()}
</ParaglideJS>
