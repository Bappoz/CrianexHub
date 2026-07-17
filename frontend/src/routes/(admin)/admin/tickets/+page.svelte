<script lang="ts">
  import Lock from 'lucide-svelte/icons/lock';
  import Search from 'lucide-svelte/icons/search';
  import Inbox from 'lucide-svelte/icons/inbox';
  import Mail from 'lucide-svelte/icons/mail';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import Phone from 'lucide-svelte/icons/phone';
  import FileText from 'lucide-svelte/icons/file-text';
  import type { PageData } from './$types';
  import type { Ticket, TicketStatus, TicketPriority, TicketMessage } from '$lib/mocks/tickets';
  import StatCard from '$lib/components/admin/dashboard/StatCard.svelte';
  import TicketDrawer from '$lib/components/admin/tickets/TicketDrawer.svelte';
  import { relativeTime } from '$lib/utils/notifications';

  export let data: PageData;

  let tickets: Ticket[] = data.forbidden
    ? []
    : data.tickets.map((t) => ({ ...t, messages: [...t.messages] }));
  const kpis = data.forbidden ? [] : data.kpis;

  let statusFilter: 'todos' | TicketStatus = 'todos';
  let priorityFilter: 'todas' | TicketPriority = 'todas';
  let query = '';
  let selectedId: string | null = null;

  const STATUS_TABS: { id: 'todos' | TicketStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'aberto', label: 'Abertos' },
    { id: 'andamento', label: 'Em andamento' },
    { id: 'resolvido', label: 'Resolvidos' },
  ];

  const STATUS_LABEL: Record<TicketStatus, string> = {
    aberto: 'Aberto',
    andamento: 'Em andamento',
    resolvido: 'Resolvido',
  };

  const CHANNEL_ICON = {
    email: Mail,
    chat: MessageCircle,
    telefone: Phone,
    formulario: FileText,
  } as const;

  $: q = query.trim().toLowerCase();
  $: filtered = tickets.filter((t) => {
    if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'todas' && t.priority !== priorityFilter) return false;
    if (q && !`${t.id} ${t.subject} ${t.cliente} ${t.produto}`.toLowerCase().includes(q)) return false;
    return true;
  });

  $: selected = tickets.find((t) => t.id === selectedId) ?? null;

  function updateTicket(id: string, updater: (t: Ticket) => Ticket) {
    tickets = tickets.map((t) => (t.id === id ? updater(t) : t));
  }

  function changeStatus(status: TicketStatus) {
    if (!selected) return;
    updateTicket(selected.id, (t) => ({ ...t, status, updatedAt: new Date().toISOString() }));
  }

  function reply(body: string) {
    if (!selected) return;
    const m: TicketMessage = {
      id: `m${Date.now()}`,
      author: 'Você',
      role: 'agente',
      body,
      at: new Date().toISOString(),
    };
    updateTicket(selected.id, (t) => ({
      ...t,
      messages: [...t.messages, m],
      status: t.status === 'aberto' ? 'andamento' : t.status,
      updatedAt: new Date().toISOString(),
      firstResponseMin: t.firstResponseMin ?? 1,
    }));
  }

  function slaBadge(t: Ticket): { text: string; over: boolean } | null {
    if (t.status === 'resolvido') return null;
    const diff = new Date(t.slaDueAt).getTime() - Date.now();
    if (diff < 0) return { text: 'SLA vencido', over: true };
    const h = Math.round(diff / 3_600_000);
    return { text: h < 1 ? '<1h p/ SLA' : `${h}h p/ SLA`, over: h < 1 };
  }
</script>

<svelte:head><title>Tickets · Crianex Admin</title></svelte:head>

