<script lang="ts">
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import Package from 'lucide-svelte/icons/package';
  import Users from 'lucide-svelte/icons/users';
  import HelpCircle from 'lucide-svelte/icons/help-circle';
  import Ticket from 'lucide-svelte/icons/ticket';
  import Activity from 'lucide-svelte/icons/activity';
  import type { Activity as ActivityItem, ActivityKind } from '$lib/mocks/dashboard';
  import { relativeTime } from '$lib/utils/notifications';

  export let items: ActivityItem[] = [];

  const ICONS: Record<ActivityKind, typeof Activity> = {
    lead: UserPlus,
    product: Package,
    member: Users,
    faq: HelpCircle,
    ticket: Ticket,
    system: Activity,
  };
  const COLORS: Record<ActivityKind, string> = {
    lead: '#7f3fe5',
    product: '#e71f84',
    member: '#66df7a',
    faq: '#f5a623',
    ticket: '#3b9ae1',
    system: '#6f6e78',
  };
</script>

<div class="panel">
  <div class="p-head">
    <h3>Atividade recente</h3>
    <a href="/admin/notificacoes" class="p-link">ver tudo</a>
  </div>
  <ul class="feed">
    {#each items as a (a.id)}
      <li>
        <span class="fico" style="background:{COLORS[a.kind]}22; color:{COLORS[a.kind]}">
          <svelte:component this={ICONS[a.kind]} size={13} />
        </span>
        <div class="ftext">
          <p class="fmain">
            <span class="factor">{a.actor}</span>
            {a.action}
            <span class="ftarget">{a.target}</span>
          </p>
          <span class="ftime">{relativeTime(a.at)}</span>
        </div>
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
  .p-link {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--purple);
    text-decoration: none;
  }
  .p-link:hover {
    text-decoration: underline;
  }
  .feed {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .feed li {
    display: flex;
    gap: 11px;
    padding: 8px 0;
    position: relative;
  }
  .feed li:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 13px;
    top: 34px;
    bottom: -2px;
    width: 1px;
    background: var(--line);
  }
  .fico {
    width: 27px;
    height: 27px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    z-index: 1;
  }
  .ftext {
    flex: 1;
    min-width: 0;
  }
  .fmain {
    margin: 0;
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.4;
  }
  .factor {
    color: var(--text);
    font-weight: 600;
  }
  .ftarget {
    color: var(--text);
    font-weight: 500;
  }
  .ftime {
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: var(--text-faint);
  }
</style>
