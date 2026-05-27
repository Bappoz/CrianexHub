<script lang="ts">
  import { goto } from '$app/navigation';
  import { onDestroy, onMount, tick } from 'svelte';
  import { ApiError, apiFetch } from '$lib/api/backend';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  type LoginStage = 'credentials' | 'setup' | 'mfa';

  type MfaStatus = {
    hasAnyFactor: boolean;
    hasVerifiedFactor: boolean;
    pendingFactorId: string | null;
    verifiedFactorId: string | null;
  };

  type MfaEnrollment = {
    id: string;
    type: 'totp';
    friendly_name?: string;
    totp: {
      qr_code: string;
      secret: string;
      uri: string;
    };
  };

  type LoginResponse = {
    mfa_required: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      name: string;
      role: string;
    };
    factorId?: string | null;
  };

  type VerifyResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      role: string;
    };
  };

  const MFA_DIGITS = 6;
  const ENROLLMENT_STORAGE_KEY = 'crianex-admin-login-mfa-enrollment';

  let stage = $state<LoginStage>('credentials');
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let verifyingMfa = $state(false);
  let setupLoading = $state(false);
  let errorMessage = $state('');
  let submitHovered = $state(false);
  let mfaDigits = $state<string[]>(Array.from({ length: MFA_DIGITS }, () => ''));
  let mfaCountdown = $state(30);
  let showCountdown = $state(false);
  let mfaAccessToken = $state('');
  let mfaEnrollFactorId = $state('');
  let mfaQrCode = $state('');
  let mfaSecret = $state('');
  let mfaUri = $state('');
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  function clearCountdownTimer() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function resetMfaState() {
    clearCountdownTimer();
    showCountdown = false;
    mfaCountdown = 30;
    mfaDigits = Array.from({ length: MFA_DIGITS }, () => '');
    mfaAccessToken = '';
    mfaEnrollFactorId = '';
    mfaQrCode = '';
    mfaSecret = '';
    mfaUri = '';
  }

  function persistEnrollment(enrollment: MfaEnrollment) {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(enrollment));
  }

  function restoreEnrollment(): boolean {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }

    const rawValue = sessionStorage.getItem(ENROLLMENT_STORAGE_KEY);

    if (!rawValue) {
      return false;
    }

    try {
      const enrollment = JSON.parse(rawValue) as MfaEnrollment;

      if (!enrollment?.id || enrollment.type !== 'totp' || !enrollment.totp?.qr_code) {
        sessionStorage.removeItem(ENROLLMENT_STORAGE_KEY);
        return false;
      }

      stage = 'setup';
      mfaEnrollFactorId = enrollment.id;
      mfaQrCode = enrollment.totp.qr_code;
      mfaSecret = enrollment.totp.secret;
      mfaUri = enrollment.totp.uri;
      return true;
    } catch {
      sessionStorage.removeItem(ENROLLMENT_STORAGE_KEY);
      return false;
    }
  }

  function clearEnrollmentStorage() {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(ENROLLMENT_STORAGE_KEY);
  }

  function applyEnrollment(enrollment: MfaEnrollment) {
    stage = 'setup';
    mfaEnrollFactorId = enrollment.id;
    mfaQrCode = enrollment.totp.qr_code;
    mfaSecret = enrollment.totp.secret;
    mfaUri = enrollment.totp.uri;
    persistEnrollment(enrollment);
  }

  async function startEnrollment(friendlyName: string) {
    if (setupLoading) {
      return;
    }

    setupLoading = true;
    errorMessage = '';

    try {
      const enrollment = await apiFetch<MfaEnrollment>('/api/auth/mfa/enroll', {
        method: 'POST',
        body: JSON.stringify({ friendlyName: friendlyName || 'Crianex Admin' }),
      });

      applyEnrollment(enrollment);
      await tick();
    } catch (error) {
      errorMessage = error instanceof ApiError ? error.message : 'Não foi possível gerar o QR code.';
    } finally {
      setupLoading = false;
    }
  }

  function focusCodeInput(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.code-input input'));
    const target = inputs[index];

    target?.focus();
    target?.select();
  }

  function startCountdown() {
    clearCountdownTimer();
    showCountdown = true;
    mfaCountdown = 30;

    countdownTimer = setInterval(() => {
      if (mfaCountdown <= 1) {
        clearCountdownTimer();
        mfaCountdown = 0;
        return;
      }

      mfaCountdown -= 1;
    }, 1000);
  }

  async function returnToCredentials() {
    stage = 'credentials';
    errorMessage = '';
    resetMfaState();
    await tick();
  }

  async function handleLoginSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (loading || stage !== 'credentials') {
      return;
    }

    errorMessage = '';
    loading = true;

    try {
      const response = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (response.mfa_required) {
        stage = 'mfa';
        mfaAccessToken = response.accessToken;
        resetMfaState();
        mfaAccessToken = response.accessToken;

        await tick();
        focusCodeInput(0);
        return;
      }

      const status = await apiFetch<MfaStatus>('/api/auth/mfa/status');

      if (status.hasVerifiedFactor) {
        clearEnrollmentStorage();
        await goto('/admin');
        return;
      }

      if (!restoreEnrollment()) {
        await startEnrollment(response.user.name);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        errorMessage = error.status === 401 ? 'E-mail ou senha inválidos.' : error.message;
      } else {
        errorMessage = 'Não foi possível conectar ao serviço de autenticação agora.';
      }
    } finally {
      loading = false;
    }
  }

  async function submitMfaCode(codeOverride?: string) {
    if (verifyingMfa || stage !== 'mfa') {
      return;
    }

    const code = (codeOverride ?? mfaDigits.join('')).trim();

    if (code.length !== MFA_DIGITS) {
      return;
    }

    verifyingMfa = true;
    errorMessage = '';

    try {
      const endpoint = mfaEnrollFactorId ? '/api/auth/mfa/enroll/verify' : '/api/auth/mfa/verify';

      await apiFetch<VerifyResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(
          mfaEnrollFactorId
            ? {
                factorId: mfaEnrollFactorId,
                code,
              }
            : {
                accessToken: mfaAccessToken,
                code,
              }
        ),
      });

      clearEnrollmentStorage();
      await goto('/admin');
    } catch (error) {
      mfaDigits = Array.from({ length: MFA_DIGITS }, () => '');
      if (error instanceof ApiError && error.reason === 'expired') {
        startCountdown();
      } else {
        clearCountdownTimer();
        showCountdown = false;
        mfaCountdown = 30;
      }
      errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível validar o código. Tente novamente.';

      await tick();
      focusCodeInput(0);
    } finally {
      verifyingMfa = false;
    }
  }

  function updateMfaDigit(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const nextDigits = [...mfaDigits];

    nextDigits[index] = digit;
    mfaDigits = nextDigits;
    errorMessage = '';

    if (digit && index < MFA_DIGITS - 1) {
      void tick().then(() => focusCodeInput(index + 1));
    }

    if (nextDigits.every((value) => value.length === 1)) {
      void submitMfaCode(nextDigits.join(''));
    }
  }

  function handleMfaKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      if (mfaDigits[index]) {
        const nextDigits = [...mfaDigits];
        nextDigits[index] = '';
        mfaDigits = nextDigits;
        return;
      }

      if (index > 0) {
        event.preventDefault();
        const nextDigits = [...mfaDigits];
        nextDigits[index - 1] = '';
        mfaDigits = nextDigits;
        focusCodeInput(index - 1);
      }

      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusCodeInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < MFA_DIGITS - 1) {
      event.preventDefault();
      focusCodeInput(index + 1);
    }
  }

  function handleMfaPaste(index: number, event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, MFA_DIGITS - index).split('');

    if (!digits.length) {
      return;
    }

    event.preventDefault();

    const nextDigits = [...mfaDigits];

    digits.forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });

    mfaDigits = nextDigits;

    const nextIndex = Math.min(index + digits.length, MFA_DIGITS - 1);

    void tick().then(() => focusCodeInput(nextIndex));

    if (nextDigits.every((value) => value.length === 1)) {
      void submitMfaCode(nextDigits.join(''));
    }
  }

  onMount(async () => {
    if (restoreEnrollment()) {
      return;
    }

    try {
      await apiFetch('/api/auth/refresh', {
        method: 'POST',
      });

      await goto('/admin');
    } catch {
      // A tela deve renderizar mesmo quando ainda nao ha uma sessao ativa.
    }
  });

  onDestroy(() => {
    clearCountdownTimer();
  });
