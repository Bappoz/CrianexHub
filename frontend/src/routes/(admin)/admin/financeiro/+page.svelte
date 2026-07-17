<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Download from 'lucide-svelte/icons/download';
  import Lock from 'lucide-svelte/icons/lock';
  import ArrowDownToLine from 'lucide-svelte/icons/arrow-down-to-line';
  import Clock from 'lucide-svelte/icons/clock';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import type { PageData } from './$types';
  import { RANGES } from '$lib/mocks/finance';
  import StatCard from '$lib/components/admin/dashboard/StatCard.svelte';
  import Donut from '$lib/components/admin/dashboard/Donut.svelte';
  import BarChart from '$lib/components/admin/finance/BarChart.svelte';
  import MrrMovement from '$lib/components/admin/finance/MrrMovement.svelte';
  import InvoicesTable from '$lib/components/admin/finance/InvoicesTable.svelte';
  import { currency } from '$lib/utils/format';

  export let data: PageData;

  $: f = data.forbidden ? null : data.finance;

  function setRange(id: string) {
    const u = new URL($page.url);
    u.searchParams.set('range', id);
    goto(u, { keepFocus: true, noScroll: true, invalidateAll: true });
  }

  function exportCsv() {
    if (!f) return;
    const rows = [
      ['mes', 'recebido', 'a_receber'],
      ...f.revenue.map((m) => [m.month, m.recebido, m.aReceber]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crianex-financeiro-${f.range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updatedLabel(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso)
    );
  }

  $: totalSubs = f ? f.plans.reduce((a, p) => a + p.value, 0) : 0;
</script>

<svelte:head><title>Financeiro · Crianex Admin</title></svelte:head>

{#if data.forbidden}
  <div class="fin">
    <div class="forbidden">
      <span class="fico"><Lock size={22} /></span>
      <h2>Sem acesso ao Financeiro</h2>
      <p>
        Seu perfil não tem permissão de visualização para este módulo. Fale com um administrador.
      </p>
    </div>
  </div>
{:else if f}
  <div class="fin">
    <header class="fin-head">
      <div>
        <h1>Financeiro</h1>
        <span class="fin-sub">
          Receita e cobrança · {f.periodLabel} · atualizado às {updatedLabel(f.updatedAt)}
        </span>
      </div>
      <div class="fin-actions">
        <div class="range-seg" role="tablist" aria-label="Intervalo de tempo">
          {#each RANGES as r (r.id)}
            <button
              role="tab"
              aria-selected={f.range === r.id}
              class:on={f.range === r.id}
              on:click={() => setRange(r.id)}>{r.label}</button
            >
          {/each}
        </div>
        <button class="export-btn" on:click={exportCsv} title="Exportar CSV">
          <Download size={14} /> <span>Exportar</span>
        </button>
      </div>
    </header>

    <!-- Totais (12 meses) -->
    <section class="totals fade">
      <div class="tot">
        <span class="tico rec"><ArrowDownToLine size={15} /></span>
        <div>
          <span class="tlabel">Recebido (12m)</span>
          <span class="tval">{currency(f.totals.recebido)}</span>
        </div>
      </div>
      <div class="tot">
        <span class="tico pend"><Clock size={15} /></span>
        <div>
          <span class="tlabel">A receber</span>
          <span class="tval">{currency(f.totals.aReceber)}</span>
        </div>
      </div>
      <div class="tot">
        <span class="tico venc"><TriangleAlert size={15} /></span>
        <div>
          <span class="tlabel">Vencido em atraso</span>
          <span class="tval">{currency(f.totals.vencido)}</span>
        </div>
      </div>
    </section>

    <!-- KPIs -->
    <section class="kpi-grid stagger">
      {#each f.kpis as kpi (kpi.id)}
        <StatCard {kpi} positiveIsGood={kpi.id !== 'inadimplencia'} />
      {/each}
    </section>

    <!-- Receita mensal -->
    <section class="fade" style="animation-delay:120ms">
      <BarChart data={f.revenue} />
    </section>

    <!-- MRR movement + planos + métodos -->
    <section class="grid-3 fade" style="animation-delay:180ms">
      <MrrMovement moves={f.mrrMovement} net={f.mrrNet} />
      <Donut
        slices={f.plans}
        title="Assinaturas por plano"
        pill="planos"
        centerValue={String(totalSubs)}
        centerCaption="assinantes"
      />
      <Donut
        slices={f.payMethods}
        title="Formas de pagamento"
        pill="métodos"
        centerCaption="métodos"
      />
    </section>

    <!-- Faturas -->
    <section class="fade" style="animation-delay:240ms">
      <InvoicesTable invoices={f.invoices} />
    </section>
  </div>
{/if}

<style>
  .fin {
    padding: 22px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
  }

  .fin-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .fin-head h1 {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0;
    color: var(--text);
  }
  .fin-sub {
    font-size: 12px;
    color: var(--text-muted);
  }
  .fin-actions {
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

  /* Totais */
  .totals {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .tot {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 14px 16px;
  }
  .tico {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .tico.rec {
    color: var(--green);
    background: rgba(102, 223, 122, 0.14);
  }
  .tico.pend {
    color: #f5a623;
    background: rgba(245, 166, 35, 0.14);
  }
  .tico.venc {
    color: var(--pink);
    background: rgba(231, 31, 132, 0.14);
  }
  .tlabel {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .tval {
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 1080px) {
    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .grid-3 {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 760px) {
    .totals {
      grid-template-columns: 1fr;
    }
    .fin-head {
      align-items: flex-start;
    }
    .fin-actions {
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

  .fade {
    animation: finUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .stagger > :global(*) {
    animation: finUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
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
  @keyframes finUp {
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
