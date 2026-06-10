<script lang="ts">
  import { page } from '$app/stores';
  import {
    Package,
    CircleQuestionMark,
    Users,
    ChartBar,
    LayoutDashboard,
    Ticket,
  } from 'lucide-svelte';

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'bom dia,';
    if (h < 18) return 'boa tarde,';
    return 'boa noite,';
  }

  function getFormattedDate() {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  $: adminUser = $page.data?.adminUser;
  $: firstName = (adminUser?.name ?? 'Admin').split(' ')[0];
  $: displayRole = adminUser?.display_role ?? adminUser?.role ?? 'Membro';

  function canView(module: string): boolean {
    if (!adminUser) return false;
    if (adminUser.role === 'owner') return true;
    const p = adminUser.permissions?.[module];
    return Array.isArray(p) && p.includes('v');
  }

  const ALL_MODULES = [
    {
      id: 'products',
      label: 'Produtos',
      href: '/admin/products',
      color: 'var(--pink)',
      icon: Package,
    },
    {
      id: 'faq',
      label: 'Gestão FAQ',
      href: '/admin/gestao-faq',
      color: 'var(--purple)',
      icon: CircleQuestionMark,
    },
    { id: 'members', label: 'Membros', href: '/admin/membros', color: 'var(--green)', icon: Users },
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/nao-implementado',
      color: 'var(--green)',
      icon: LayoutDashboard,
    },
    {
      id: 'crm',
      label: 'CRM · Leads',
      href: '/nao-implementado',
      color: 'var(--purple)',
      icon: Users,
    },
    {
      id: 'finance',
      label: 'Financeiro',
      href: '/nao-implementado',
      color: 'var(--pink)',
      icon: ChartBar,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      href: '/nao-implementado',
      color: 'var(--purple)',
      icon: Ticket,
    },
  ];

  $: visibleModules = ALL_MODULES.filter((m) => canView(m.id));

  const greeting = getGreeting();
  const dateStr = getFormattedDate();
</script>

<div class="painel-root">
  <!-- Decorative SVG background element -->
  <div class="deco-wrap" aria-hidden="true">
    <svg viewBox="0 0 90 80" class="deco-svg">
      <polygon fill="#E71F84" points="5,5 33,5 45,37 17,37" />
      <polygon fill="#66DF7A" points="57,5 85,5 73,37 45,37" />
      <polygon fill="#FCFCFC" points="17,43 45,43 33,75 5,75" />
      <polygon fill="#7F3FE5" points="45,43 73,43 85,75 57,75" />
    </svg>
  </div>

  <!-- Secondary deco: small mirrored instance top-left -->
  <div class="deco-sm" aria-hidden="true">
    <svg viewBox="0 0 90 80" class="deco-svg-sm">
      <polygon fill="#E71F84" points="5,5 33,5 45,37 17,37" />
      <polygon fill="#66DF7A" points="57,5 85,5 73,37 45,37" />
      <polygon fill="#FCFCFC" points="17,43 45,43 33,75 5,75" />
      <polygon fill="#7F3FE5" points="45,43 73,43 85,75 57,75" />
    </svg>
  </div>

  <div class="content">
    <!-- Meta strip -->
    <div class="meta-strip">
      <span class="mono label-xs">crianex · painel administrativo</span>
      <span class="mono label-xs date-label">{dateStr}</span>
    </div>

    <!-- Greeting -->
    <div class="greeting-block">
      <p class="greeting-sub">{greeting}</p>
      <h1 class="greeting-name">{firstName.toUpperCase()}.</h1>
    </div>

    <!-- Role + separator -->
    <div class="role-row">
      <span class="role-badge">{displayRole}</span>
      <span class="role-sep"></span>
    </div>

    <!-- Quick-access tiles -->
    {#if visibleModules.length > 0}
      <div class="tiles-section">
        <span class="mono label-xs tiles-label">acesso rápido</span>
        <div class="tiles-grid">
          {#each visibleModules as mod (mod.id)}
            <a href={mod.href} class="tile" style="--accent: {mod.color}">
              <span class="tile-icon">
                <svelte:component this={mod.icon} size={15} />
              </span>
              <span class="tile-label">{mod.label}</span>
            </a>
          {/each}
        </div>
      </div>
    {:else}
      <p class="no-access">Nenhum módulo disponível para este perfil.</p>
    {/if}
  </div>
</div>

<style>
  .painel-root {
    position: relative;
    flex: 1;
    min-height: calc(100dvh - 56px);
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 56px 72px;
  }

  /* ── Background SVGs ── */
  .deco-wrap {
    position: absolute;
    right: -100px;
    bottom: -120px;
    pointer-events: none;
    opacity: 0.055;
    rotate: 12deg;
  }
  .deco-svg {
    width: 580px;
    height: 520px;
  }

  .deco-sm {
    position: absolute;
    left: -30px;
    top: -40px;
    pointer-events: none;
    opacity: 0.025;
    rotate: -8deg;
  }
  .deco-svg-sm {
    width: 220px;
    height: 200px;
  }

  /* ── Content ── */
  .content {
    position: relative;
    z-index: 1;
    max-width: 760px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Meta strip ── */
  .meta-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 52px;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .label-xs {
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  /* ── Greeting ── */
  .greeting-block {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 20px;
  }

  .greeting-sub {
    font-size: clamp(18px, 2.5vw, 24px);
    font-weight: 300;
    color: var(--text-muted);
    margin: 0;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .greeting-name {
    font-size: clamp(52px, 9vw, 112px);
    font-weight: 900;
    letter-spacing: -0.045em;
    color: var(--text);
    margin: 0;
    line-height: 0.92;
  }

  /* ── Role row ── */
  .role-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 52px;
    margin-top: 18px;
  }

  .role-badge {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 4px 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .role-sep {
    flex: 1;
    max-width: 280px;
    height: 1px;
    background: linear-gradient(to right, var(--line), transparent);
  }

  /* ── Tiles ── */
  .tiles-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tiles-label {
    font-weight: 600;
  }

  .tiles-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tile {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    transition:
      background 0.14s,
      box-shadow 0.14s,
      border-color 0.14s;
    white-space: nowrap;
  }

  .tile:hover {
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-elev));
    box-shadow: 0 0 0 1px var(--accent);
    border-color: var(--accent);
  }

  .tile-icon {
    color: var(--accent);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .tile-label {
    color: var(--text);
  }

  /* ── No access ── */
  .no-access {
    font-size: 13px;
    color: var(--text-faint);
    font-style: italic;
  }

  /* ── Responsive ── */
  @media (max-width: 820px) {
    .painel-root {
      padding: 36px 24px;
      align-items: flex-start;
    }
    .date-label {
      display: none;
    }
    .deco-svg {
      width: 360px;
      height: 320px;
    }
    .deco-wrap {
      right: -60px;
      bottom: -80px;
    }
  }

  @media (max-width: 480px) {
    .greeting-name {
      font-size: 48px;
    }
    .tile {
      padding: 8px 14px;
      font-size: 12px;
    }
  }
</style>
