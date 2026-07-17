<script lang="ts">
  import type { MonthRevenue } from '$lib/mocks/finance';
  import { currency, compact } from '$lib/utils/format';

  export let data: MonthRevenue[] = [];

  const H = 260;
  const M = { l: 46, r: 14, t: 16, b: 26 };
  let width = 720;
  let hover: number | null = null;

  $: innerW = Math.max(1, width - M.l - M.r);
  $: innerH = H - M.t - M.b;
  $: totals = data.map((d) => d.recebido + d.aReceber);
  $: max = Math.max(...totals, 1) * 1.12;
  $: step = innerW / Math.max(1, data.length);
  $: barW = Math.min(34, step * 0.56);

  $: yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: M.t + innerH * (1 - f), val: max * f }));

  function xCenter(i: number): number {
    return M.l + step * i + step / 2;
  }
  function h(v: number): number {
    return (v / max) * innerH;
  }

  function onMove(e: PointerEvent) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const mx = e.clientX - rect.left - M.l;
    hover = Math.max(0, Math.min(data.length - 1, Math.floor(mx / step)));
  }
  function onLeave() {
    hover = null;
  }
</script>

<div class="bar-panel">
  <div class="bar-head">
    <div>
      <h3>Receita mensal</h3>
      <span class="bar-sub">Recebido e a receber · 12 meses</span>
    </div>
    <div class="bar-legend">
      <span><i class="sw recebido"></i> Recebido</span>
      <span><i class="sw areceber"></i> A receber</span>
    </div>
  </div>

  <div class="bar-wrap" bind:clientWidth={width}>
    <svg viewBox="0 0 {width} {H}" {width} height={H} role="img" aria-label="Receita mensal">
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8b52e8" />
          <stop offset="100%" stop-color="#7f3fe5" />
        </linearGradient>
      </defs>

      {#each yTicks as t}
        <line x1={M.l} y1={t.y} x2={width - M.r} y2={t.y} class="grid" />
        <text x={M.l - 8} y={t.y + 3} class="axis-y" text-anchor="end">{compact(t.val)}</text>
      {/each}

      {#each data as d, i}
        {@const cx = xCenter(i)}
        {@const hr = h(d.recebido)}
        {@const ha = h(d.aReceber)}
        <g class:dim={hover !== null && hover !== i}>
          <rect
            x={cx - barW / 2}
            y={M.t + innerH - hr}
            width={barW}
            height={hr}
            rx="3"
            fill="url(#bar-grad)"
          />
          <rect
            x={cx - barW / 2}
            y={M.t + innerH - hr - ha}
            width={barW}
            height={ha}
            rx="3"
            fill="var(--line-strong)"
            opacity="0.85"
          />
        </g>
        <text x={cx} y={H - 6} class="axis-x" text-anchor="middle">{d.month}</text>
      {/each}

      <rect
        x={M.l}
        y={M.t}
        width={innerW}
        height={innerH}
        fill="transparent"
        on:pointermove={onMove}
        on:pointerleave={onLeave}
      />
    </svg>

    {#if hover !== null && data[hover]}
      <div class="tip" style="left:{xCenter(hover)}px" class:flip={xCenter(hover) > width * 0.7}>
        <span class="tip-t">{data[hover].month}</span>
        <span class="tip-r">Recebido {currency(data[hover].recebido)}</span>
        <span class="tip-a">A receber {currency(data[hover].aReceber)}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .bar-panel {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px 18px 8px;
  }
  .bar-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .bar-head h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .bar-sub {
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .bar-legend {
    display: flex;
    gap: 14px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .bar-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sw {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
  }
  .sw.recebido {
    background: var(--purple);
  }
  .sw.areceber {
    background: var(--line-strong);
  }
  .bar-wrap {
    position: relative;
    width: 100%;
  }
  svg {
    display: block;
    touch-action: none;
  }
  g {
    transition: opacity 0.15s;
  }
  g.dim {
    opacity: 0.42;
  }
  .grid {
    stroke: var(--line);
    stroke-width: 1;
    opacity: 0.55;
  }
  .axis-y,
  .axis-x {
    font-family: var(--font-mono);
    font-size: 9.5px;
    fill: var(--text-faint);
  }
  .tip {
    position: absolute;
    top: 12px;
    transform: translateX(-50%);
    background: var(--venom, #060606);
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    padding: 6px 10px;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 3;
  }
  .tip.flip {
    transform: translateX(-85%);
  }
  .tip-t {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .tip-r {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
  }
  .tip-a {
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
