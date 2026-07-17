<script lang="ts">
  import type { MrrMove } from '$lib/mocks/finance';
  import { currency } from '$lib/utils/format';

  export let moves: MrrMove[] = [];
  export let net = 0;

  $: maxAbs = Math.max(...moves.map((m) => Math.abs(m.value)), 1);
</script>

<div class="panel">
  <div class="p-head">
    <h3>Movimento de MRR</h3>
    <span class="net" class:pos={net >= 0} class:neg={net < 0}>
      líquido {net >= 0 ? '+' : '−'}{currency(Math.abs(net))}
    </span>
  </div>
  <ul class="moves">
    {#each moves as m (m.label)}
      {@const pos = m.value >= 0}
      <li>
        <span class="mlabel">{m.label}</span>
        <div class="mtrack">
          <div
            class="mbar"
            class:pos
            class:neg={!pos}
            style="width:{(Math.abs(m.value) / maxAbs) * 100}%"
          ></div>
        </div>
        <span class="mval" class:pos class:neg={!pos}>
          {pos ? '+' : '−'}{currency(Math.abs(m.value))}
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
    margin-bottom: 16px;
  }
  .p-head h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .net {
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 100px;
  }
  .net.pos {
    color: var(--green);
    background: rgba(102, 223, 122, 0.14);
  }
  .net.neg {
    color: var(--pink);
    background: rgba(231, 31, 132, 0.14);
  }
  .moves {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .moves li {
    display: grid;
    grid-template-columns: 84px 1fr auto;
    align-items: center;
    gap: 12px;
  }
  .mlabel {
    font-size: 12.5px;
    color: var(--text-muted);
  }
  .mtrack {
    height: 8px;
    background: var(--bg-soft);
    border-radius: 100px;
    overflow: hidden;
  }
  .mbar {
    height: 100%;
    border-radius: 100px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .mbar.pos {
    background: linear-gradient(90deg, var(--purple), var(--green));
  }
  .mbar.neg {
    background: linear-gradient(90deg, var(--pink), #ff6ba8);
  }
  .mval {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .mval.pos {
    color: var(--green);
  }
  .mval.neg {
    color: var(--pink);
  }
</style>
