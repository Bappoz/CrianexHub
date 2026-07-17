<script lang="ts">
  import X from 'lucide-svelte/icons/x';
  import Send from 'lucide-svelte/icons/send';
  import Clock from 'lucide-svelte/icons/clock';
  import type { Ticket, TicketStatus } from '$lib/mocks/tickets';
  import { relativeTime } from '$lib/utils/notifications';

  export let ticket: Ticket | null = null;
  export let onClose: () => void;
  export let onStatusChange: (status: TicketStatus) => void;
  export let onReply: (body: string) => void;

  let reply = '';

  const STATUS: { id: TicketStatus; label: string }[] = [
    { id: 'aberto', label: 'Aberto' },
    { id: 'andamento', label: 'Em andamento' },
    { id: 'resolvido', label: 'Resolvido' },
  ];

  const CHANNEL_LABEL: Record<string, string> = {
    email: 'E-mail',
    chat: 'Chat',
    telefone: 'Telefone',
    formulario: 'Formulário',
  };
  const PRIORITY_LABEL: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    urgente: 'Urgente',
  };

  function slaLabel(t: Ticket): { text: string; over: boolean } {
    const diff = new Date(t.slaDueAt).getTime() - Date.now();
    if (t.status === 'resolvido') return { text: 'concluído', over: false };
    if (diff < 0) return { text: 'SLA vencido', over: true };
    const h = Math.round(diff / 3_600_000);
    return { text: h < 1 ? 'vence em <1h' : `vence em ${h}h`, over: h < 1 };
  }

  $: sla = ticket ? slaLabel(ticket) : null;

  function submitReply() {
    const body = reply.trim();
    if (!body) return;
    onReply(body);
    reply = '';
  }
</script>

