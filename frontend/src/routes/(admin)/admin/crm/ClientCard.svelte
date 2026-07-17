<script lang="ts">
  import Bell from 'lucide-svelte/icons/bell';
  import Mail from 'lucide-svelte/icons/mail';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import type { CrmClient } from './+page.svelte';
  import { initials, isStale, mailLink, relativeTime, waLink } from '$lib/utils/crm';

  let {
    client,
    columnColor = '#7f3fe5',
    onclick,
    dragging = false,
    ondragstart,
    ondragend,
  } = $props<{
    client: CrmClient;
    columnColor?: string;
    onclick: () => void;
    dragging?: boolean;
    ondragstart?: () => void;
    ondragend?: () => void;
  }>();

  const stale = $derived(isStale(client.last_interaction));
  const wa = $derived(waLink(client.name, client.phone));
  const mail = $derived(mailLink(client.name, client.email));
</script>

<div
  class="crm-card {dragging ? 'dragging' : ''}"
  role="button"
  tabindex="0"
  {onclick}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
  draggable={true}
  ondragstart={(e) => {
    e.dataTransfer?.setData('text/plain', client.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    ondragstart?.();
  }}
  ondragend={() => ondragend?.()}
>
  <div class="top">
    <span class="crm-avatar" style="background:{columnColor}">{initials(client.name)}</span>
    <div class="who">
      <div class="name">{client.name}</div>
      <div class="email">{client.email || 'Sem e-mail'}</div>
    </div>
  </div>

  {#if client.product_name}
    <div class="crm-prods">
      <span
        class="crm-prodtag"
        style="background:{(client.product_color || '#7f3fe5') +
          '22'}; color:{client.product_color || '#7f3fe5'}"
      >
        <span class="d" style="background:{client.product_color || '#7f3fe5'}"></span>
        {client.product_name}
      </span>
    </div>
  {/if}

  <div class="meta-row">
    <span class="respo">
      {#if stale}
        <span class="agewarn" title="Sem interação recente"><Bell size={10} /></span>
      {/if}
      {client.responsible_name || 'Sem responsável'} · {relativeTime(client.last_interaction)}
    </span>
    <span class="crm-actions" onclick={(e) => e.stopPropagation()} role="presentation">
      {#if wa}
        <a class="crm-iconbtn wa" href={wa} target="_blank" rel="noopener" title="WhatsApp">
          <MessageCircle size={13} />
        </a>
      {/if}
      {#if mail}
        <a class="crm-iconbtn mail" href={mail} title="E-mail">
          <Mail size={13} />
        </a>
      {/if}
    </span>
  </div>
</div>

<style>
  .crm-card {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    cursor: grab;
    text-align: left;
    width: 100%;
    transition:
      transform 0.14s,
      box-shadow 0.14s,
      border-color 0.14s;
  }
  .crm-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-2, 0 6px 16px rgba(0, 0, 0, 0.25));
    border-color: var(--line-strong, var(--line));
  }
  .crm-card.dragging {
    opacity: 0.35;
    cursor: grabbing;
  }
  .crm-card .top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .crm-avatar {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }
  .crm-card .who {
    min-width: 0;
    flex: 1;
  }
  .crm-card .name {
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text);
  }
  .crm-card .email {
    font-size: 11.5px;
    color: var(--text-muted);
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .crm-prods {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .crm-prodtag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.04em;
    padding: 2px 7px;
    border-radius: 5px;
    font-weight: 500;
  }
  .crm-prodtag .d {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 9px;
    border-top: 1px solid var(--line);
    gap: 8px;
  }
  .respo {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-faint);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .agewarn {
    color: #f59e0b;
    display: inline-flex;
  }

  .crm-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .crm-iconbtn {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.12s;
    text-decoration: none;
  }
  .crm-iconbtn:hover {
    color: var(--text);
    border-color: var(--line-strong, var(--line));
    transform: translateY(-1px);
  }
  .crm-iconbtn.wa:hover {
    background: #25d366;
    border-color: #25d366;
    color: #fff;
  }
  .crm-iconbtn.mail:hover {
    background: var(--purple);
    border-color: var(--purple);
    color: #fff;
  }
</style>
