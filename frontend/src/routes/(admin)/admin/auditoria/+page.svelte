<script lang="ts">
  import Lock from 'lucide-svelte/icons/lock';
  import Search from 'lucide-svelte/icons/search';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import ShieldCheck from 'lucide-svelte/icons/shield-check';
  import ShieldAlert from 'lucide-svelte/icons/shield-alert';
  import LogIn from 'lucide-svelte/icons/log-in';
  import KeyRound from 'lucide-svelte/icons/key-round';
  import type { PageData } from './$types';
  import {
    CATEGORY_META,
    RESULT_META,
    type AuditCategory,
    type AuditEvent,
  } from '$lib/mocks/audit';

  export let data: PageData;

  const events: AuditEvent[] = data.forbidden ? [] : data.events;
  const summary = data.forbidden ? null : data.summary;

  const CATEGORIES = Object.keys(CATEGORY_META) as AuditCategory[];

  let categoryFilter: 'todas' | AuditCategory = 'todas';
  let onlyDenied = false;
  let query = '';
  let expanded = new Set<string>();

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expanded = next;
  }

  $: q = query.trim().toLowerCase();
  $: filtered = events.filter((e) => {
    if (categoryFilter !== 'todas' && e.category !== categoryFilter) return false;
    if (onlyDenied && e.result !== 'negado') return false;
    if (q && !`${e.actor} ${e.action} ${e.resource} ${e.ip}`.toLowerCase().includes(q)) return false;
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
    const out: { label: string; items: AuditEvent[] }[] = [];
    for (const e of filtered) {
      const label = dayLabel(e.at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(e);
      else out.push({ label, items: [e] });
    }
    return out;
  })();
</script>

<svelte:head><title>Auditoria · Crianex Admin</title></svelte:head>

{#if data.forbidden}
  <div class="au">
    <div class="forbidden">
      <span class="fico"><Lock size={22} /></span>
      <h2>Sem acesso à Auditoria</h2>
      <p>Seu perfil não tem permissão de visualização para este módulo. Fale com um administrador.</p>
    </div>
  </div>
{:else}
  <div class="au">
    <header class="au-head">
      <div>
        <h1>Auditoria</h1>
        <span class="au-sub">Trilha de ações privilegiadas do painel</span>
      </div>
    </header>

    {#if summary}
      <section class="summary fade">
        <div class="tot">
          <span class="tico a"><ShieldCheck size={15} /></span>
          <div>
            <span class="tlabel">Eventos registrados</span>
            <span class="tval">{summary.total}</span>
          </div>
        </div>
        <div class="tot warn">
          <span class="tico d"><ShieldAlert size={15} /></span>
          <div>
            <span class="tlabel">Ações negadas</span>
            <span class="tval">{summary.negados}</span>
          </div>
        </div>
        <div class="tot">
          <span class="tico b"><LogIn size={15} /></span>
          <div>
            <span class="tlabel">Logins</span>
            <span class="tval">{summary.logins}</span>
          </div>
        </div>
        <div class="tot">
          <span class="tico c"><KeyRound size={15} /></span>
          <div>
            <span class="tlabel">Alterações de permissão</span>
            <span class="tval">{summary.permissao}</span>
          </div>
        </div>
      </section>
    {/if}

    <!-- Filtros -->
    <div class="filters fade" style="animation-delay:60ms">
      <div class="chips">
        <button class:on={categoryFilter === 'todas'} on:click={() => (categoryFilter = 'todas')}>
          Todas
        </button>
        {#each CATEGORIES as c (c)}
          <button
            class:on={categoryFilter === c}
            style="--c:{CATEGORY_META[c].color}"
            on:click={() => (categoryFilter = c)}
          >
            <span class="cdot" style="background:{CATEGORY_META[c].color}"></span>
            {CATEGORY_META[c].label}
          </button>
        {/each}
      </div>
      <div class="filter-right">
        <label class="deny-toggle" class:on={onlyDenied}>
          <input type="checkbox" bind:checked={onlyDenied} />
          Só negados
        </label>
        <div class="au-search">
          <Search size={14} />
          <input type="text" placeholder="Ator, recurso ou IP…" bind:value={query} aria-label="Buscar" />
        </div>
      </div>
    </div>

    <!-- Trilha -->
    <section class="timeline fade" style="animation-delay:120ms">
      {#if groups.length === 0}
        <div class="empty-state">
          <ShieldCheck size={26} />
          <p>Nenhum evento corresponde aos filtros.</p>
        </div>
      {:else}
        {#each groups as g (g.label)}
          <div class="day">
            <span class="day-label">{g.label}</span>
            <div class="list-scroll">
              <div class="entries">
                {#each g.items as e (e.id)}
                  {@const cat = CATEGORY_META[e.category]}
                  {@const res = RESULT_META[e.result]}
                  {@const open = expanded.has(e.id)}
                  <div class="entry" class:denied={e.result === 'negado'}>
                    <button class="entry-main" on:click={() => toggle(e.id)}>
                      <span class="etime">{timeLabel(e.at)}</span>
                      <div class="eactor">
                        <span class="ename">{e.actor}</span>
                        <span class="erole">{e.actorRole}</span>
                      </div>
                      <div class="etext">
                        <span class="eaction">{e.action}</span>
                        <span class="eresource">{e.resource}</span>
                      </div>
                      <span class="cat" style="--c:{cat.color}">{cat.label}</span>
                      <span class="res" style="--c:{res.color}">{res.label}</span>
                      <span class="eip">{e.ip}</span>
                      <span class="chev" class:open><ChevronDown size={15} /></span>
                    </button>
                    {#if open}
                      <div class="details">
                        {#each e.details as d (d.label)}
                          <div class="det">
                            <span class="dk">{d.label}</span>
                            <span class="dv">{d.value}</span>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </section>
  </div>
{/if}

<style>
  .au {
    padding: 22px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1220px;
    width: 100%;
    margin: 0 auto;
  }
  .au-head h1 {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0;
    color: var(--text);
  }
  .au-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
    position: relative;
    overflow: hidden;
  }
  .tot.warn::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--pink);
    opacity: 0.7;
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
  .tico.d {
    color: var(--pink);
    background: rgba(231, 31, 132, 0.14);
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
  .filter-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .deny-toggle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--bg-elev);
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
  }
  .deny-toggle.on {
    color: var(--pink);
    border-color: rgba(231, 31, 132, 0.4);
    background: rgba(231, 31, 132, 0.08);
  }
  .deny-toggle input {
    accent-color: var(--pink);
    cursor: pointer;
  }
  .au-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 12px;
    color: var(--text-muted);
  }
  .au-search input {
    background: transparent;
    border: 0;
    outline: none;
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    width: 170px;
  }

  /* Trilha */
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
  .list-scroll {
    overflow-x: auto;
  }
  .entries {
    min-width: 780px;
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
  .entry.denied {
    border-color: rgba(231, 31, 132, 0.32);
  }
  .entry-main {
    width: 100%;
    display: grid;
    grid-template-columns: 50px 130px 1fr 110px 84px 108px 22px;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: transparent;
    border: 0;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }
  .entry-main:hover {
    background: var(--bg-soft);
  }
  .etime {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint);
  }
  .eactor {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .ename {
    font-size: 12.5px;
    color: var(--text);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .erole {
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: var(--text-faint);
  }
  .etext {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .eaction {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }
  .eresource {
    font-size: 11.5px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cat,
  .res {
    justify-self: start;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 100px;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 15%, transparent);
    white-space: nowrap;
  }
  .eip {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
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

  .details {
    border-top: 1px solid var(--line);
    padding: 10px 14px 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    background: var(--bg);
  }
  .det {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
  }
  .dk {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .dv {
    color: var(--text);
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
      grid-template-columns: 1fr 1fr;
    }
  }

  .fade {
    animation: auUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes auUp {
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
