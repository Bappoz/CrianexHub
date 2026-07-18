<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { lang } from '$lib/stores/lang';
  import {
    buildPayload,
    resolveStatus,
    defaultForm,
    canAdvance,
    isValidEmail,
    STEP_COUNT,
    ROLE_LABELS,
  } from './contact';
  import type { Product, WizardForm, SubmitStatus, TeamSize, Timeline } from './contact';

  export let products: Product[] = [];
  export let selectedProduct = '';

  const API_BASE = env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

  let step = 0;
  let direction = 1; // 1 = avançando, -1 = voltando (dá o sentido da transição)
  let form: WizardForm = { ...defaultForm(), product: selectedProduct };
  let status: SubmitStatus = 'idle';
  let errorMsg = '';
  let rateLimitError = false;
  let token = '';
  let emailTouched = false;

  const t = {
    steps: {
      pt: ['Identidade', 'Interesse', 'Operação', 'Perfil', 'Desafio', 'Revisão'],
      en: ['Identity', 'Interest', 'Operation', 'Profile', 'Challenge', 'Review'],
    },
    of: { pt: 'de', en: 'of' },
    q: {
      pt: [
        'Vamos começar. Como te encontramos?',
        'Qual produto te trouxe até aqui?',
        'Como é a sua operação?',
        'E sobre você?',
        'Conte o seu desafio.',
        'Tudo certo? Confira e envie.',
      ],
      en: [
        "Let's start. How do we reach you?",
        'Which product brought you here?',
        'What does your operation look like?',
        'And about you?',
        'Tell us your challenge.',
        'All set? Review and send.',
      ],
    },
    sub: {
      pt: [
        'Usamos esses dados só para retornar o seu contato.',
        'Opcional — ajuda a direcionar você ao time certo.',
        'Opcional — nos dá contexto do tamanho e da urgência.',
        'Opcional — quanto mais soubermos, melhor respondemos.',
        'O que você quer resolver com a Crianex?',
        'Você pode voltar e ajustar qualquer resposta.',
      ],
      en: [
        'We use this only to get back to you.',
        'Optional — helps route you to the right team.',
        'Optional — gives us context on size and urgency.',
        'Optional — the more we know, the better we answer.',
        'What do you want to solve with Crianex?',
        'You can go back and adjust any answer.',
      ],
    },
    fields: {
      name: { pt: 'Nome completo', en: 'Full name' },
      email: { pt: 'E-mail corporativo', en: 'Work email' },
      phone: { pt: 'Telefone / WhatsApp', en: 'Phone / WhatsApp' },
      company: { pt: 'Empresa', en: 'Company' },
      message: { pt: 'Sua mensagem', en: 'Your message' },
      optional: { pt: 'opcional', en: 'optional' },
    },
    ph: {
      name: { pt: 'ex. Marina Pereira', en: 'e.g. Marina Pereira' },
      email: { pt: 'voce@empresa.com', en: 'you@company.com' },
      phone: { pt: '+55 (11) 90000-0000', en: '+55 (11) 90000-0000' },
      company: { pt: 'Nome da empresa', en: 'Company name' },
      message: {
        pt: 'Descreva o cenário, o problema e o que espera da gente…',
        en: 'Describe the scenario, the problem and what you expect from us…',
      },
    },
    invalidEmail: { pt: 'E-mail inválido', en: 'Invalid email' },
    noneOfThese: { pt: 'Ainda explorando', en: 'Still exploring' },
    back: { pt: 'Voltar', en: 'Back' },
    next: { pt: 'Continuar', en: 'Continue' },
    skip: { pt: 'Pular', en: 'Skip' },
    submit: { pt: 'Enviar mensagem', en: 'Send message' },
    review: {
      contact: { pt: 'Contato', en: 'Contact' },
      product: { pt: 'Produto', en: 'Product' },
      operation: { pt: 'Operação', en: 'Operation' },
      profile: { pt: 'Perfil', en: 'Profile' },
      message: { pt: 'Mensagem', en: 'Message' },
      empty: { pt: '—', en: '—' },
    },
    lgpdPrefix: { pt: 'Li e concordo com a ', en: 'I have read and agree to the ' },
    lgpdLink: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
    lgpdSuffix: {
      pt: '. Meus dados serão usados apenas para contato comercial (LGPD).',
      en: '. My data will be used for sales contact only (LGPD).',
    },
    successTitle: { pt: 'Recebemos sua mensagem!', en: 'Message received!' },
    successBody: {
      pt: 'Nosso time retorna em até 24 horas úteis no canal que você preferiu.',
      en: "Our team will get back within 24 business hours on your preferred channel.",
    },
    sendAnother: { pt: 'Enviar outra', en: 'Send another' },
    errorGeneric: { pt: 'Erro ao enviar. Tente novamente.', en: 'Failed to send. Try again.' },
    errorRate: {
      pt: 'Muitas tentativas. Aguarde alguns minutos.',
      en: 'Too many attempts. Please wait a few minutes.',
    },
    errorToken: {
      pt: 'Sua sessão do formulário expirou. Tente enviar novamente.',
      en: 'Your form session expired. Please try sending again.',
    },
  };

  const teamOptions: { v: TeamSize; label: { pt: string; en: string }; hint: { pt: string; en: string } }[] = [
    { v: 'solo', label: { pt: 'Só eu', en: 'Just me' }, hint: { pt: 'Autônomo(a)', en: 'Solo' } },
    { v: 'small', label: { pt: '2–10', en: '2–10' }, hint: { pt: 'Time enxuto', en: 'Small team' } },
    { v: 'medium', label: { pt: '11–50', en: '11–50' }, hint: { pt: 'Em crescimento', en: 'Growing' } },
    { v: 'large', label: { pt: '50+', en: '50+' }, hint: { pt: 'Escala', en: 'At scale' } },
  ];

  const timelineOptions: { v: Timeline; label: { pt: string; en: string } }[] = [
    { v: 'now', label: { pt: 'Agora', en: 'Now' } },
    { v: 'month', label: { pt: 'Este mês', en: 'This month' } },
    { v: 'quarter', label: { pt: 'Este trimestre', en: 'This quarter' } },
    { v: 'exploring', label: { pt: 'Só explorando', en: 'Just exploring' } },
  ];

  const roleOptions: (keyof typeof ROLE_LABELS)[] = [
    'founder',
    'manager',
    'operational',
    'other',
  ];

  onMount(fetchToken);

  async function fetchToken() {
    try {
      const res = await fetch(`${API_BASE}/api/public/contact/token`);
      if (res.ok) token = (await res.json()).token ?? '';
    } catch {
      token = '';
    }
  }

  function productName(p: Product): string {
    return $lang === 'pt' ? p.name_pt : p.name_en;
  }
  function productCategory(p: Product): string {
    const c = $lang === 'pt' ? (p.category_pt ?? p.category_en) : (p.category_en ?? p.category_pt);
    return c ?? '';
  }

  $: emailInvalid = emailTouched && form.email.trim().length > 0 && !isValidEmail(form.email);
  $: canGo = canAdvance(step, form);

  function next() {
    if (!canGo) return;
    if (step < STEP_COUNT - 1) {
      direction = 1;
      step += 1;
    }
  }
  function skip() {
    direction = 1;
    if (step < STEP_COUNT - 1) step += 1;
  }
  function back() {
    if (step > 0) {
      direction = -1;
      step -= 1;
    }
  }

  function toggle<T>(current: T, value: T): T {
    return current === value ? ('' as T) : value;
  }

  function onIdentityKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      next();
    }
  }

  const selectedProductObj = () => products.find((p) => p.slug === form.product);

  async function handleSubmit() {
    if (!canAdvance(STEP_COUNT - 1, form)) return;
    status = 'loading';
    errorMsg = '';
    rateLimitError = false;

    if (!token) await fetchToken();

    try {
      const res = await fetch(`${API_BASE}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(form), token }),
      });

      const resolved = resolveStatus(res.status);
      if (resolved.errorKey === 'token') {
        // Token expirado: renova para permitir novo envio imediato.
        await fetchToken();
        status = 'error';
        errorMsg = t.errorToken[$lang];
        return;
      }
      status = resolved.status;
      if (resolved.errorKey === 'rate') rateLimitError = true;
      if (resolved.errorKey === 'generic') errorMsg = t.errorGeneric[$lang];
    } catch {
      status = 'error';
      errorMsg = t.errorGeneric[$lang];
    }
  }

  function reset() {
    form = { ...defaultForm(), product: selectedProduct };
    step = 0;
    status = 'idle';
    errorMsg = '';
    rateLimitError = false;
    emailTouched = false;
    void fetchToken();
  }
</script>

<div class="wiz">
  {#if status === 'success'}
    <div class="wiz-success" in:fly={{ y: 12, duration: 300 }}>
      <div class="check">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg
        >
      </div>
      <h3>{t.successTitle[$lang]}</h3>
      <p>{t.successBody[$lang]}</p>
      <button class="btn ghost sm" type="button" onclick={reset}>{t.sendAnother[$lang]}</button>
    </div>
  {:else}
    <!-- Honeypot: invisível para humanos, atrai bots. -->
    <div class="hp" aria-hidden="true">
      <label for="wz-website">Website</label>
      <input
        id="wz-website"
        name="website"
        type="text"
        tabindex="-1"
        autocomplete="off"
        bind:value={form.website}
      />
    </div>

    <!-- Progresso -->
    <div class="progress-head">
      <div class="progress-track">
        {#each Array(STEP_COUNT) as _, i}
          <span class="seg" class:done={i < step} class:current={i === step}></span>
        {/each}
      </div>
      <span class="progress-label">
        {t.steps[$lang][step]} · {step + 1} {t.of[$lang]} {STEP_COUNT}
      </span>
    </div>

    {#key step}
      <div class="step" in:fly={{ x: direction * 24, duration: 260, opacity: 0 }}>
        <header class="step-head">
          <h2>{t.q[$lang][step]}</h2>
          <p>{t.sub[$lang][step]}</p>
        </header>

        {#if step === 0}
          <div class="fields">
            <div class="field">
              <label for="wz-name">{t.fields.name[$lang]}</label>
              <input
                id="wz-name"
                type="text"
                autocomplete="name"
                placeholder={t.ph.name[$lang]}
                bind:value={form.name}
                onkeydown={onIdentityKeydown}
              />
            </div>
            <div class="field">
              <label for="wz-email">{t.fields.email[$lang]}</label>
              <input
                id="wz-email"
                type="email"
                autocomplete="email"
                placeholder={t.ph.email[$lang]}
                bind:value={form.email}
                onblur={() => (emailTouched = true)}
                onkeydown={onIdentityKeydown}
                class:invalid={emailInvalid}
              />
              {#if emailInvalid}<span class="err">{t.invalidEmail[$lang]}</span>{/if}
            </div>
            <div class="field">
              <label for="wz-phone">
                {t.fields.phone[$lang]} <span class="opt">({t.fields.optional[$lang]})</span>
              </label>
              <input
                id="wz-phone"
                type="tel"
                autocomplete="tel"
                placeholder={t.ph.phone[$lang]}
                bind:value={form.phone}
                onkeydown={onIdentityKeydown}
              />
            </div>
          </div>
        {:else if step === 1}
          <div class="cards">
            {#each products as p (p.id)}
              <button
                type="button"
                class="opt-card"
                class:sel={form.product === p.slug}
                style="--c: {p.color || 'var(--purple)'}"
                aria-pressed={form.product === p.slug}
                onclick={() => (form.product = toggle(form.product, p.slug))}
              >
                <span class="pdot"></span>
                <span class="oc-body">
                  <span class="oc-title">{productName(p)}</span>
                  {#if productCategory(p)}<span class="oc-hint">{productCategory(p)}</span>{/if}
                </span>
              </button>
            {/each}
            <button
              type="button"
              class="opt-card muted"
              class:sel={form.product === 'other'}
              aria-pressed={form.product === 'other'}
              onclick={() => (form.product = toggle(form.product, 'other'))}
            >
              <span class="oc-body"><span class="oc-title">{t.noneOfThese[$lang]}</span></span>
            </button>
          </div>
        {:else if step === 2}
          <div class="group">
            <span class="group-label">{$lang === 'pt' ? 'Tamanho da equipe' : 'Team size'}</span>
            <div class="cards cols-4">
              {#each teamOptions as o}
                <button
                  type="button"
                  class="opt-card center"
                  class:sel={form.teamSize === o.v}
                  aria-pressed={form.teamSize === o.v}
                  onclick={() => (form.teamSize = toggle(form.teamSize, o.v))}
                >
                  <span class="oc-title">{o.label[$lang]}</span>
                  <span class="oc-hint">{o.hint[$lang]}</span>
                </button>
              {/each}
            </div>
          </div>
          <div class="group">
            <span class="group-label">{$lang === 'pt' ? 'Quando pretende começar?' : 'When do you want to start?'}</span>
            <div class="cards cols-4">
              {#each timelineOptions as o}
                <button
                  type="button"
                  class="opt-card center compact"
                  class:sel={form.timeline === o.v}
                  aria-pressed={form.timeline === o.v}
                  onclick={() => (form.timeline = toggle(form.timeline, o.v))}
                >
                  <span class="oc-title">{o.label[$lang]}</span>
                </button>
              {/each}
            </div>
          </div>
        {:else if step === 3}
          <div class="group">
            <span class="group-label">{$lang === 'pt' ? 'Seu papel' : 'Your role'}</span>
            <div class="cards cols-2">
              {#each roleOptions as r}
                <button
                  type="button"
                  class="opt-card"
                  class:sel={form.role === r}
                  aria-pressed={form.role === r}
                  onclick={() => (form.role = toggle(form.role, r))}
                >
                  <span class="oc-title">{ROLE_LABELS[r][$lang]}</span>
                </button>
              {/each}
            </div>
          </div>
          <div class="field">
            <label for="wz-company">
              {t.fields.company[$lang]} <span class="opt">({t.fields.optional[$lang]})</span>
            </label>
            <input
              id="wz-company"
              type="text"
              autocomplete="organization"
              placeholder={t.ph.company[$lang]}
              bind:value={form.company}
            />
          </div>
        {:else if step === 4}
          <div class="field">
            <label for="wz-message">{t.fields.message[$lang]}</label>
            <textarea
              id="wz-message"
              rows="6"
              placeholder={t.ph.message[$lang]}
              bind:value={form.message}
            ></textarea>
          </div>
        {:else if step === 5}
          <div class="summary">
            <div class="sum-row">
              <span class="sk">{t.review.contact[$lang]}</span>
              <span class="sv">
                {form.name} · {form.email}{form.phone ? ` · ${form.phone}` : ''}
              </span>
            </div>
            <div class="sum-row">
              <span class="sk">{t.review.product[$lang]}</span>
              <span class="sv">
                {#if form.product === 'other'}{t.noneOfThese[$lang]}{:else if selectedProductObj()}{productName(
                    selectedProductObj()!
                  )}{:else}{t.review.empty[$lang]}{/if}
              </span>
            </div>
            <div class="sum-row">
              <span class="sk">{t.review.operation[$lang]}</span>
              <span class="sv">
                {#if form.teamSize || form.timeline}
                  {teamOptions.find((o) => o.v === form.teamSize)?.label[$lang] ?? ''}
                  {form.teamSize && form.timeline ? '·' : ''}
                  {timelineOptions.find((o) => o.v === form.timeline)?.label[$lang] ?? ''}
                {:else}{t.review.empty[$lang]}{/if}
              </span>
            </div>
            <div class="sum-row">
              <span class="sk">{t.review.profile[$lang]}</span>
              <span class="sv">
                {form.role ? ROLE_LABELS[form.role][$lang] : t.review.empty[$lang]}{form.company
                  ? ` · ${form.company}`
                  : ''}
              </span>
            </div>
            <div class="sum-row">
              <span class="sk">{t.review.message[$lang]}</span>
              <span class="sv clamp">{form.message}</span>
            </div>
          </div>

          <label class="consent">
            <input type="checkbox" bind:checked={form.consent} />
            <span>
              {t.lgpdPrefix[$lang]}<a
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer">{t.lgpdLink[$lang]}</a
              >{t.lgpdSuffix[$lang]}
            </span>
          </label>

          {#if rateLimitError}
            <div class="banner" role="alert">{t.errorRate[$lang]}</div>
          {:else if status === 'error' && errorMsg}
            <div class="banner" role="alert">{errorMsg}</div>
          {/if}
        {/if}
      </div>
    {/key}

    <!-- Navegação -->
    <div class="nav">
      <button class="btn ghost sm" type="button" onclick={back} disabled={step === 0}>
        {t.back[$lang]}
      </button>

      <div class="nav-right">
        {#if step > 0 && step < STEP_COUNT - 1 && step !== 4}
          <button class="btn link" type="button" onclick={skip}>{t.skip[$lang]}</button>
        {/if}
        {#if step < STEP_COUNT - 1}
          <button class="btn" type="button" onclick={next} disabled={!canGo}>
            {t.next[$lang]}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="arrow"
              aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg
            >
          </button>
        {:else}
          <button
            class="btn"
            type="button"
            onclick={handleSubmit}
            disabled={!form.consent || status === 'loading'}
          >
            {#if status === 'loading'}
              <span class="spinner" aria-label="Enviando…"></span>
            {:else}
              {t.submit[$lang]}
            {/if}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .wiz {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 30px 32px 26px;
    display: flex;
    flex-direction: column;
    min-height: 460px;
  }

  .hp {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  /* Progresso */
  .progress-head {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 26px;
  }
  .progress-track {
    display: flex;
    gap: 6px;
  }
  .seg {
    flex: 1;
    height: 4px;
    border-radius: 4px;
    background: var(--line);
    transition: background 0.3s ease;
  }
  .seg.done {
    background: var(--purple);
  }
  .seg.current {
    background: linear-gradient(90deg, var(--purple), var(--pink));
  }
  .progress-label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  .step {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .step-head h2 {
    font-size: clamp(20px, 2.4vw, 26px);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--venom);
    line-height: 1.15;
  }
  .step-head p {
    margin-top: 6px;
    font-size: 13.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* Campos */
  .fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .field label .opt {
    text-transform: none;
    letter-spacing: 0;
    color: var(--text-faint);
  }
  .field input,
  .field textarea {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 14.5px;
    color: var(--venom);
    outline: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .field input:focus,
  .field textarea:focus {
    border-color: var(--purple);
    box-shadow: 0 0 0 4px var(--accent-soft);
  }
  .field input.invalid {
    border-color: var(--pink);
  }
  .field textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.5;
  }
  .err {
    font-size: 12px;
    color: var(--pink);
  }

  /* Grupos e cards de opção */
  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .group-label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .cards.cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  .cards.cols-2 {
    grid-template-columns: 1fr 1fr;
  }

  .opt-card {
    --c: var(--purple);
    display: flex;
    align-items: center;
    gap: 11px;
    text-align: left;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 14px;
    cursor: pointer;
    font-family: inherit;
    transition:
      border-color 0.14s,
      background 0.14s,
      transform 0.08s;
  }
  .opt-card:hover {
    border-color: color-mix(in srgb, var(--c) 45%, var(--line));
  }
  .opt-card:active {
    transform: scale(0.985);
  }
  .opt-card.center {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }
  .opt-card.compact {
    padding: 12px 14px;
  }
  .opt-card.sel {
    border-color: var(--c);
    background: color-mix(in srgb, var(--c) 8%, var(--bg-elev));
  }
  .opt-card.muted .oc-title {
    color: var(--text-muted);
  }
  .oc-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .oc-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--venom);
  }
  .oc-hint {
    font-size: 12px;
    color: var(--text-faint);
  }
  .pdot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
    flex-shrink: 0;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 14%, transparent);
  }

  /* Revisão */
  .summary {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }
  .sum-row {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
  }
  .sum-row:last-child {
    border-bottom: 0;
  }
  .sk {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
    padding-top: 2px;
  }
  .sv {
    font-size: 13.5px;
    color: var(--venom);
    line-height: 1.5;
    word-break: break-word;
  }
  .sv.clamp {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .consent {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.5;
    cursor: pointer;
  }
  .consent input {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: var(--purple);
    cursor: pointer;
  }
  .consent a {
    color: var(--purple);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .banner {
    background: var(--hot-soft, rgba(231, 31, 132, 0.08));
    color: var(--pink);
    border: 1px solid color-mix(in srgb, var(--pink) 40%, transparent);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
  }

  /* Navegação */
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
  }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 11px 22px;
    border-radius: 9px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
    border: none;
    background: #060606;
    color: #fff;
    text-decoration: none;
  }
  .btn:hover {
    opacity: 0.88;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn.ghost {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--venom);
  }
  .btn.ghost:hover {
    border-color: var(--text-muted);
    opacity: 1;
  }
  .btn.ghost:disabled {
    opacity: 0.4;
  }
  .btn.link {
    background: transparent;
    color: var(--text-faint);
    padding: 11px 12px;
  }
  .btn.link:hover {
    color: var(--text-muted);
    opacity: 1;
  }
  .btn.sm {
    padding: 8px 16px;
    font-size: 13px;
  }
  .arrow {
    transition: transform 0.15s;
  }
  .btn:hover .arrow {
    transform: translateX(3px);
  }

  .spinner {
    display: inline-block;
    width: 15px;
    height: 15px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Sucesso */
  .wiz-success {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
  }
  .wiz-success .check {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: var(--pos-soft);
    color: var(--pos-deep);
    display: grid;
    place-items: center;
  }
  .wiz-success h3 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--venom);
  }
  .wiz-success p {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
    max-width: 34ch;
  }

  @media (max-width: 560px) {
    .wiz {
      padding: 24px 20px;
    }
    .cards.cols-4 {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
