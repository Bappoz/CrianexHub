<script lang="ts">
  import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
  import ArrowDownRight from 'lucide-svelte/icons/arrow-down-right';
  import type { TopProduct } from '$lib/mocks/dashboard';
  import { compact, delta } from '$lib/utils/format';

  export let items: TopProduct[] = [];

  $: maxViews = Math.max(...items.map((i) => i.views), 1);
</script>

<div class="panel">
  <div class="p-head">
    <h3>Produtos mais vistos</h3>
    <span class="p-pill">vitrine</span>
  </div>
  <ul class="top">
    {#each items as p, i (p.name)}
      <li>
        <span class="rank">{i + 1}</span>
        <div class="body">
          <div class="line">
            <span class="name">{p.name}</span>
            <span class="views">{compact(p.views)}</span>
          </div>
          <div class="track">
            <div class="bar" style="width:{(p.views / maxViews) * 100}%"></div>
          </div>
        </div>
        <span class="trend" class:up={p.trendPct >= 0} class:down={p.trendPct < 0}>
          <svelte:component
            this={p.trendPct >= 0 ? ArrowUpRight : ArrowDownRight}
            size={11}
            strokeWidth={2.5}
          />
          {delta(p.trendPct)}
        </span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .panel {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px;
  }
  .p-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .p-head h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .p-pill {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 100px;
    background: var(--bg-soft);
    color: var(--text-muted);
  }
  .top {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .top li {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .rank {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint);
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 5px;
    gap: 8px;
  }
  .name {
    font-size: 12.5px;
    color: var(--text);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .views {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .track {
    height: 5px;
    background: var(--bg-soft);
    border-radius: 100px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    background: linear-gradient(90deg, var(--purple), var(--pink));
    border-radius: 100px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .trend {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
    width: 52px;
    justify-content: flex-end;
  }
  .trend.up {
    color: var(--green);
  }
  .trend.down {
    color: var(--pink);
  }
</style>
