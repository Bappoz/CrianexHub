# IT2 — Protótipo do CRM Interno (CP1)

Protótipo de alta fidelidade do CRM interno (pipeline de leads em Kanban) desenvolvido em HTML, produzido para validar o fluxo com o cliente antes da codificação. Abaixo está o vídeo da apresentação ao cliente e o protótipo interativo embarcado para interação direta.

---

## Vídeo de Apresentação ao Cliente

<div style="position: relative; max-width: 800px; margin: 0 auto;">
  <iframe
    width="100%"
    height="450"
    src="https://www.youtube.com/embed/DuHI0j7OKhg"
    title="Apresentação do protótipo CRM Crianex ao cliente"
    style="border: 1px solid #ddd; border-radius: 4px; display: block;"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen>
  </iframe>
</div>

---

## Protótipo Interativo

<div style="margin-bottom: 8px; text-align: right;">
  <button onclick="document.getElementById('proto-crm-modal').style.display='flex'"
          style="padding: 6px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
    ⛶ &nbsp;Abrir em tela cheia
  </button>
</div>
<iframe
  src="../../prototipo/PrototipoCrianexCRM/CRM%20Crianex.html"
  width="100%"
  height="600px"
  style="border: 1px solid #ddd; border-radius: 4px; display: block;"
  allowfullscreen>
</iframe>

<div id="proto-crm-modal"
     onclick="if(event.target===this)this.style.display='none'"
     style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.80); z-index:9999; align-items:center; justify-content:center;">
  <div style="position:relative; width:88%; height:88%;">
    <button onclick="document.getElementById('proto-crm-modal').style.display='none'"
            style="position:absolute; top:-38px; right:0; padding:6px 16px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-weight:500;">
      ✕ &nbsp;Fechar
    </button>
    <iframe
      src="../../prototipo/PrototipoCrianexCRM/CRM%20Crianex.html"
      width="100%"
      height="100%"
      style="border: none; border-radius: 4px; display: block;"
      allowfullscreen>
    </iframe>
  </div>
</div>

<script>
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') document.getElementById('proto-crm-modal').style.display = 'none';
});
</script>

---

## Feedback do Cliente

> Aguardando retorno do cliente sobre o protótipo apresentado no vídeo acima. Esta seção será preenchida após a resposta.

<!-- TODO: preencher após o cliente responder -->
