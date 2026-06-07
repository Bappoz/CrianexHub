<script lang="ts">
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang';
  import { CONSENT_KEY, cookieI18n, getConsent, setConsent } from './cookie-banner';

  let visible = false;
  let leaving = false;

  onMount(() => {
    if (getConsent(localStorage) === null) {
      visible = true;
    }
  });

  function dismiss(value: 'accepted' | 'rejected') {
    leaving = true;
    setConsent(localStorage, value);
    setTimeout(() => {
      visible = false;
      leaving = false;
    }, 220);
  }

  $: t = cookieI18n[$lang];
</script>

{#if visible}
  <div
    class="cookie-banner"
    class:leaving
    role="region"
    aria-label={$lang === 'en' ? 'Cookie consent' : 'Consentimento de cookies'}
    aria-live="polite"
    data-testid="cookie-banner"
  >
    <p class="message">{t.message}</p>
    <div class="actions">
      <button
        class="btn-accept"
        on:click={() => dismiss('accepted')}
        data-consent={CONSENT_KEY}
      >{t.accept}</button>
      <button
        class="btn-reject"
        on:click={() => dismiss('rejected')}
      >{t.reject}</button>
    </div>
  </div>
{/if}

<style>
  .cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: var(--bg);
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 40px;
    animation: slide-in 280ms ease-out;
  }

  .cookie-banner.leaving {
    animation: slide-out 220ms ease-in forwards;
  }

  @keyframes slide-in {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slide-out {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  .message {
    font-size: 13.5px;
    color: var(--text-muted);
    line-height: 1.55;
    max-width: 72ch;
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .btn-accept {
    background: var(--venom);
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 9px 22px;
    font-size: 13.5px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
    white-space: nowrap;
  }

  .btn-accept:hover {
    opacity: 0.82;
  }

  .btn-reject {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 9px 22px;
    font-size: 13.5px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;
    white-space: nowrap;
  }

  .btn-reject:hover {
    border-color: var(--line-strong);
    color: var(--text);
  }

  @media (max-width: 767px) {
    .cookie-banner {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
    }

    .actions {
      width: 100%;
    }

    .btn-accept,
    .btn-reject {
      flex: 1;
      text-align: center;
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cookie-banner,
    .cookie-banner.leaving {
      animation: none;
    }
  }
</style>