</script>

<div class="admin-root">
  <main class="login-page" aria-label="Login administrativo da Crianex">
    <section class="login-side" aria-labelledby="login-title">
      <div class="deco" aria-hidden="true"></div>

      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span>Crianex Hub</span>
      </div>

      <div class="hero-copy">
        <span class="tag">Área restrita</span>
        <h1 id="login-title">Painel interno de gestão Crianex.</h1>
        <p>
          Plataforma compartilhada por produto, comercial, suporte e engenharia para auditoria de
          toda ação privilegiada.
        </p>
      </div>

      <blockquote>
        "Operação boa é aquela que deixa rastros claros antes de pedir confiança."
      </blockquote>
    </section>

    <section class="login-form-wrap" aria-labelledby="form-title">
      <div class="login-form">
        <div class="login-header">
          {#if stage === 'credentials'}
            <h2 id="form-title">Entrar no painel</h2>
            <p>Entre com as suas credenciais de acesso ao painel administrativo.</p>
          {:else if stage === 'setup'}
            <h2 id="form-title">Ativar autenticador</h2>
            <p>Escaneie o QR code abaixo com qualquer app compatível com TOTP antes de seguir.</p>
          {:else}
            <h2 id="form-title">Verificação em duas etapas</h2>
            <p>Digite o código TOTP de 6 dígitos gerado no seu aplicativo autenticador.</p>
          {/if}
        </div>

        {#if stage === 'credentials'}
          <Button
            class="workspace-button"
            variant="outline"
            type="button"
            disabled={loading}
            style="background-color: transparent; color: #ffffff; border-color: #ffffff; box-shadow: none;"
          >
            <img class="google-logo" src="/assets/logo-google.png" alt="" aria-hidden="true" />
            Entrar com Google Workspace
          </Button>

          <div class="divider" aria-hidden="true">
            <span></span>
            <p>ou com senha</p>
            <span></span>
          </div>

          <form class="form-fields" onsubmit={handleLoginSubmit}>
            <div class="field">
              <Label for="admin-email">E-mail corporativo</Label>
              <Input
                class="login-input"
                id="admin-email"
                type="email"
                placeholder="voce@gmail.com.br"
                autocomplete="email"
                bind:value={email}
                disabled={loading}
                required
              />
            </div>

            <div class="field">
              <div class="label-row">
                <Label for="admin-password">Senha</Label>
                <a href="/admin/login" aria-label="Recuperar senha">Esqueci</a>
              </div>
              <Input
                class="login-input"
                id="admin-password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                bind:value={password}
                disabled={loading}
                required
              />
            </div>

            <button
              class="submit-button"
              style={`background-color: ${submitHovered ? '#7f3fe5' : '#ffffff'}; color: ${submitHovered ? '#ffffff' : '#101010'}; border: none;`}
              type="submit"
              disabled={loading}
              onmouseenter={() => (submitHovered = true)}
              onmouseleave={() => (submitHovered = false)}
            >
              {#if loading}
                <span class="spinner" aria-hidden="true"></span>
                Entrando
              {:else}
                Continuar
                <span aria-hidden="true">→</span>
              {/if}
            </button>
          </form>
        {:else}
          {#if stage === 'setup'}
            <div class="mfa-setup" aria-live="polite">
              <div class="mfa-setup-copy">
                <p class="mfa-setup-lead">
                  Abra o app autenticador de sua preferência, escaneie o QR code e depois avance para
                  digitar o código gerado.
                </p>

                <div class="mfa-setup-qr" aria-label="QR code para vincular o aplicativo autenticador">
                  <img src={mfaQrCode} alt={mfaUri} />
                </div>

                <div class="mfa-secret">
                  <span>Secret</span>
                  <code>{mfaSecret}</code>
                </div>

                <button class="submit-button" type="button" onclick={async () => {
                  stage = 'mfa';
                  await tick();
                  focusCodeInput(0);
                }}>
                  Já escaneei, continuar
                  <span aria-hidden="true">→</span>
                </button>

                <button class="mfa-back" type="button" onclick={() => {
                  stage = 'credentials';
                  errorMessage = '';
                  resetMfaState();
                  clearEnrollmentStorage();
                }}>
                  Voltar para as credenciais
                </button>
              </div>
            </div>
          {:else}
          <div class="mfa-step" aria-live="polite">
            <div class="code-inputs" role="group" aria-label="Código de autenticação de seis dígitos">
              {#each mfaDigits as digit, index}
                <div class="code-input">
                  <input
                    type="text"
                    inputmode="numeric"
                    autocomplete={index === 0 ? 'one-time-code' : 'off'}
                    maxlength="1"
                    value={digit}
                    disabled={verifyingMfa}
                    oninput={(event) => updateMfaDigit(index, (event.currentTarget as HTMLInputElement).value)}
                    onkeydown={(event) => handleMfaKeydown(index, event)}
                    onpaste={(event) => handleMfaPaste(index, event)}
                  />
                </div>
              {/each}
            </div>

            <p class="mfa-hint">Os códigos mudam a cada 30 segundos.</p>

            {#if showCountdown}
              <p class="mfa-countdown" role="status">Novo código em {mfaCountdown}s</p>
            {/if}

            <div class="mfa-actions">
              <button
                class="submit-button"
                style={`background-color: ${submitHovered ? '#7f3fe5' : '#ffffff'}; color: ${submitHovered ? '#ffffff' : '#101010'}; border: none;`}
                type="button"
                disabled={verifyingMfa}
                onmouseenter={() => (submitHovered = true)}
                onmouseleave={() => (submitHovered = false)}
                onclick={() => submitMfaCode()}
              >
                {#if verifyingMfa}
                  <span class="spinner" aria-hidden="true"></span>
                  Validando
                {:else}
                  Verificar código
                  <span aria-hidden="true">→</span>
                {/if}
              </button>

              <button class="mfa-back" type="button" onclick={returnToCredentials} disabled={verifyingMfa}>
                Voltar para senha
              </button>
            </div>
          </div>
          {/if}
        {/if}

        {#if errorMessage}
          <p class="error-message" role="alert">{errorMessage}</p>
        {/if}

        <div class="security-note">
          <span aria-hidden="true">▢</span>
          <p>
            Tentativas de acesso são auditadas. IPs fora da faixa corporativa precisam de aprovação
            adicional.
          </p>
        </div>
      </div>
    </section>
  </main>
</div>

<style>
  :global(:root) {
    --accent-soft: rgba(127, 63, 229, 0.18);
    --background: #060606;
    --foreground: #fcfcfc;
    --primary: #fcfcfc;
    --primary-foreground: #060606;
    --secondary: #1a1a1d;
    --secondary-foreground: #fcfcfc;
    --muted: #1a1a1d;
    --muted-foreground: rgba(252, 252, 252, 0.58);
    --border: rgba(252, 252, 252, 0.13);
    --input: rgba(252, 252, 252, 0.13);
    --ring: var(--purple);
    --destructive: var(--pink);
    --radius-md: 0.5rem;
  }

  :global(body) {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    margin: 0;
  }

  .admin-root {
    background: #060606;
    color: #fcfcfc;
    font-family: 'Space Grotesk', system-ui, sans-serif;
  }

  .login-page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(360px, 0.92fr);
    background: #0b0b0d;
    font-family: 'Space Grotesk', system-ui, sans-serif;
  }

  .login-side {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 56px;
    padding: clamp(28px, 5vw, 56px);
    background: var(--venom);
  }

  .deco {
    position: absolute;
    inset: -18% -12% auto auto;
    width: min(680px, 86vw);
    aspect-ratio: 1;
    background:
      radial-gradient(circle at 30% 25%, rgba(231, 31, 132, 0.44), transparent 28%),
      radial-gradient(circle at 67% 42%, rgba(127, 63, 229, 0.46), transparent 32%),
      radial-gradient(circle at 54% 80%, rgba(102, 223, 122, 0.25), transparent 24%);
    filter: blur(54px);
    opacity: 0.85;
    pointer-events: none;
  }

  .brand,
  .hero-copy,
  blockquote {
    position: relative;
    z-index: 1;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 700;
  }

  .brand-mark {
    width: 20px;
    height: 18px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3px;
    transform: skewX(-10deg);
  }

  .brand-mark span:nth-child(1),
  .brand-mark span:nth-child(4) {
    background: var(--pink);
  }

  .brand-mark span:nth-child(2) {
    background: var(--green);
  }

  .brand-mark span:nth-child(3) {
    background: var(--purple);
  }

  .hero-copy {
    max-width: 440px;
  }

  .tag,
  :global(.field label),
  .divider {
    font-family: var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .tag {
    display: block;
    margin-bottom: 22px;
    color: rgba(252, 252, 252, 0.48);
    font-size: 11px;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    max-width: 12ch;
    font-size: clamp(38px, 5.5vw, 64px);
    line-height: 0.98;
    font-weight: 700;
  }

  .hero-copy p {
    max-width: 42ch;
    margin-top: 28px;
    color: rgba(252, 252, 252, 0.62);
    font-size: 14px;
    line-height: 1.7;
  }

  blockquote {
    max-width: 46ch;
    margin: 0;
    color: rgba(252, 252, 252, 0.54);
    font-size: 13px;
    line-height: 1.65;
  }

  .login-form-wrap {
    display: grid;
    place-items: center;
    padding: clamp(28px, 6vw, 64px);
    background: #0a0a0c;
    color: #fcfcfc;
  }

  .login-form {
    width: min(100%, 380px);
    display: grid;
    gap: 22px;
  }

  .mfa-step {
    display: grid;
    gap: 18px;
  }

  .mfa-setup {
    display: grid;
    gap: 18px;
  }

  .mfa-setup-copy {
    display: grid;
    gap: 14px;
  }

  .mfa-setup-lead {
    color: rgba(252, 252, 252, 0.72);
    font-size: 14px;
    line-height: 1.55;
  }

  .mfa-setup-qr {
    display: grid;
    place-items: center;
    padding: 16px;
    border-radius: 18px;
    background: #ffffff;
  }

  .mfa-setup-qr img {
    width: min(100%, 220px);
    display: block;
  }

  .mfa-secret {
    display: grid;
    gap: 8px;
  }

  .mfa-secret span {
    color: rgba(252, 252, 252, 0.52);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .mfa-secret code {
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(252, 252, 252, 0.1);
    background: rgba(252, 252, 252, 0.04);
    color: #fcfcfc;
    font-family: var(--font-mono);
    font-size: 12px;
    word-break: break-all;
  }

  .code-inputs {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .code-input {
    min-width: 0;
  }

  :global(.code-input input) {
    width: 100%;
    min-width: 0;
    height: 48px;
    border-radius: 10px;
    border: 1px solid rgba(252, 252, 252, 0.22);
    background: rgba(252, 252, 252, 0.04);
    color: #fcfcfc;
    font-family: var(--font-mono);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-align: center;
    outline: none;
    caret-color: #fcfcfc;
  }

  :global(.code-input input::placeholder) {
    color: rgba(252, 252, 252, 0.28);
  }

  :global(.code-input input:focus-visible) {
    border-color: #7f3fe5 !important;
    box-shadow: 0 0 0 4px rgba(127, 63, 229, 0.18);
  }

  .mfa-hint,
  .mfa-countdown {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
  }

  .mfa-hint {
    color: rgba(252, 252, 252, 0.58);
  }

  .mfa-countdown {
    color: #7f3fe5;
    font-weight: 700;
  }

  .mfa-actions {
    display: grid;
    gap: 10px;
  }

  .mfa-back {
    background: transparent;
    border: 0;
    color: rgba(252, 252, 252, 0.72);
    font-family: var(--font-sans);
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .login-header {
    display: grid;
    gap: 10px;
  }

  h2 {
    font-size: 26px;
    line-height: 1.1;
    font-weight: 700;
  }

  .login-header p {
    color: rgba(252, 252, 252, 0.62);
    font-size: 14px;
    line-height: 1.55;
  }

  :global(.workspace-button),
  :global(.submit-button) {
    width: 100%;
    min-height: 48px;
    border-radius: 999px;
    font-family: var(--font-sans);
    font-size: 14px;
  }

  :global(.workspace-button) {
    box-shadow: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  :global(.workspace-button:hover) {
    background-color: transparent;
    color: #ffffff;
    box-shadow: none;
  }

  .google-logo {
    width: 18px;
    height: 18px;
    display: block;
    flex: 0 0 auto;
    object-fit: contain;
  }

  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    color: rgba(16, 16, 16, 0.42);
    font-size: 10px;
  }

  .divider span {
    height: 1px;
    background: rgba(16, 16, 16, 0.12);
  }

  .form-fields {
    display: grid;
    gap: 16px;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  :global(.field label) {
    color: rgba(252, 252, 252, 0.62);
    font-size: 10px;
    font-weight: 700;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .label-row a {
    color: #7f3fe5;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }

  :global(.login-input) {
    height: 44px;
    border-radius: 8px;
    border-color: rgba(252, 252, 252, 0.62) !important;
    background: transparent !important;
    color: rgba(252, 252, 252, 0.62);
    font-family: var(--font-sans);
    font-size: 14px;
    padding-left: 16px;
    outline: none;
    caret-color: #fcfcfc;
    -webkit-text-fill-color: rgba(252, 252, 252, 0.62);
  }

  :global(.login-input::placeholder) {
    color: rgba(252, 252, 252, 0.38);
  }

  :global(.login-input:focus) {
    background: transparent !important;
  }

  :global(.login-input:focus),
  :global(.login-input:focus-visible),
  :global(.code-input input:focus-visible) {
    border-color: #7f3fe5 !important;
    box-shadow: 0 0 0 4px rgba(127, 63, 229, 0.18);
  }

  :global(.login-input:-webkit-autofill),
  :global(.login-input:-webkit-autofill:hover),
  :global(.login-input:-webkit-autofill:focus),
  :global(.login-input:-webkit-autofill:active) {
    -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
    box-shadow: 0 0 0 1000px transparent inset !important;
    -webkit-text-fill-color: rgba(252, 252, 252, 0.62) !important;
    caret-color: #fcfcfc;
    transition: background-color 9999s ease-out 0s;
  }

  :global(.submit-button) {
    margin-top: 2px;
    border: none !important;
    background: #ffffff !important;
    color: #101010 !important;
    font-weight: 600;
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
  }

  :global(button.submit-button:hover) {
    background: #7f3fe5 !important;
    color: #ffffff !important;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    border: 2px solid rgba(255, 255, 255, 0.34);
    border-top-color: #ffffff;
    animation: spin 0.8s linear infinite;
  }

  .error-message {
    color: var(--pink);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
  }

  .security-note {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    border: 1px solid rgba(16, 16, 16, 0.08);
    border-radius: 8px;
    background: rgba(16, 16, 16, 0.06);
    color: rgba(16, 16, 16, 0.62);
    font-size: 12px;
    line-height: 1.45;
  }

  .security-note span {
    color: rgba(16, 16, 16, 0.5);
    line-height: 1.2;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 820px) {
    .login-page {
      grid-template-columns: 1fr;
    }

    .login-side {
      min-height: 220px;
      gap: 28px;
      padding: 28px;
    }

    .hero-copy p,
    blockquote {
      display: none;
    }

    h1 {
      font-size: 38px;
    }

    .login-form-wrap {
      place-items: start center;
      min-height: calc(100vh - 220px);
      padding: 32px 20px;
    }
  }

  @media (max-width: 420px) {
    .brand {
      font-size: 14px;
    }

    h1 {
      font-size: 34px;
    }

    .login-form {
      gap: 18px;
    }

    .code-inputs {
      gap: 8px;
    }

    :global(.code-input input) {
      font-size: 18px;
    }
  }
</style>
