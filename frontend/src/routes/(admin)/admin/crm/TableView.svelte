<script lang="ts">
  import Mail from 'lucide-svelte/icons/mail';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import Users from 'lucide-svelte/icons/users';
  import type { CrmClient } from './+page.svelte';
  import { mailLink, relativeTime, waLink } from '$lib/utils/crm';

  type CrmColumn = { id: string; title: string; color: string };

  let { columns, clients, onOpen } = $props<{
    columns: CrmColumn[];
    clients: CrmClient[];
    onOpen: (client: CrmClient) => void;
  }>();

  type SortKey = 'name' | 'product' | 'stage' | 'responsible' | 'last_interaction';
  let sortKey = $state<SortKey>('last_interaction');
  let sortDir = $state<1 | -1>(1);

  function colTitle(id: string | null): string {
    return columns.find((c: CrmColumn) => c.id === id)?.title ?? '—';
  }
  function colColor(id: string | null): string {
    return columns.find((c: CrmColumn) => c.id === id)?.color ?? '#9ca3af';
  }

  function sortValue(c: CrmClient, key: SortKey): string {
    switch (key) {
      case 'name':
        return c.name.toLowerCase();
      case 'product':
        return (c.product_name || '').toLowerCase();
      case 'stage':
        return colTitle(c.column_id).toLowerCase();
      case 'responsible':
        return (c.responsible_name || '').toLowerCase();
      default:
        return c.last_interaction || '';
    }
  }

  const sorted = $derived(
    [...clients].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (va < vb) return -sortDir;
      if (va > vb) return sortDir;
      return 0;
    })
  );

  function setSort(key: SortKey) {
    if (sortKey === key) sortDir = (sortDir * -1) as 1 | -1;
    else {
      sortKey = key;
      sortDir = 1;
    }
  }
</script>

<div class="crm-table-wrap">
  <table class="crm-table">
    <thead>
      <tr>
        <th class={sortKey === 'name' ? 'sorted' : ''} onclick={() => setSort('name')}>
          Nome · contato<span class="sortcaret"
            >{sortKey === 'name' ? (sortDir > 0 ? '▲' : '▼') : '▲'}</span
          >
        </th>
        <th class={sortKey === 'product' ? 'sorted' : ''} onclick={() => setSort('product')}>
          Produto<span class="sortcaret"
            >{sortKey === 'product' ? (sortDir > 0 ? '▲' : '▼') : '▲'}</span
          >
        </th>
        <th class={sortKey === 'stage' ? 'sorted' : ''} onclick={() => setSort('stage')}>
          Estágio<span class="sortcaret"
            >{sortKey === 'stage' ? (sortDir > 0 ? '▲' : '▼') : '▲'}</span
          >
        </th>
        <th
          class={sortKey === 'responsible' ? 'sorted' : ''}
          onclick={() => setSort('responsible')}
        >
          Responsável<span class="sortcaret"
            >{sortKey === 'responsible' ? (sortDir > 0 ? '▲' : '▼') : '▲'}</span
          >
        </th>
        <th
          class={sortKey === 'last_interaction' ? 'sorted' : ''}
          onclick={() => setSort('last_interaction')}
        >
          Atividade<span class="sortcaret"
            >{sortKey === 'last_interaction' ? (sortDir > 0 ? '▲' : '▼') : '▲'}</span
          >
        </th>
        <th class="no-sort" style="text-align:right">Ações</th>
      </tr>
    </thead>
    <tbody>
      {#each sorted as client (client.id)}
        {@const wa = waLink(client.name, client.phone)}
        {@const mail = mailLink(client.name, client.email)}
        <tr class="lead-row" onclick={() => onOpen(client)}>
          <td>
            <div class="crm-tname">{client.name}</div>
            <div class="crm-tsub">{client.email || 'Sem e-mail'}</div>
          </td>
          <td>{client.product_name || '—'}</td>
          <td>
            <span class="crm-tstage"
              ><span class="d" style="background:{colColor(client.column_id)}"></span>{colTitle(
                client.column_id
              )}</span
            >
          </td>
          <td class="crm-tsub">{client.responsible_name || 'Sem responsável'}</td>
          <td class="crm-tsub">{relativeTime(client.last_interaction)}</td>
          <td>
            <div class="col-actions">
              {#if wa}
                <a
                  class="crm-iconbtn wa"
                  href={wa}
                  target="_blank"
                  rel="noopener"
                  onclick={(e) => e.stopPropagation()}
                  title="WhatsApp"><MessageCircle size={13} /></a
                >
              {/if}
              {#if mail}
                <a
                  class="crm-iconbtn mail"
                  href={mail}
                  onclick={(e) => e.stopPropagation()}
                  title="E-mail"><Mail size={13} /></a
                >
              {/if}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if sorted.length === 0}
    <div class="crm-empty">
      <div class="ico"><Users size={20} /></div>
      Nenhum lead corresponde aos filtros atuais.
    </div>
  {/if}
</div>

<style>
  .crm-table-wrap {
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg-elev);
  }
  .crm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .crm-table th {
    text-align: left;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint);
    font-weight: 500;
    padding: 11px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--bg-soft);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  .crm-table th.no-sort {
    cursor: default;
  }
  .crm-table th .sortcaret {
    opacity: 0.4;
    margin-left: 4px;
    font-size: 9px;
  }
  .crm-table th.sorted .sortcaret {
    opacity: 1;
    color: var(--purple);
  }
  .crm-table td {
    padding: 11px 14px;
    border-bottom: 1px solid var(--line);
    vertical-align: middle;
  }
  .crm-table tbody tr {
    transition: background 0.1s;
  }
  .crm-table tbody tr.lead-row {
    cursor: pointer;
  }
  .crm-table tbody tr.lead-row:hover {
    background: var(--bg-soft);
  }
  .crm-table tbody tr:last-child td {
    border-bottom: 0;
  }
  .crm-tname {
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
  }
  .crm-tsub {
    font-size: 11.5px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .crm-tstage {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .crm-tstage .d {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .col-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }
  .crm-iconbtn {
    width: 26px;
    height: 26px;
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
  .crm-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
  }
  .crm-empty .ico {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    margin: 0 auto 14px;
    color: var(--text-faint);
  }
</style>
