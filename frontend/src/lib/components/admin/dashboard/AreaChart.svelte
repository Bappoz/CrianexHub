<script lang="ts">
  import { onMount } from 'svelte';
  import { toPoints, smoothPath, areaPath } from '$lib/utils/chart';
  import type { SeriesPoint } from '$lib/mocks/dashboard';
  import { currency, compact } from '$lib/utils/format';

  export let data: SeriesPoint[] = [];

  type Metric = 'receita' | 'leads';
  let metric: Metric = 'receita';

  const H = 260;
  const M = { l: 46, r: 14, t: 16, b: 26 };
  let width = 720;
  let mounted = false;
  let hover: number | null = null;

  onMount(() => {
    mounted = true;
  });

  $: color = metric === 'receita' ? 'var(--purple)' : 'var(--green)';
  $: values = data.map((d) => (metric === 'receita' ? d.receita : d.leads));
  $: max = Math.max(...values, 1);
  $: innerW = Math.max(1, width - M.l - M.r);
  $: innerH = H - M.t - M.b;
  $: pts = toPoints(values, innerW, innerH, 0, 0, max * 1.12).map((p) => ({
    x: p.x + M.l,
    y: p.y + M.t,
  }));
  $: line = smoothPath(pts);
  $: area = areaPath(pts, M.t + innerH);

  // Gridlines + labels do eixo Y
  $: yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: M.t + innerH * (1 - f),
    val: max * 1.12 * f,
  }));

  // Rótulos do eixo X (subconjunto para não amontoar)
  $: xEvery = Math.max(1, Math.ceil(data.length / 7));
  $: xLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % xEvery === 0 || i === data.length - 1);

  function fmtY(v: number): string {
    return metric === 'receita' ? compact(v) : compact(v);
  }
  function fmtVal(v: number): string {
    return metric === 'receita' ? currency(v) : `${v} leads`;
  }

  function onMove(e: PointerEvent) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const rel = (mx - M.l) / innerW;
    const idx = Math.round(rel * (data.length - 1));
    hover = Math.max(0, Math.min(data.length - 1, idx));
  }
  function onLeave() {
    hover = null;
  }

  $: gid = 'area-grad';
</script>

<div class="area-panel">
  <div class="area-head">
    <div>
      <h3>Receita &amp; Leads no tempo</h3>
      <span class="area-sub">
        {metric === 'receita' ? 'Receita gerada' : 'Leads capturados'} por período
      </span>
    </div>
    <div class="seg" role="tablist" aria-label="Métrica do gráfico">
      <button
        role="tab"
        aria-selected={metric === 'receita'}
        class:on={metric === 'receita'}
        on:click={() => (metric = 'receita')}>Receita</button
      >
      <button
        role="tab"
        aria-selected={metric === 'leads'}
        class:on={metric === 'leads'}
        on:click={() => (metric = 'leads')}>Leads</button
      >
    </div>
  </div>

  <div class="area-wrap" bind:clientWidth={width}>
    <svg viewBox="0 0 {width} {H}" {width} height={H} role="img" aria-label="Gráfico de {metric}">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={color} stop-opacity="0.28" />
          <stop offset="100%" stop-color={color} stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Gridlines -->
      {#each yTicks as t}
        <line x1={M.l} y1={t.y} x2={width - M.r} y2={t.y} class="grid" />
        <text x={M.l - 8} y={t.y + 3} class="axis-y" text-anchor="end">{fmtY(t.val)}</text>
      {/each}

      <!-- Área + linha -->
      <path d={area} fill="url(#{gid})" class="area-fill" />
      <path
        d={line}
        fill="none"
        stroke={color}
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
        class="area-line"
        style="stroke-dashoffset:{mounted ? 0 : 1}"
      />

      <!-- Rótulos X -->
      {#each xLabels as { d, i }}
        <text
          x={pts[i]?.x ?? 0}
          y={H - 6}
          class="axis-x"
          text-anchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>{d.t}</text
        >
      {/each}

      <!-- Crosshair + ponto no hover -->
      {#if hover !== null && pts[hover]}
        <line x1={pts[hover].x} y1={M.t} x2={pts[hover].x} y2={M.t + innerH} class="crosshair" />
        <circle cx={pts[hover].x} cy={pts[hover].y} r="4.5" fill={color} class="dot" />
        <circle cx={pts[hover].x} cy={pts[hover].y} r="8" fill={color} opacity="0.18" />
      {/if}

      <!-- Overlay de captura -->
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

    {#if hover !== null && pts[hover]}
      <div
        class="tip"
        style="left:{pts[hover].x}px; top:{pts[hover].y}px"
        class:flip={pts[hover].x > width * 0.7}
      >
        <span class="tip-t">{data[hover].t}</span>
        <span class="tip-v">{fmtVal(values[hover])}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .area-panel {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px 18px 8px;
  }
  .area-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .area-head h3 {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--text);
  }
  .area-sub {
    font-size: 11.5px;
    color: var(--text-muted);
  }

  .seg {
    display: inline-flex;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 2px;
    flex-shrink: 0;
  }
  .seg button {
    background: transparent;
    border: 0;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.04em;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .seg button.on {
    background: var(--bg-elev);
    color: var(--text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  }

  .area-wrap {
    position: relative;
    width: 100%;
  }
  svg {
    display: block;
    touch-action: none;
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
  .area-line {
    stroke-dasharray: 1;
    transition: stroke-dashoffset 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .crosshair {
    stroke: var(--text-faint);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.6;
  }
  .dot {
    stroke: var(--bg-elev);
    stroke-width: 2;
  }

  .tip {
    position: absolute;
    transform: translate(-50%, calc(-100% - 12px));
    background: var(--venom, #060606);
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    padding: 6px 10px;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 3;
  }
  .tip.flip {
    transform: translate(-85%, calc(-100% - 12px));
  }
  .tip-t {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .tip-v {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }
</style>
