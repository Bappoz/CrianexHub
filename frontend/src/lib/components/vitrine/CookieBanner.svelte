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
    <div class="banner-left">
      <svg
        class="cookie-icon"
        viewBox="0 0 64 64"
        width="36"
        height="36"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <!-- Cookie principal com mordida -->
        <path d="M44 20 C44 20 41 14 34 14 C27 14 20 20 20 28 C20 36 26 42 34 42 C42 42 48 36 48 28 C48 24 46 22 44 20 Z" />
        <!-- Mordida -->
        <path d="M44 20 C44 20 48 17 52 18 C53 22 51 26 48 28" stroke-dasharray="0" />
        <!-- Chips no cookie -->
        <circle cx="29" cy="25" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="36" cy="22" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="32" cy="32" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="40" cy="30" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="26" cy="33" r="1.3" fill="currentColor" stroke="none" />
        <!-- Migalhas -->
        <circle cx="51" cy="14" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="55" cy="20" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="53" cy="10" r="0.8" fill="currentColor" stroke="none" />
      </svg>
      <p class="message">{t.message}</p>
    </div>
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
    background-color: rgb(240, 239, 239);
    border-top: 1px solid rgb(166, 166, 166);
    border-radius: 8px;
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

  .banner-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .cookie-icon {
    flex-shrink: 0;
    color: var(--text-muted);
    opacity: 0.75;
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

    .banner-left {
      align-items: flex-start;
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
