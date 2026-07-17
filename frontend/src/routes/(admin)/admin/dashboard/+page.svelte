<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Download from 'lucide-svelte/icons/download';
  import Lock from 'lucide-svelte/icons/lock';
  import type { PageData } from './$types';
  import { RANGES } from '$lib/mocks/dashboard';
  import StatCard from '$lib/components/admin/dashboard/StatCard.svelte';
  import AreaChart from '$lib/components/admin/dashboard/AreaChart.svelte';
  import FunnelBars from '$lib/components/admin/dashboard/FunnelBars.svelte';
  import Donut from '$lib/components/admin/dashboard/Donut.svelte';
  import TopList from '$lib/components/admin/dashboard/TopList.svelte';
  import ActivityFeed from '$lib/components/admin/dashboard/ActivityFeed.svelte';
  import SystemHealth from '$lib/components/admin/dashboard/SystemHealth.svelte';

  export let data: PageData;

  $: d = data.forbidden ? null : data.dashboard;

  function setRange(id: string) {
    const u = new URL($page.url);
    u.searchParams.set('range', id);
    goto(u, { keepFocus: true, noScroll: true, invalidateAll: true });
  }

  function exportCsv() {
    if (!d) return;
    const rows = [
      ['periodo', 'receita', 'leads'],
      ...d.timeseries.map((p) => [p.t, p.receita, p.leads]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crianex-dashboard-${d.range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updatedLabel(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso)
    );
  }
</script>

<svelte:head><title>Dashboard · Crianex Admin</title></svelte:head>

{#if data.forbidden}
  <div class="dash">
    <div class="forbidden">
      <span class="fico"><Lock size={22} /></span>
      <h2>Sem acesso ao Dashboard</h2>
      <p>
        Seu perfil não tem permissão de visualização para este módulo. Fale com um administrador.
      </p>
    </div>
  </div>
{:else if d}
  <div class="dash">
    <!-- Header -->
    <header class="dash-head">
      <div class="dh-left">
        <h1>Dashboard</h1>
        <span class="dh-sub">
          Visão geral · {d.periodLabel} · atualizado às {updatedLabel(d.updatedAt)}
        </span>
      </div>
      <div class="dh-right">
        <div class="range-seg" role="tablist" aria-label="Intervalo de tempo">
          {#each RANGES as r (r.id)}
            <button
              role="tab"
              aria-selected={d.range === r.id}
              class:on={d.range === r.id}
              on:click={() => setRange(r.id)}>{r.label}</button
            >
          {/each}
        </div>
        <button class="export-btn" on:click={exportCsv} title="Exportar CSV">
          <Download size={14} /> <span>Exportar</span>
        </button>
      </div>
    </header>

    <!-- KPIs -->
    <section class="kpi-grid stagger">
      {#each d.kpis as kpi (kpi.id)}
        <StatCard {kpi} positiveIsGood={kpi.id !== 'tickets'} />
      {/each}
    </section>

    <!-- Main chart -->
    <section class="fade" style="animation-delay:120ms">
      <AreaChart data={d.timeseries} />
    </section>

    <!-- Funnel + Sources -->
    <section class="grid-2 fade" style="animation-delay:180ms">
      <FunnelBars stages={d.funnel} />
      <Donut slices={d.sources} />
    </section>

    <!-- Bottom trio -->
    <section class="grid-3 fade" style="animation-delay:240ms">
      <TopList items={d.topProducts} />
      <ActivityFeed items={d.activity} />
      <SystemHealth items={d.system} />
    </section>
  </div>
{/if}

<style>
  .dash {
    padding: 22px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
  }

  /* Header */
  .dash-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .dh-left h1 {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0;
    color: var(--text);
  }
  .dh-sub {
    font-size: 12px;
    color: var(--text-muted);
  }
  .dh-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .range-seg {
    display: inline-flex;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 2px;
  }
  .range-seg button {
    background: transparent;
    border: 0;
    padding: 6px 12px;
    border-radius: 7px;
    cursor: pointer;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.02em;
    transition:
      background 0.15s,
      color 0.15s;
    white-space: nowrap;
  }
  .range-seg button.on {
    background: var(--accent-soft);
    color: var(--text);
  }
  .range-seg button:hover:not(.on) {
    color: var(--text);
  }
  .export-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 34px;
    padding: 0 14px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--text);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s;
  }
  .export-btn:hover {
    background: var(--bg-soft);
    border-color: var(--line-strong);
  }

  /* Grids */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 16px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 1080px) {
    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .grid-3 {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 760px) {
    .grid-2,
    .grid-3 {
      grid-template-columns: 1fr;
    }
    .dash-head {
      align-items: flex-start;
    }
    .dh-right {
      width: 100%;
      justify-content: space-between;
    }
  }
  @media (max-width: 440px) {
    .kpi-grid {
      grid-template-columns: 1fr;
    }
    .range-seg button {
      padding: 6px 9px;
    }
  }

  /* Entrance */
  .fade {
    animation: dashUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .stagger > :global(*) {
    animation: dashUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .stagger > :global(*:nth-child(1)) {
    animation-delay: 0ms;
  }
  .stagger > :global(*:nth-child(2)) {
    animation-delay: 60ms;
  }
  .stagger > :global(*:nth-child(3)) {
    animation-delay: 120ms;
  }
  .stagger > :global(*:nth-child(4)) {
    animation-delay: 180ms;
  }
  @keyframes dashUp {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fade,
    .stagger > :global(*) {
      animation: none;
    }
  }

  /* Forbidden */
  .forbidden {
    margin: 60px auto;
    max-width: 420px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .forbidden .fico {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: var(--bg-soft);
    color: var(--text-faint);
    margin-bottom: 6px;
  }
  .forbidden h2 {
    font-size: 17px;
    font-weight: 600;
    margin: 0;
    color: var(--text);
  }
  .forbidden p {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.6;
  }
</style>
