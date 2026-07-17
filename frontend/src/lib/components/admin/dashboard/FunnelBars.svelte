<script lang="ts">
  import type { FunnelStage } from '$lib/mocks/dashboard';
  import { number } from '$lib/utils/format';

  export let stages: FunnelStage[] = [];

  const COLORS = ['#7f3fe5', '#9b4de0', '#c73bb0', '#e71f84'];

  $: maxVal = Math.max(...stages.map((s) => s.value), 1);
  $: rows = stages.map((s, i) => ({
    ...s,
    pct: (s.value / maxVal) * 100,
    color: COLORS[i] ?? COLORS[COLORS.length - 1],
    conv: i === 0 ? null : Math.round((s.value / (stages[i - 1].value || 1)) * 100),
  }));
</script>

<div class="panel">
  <div class="p-head">
    <h3>Funil de conversão</h3>
    <span class="p-pill">Leads → Fechados</span>
  </div>
  <div class="funnel">
    {#each rows as r (r.label)}
      <div class="fstage">
        <div class="frow">
          <span class="flabel">{r.label}</span>
          <span class="fval">{number(r.value)}</span>
        </div>
        <div class="ftrack">
          <div class="fbar" style="width:{r.pct}%; background:{r.color}"></div>
          {#if r.conv !== null}
            <span class="fconv">{r.conv}%</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
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
    margin-bottom: 18px;
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
  .funnel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .frow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .flabel {
    font-size: 12.5px;
    color: var(--text-muted);
  }
  .fval {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .ftrack {
    position: relative;
    height: 12px;
    background: var(--bg-soft);
    border-radius: 100px;
    overflow: hidden;
  }
  .fbar {
    height: 100%;
    border-radius: 100px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .fconv {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    mix-blend-mode: difference;
  }
</style>
