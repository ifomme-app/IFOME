// Balão do assistente do IFOMME: botão flutuante que abre uma conversa.
//
// A pergunta vai para /api/chat, que é quem fala com a IA. Se a função não
// estiver disponível, por falta de chave ou por queda, o balão responde pela
// base que já vem aqui, para o visitante nunca bater numa porta fechada.
//
// Tudo é montado com createElement e textContent, nunca innerHTML: o que a IA
// devolve entra como texto, não como HTML.
(function () {
  if (window.__ifommeBalao) return;
  window.__ifommeBalao = true;

  var T = {
    abrir: "Perguntar ao assistente",
    rotulo: "Dúvidas",
    titulo: "Pergunte sobre o IFOMME",
    sub: "Responde com o conteúdo do projeto",
    fechar: "Fechar o assistente",
    ola: "Olá. Pode perguntar como doar, o que pode e o que não pode, como as instituições são verificadas ou como o app foi feito.",
    chips: ["Como faço uma doação?", "Posso doar comida pronta?", "Como o app escolhe a instituição?"],
    campo: "Sua pergunta",
    placeholder: "Escreva sua pergunta",
    enviar: "Perguntar",
    pensando: "Pensando...",
    curta: "Escreva uma pergunta com pelo menos algumas palavras.",
    limite: "O limite de perguntas de hoje foi atingido. Tente de novo amanhã.",
    nota: "Respostas automáticas podem conter erros. Não escreva dados pessoais.",
  };

  // Base local: responde sozinha quando a função do servidor não está no ar.
  var BASE = [
    {
      termos: ["como doar", "como dou", "quero doar", "fazer uma doacao", "quais passos",
        "passo a passo", "comecar a doar", "doar", "doacao"],
      resposta:
        "A doação tem quatro passos. Primeiro você escolhe o que tem para doar, entre alimentos, roupas, dinheiro, voluntariado, material escolar, higiene e móveis. Depois informa a quantidade e a descrição. No terceiro passo escolhe entre coleta por um voluntário ou entrega no local. No quarto, o app mostra as instituições ordenadas pela compatibilidade com a sua doação e você escolhe uma.",
    },
    {
      termos: [
        "comida pronta",
        "posso doar",
        "pode doar",
        "o que pode",
        "não pode",
        "nao pode",
        "regras",
        "vencido",
        "validade",
        "sobra",
        "restos",
        "marmita",
      ],
      resposta:
        "Pode doar alimento in natura, industrializado ou preparado, excedente que não foi vendido ou sobra segura para consumo. Não pode doar resto já servido ou manipulado pelo consumidor, nem produto vencido ou impróprio. O app mostra essas regras antes de você confirmar e registra a sua declaração.",
    },
    {
      termos: ["como escolhe", "escolhe a instituic", "escolhe a ong", "melhor ponte",
        "compatibilidade", "pontuacao", "criterio", "ranking", "ordena", "escolhe", "nota"],
      resposta:
        "O app dá uma nota a cada instituição para aquela doação específica. Pesa se ela pediu exatamente aquela categoria, se o pedido está marcado como urgente, a distância até você e o selo de verificação. Quem faz coleta ganha ponto quando você pede coleta. A nota vem com o motivo escrito do lado, então você vê por que aquela instituição está em primeiro.",
    },
    {
      termos: ["responsabilidade", "15.224", "juridic", "processar", "ser processado",
        "passar mal", "intoxic", "advogado", "culpa", "lei"],
      resposta:
        "Pela Lei 15.224 de 2025, doador e instituição só respondem por dano se houver dolo, e a doação não configura relação de consumo. A responsabilidade do doador termina na primeira entrega. Essa lei revogou a Lei 14.016 de 2020.",
    },
    {
      termos: [
        "verific",
        "selo",
        "inspe",
        "confiar",
        "confiavel",
        "golpe",
        "fraude",
        "quem aprova",
        "e seguro",
      ],
      resposta:
        "Instituição não entra na rede sem inspeção. O resultado fica visível ao lado do nome: verificada, em inspeção ou pendente. Assim você sabe com quem está falando antes de doar.",
    },
    {
      termos: ["doar dinheiro", "quanto custa", "cobra taxa", "pagamento", "dinheiro",
        "gratis", "pix", "pagar", "taxa"],
      resposta:
        "O IFOMME não processa pagamento e não cobra taxa. Na categoria dinheiro ele mostra a chave Pix da instituição e você paga pelo seu próprio banco.",
    },
    {
      termos: ["depois de doar", "minha doacao", "minha doação", "acompanh", "rastre",
        "chegou", "entregue", "etapa", "andamento", "status", "recebi"],
      resposta:
        "Depois de registrada, a doação passa por cinco etapas: registrada, confirmada pela instituição, coleta ou entrega, recebida e impacto relatado. Quem confirma cada etapa é quem recebe. Você e a instituição conversam dentro do app.",
    },
    {
      termos: ["como foi feito", "arquitetura", "tecnologia", "framework", "codigo aberto",
        "open source", "cloudflare", "github", "codigo", "stack", "banco de dados"],
      resposta:
        "A interface é HTML, CSS e JavaScript sem framework. A hospedagem é Cloudflare Pages, a API roda em Pages Functions e o banco é o Cloudflare D1. Quem decide o acesso é o servidor, não o navegador. O código é aberto em https://github.com/ifomme-app/IFOME.",
    },
    {
      termos: ["para que serve", "o que e o ifomme", "como funciona", "hack brasil",
        "hackathon", "quem fez", "o que e", "o que é", "projeto", "serve"],
      resposta:
        "O IFOMME conecta quem tem o que doar com instituições próximas e verificadas. Foi feito para o Hack Brasil 2026, na trilha de logística e automação. A página que explica o projeto é https://ifomme.pages.dev/sobre.",
    },
    {
      termos: ["minha instituic", "sou de uma ong", "minha ong", "quero receber",
        "como participo", "quero me cadastrar", "cadastr"],
      resposta:
        "A instituição publica o que precisa hoje, com quantidade, urgência e horário de recebimento, e passa por inspeção antes de ganhar o selo. Nesta demonstração os perfis de instituição, inspetor e equipe ficam disponíveis mediante aprovação da equipe.",
    },
  ];

  var SEM_RESPOSTA =
    "Não tenho essa informação aqui. A página https://ifomme.pages.dev/sobre explica o projeto inteiro.";

  function semAcento(t) {
    return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Resposta local: ganha o assunto com os termos mais específicos. O peso é o
  // tamanho do termo, senão uma palavra solta como "doar", que aparece em quase
  // toda pergunta, venceria de "comida pronta".
  function respostaLocal(pergunta) {
    var p = semAcento(pergunta);
    var melhor = null;
    var maior = 0;
    BASE.forEach(function (item) {
      var peso = 0;
      item.termos.forEach(function (t) {
        if (p.indexOf(semAcento(t)) !== -1) peso += t.length;
      });
      if (peso > maior) {
        maior = peso;
        melhor = item;
      }
    });
    return melhor ? melhor.resposta : SEM_RESPOSTA;
  }

  var CSS = [
    ".ifb-botao{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:8px;",
    "border:0;cursor:pointer;border-radius:999px;padding:13px 18px;font:inherit;font-weight:800;font-size:15px;",
    "background:var(--brand,#CC4700);color:var(--brand-ink,#fff);box-shadow:0 10px 26px rgba(0,0,0,.26)}",
    ".ifb-botao:hover{filter:brightness(1.07)}",
    ".ifb-botao:focus-visible{outline:3px solid var(--accent,#FFC21A);outline-offset:3px}",
    ".ifb-botao svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2;",
    "stroke-linecap:round;stroke-linejoin:round}",
    ".ifb-painel{position:fixed;right:18px;bottom:84px;z-index:71;width:min(382px,calc(100vw - 32px));",
    "max-height:min(600px,calc(100vh - 120px));display:flex;flex-direction:column;overflow:hidden;",
    "background:var(--surface,#fff);color:var(--ink,#2F2620);border:1px solid var(--line,#EEE5DB);",
    "border-radius:18px;box-shadow:0 22px 60px rgba(0,0,0,.3)}",
    ".ifb-painel[hidden]{display:none}",
    ".ifb-cabeca{display:flex;align-items:flex-start;gap:10px;padding:14px 14px 12px;",
    "border-bottom:1px solid var(--line,#EEE5DB);background:var(--sunk,#F7F2EC)}",
    ".ifb-cabeca strong{display:block;font-size:15px}",
    ".ifb-cabeca span{display:block;font-size:12.5px;color:var(--muted,#756A60);margin-top:2px}",
    ".ifb-x{margin-left:auto;background:none;border:0;cursor:pointer;color:var(--muted,#756A60);",
    "padding:4px;border-radius:8px;line-height:0}",
    ".ifb-x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}",
    ".ifb-x:hover{background:var(--line,#EEE5DB);color:var(--ink,#2F2620)}",
    ".ifb-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}",
    ".ifb-msg{max-width:92%;padding:10px 13px;border-radius:14px;font-size:14.5px;line-height:1.5}",
    ".ifb-msg p{margin:0 0 7px}.ifb-msg p:last-child{margin:0}",
    ".ifb-msg ul{margin:4px 0 0;padding-left:18px}.ifb-msg li{margin:3px 0}",
    ".ifb-msg.ia{align-self:flex-start;background:var(--sunk,#F7F2EC);border-bottom-left-radius:5px}",
    ".ifb-msg.eu{align-self:flex-end;background:var(--brand,#CC4700);color:var(--brand-ink,#fff);",
    "border-bottom-right-radius:5px}",
    ".ifb-msg.espera{opacity:.65;font-style:italic}",
    ".ifb-msg.aviso{align-self:flex-start;background:var(--accent-soft,#FFF2CC);color:var(--ink,#2F2620);",
    "font-size:13.5px}",
    ".ifb-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 12px}",
    ".ifb-chips[hidden]{display:none}",
    ".ifb-chip{cursor:pointer;font:inherit;font-size:12.5px;font-weight:700;padding:7px 11px;",
    "border-radius:999px;border:1px solid var(--line,#EEE5DB);background:var(--surface,#fff);",
    "color:var(--ink,#2F2620);text-align:left}",
    ".ifb-chip:hover{border-color:var(--brand,#CC4700);color:var(--brand,#CC4700)}",
    ".ifb-form{display:flex;gap:8px;padding:11px 14px;border-top:1px solid var(--line,#EEE5DB)}",
    ".ifb-form textarea{flex:1;resize:none;font:inherit;font-size:14px;padding:9px 11px;border-radius:11px;",
    "border:1px solid var(--line,#EEE5DB);background:var(--bg,#FFFDFA);color:var(--ink,#2F2620)}",
    ".ifb-form textarea:focus{outline:2px solid var(--brand,#CC4700);outline-offset:-1px}",
    ".ifb-form button{cursor:pointer;border:0;border-radius:11px;padding:0 15px;font:inherit;font-weight:800;",
    "font-size:14px;background:var(--brand,#CC4700);color:var(--brand-ink,#fff)}",
    ".ifb-form button:disabled{opacity:.55;cursor:default}",
    ".ifb-nota{margin:0;padding:0 14px 12px;font-size:11.5px;line-height:1.45;color:var(--muted,#756A60)}",
    ".ifb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    // No celular o aplicativo tem barra de abas fixa embaixo: o balão sobe
    // acima dela para não tapar nenhum botão.
    "@media (max-width:520px){.ifb-botao{right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));",
    "padding:14px}.ifb-rotulo{display:none}",
    ".ifb-painel{right:10px;left:10px;width:auto;bottom:calc(142px + env(safe-area-inset-bottom,0px));",
    "max-height:calc(100vh - 230px)}}",
    "@media (prefers-reduced-motion:no-preference){.ifb-painel{animation:ifb-sobe .16s ease-out}",
    "@keyframes ifb-sobe{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}",
  ].join("");

  function el(tag, props, filhos) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "texto") n.textContent = props[k];
      else n.setAttribute(k, props[k]);
    });
    (filhos || []).forEach(function (f) {
      if (f) n.appendChild(f);
    });
    return n;
  }

  function icone(d) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
    return svg;
  }

  var BALAO = "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z";
  var X = "M6 6l12 12M18 6L6 18";

  var estilo = el("style", { texto: CSS });
  var botao = el(
    "button",
    {
      type: "button",
      class: "ifb-botao",
      "aria-label": T.abrir,
      "aria-expanded": "false",
      "aria-controls": "ifbPainel",
    },
    [icone(BALAO), el("span", { class: "ifb-rotulo", texto: T.rotulo })],
  );
  var fechar = el("button", { type: "button", class: "ifb-x", "aria-label": T.fechar }, [icone(X)]);
  var log = el("div", { class: "ifb-log", role: "log", "aria-live": "polite" }, [
    el("div", { class: "ifb-msg ia" }, [el("p", { texto: T.ola })]),
  ]);
  var chips = el(
    "div",
    { class: "ifb-chips" },
    T.chips.map(function (c) {
      return el("button", { type: "button", class: "ifb-chip", texto: c });
    }),
  );
  var campo = el("textarea", {
    id: "ifbPergunta",
    rows: "2",
    maxlength: "600",
    placeholder: T.placeholder,
    required: "",
  });
  var enviar = el("button", { type: "submit", texto: T.enviar });
  var form = el("form", { class: "ifb-form", novalidate: "" }, [
    el("label", { class: "ifb-sr", for: "ifbPergunta", texto: T.campo }),
    campo,
    enviar,
  ]);
  var painel = el(
    "div",
    {
      class: "ifb-painel",
      id: "ifbPainel",
      role: "dialog",
      "aria-labelledby": "ifbTitulo",
      hidden: "",
    },
    [
      el("div", { class: "ifb-cabeca" }, [
        el("div", {}, [
          el("strong", { id: "ifbTitulo", texto: T.titulo }),
          el("span", { texto: T.sub }),
        ]),
        fechar,
      ]),
      log,
      chips,
      form,
      el("p", { class: "ifb-nota", texto: T.nota }),
    ],
  );

  document.head.appendChild(estilo);
  document.body.appendChild(painel);
  document.body.appendChild(botao);

  // Monta a bolha em parágrafos e listas simples. Nada entra como HTML.
  function bolha(de, texto) {
    var caixa = el("div", { class: "ifb-msg " + de });
    var lista = null;
    String(texto)
      .replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
      .replace(/\*\*|__|`/g, "")
      .split(/\n+/)
      .forEach(function (linha) {
        var l = linha.trim();
        if (!l) return;
        var item = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
        if (item) {
          if (!lista) {
            lista = el("ul");
            caixa.appendChild(lista);
          }
          lista.appendChild(el("li", { texto: item[1] }));
        } else {
          lista = null;
          caixa.appendChild(el("p", { texto: l.replace(/^#+\s*/, "") }));
        }
      });
    log.appendChild(caixa);
    log.scrollTop = log.scrollHeight;
    return caixa;
  }

  var historico = [];
  // Quando a função de IA não está configurada, ela responde 503. Depois do
  // primeiro, nem tentamos de novo nesta visita: a resposta local sai na hora,
  // sem a espera de uma chamada que já sabemos que falha.
  var semServidor = false;

  async function perguntar(pergunta) {
    if (pergunta.length < 4) {
      bolha("aviso", T.curta);
      return;
    }
    bolha("eu", pergunta);
    chips.hidden = true;
    campo.value = "";
    enviar.disabled = true;
    campo.disabled = true;
    var espera = bolha("ia espera", T.pensando);
    var resposta = null;
    var limite = false;
    if (!semServidor) {
      try {
        var resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pergunta: pergunta, historico: historico.slice(-6) }),
        });
        var dados = await resp.json().catch(function () {
          return {};
        });
        if (resp.ok && dados.resposta) resposta = dados.resposta;
        else if (dados.erro === "limite" || dados.erro === "cota") limite = true;
        else if (resp.status === 503) semServidor = true;
      } catch (e) {
        // sem rede ou função fora do ar: cai na base local
        semServidor = true;
      }
    }
    espera.remove();
    if (limite) {
      bolha("aviso", T.limite);
    } else {
      if (!resposta) resposta = respostaLocal(pergunta);
      bolha("ia", resposta);
      historico.push({ de: "eu", texto: pergunta }, { de: "ia", texto: resposta });
    }
    enviar.disabled = false;
    campo.disabled = false;
    campo.focus();
  }

  function abrir() {
    painel.hidden = false;
    botao.setAttribute("aria-expanded", "true");
    setTimeout(function () {
      campo.focus();
    }, 50);
  }
  function fecharPainel() {
    painel.hidden = true;
    botao.setAttribute("aria-expanded", "false");
    botao.focus();
  }

  botao.addEventListener("click", function () {
    if (painel.hidden) abrir();
    else fecharPainel();
  });
  fechar.addEventListener("click", fecharPainel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !painel.hidden) fecharPainel();
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!enviar.disabled) perguntar(campo.value.trim());
  });
  campo.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  chips.addEventListener("click", function (e) {
    var chip = e.target.closest(".ifb-chip");
    if (chip && !enviar.disabled) perguntar(chip.textContent.trim());
  });
})();