{#if data.forbidden}
  <div class="tk">
    <div class="forbidden">
      <span class="fico"><Lock size={22} /></span>
      <h2>Sem acesso aos Tickets</h2>
      <p>Seu perfil não tem permissão de visualização para este módulo. Fale com um administrador.</p>
    </div>
  </div>
{:else}
  <div class="tk">
    <header class="tk-head">
      <div>
        <h1>Tickets</h1>
        <span class="tk-sub">
          {data.counts.aberto} abertos · {data.counts.andamento} em andamento · fila de suporte
        </span>
      </div>
    </header>

    <section class="kpi-grid stagger">
      {#each kpis as kpi (kpi.id)}
        <StatCard {kpi} positiveIsGood={kpi.id === 'resolvido'} />
      {/each}
    </section>

    <!-- Filtros -->
    <div class="filters fade">
      <div class="tabs" role="tablist" aria-label="Filtrar por status">
        {#each STATUS_TABS as tab (tab.id)}
          <button
            role="tab"
            aria-selected={statusFilter === tab.id}
            class:on={statusFilter === tab.id}
            on:click={() => (statusFilter = tab.id)}>{tab.label}</button
          >
        {/each}
      </div>
      <div class="filter-right">
        <label class="sel">
          Prioridade
          <select bind:value={priorityFilter}>
            <option value="todas">Todas</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </label>
        <div class="tk-search">
          <Search size={14} />
          <input type="text" placeholder="Buscar ticket…" bind:value={query} aria-label="Buscar" />
        </div>
      </div>
    </div>

    <!-- Lista -->
    <section class="list fade" style="animation-delay:80ms">
      {#if filtered.length === 0}
        <div class="empty-state">
          <Inbox size={26} />
          <p>Nenhum ticket corresponde aos filtros.</p>
        </div>
      {:else}
        <div class="list-scroll">
          <div class="rows">
            {#each filtered as t (t.id)}
              {@const sla = slaBadge(t)}
              <button class="row" class:active={t.id === selectedId} on:click={() => (selectedId = t.id)}>
                <span class="pdot {t.priority}" title={t.priority}></span>
                <div class="rmain">
                  <span class="rsubject">{t.subject}</span>
                  <span class="rmeta">{t.id} · {t.cliente} · {t.produto}</span>
                </div>
                <span class="rchannel" title={t.channel}>
                  <svelte:component this={CHANNEL_ICON[t.channel]} size={14} />
                </span>
                <span class="rstatus {t.status}">{STATUS_LABEL[t.status]}</span>
                <span class="rassignee">{t.assignee ?? '—'}</span>
                <span class="rtime">
                  {#if sla}
                    <span class="sla" class:over={sla.over}>{sla.text}</span>
                  {:else}
                    <span class="ago">{relativeTime(t.updatedAt)}</span>
                  {/if}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  </div>

  <TicketDrawer
    ticket={selected}
    onClose={() => (selectedId = null)}
    onStatusChange={changeStatus}
    onReply={reply}
  />
{/if}

<style>
  .tk {
    padding: 22px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
  }
  .tk-head h1 {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0;
    color: var(--text);
  }
  .tk-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  @media (max-width: 1080px) {
    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 440px) {
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Filtros */
  .filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .tabs {
    display: inline-flex;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 2px;
  }
  .tabs button {
    background: transparent;
    border: 0;
    padding: 6px 12px;
    border-radius: 7px;
    cursor: pointer;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 12px;
    white-space: nowrap;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .tabs button.on {
    background: var(--accent-soft);
    color: var(--text);
  }
  .tabs button:hover:not(.on) {
    color: var(--text);
  }
  .filter-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sel {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .sel select {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 10px;
    font-family: inherit;
    font-size: 12px;
    color: var(--text);
    outline: none;
    text-transform: none;
    letter-spacing: normal;
  }
  .tk-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 12px;
    color: var(--text-muted);
  }
  .tk-search input {
    background: transparent;
    border: 0;
    outline: none;
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    width: 160px;
  }

  /* Lista */
  .list-scroll {
    overflow-x: auto;
  }
  .rows {
    min-width: 720px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 12px 1fr 26px 120px 120px 110px;
    align-items: center;
    gap: 14px;
    padding: 13px 14px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition:
      border-color 0.14s,
      background 0.14s;
  }
  .row:hover {
    border-color: var(--line-strong);
    background: color-mix(in srgb, var(--purple) 4%, var(--bg-elev));
  }
  .row.active {
    border-color: var(--accent-line);
    box-shadow: 0 0 0 1px var(--accent-line);
  }
  .pdot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .pdot.baixa {
    background: var(--text-faint);
  }
  .pdot.media {
    background: #3b9ae1;
  }
  .pdot.alta {
    background: #f5a623;
  }
  .pdot.urgente {
    background: var(--pink);
  }
  .rmain {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .rsubject {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rmeta {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rchannel {
    color: var(--text-muted);
    display: grid;
    place-items: center;
  }
  .rstatus {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 100px;
    text-align: center;
    justify-self: start;
  }
  .rstatus.aberto {
    background: rgba(245, 166, 35, 0.16);
    color: #f5a623;
  }
  .rstatus.andamento {
    background: var(--accent-soft);
    color: var(--purple);
  }
  .rstatus.resolvido {
    background: rgba(102, 223, 122, 0.16);
    color: var(--green);
  }
  .rassignee {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rtime {
    text-align: right;
    font-family: var(--font-mono);
    font-size: 10px;
  }
  .sla {
    color: #f5a623;
  }
  .sla.over {
    color: var(--pink);
  }
  .ago {
    color: var(--text-faint);
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

  .fade {
    animation: tkUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .stagger > :global(*) {
    animation: tkUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .stagger > :global(*:nth-child(2)) {
    animation-delay: 60ms;
  }
  .stagger > :global(*:nth-child(3)) {
    animation-delay: 120ms;
  }
  .stagger > :global(*:nth-child(4)) {
    animation-delay: 180ms;
  }
  @keyframes tkUp {
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
    .fade,
    .stagger > :global(*) {
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