{#if ticket}
  <button class="drawer-backdrop" aria-label="Fechar" on:click={onClose}></button>
  <aside class="drawer" role="dialog" aria-label="Detalhe do ticket">
    <header class="d-head">
      <div class="d-head-main">
        <span class="d-id">{ticket.id}</span>
        <h2>{ticket.subject}</h2>
      </div>
      <button class="d-close" on:click={onClose} aria-label="Fechar"><X size={18} /></button>
    </header>

    <div class="d-meta">
      <div class="mrow"><span class="mk">Cliente</span><span class="mv">{ticket.cliente}</span></div>
      <div class="mrow"><span class="mk">Produto</span><span class="mv">{ticket.produto}</span></div>
      <div class="mrow"><span class="mk">Canal</span><span class="mv">{CHANNEL_LABEL[ticket.channel]}</span></div>
      <div class="mrow">
        <span class="mk">Prioridade</span>
        <span class="mv"><span class="prio {ticket.priority}">{PRIORITY_LABEL[ticket.priority]}</span></span>
      </div>
      <div class="mrow">
        <span class="mk">Responsável</span>
        <span class="mv">{ticket.assignee ?? '— não atribuído'}</span>
      </div>
      <div class="mrow">
        <span class="mk">SLA</span>
        {#if sla}
          <span class="mv sla" class:over={sla.over}><Clock size={12} /> {sla.text}</span>
        {/if}
      </div>
    </div>

    <div class="d-status">
      {#each STATUS as s (s.id)}
        <button
          class="stbtn {s.id}"
          class:on={ticket.status === s.id}
          on:click={() => onStatusChange(s.id)}
        >
          {s.label}
        </button>
      {/each}
    </div>

    <div class="d-thread">
      {#each ticket.messages as m (m.id)}
        <div class="msg" class:agent={m.role === 'agente'}>
          <div class="msg-head">
            <span class="msg-author">{m.author}</span>
            <span class="msg-time">{relativeTime(m.at)}</span>
          </div>
          <div class="msg-body">{m.body}</div>
        </div>
      {/each}
    </div>

    <div class="d-reply">
      <textarea
        bind:value={reply}
        rows="2"
        placeholder="Escreva uma resposta…"
        on:keydown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitReply();
        }}
      ></textarea>
      <button class="reply-btn" on:click={submitReply} disabled={!reply.trim()}>
        <Send size={14} /> Responder
      </button>
    </div>
  </aside>
{/if}

<style>
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 6, 6, 0.5);
    backdrop-filter: blur(2px);
    border: 0;
    padding: 0;
    cursor: default;
    z-index: 60;
    animation: fadeIn 0.18s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(480px, 92vw);
    background: var(--bg-elev);
    border-left: 1px solid var(--line);
    z-index: 61;
    display: flex;
    flex-direction: column;
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes slideIn {
    from {
      transform: translateX(20px);
      opacity: 0.4;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  .d-head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 18px 20px;
    border-bottom: 1px solid var(--line);
  }
  .d-head-main {
    flex: 1;
    min-width: 0;
  }
  .d-id {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-faint);
    letter-spacing: 0.04em;
  }
  .d-head h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 3px 0 0;
    color: var(--text);
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  .d-close {
    flex-shrink: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
    color: var(--text-muted);
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }
  .d-close:hover {
    background: var(--bg-soft);
    color: var(--text);
  }

  .d-meta {
    padding: 14px 20px;
    display: grid;
    gap: 8px;
    border-bottom: 1px solid var(--line);
  }
  .mrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12.5px;
  }
  .mk {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .mv {
    color: var(--text);
    text-align: right;
  }
  .sla {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
  }
  .sla.over {
    color: var(--pink);
  }

  .prio {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 100px;
  }
  .prio.baixa {
    background: var(--bg-soft);
    color: var(--text-muted);
  }
  .prio.media {
    background: rgba(59, 154, 225, 0.16);
    color: #3b9ae1;
  }
  .prio.alta {
    background: rgba(245, 166, 35, 0.16);
    color: #f5a623;
  }
  .prio.urgente {
    background: rgba(231, 31, 132, 0.16);
    color: var(--pink);
  }

  .d-status {
    display: flex;
    gap: 6px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--line);
  }
  .stbtn {
    flex: 1;
    padding: 7px 8px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--text-muted);
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.14s,
      color 0.14s,
      border-color 0.14s;
  }
  .stbtn:hover {
    color: var(--text);
    border-color: var(--line-strong);
  }
  .stbtn.on.aberto {
    background: rgba(245, 166, 35, 0.16);
    color: #f5a623;
    border-color: transparent;
  }
  .stbtn.on.andamento {
    background: var(--accent-soft);
    color: var(--purple);
    border-color: transparent;
  }
  .stbtn.on.resolvido {
    background: rgba(102, 223, 122, 0.16);
    color: var(--green);
    border-color: transparent;
  }

  .d-thread {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .msg {
    max-width: 88%;
    align-self: flex-start;
  }
  .msg.agent {
    align-self: flex-end;
  }
  .msg-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }
  .msg.agent .msg-head {
    flex-direction: row-reverse;
  }
  .msg-author {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
  }
  .msg-time {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-faint);
  }
  .msg-body {
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--bg-soft);
    border: 1px solid var(--line);
  }
  .msg.agent .msg-body {
    background: var(--accent-soft);
    border-color: var(--accent-line);
  }

  .d-reply {
    padding: 14px 20px;
    border-top: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .d-reply textarea {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    font-family: inherit;
    font-size: 13px;
    color: var(--text);
    outline: none;
    resize: vertical;
    min-height: 46px;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .d-reply textarea:focus {
    border-color: var(--purple);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .reply-btn {
    align-self: flex-end;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: 100px;
    background: var(--text);
    color: var(--bg);
    border: 0;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition:
      opacity 0.15s,
      background 0.15s;
  }
  .reply-btn:hover:not(:disabled) {
    background: var(--purple);
    color: #fff;
  }
  .reply-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
