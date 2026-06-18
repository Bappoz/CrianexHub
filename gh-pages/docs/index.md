<div class="crianex-hero">
  <h1>Crianex Hub</h1>
  <p>Plataforma de Gestão e Portfólio de Projetos SaaS — documentação centralizada da equipe</p>
</div>

---

## Sobre o Projeto

**Crianex** é um software SaaS de gestão e portfólio de projetos, desenvolvido como projeto da disciplina de Requisitos de Software (REQ-2026.1-T02).

| Informação | Detalhe                               |
| ---------- | ------------------------------------- |
| Disciplina | Requisitos de Software — 2026.1       |
| Turma      | T02                                   |
| Produto    | Plataforma SaaS de Gestão de Projetos |

---

## Objetivo do Projeto

O projeto é desenvolvido no contexto da disciplina de **Requisitos de Software (REQ — 2026.1)** da Universidade de Brasília (UnB), com a finalidade de aplicar, de forma sistemática, as atividades do processo de Engenharia de Requisitos (ER) sobre um produto de software com domínio e stakeholders reais.

O escopo acadêmico compreende a execução das **seis atividades canônicas de Engenharia de Requisitos**, executadas por meio do processo híbrido **FDD + Kanban**:

| Atividade de ER               | Técnicas / Artefatos Utilizados                                                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Elicitação e Descoberta**   | Entrevistas semiestruturadas, Rich Picture, Diagrama de Ishikawa e Brainstorming com stakeholders (Otávio Maya — CTO)                                                                                                                                              |
| **Análise e Consenso**        | Decomposição em Características de Produto (CPs), Feature Sets e Features; refinamento com Vertical Slicing e INVEST; priorização por Matriz Valor × Esforço e Índice de Prioridade `IP = VB / ((CX + ES) / 2)`, alinhada às CPs e aos Objetivos Específicos (OEs) |
| **Declaração**                | Features no formato FDD `<ação> o <resultado> <por/para> um <objeto>`, com critérios de aceitação no formato _Dado / Quando / Então_ (BDD)                                                                                                                         |
| **Representação**             | Diagrama de domínio, glossário de termos e Feature Matrix; visualizações do backlog publicadas no site                                                                                                                                                             |
| **Verificação e Validação**   | Definition of Ready (DoR), Definition of Done (DoD), inspeções formais via Pull Request e validação contínua com o cliente ao longo das iterações                                                                                                                  |
| **Organização e Atualização** | Rastreabilidade OEs → CPs → Funcionalidades; versionamento via Git e histórico de revisão em cada artefato; backlog priorizado e artefatos publicados/versionados via GitHub Pages (MkDocs Material)                                                               |

O produto objeto deste processo de ER é a **Crianex Hub**: plataforma administrativa centralizada composta por painel de gestão interno e vitrine digital bilíngue (PT/EN), desenvolvida para a Software House B2B Crianex. Os requisitos derivam diretamente dos três Objetivos Específicos (OEs) levantados junto aos clientes reais e se materializam nas nove Características de Produto (CPs) que compõem o backlog do projeto.

---

## Integrantes

<div class="crianex-members">
  <div class="crianex-member">
    <img src="https://github.com/Bappoz.png?size=200" alt="Lucas A. Zanetti">
    <p class="crianex-member__name">Lucas</p>
    <p class="crianex-member__role">Tech Lead</p>
  </div>
  <div class="crianex-member">
    <img src="https://github.com/knz13.png?size=200" alt="Otávio">
    <p class="crianex-member__name">Otávio</p>
    <p class="crianex-member__role">Cliente</p>
  </div>
  <div class="crianex-member">
    <img src="https://github.com/Phill-Chill.png?size=200" alt="Philipe">
    <p class="crianex-member__name">Philipe</p>
    <p class="crianex-member__role">QA / Dev</p>
  </div>
  <div class="crianex-member">
    <img src="https://github.com/HeitorM50.png?size=200" alt="Heitor">
    <p class="crianex-member__name">Heitor</p>
    <p class="crianex-member__role">QA / Dev</p>
  </div>
  <div class="crianex-member">
    <img src="https://github.com/HugoFreitass.png?size=200" alt="Hugo">
    <p class="crianex-member__name">Hugo</p>
    <p class="crianex-member__role">Dev</p>
  </div>
  <div class="crianex-member">
    <img src="https://github.com/Camile0318.png?size=200" alt="Camile">
    <p class="crianex-member__name">Camile</p>
    <p class="crianex-member__role">Dev</p>
  </div>
  <div class="crianex-member">
    <img src="https://github.com/LeoFacB.png?size=200" alt="Leonardo">
    <p class="crianex-member__name">Leonardo</p>
    <p class="crianex-member__role">Dev</p>
  </div>
</div>

---

## Histórico de Revisão

| Versão | Data       | Descrição                                                                                                                                         | Autor(es)             |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1.0    | 13/04/2026 | Criação da home page com cards de navegação e visão geral                                                                                         | Lucas A. Zanetti      |
| 1.1    | 13/04/2026 | Adição de seção de integrantes, objetivo do projeto e histórico de revisão                                                                        | Equipe Crianex        |
| 1.2    | 13/04/2026 | Remoção dos dos links redirecionaveis bugados                                                                                                     | Lucas A.              |
| 1.3    | 05/05/2026 | Reescrita da seção Objetivo do Projeto                                                                                                            | Lucas A. Zanetti      |
| 1.4    | 15/06/2026 | Correção dos contadores: 5 OEs → 3 OEs e 15 CPs → 9 CPs                                                                                           | Heitor Macedo Ricardo |
| 1.5    | 17/06/2026 | Alinhamento da tabela de atividades de ER ao framework canônico (seis atividades): correção dos nomes não-canônicos e redistribuição das técnicas | Heitor                |
