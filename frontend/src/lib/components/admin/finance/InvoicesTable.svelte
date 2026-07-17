<script lang="ts">
  import type { Invoice, InvoiceStatus } from '$lib/mocks/finance';
  import { currency } from '$lib/utils/format';

  export let invoices: Invoice[] = [];

  const STATUS_LABEL: Record<InvoiceStatus, string> = {
    paga: 'Paga',
    pendente: 'Pendente',
    vencida: 'Vencida',
  };

  function fmtDate(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
      new Date(iso)
    );
  }
</script>

<div class="panel">
  <div class="p-head">
    <h3>Faturas recentes</h3>
    <span class="p-pill">{invoices.length} faturas</span>
  </div>

  <div class="table-scroll">
    <div class="inv-table">
      <div class="inv-row head">
        <span>Fatura</span>
        <span>Cliente</span>
        <span>Plano</span>
        <span class="right">Valor</span>
        <span>Vencimento</span>
        <span class="right">Status</span>
      </div>
      {#each invoices as f (f.id)}
        <div class="inv-row">
          <span class="mono">{f.id}</span>
          <span class="name">{f.cliente}</span>
          <span class="mono muted">{f.plano}</span>
          <span class="right val">{currency(f.valor)}</span>
          <span class="mono muted">{fmtDate(f.vencimento)}</span>
          <span class="right">
            <span class="pill {f.status}">
              <i class="dot"></i>{STATUS_LABEL[f.status]}
            </span>
          </span>
        </div>
      {/each}
    </div>
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
    margin-bottom: 8px;
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
  .table-scroll {
    overflow-x: auto;
  }
  .inv-table {
    min-width: 620px;
    display: flex;
    flex-direction: column;
  }
  .inv-row {
    display: grid;
    grid-template-columns: 90px 1.4fr 90px 110px 100px 110px;
    gap: 12px;
    align-items: center;
    padding: 11px 4px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .inv-row:last-child {
    border-bottom: 0;
  }
  .inv-row.head {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
    border-bottom-color: var(--line-strong);
  }
  .right {
    text-align: right;
    justify-self: end;
  }
  .mono {
    font-family: var(--font-mono);
    font-size: 11.5px;
  }
  .muted {
    color: var(--text-muted);
  }
  .name {
    color: var(--text);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .val {
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    border-radius: 100px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .pill .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
  .pill.paga {
    color: var(--green);
    background: rgba(102, 223, 122, 0.14);
  }
  .pill.paga .dot {
    background: var(--green);
  }
  .pill.pendente {
    color: #f5a623;
    background: rgba(245, 166, 35, 0.14);
  }
  .pill.pendente .dot {
    background: #f5a623;
  }
  .pill.vencida {
    color: var(--pink);
    background: rgba(231, 31, 132, 0.14);
  }
  .pill.vencida .dot {
    background: var(--pink);
  }
</style>
