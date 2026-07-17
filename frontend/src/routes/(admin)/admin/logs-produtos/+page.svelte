<script lang="ts">
  import Lock from 'lucide-svelte/icons/lock';
  import Search from 'lucide-svelte/icons/search';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import FileClock from 'lucide-svelte/icons/file-clock';
  import Package from 'lucide-svelte/icons/package';
  import CircleCheck from 'lucide-svelte/icons/circle-check';
  import type { PageData } from './$types';
  import { ACTION_META, type LogAction, type ProductLog } from '$lib/mocks/product-logs';

  export let data: PageData;

  const logs: ProductLog[] = data.forbidden ? [] : data.logs;
  const summary = data.forbidden ? null : data.summary;

  const ACTIONS = Object.keys(ACTION_META) as LogAction[];

  let actionFilter: 'todas' | LogAction = 'todas';
  let query = '';
  let expanded = new Set<string>();

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expanded = next;
  }

  $: q = query.trim().toLowerCase();
  $: filtered = logs.filter((l) => {
    if (actionFilter !== 'todas' && l.action !== actionFilter) return false;
    if (q && !`${l.productName} ${l.actor} ${l.summary}`.toLowerCase().includes(q)) return false;
    return true;
  });

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(d);
  }

  function timeLabel(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  $: groups = (() => {
    const out: { label: string; items: ProductLog[] }[] = [];
    for (const l of filtered) {
      const label = dayLabel(l.at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(l);
      else out.push({ label, items: [l] });
    }
    return out;
  })();
</script>

<svelte:head><title>Logs de Produtos · Crianex Admin</title></svelte:head>

{#if data.forbidden}
  <div class="pl">
    <div class="forbidden">
      <span class="fico"><Lock size={22} /></span>
      <h2>Sem acesso aos Logs de Produtos</h2>
      <p>Seu perfil não tem permissão de visualização para este módulo. Fale com um administrador.</p>
    </div>
  </div>
{:else}
  <div class="pl">
    <header class="pl-head">
      <div>
        <h1>Logs de Produtos</h1>
        <span class="pl-sub">Trilha de alterações da vitrine de produtos</span>
      </div>
    </header>

    {#if summary}
      <section class="summary fade">
        <div class="tot">
          <span class="tico a"><FileClock size={15} /></span>
          <div>
            <span class="tlabel">Alterações registradas</span>
            <span class="tval">{summary.total}</span>
          </div>
        </div>
        <div class="tot">
          <span class="tico b"><Package size={15} /></span>
          <div>
            <span class="tlabel">Produtos afetados</span>
            <span class="tval">{summary.produtosAfetados}</span>
          </div>
        </div>
        <div class="tot">
          <span class="tico c"><CircleCheck size={15} /></span>
          <div>
            <span class="tlabel">Publicações</span>
            <span class="tval">{summary.publicacoes}</span>
          </div>
        </div>
      </section>
    {/if}

    <!-- Filtros -->
    <div class="filters fade" style="animation-delay:60ms">
      <div class="chips">
        <button class:on={actionFilter === 'todas'} on:click={() => (actionFilter = 'todas')}>
          Todas
        </button>
        {#each ACTIONS as a (a)}
          <button
            class:on={actionFilter === a}
            style="--c:{ACTION_META[a].color}"
            on:click={() => (actionFilter = a)}
          >
            <span class="cdot" style="background:{ACTION_META[a].color}"></span>
            {ACTION_META[a].label}
          </button>
        {/each}
      </div>
      <div class="pl-search">
        <Search size={14} />
        <input type="text" placeholder="Buscar produto ou autor…" bind:value={query} aria-label="Buscar" />
      </div>
    </div>

    <!-- Timeline -->
    <section class="timeline fade" style="animation-delay:120ms">
      {#if groups.length === 0}
        <div class="empty-state">
          <FileClock size={26} />
          <p>Nenhuma alteração corresponde aos filtros.</p>
        </div>
      {:else}
        {#each groups as g (g.label)}
          <div class="day">
            <span class="day-label">{g.label}</span>
            <div class="entries">
              {#each g.items as l (l.id)}
                {@const meta = ACTION_META[l.action]}
                {@const hasDiff = l.changes.length > 0}
                <div class="entry">
                  <button
                    class="entry-main"
                    class:clickable={hasDiff}
                    on:click={() => hasDiff && toggle(l.id)}
                    disabled={!hasDiff}
                  >
                    <span class="etime">{timeLabel(l.at)}</span>
                    <span class="badge" style="--c:{meta.color}">{meta.label}</span>
                    <div class="etext">
                      <span class="eproduct">{l.productName}</span>
                      <span class="esummary">{l.summary}</span>
                    </div>
                    <span class="eactor">{l.actor}</span>
                    {#if hasDiff}
                      <span class="chev" class:open={expanded.has(l.id)}><ChevronDown size={15} /></span>
                    {:else}
                      <span class="chev-spacer"></span>
                    {/if}
                  </button>

                  {#if hasDiff && expanded.has(l.id)}
                    <div class="diffs">
                      {#each l.changes as c (c.field)}
                        <div class="diff">
                          <span class="dfield">{c.field}</span>
                          <span class="dbefore">{c.before ?? '—'}</span>
                          <ArrowRight size={12} />
                          <span class="dafter">{c.after ?? '—'}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </section>
  </div>
{/if}

<style>
  .pl {
    padding: 22px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1120px;
    width: 100%;
    margin: 0 auto;
  }
  .pl-head h1 {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0;
    color: var(--text);
  }
  .pl-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  .summary {
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
  .tico.a {
    color: var(--purple);
    background: var(--accent-soft);
  }
  .tico.b {
    color: #3b9ae1;
    background: rgba(59, 154, 225, 0.14);
  }
  .tico.c {
    color: var(--green);
    background: rgba(102, 223, 122, 0.14);
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

  /* Filtros */
  .filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chips button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 11px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 100px;
    font-family: inherit;
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      border-color 0.14s,
      color 0.14s,
      background 0.14s;
  }
  .chips button:hover {
    color: var(--text);
    border-color: var(--line-strong);
  }
  .chips button.on {
    color: var(--text);
    border-color: var(--c, var(--line-strong));
    background: color-mix(in srgb, var(--c, var(--purple)) 12%, var(--bg-elev));
  }
  .cdot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .pl-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 12px;
    color: var(--text-muted);
  }
  .pl-search input {
    background: transparent;
    border: 0;
    outline: none;
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    width: 180px;
  }

  /* Timeline */
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .day-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 8px;
    padding-left: 2px;
  }
  .entries {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .entry {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }
  .entry-main {
    width: 100%;
    display: grid;
    grid-template-columns: 52px 116px 1fr auto 22px;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: transparent;
    border: 0;
    font-family: inherit;
    text-align: left;
  }
  .entry-main.clickable {
    cursor: pointer;
  }
  .entry-main.clickable:hover {
    background: var(--bg-soft);
  }
  .etime {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint);
  }
  .badge {
    justify-self: start;
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 100px;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 16%, transparent);
    white-space: nowrap;
  }
  .etext {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .eproduct {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }
  .esummary {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .eactor {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .chev {
    color: var(--text-faint);
    display: grid;
    place-items: center;
    transition: transform 0.18s;
  }
  .chev.open {
    transform: rotate(180deg);
  }
  .chev-spacer {
    width: 15px;
  }

  .diffs {
    border-top: 1px solid var(--line);
    padding: 10px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--bg);
  }
  .diff {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
    flex-wrap: wrap;
  }
  .dfield {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-faint);
    min-width: 110px;
  }
  .dbefore {
    color: var(--text-muted);
    text-decoration: line-through;
    text-decoration-color: var(--text-faint);
  }
  .diff :global(svg) {
    color: var(--text-faint);
    flex-shrink: 0;
  }
  .dafter {
    color: var(--green);
    font-weight: 500;
  }

  .empty-state {
    padding: 48px;
    text-align: center;
    color: var(--text-muted);
    border: 1px dashed var(--line);
    border-radius: 14px;
    background: var(--bg-elev);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .empty-state p {
    margin: 0;
    font-size: 13px;
  }

  @media (max-width: 720px) {
    .summary {
      grid-template-columns: 1fr;
    }
    .entry-main {
      grid-template-columns: 46px 1fr 22px;
    }
    .badge,
    .eactor {
      display: none;
    }
  }

  .fade {
    animation: plUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes plUp {
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
    .fade {
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
