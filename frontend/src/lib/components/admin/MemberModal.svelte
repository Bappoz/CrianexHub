<script lang="ts">
  import { getInitials, validateEmail, type Member } from '$lib/utils/membros';
  import { ApiError } from '$lib/api/backend';

  const ROLE_OPTIONS = [
    'Owner',
    'Administrador',
    'Comercial',
    'Suporte',
    'Engenharia',
    'Financeiro',
    'Auditor',
  ];

  const MODULES = [
    { id: 'dashboard', label: 'Dashboard executivo' },
    { id: 'crm', label: 'CRM · Leads e interações' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'members', label: 'Membros e permissões' },
    { id: 'products', label: 'Produtos da vitrine' },
    { id: 'faq', label: 'Gestão FAQ' },
    { id: 'tickets', label: 'Tickets de suporte' },
    { id: 'productLogs', label: 'Logs de produtos' },
    { id: 'notifications', label: 'Configuração de notificações' },
    { id: 'auditLogs', label: 'Auditoria' },
  ];

  type Perms = Record<string, string[]>;

  function emptyPerms(): Perms {
    return Object.fromEntries(MODULES.map((m) => [m.id, []]));
  }
  function allPerms(): Perms {
    return Object.fromEntries(MODULES.map((m) => [m.id, ['v', 'e', 'a']]));
  }
  function viewPerms(): Perms {
    return Object.fromEntries(MODULES.map((m) => [m.id, ['v']]));
  }

  let {
    isOpen = false,
    isEditing = false,
    member = {},
    onClose,
    onSave,
  } = $props<{
    isOpen: boolean;
    isEditing: boolean;
    member: Partial<Member>;
    onClose: () => void;
    onSave: (m: Partial<Member>) => Promise<void> | void;
  }>();

  let name = $state('');
  let email = $state('');
  let displayRole = $state('Comercial');
  let status = $state<'active' | 'inactive'>('active');
  let perms = $state<Perms>(emptyPerms());
  let loading = $state(false);
  let errorMessage = $state('');
  let emailError = $state('');

  $effect(() => {
    if (isOpen) {
      name = member.name || '';
      email = member.email || '';
      displayRole = member.display_role || 'Comercial';
      status = member.status || 'active';
      perms = member.permissions ? { ...member.permissions } : emptyPerms();
      errorMessage = '';
      emailError = '';
    }
  });

  let initials = $derived(getInitials(name || member.name || ''));

  function handleRoleChange(e: Event) {
    const r = (e.target as HTMLSelectElement).value;
    displayRole = r;
    if (r === 'Owner' || r === 'Administrador') perms = allPerms();
    else if (r === 'Auditor') perms = viewPerms();
  }

  function togglePerm(modId: string, perm: string) {
    const cur = perms[modId] ?? [];
    perms = {
      ...perms,
      [modId]: cur.includes(perm) ? cur.filter((x) => x !== perm) : [...cur, perm],
    };
  }

  function getAuthRole(dr: string): 'owner' | 'member' {
    return dr === 'Owner' || dr === 'Administrador' ? 'owner' : 'member';
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errorMessage = '';
    emailError = '';

    const cleanedName = name.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedName) {
      errorMessage = 'Por favor, preencha o nome.';
      return;
    }
    if (!isEditing && (!cleanedEmail || !validateEmail(cleanedEmail))) {
      emailError = 'Insira um e-mail válido (ex: nome@empresa.com).';
      return;
    }

    loading = true;
    try {
      await onSave({
        ...member,
        name: cleanedName,
        email: cleanedEmail,
        role: getAuthRole(displayRole),
        display_role: displayRole,
        status,
        permissions: perms,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        emailError = err.message || 'E-mail já cadastrado na plataforma.';
      } else if (err instanceof Error) {
        errorMessage = err.message || 'Falha ao salvar membro. Tente novamente.';
      } else {
        errorMessage = 'Falha ao salvar membro. Tente novamente.';
      }
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !loading) onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="admin-overlay" role="presentation">
    <div
      class="admin-modal wide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
    >
      <header class="admin-modal-head">
        <h3 id="member-modal-title">
          {isEditing ? `Editar · ${member.name}` : 'Cadastrar membro'}
        </h3>
        <span class="crumbs">/ membros / permissões</span>
        <button class="x" type="button" onclick={onClose} disabled={loading} aria-label="Fechar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <form onsubmit={handleSubmit}>
        <div class="admin-modal-body">
          {#if errorMessage}
            <div class="error-banner" role="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMessage}</span>
            </div>
          {/if}

          <div class="fld-group">
            <div class="fld-row">
              <div class="fld">
                <label for="m-name">Nome completo</label>
                <input
                  type="text"
                  id="m-name"
                  placeholder="ex. Marina Pereira"
                  bind:value={name}
                  required
                  disabled={loading}
                />
              </div>
              <div class="fld">
                <label for="m-email">E-mail (deve ser @crianex.com.br)</label>
                <input
                  type="email"
                  id="m-email"
                  placeholder="nome@crianex.com.br"
                  bind:value={email}
                  required
                  disabled={isEditing || loading}
                  class:fld-input-err={emailError}
                />
                {#if emailError}
                  <span class="fld-err" role="alert">{emailError}</span>
                {:else if isEditing}
                  <span class="fld-hint">O e-mail não pode ser alterado após o cadastro.</span>
                {/if}
              </div>
            </div>

            <div class="fld-row">
              <div class="fld">
                <label for="m-role">Papel base</label>
                <select
                  id="m-role"
                  value={displayRole}
                  onchange={handleRoleChange}
                  disabled={loading}
                >
                  {#each ROLE_OPTIONS as opt}
                    <option value={opt}>{opt}</option>
                  {/each}
                </select>
              </div>
              <div class="fld">
                <label for="m-status">Status inicial</label>
                <select id="m-status" bind:value={status} disabled={loading}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            <div class="fld">
              <span class="perm-header" aria-hidden="true">Permissões por módulo</span>
              <div class="perm-matrix" role="group" aria-label="Permissões por módulo">
                <div class="pm-row pm-head">
                  <span>Módulo</span>
                  <span>Visualizar</span>
                  <span>Editar</span>
                  <span>Aprovar</span>
                </div>
                {#each MODULES as mod}
                  <div class="pm-row">
                    <span class="pm-mod">{mod.label}</span>
                    <span>
                      <input
                        type="checkbox"
                        checked={(perms[mod.id] ?? []).includes('v')}
                        onchange={() => togglePerm(mod.id, 'v')}
                        disabled={loading}
                      />
                    </span>
                    <span>
                      <input
                        type="checkbox"
                        checked={(perms[mod.id] ?? []).includes('e')}
                        onchange={() => togglePerm(mod.id, 'e')}
                        disabled={loading}
                      />
                    </span>
                    <span>
                      <input
                        type="checkbox"
                        checked={(perms[mod.id] ?? []).includes('a')}
                        onchange={() => togglePerm(mod.id, 'a')}
                        disabled={loading}
                      />
                    </span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="info-tip">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="tip-icon"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span
                >O membro receberá um e-mail com link de ativação. O acesso só é concedido após
                login via Google Workspace com o e-mail informado.</span
              >
            </div>
          </div>
        </div>

        <footer class="admin-modal-foot">
          <button type="button" class="btn ghost sm" onclick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" class="btn sm" disabled={loading}>
            {#if loading}
              Salvando…
            {:else if isEditing}
              Salvar alterações
            {:else}
              Cadastrar e enviar convite
            {/if}
          </button>
        </footer>
      </form>
    </div>
  </div>
{/if}

<style>
  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 8px;
    padding: 10px 12px;
    color: #ef4444;
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .fld-input-err {
    border-color: #ef4444 !important;
  }

  .fld-err {
    font-size: 11.5px;
    color: #ef4444;
    margin-top: 2px;
  }

  .fld-hint {
    font-size: 11.5px;
    color: var(--text-faint);
    margin-top: 2px;
  }

  .perm-header {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  /* Permissions matrix */
  .perm-matrix {
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
    margin-top: 4px;
  }

  .pm-row {
    display: grid;
    grid-template-columns: 1fr 80px 80px 80px;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }

  .pm-row:last-child {
    border-bottom: none;
  }

  .pm-head {
    background: var(--bg-soft);
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .pm-row span {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pm-row span:first-child {
    justify-content: flex-start;
  }

  .pm-mod {
    font-size: 12.5px;
    color: var(--text);
  }

  .pm-row input[type='checkbox'] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--purple);
  }

  /* Info tip */
  .info-tip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .tip-icon {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--purple);
  }
</style>
