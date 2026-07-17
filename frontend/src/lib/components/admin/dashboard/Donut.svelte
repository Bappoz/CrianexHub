<script lang="ts">
  type Slice = { label: string; value: number; color: string };

  export let slices: Slice[] = [];
  export let title = 'Leads por origem';
  export let pill = 'canais';
  export let centerCaption = 'origens';
  /** Sobrescreve o texto grande no centro; padrão = "100%". */
  export let centerValue: string | null = null;

  const R = 54;
  const STROKE = 16;
  const C = 2 * Math.PI * R;

  $: total = slices.reduce((a, s) => a + s.value, 0) || 1;
  $: arcs = (() => {
    let acc = 0;
    return slices.map((s) => {
      const frac = s.value / total;
      const seg = {
        ...s,
        dash: `${frac * C} ${C - frac * C}`,
        offset: -acc * C,
        pct: Math.round(frac * 100),
      };
      acc += frac;
      return seg;
    });
  })();
</script>

<div class="panel">
  <div class="p-head">
    <h3>{title}</h3>
    <span class="p-pill">{pill}</span>
  </div>

  <div class="donut-wrap">
    <svg
      viewBox="0 0 140 140"
      class="donut"
      role="img"
      aria-label="Distribuição de leads por origem"
    >
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--bg-soft)" stroke-width={STROKE} />
        {#each arcs as a (a.label)}
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={a.color}
            stroke-width={STROKE}
            stroke-dasharray={a.dash}
            stroke-dashoffset={a.offset}
            stroke-linecap="butt"
            class="arc"
          />
        {/each}
      </g>
      <text x="70" y="66" text-anchor="middle" class="donut-total"
        >{centerValue ?? `${total}%`}</text
      >
      <text x="70" y="82" text-anchor="middle" class="donut-cap">{centerCaption}</text>
    </svg>

    <ul class="legend">
      {#each arcs as a (a.label)}
        <li>
          <span class="ldot" style="background:{a.color}"></span>
          <span class="lname">{a.label}</span>
          <span class="lval">{a.pct}%</span>
        </li>
      {/each}
    </ul>
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
    margin-bottom: 12px;
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
  .donut-wrap {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .donut {
    width: 132px;
    height: 132px;
    flex-shrink: 0;
  }
  .arc {
    transition: stroke-dasharray 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .donut-total {
    font-size: 20px;
    font-weight: 700;
    fill: var(--text);
    letter-spacing: -0.03em;
  }
  .donut-cap {
    font-family: var(--font-mono);
    font-size: 8.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    fill: var(--text-faint);
  }
  .legend {
    flex: 1;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .ldot {
    width: 9px;
    height: 9px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .lname {
    color: var(--text-muted);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lval {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text);
    font-size: 11.5px;
  }

  @media (max-width: 420px) {
    .donut-wrap {
      flex-direction: column;
    }
  }
</style>
