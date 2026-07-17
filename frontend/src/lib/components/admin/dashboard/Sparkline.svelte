<script lang="ts">
  import { toPoints, smoothPath, areaPath } from '$lib/utils/chart';

  export let data: number[] = [];
  export let color = 'var(--purple)';
  export let height = 34;
  export let fill = true;

  const W = 120;

  $: pts = toPoints(data.length ? data : [0, 0], W, height, 3);
  $: line = smoothPath(pts);
  $: area = areaPath(pts, height);
  $: gid = `spark-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg
  class="spark"
  viewBox="0 0 {W} {height}"
  preserveAspectRatio="none"
  role="img"
  aria-hidden="true"
>
  <defs>
    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color={color} stop-opacity="0.24" />
      <stop offset="100%" stop-color={color} stop-opacity="0" />
    </linearGradient>
  </defs>
  {#if fill}
    <path d={area} fill="url(#{gid})" />
  {/if}
  <path
    d={line}
    fill="none"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
</svg>

<style>
  .spark {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
