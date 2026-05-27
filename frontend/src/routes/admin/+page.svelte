<svelte:head>
  <title>Painel - Crianex Admin</title>
</svelte:head>

<section class="admin-home">
  <p class="eyebrow">Área autenticada</p>
  <h1>Painel administrativo disponível</h1>
  <p>
    O acesso foi validado. Use esta área para navegar pelas rotinas administrativas após concluir o
    login.
  </p>
</section>

<style>
  .admin-home {
    min-height: calc(100vh - 0px);
    display: grid;
    max-width: 720px;
    align-content: center;
    gap: 14px;
    padding: clamp(32px, 6vw, 72px);
  }

  .eyebrow {
    margin: 0;
    color: rgba(252, 252, 252, 0.56);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(32px, 4vw, 52px);
    line-height: 1;
  }

  p:last-child {
    margin: 0;
    max-width: 58ch;
    color: rgba(252, 252, 252, 0.72);
    font-size: 15px;
    line-height: 1.6;
  }
</style>
