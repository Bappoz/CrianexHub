# IT1 — Protótipo de Alta Fidelidade

Protótipo desenvolvido em HTML com base nas features priorizadas para a IT1. Produzido antes do desenvolvimento para validar o fluxo com o cliente antes de codar.

Duas versões foram produzidas: a **V1** foi apresentada ao cliente Otávio, que solicitou ajustes pontuais; a **V2** incorpora as correções requisitadas. O protótipo embarcado abaixo é a versão final (V2).

---

## Protótipo Interativo (V2)

<div style="margin-bottom: 8px; text-align: right;">
  <button onclick="document.getElementById('proto-modal').style.display='flex'"
          style="padding: 6px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
    ⛶ &nbsp;Abrir em tela cheia
  </button>
</div>
<iframe
  src="../../prototipo/PrototipoCrianexV2/Crianex%20Hub.html"
  width="100%"
  height="540px"
  style="border: 1px solid #ddd; border-radius: 4px; display: block;"
  allowfullscreen>
</iframe>

<div id="proto-modal"
     onclick="if(event.target===this)this.style.display='none'"
     style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.80); z-index:9999; align-items:center; justify-content:center;">
  <div style="position:relative; width:88%; height:88%;">
    <button onclick="document.getElementById('proto-modal').style.display='none'"
            style="position:absolute; top:-38px; right:0; padding:6px 16px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-weight:500;">
      ✕ &nbsp;Fechar
    </button>
    <iframe
      src="../../prototipo/PrototipoCrianexV2/Crianex%20Hub.html"
      width="100%"
      height="100%"
      style="border: none; border-radius: 4px; display: block;"
      allowfullscreen>
    </iframe>
  </div>
</div>

<script>
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') document.getElementById('proto-modal').style.display = 'none';
});
</script>

---

## Validação pelo Cliente

### Feedback Recebido (V1)

<div align="center">
  <p><strong>Figura 1</strong> — Feedback do cliente Otávio sobre o Protótipo V1</p>
  <img src="../../images/feedback_prototipo.png" alt="Feedback sobre protótipo" width="800">
  <p><em>Fonte: Comunicação direta com o cliente (Domain Expert).</em></p>
</div>

O cliente solicitou ajustes pontuais após a apresentação da V1. A equipe produziu a **V2** incorporando todas as correções solicitadas. O protótipo embarcado acima é a versão final (V2).
