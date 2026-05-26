<script lang="ts">
  import ContactInfo from './ContactInfo.svelte';
  import ContactForm from './ContactForm.svelte';
</script>

<svelte:head>
  <title>Contato — Crianex Hub</title>
  <meta
    name="description"
    content="Entre em contato com a equipe Crianex. Respondemos em até 24 horas úteis."
  />
</svelte:head>

<div class="contact-layout">
  <ContactInfo />
  <ContactForm />
</div>

<style>
  :root {
    --bg-elev: #ffffff;
    --bg: #fcfcfc;
    --line: #e8e6e2;
    --text-muted: #6b6862;
    --text-faint: #9a968e;
    --accent-soft: rgba(127, 63, 229, 0.08);
    --pos-soft: rgba(102, 223, 122, 0.18);
    --pos-deep: #2b8a3e;
    --r-lg: 18px;
  }

  .contact-layout {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 64px;
    padding: 80px 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .contact-layout {
      grid-template-columns: 1fr;
      gap: 36px;
      padding: 48px 20px;
    }
  }
</style>
