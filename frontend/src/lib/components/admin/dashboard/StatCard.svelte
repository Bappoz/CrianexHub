<script lang="ts">
  import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
  import ArrowDownRight from 'lucide-svelte/icons/arrow-down-right';
  import Sparkline from './Sparkline.svelte';
  import type { Kpi } from '$lib/mocks/dashboard';
  import { currency, number, percent, delta } from '$lib/utils/format';

  export let kpi: Kpi;
  /** Se true, alta = bom (verde). Para "tickets abertos", passar false. */
  export let positiveIsGood = true;

  $: formatted =
    kpi.format === 'currency'
      ? currency(kpi.value)
      : kpi.format === 'percent'
        ? percent(kpi.value)
        : number(kpi.value);

  $: up = kpi.deltaPct >= 0;
  $: good = positiveIsGood ? up : !up;
  $: sparkColor = kpi.tone === 'warn' ? 'var(--pink)' : 'var(--purple)';
</script>

<div class="stat" class:warn={kpi.tone === 'warn'}>
  <div class="stat-top">
    <span class="stat-label">{kpi.label}</span>
    {#if kpi.deltaPct !== 0}
      <span class="delta" class:good class:bad={!good}>
        <svelte:component this={up ? ArrowUpRight : ArrowDownRight} size={12} strokeWidth={2.5} />
        {delta(kpi.deltaPct)}
      </span>
    {/if}
  </div>

  <div class="stat-value">{formatted}</div>
  {#if kpi.hint}<div class="stat-hint">{kpi.hint}</div>{/if}

  <div class="stat-spark">
    <Sparkline data={kpi.series} color={sparkColor} height={38} />
  </div>
</div>

<style>
  .stat {
    position: relative;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 16px 16px 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition:
      border-color 0.18s ease,
      transform 0.18s ease;
  }
  .stat:hover {
    border-color: var(--line-strong);
    transform: translateY(-2px);
  }
  .stat.warn::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--pink);
    opacity: 0.7;
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .stat-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  .delta {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 6px 2px 4px;
    border-radius: 100px;
  }
  .delta.good {
    color: var(--green);
    background: rgba(102, 223, 122, 0.14);
  }
  .delta.bad {
    color: var(--pink);
    background: rgba(231, 31, 132, 0.14);
  }

  .stat-value {
    font-size: clamp(26px, 3vw, 32px);
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--text);
    line-height: 1.05;
  }
  .stat-hint {
    font-size: 11.5px;
    color: var(--text-muted);
  }

  .stat-spark {
    height: 38px;
    margin: 6px -16px 0;
  }
</style>
