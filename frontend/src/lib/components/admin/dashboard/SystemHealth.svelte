<script lang="ts">
  import type { SystemStatus } from '$lib/mocks/dashboard';

  export let items: SystemStatus[] = [];

  const LABEL: Record<SystemStatus['status'], string> = {
    ok: 'Operacional',
    warn: 'Atenção',
    down: 'Fora do ar',
  };
</script>

<div class="panel">
  <div class="p-head">
    <h3>Saúde do sistema</h3>
    <span class="p-pill">tempo real</span>
  </div>
  <ul class="health">
    {#each items as s (s.label)}
      <li>
        <span class="hdot {s.status}"></span>
        <div class="hbody">
          <span class="hlabel">{s.label}</span>
          <span class="hdetail">{s.detail}</span>
        </div>
        <span class="hstatus {s.status}">{LABEL[s.status]}</span>
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
  .health {
    list-style: none;
    display: flex;
    flex-direction: column;
  }
  .health li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid var(--line);
  }
  .health li:last-child {
    border-bottom: 0;
  }
  .hdot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
  }
  .hdot.ok {
    background: var(--green);
    box-shadow: 0 0 0 3px rgba(102, 223, 122, 0.18);
  }
  .hdot.warn {
    background: #f5a623;
    box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.18);
  }
  .hdot.down {
    background: var(--pink);
    box-shadow: 0 0 0 3px rgba(231, 31, 132, 0.18);
  }
  .hbody {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .hlabel {
    font-size: 12.5px;
    color: var(--text);
    font-weight: 500;
  }
  .hdetail {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-faint);
  }
  .hstatus {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 100px;
    flex-shrink: 0;
  }
  .hstatus.ok {
    color: var(--green);
    background: rgba(102, 223, 122, 0.14);
  }
  .hstatus.warn {
    color: #f5a623;
    background: rgba(245, 166, 35, 0.14);
  }
  .hstatus.down {
    color: var(--pink);
    background: rgba(231, 31, 132, 0.14);
  }
</style>
