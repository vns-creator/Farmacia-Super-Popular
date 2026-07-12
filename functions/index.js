const admin = require("firebase-admin");
const {
  onCall,
  onRequest,
  HttpsError,
} = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const {
  FORMAS_PAGAMENTO,
  STATUS_PAGAMENTO,
  getStatusInicialPagamento,
  isPagamentoOnline,
  mapMercadoPagoStatus,
  normalizarFormaPagamento,
} = require("./paymentUtils");

admin.initializeApp();

const db = admin.firestore();
const mercadoPagoAccessToken = defineSecret("MERCADO_PAGO_ACCESS_TOKEN");
const mercadoPagoWebhookUrl =
  "https://us-central1-farmaciasp-app.cloudfunctions.net/webhookPagamento";

const filiais = [
  {
    id: "filial-efapi-tancredo",
    nome: "Filial Efapi (Tancredo)",
    endereco: "Rua Cunha Pora, 555E - Efapi",
  },
  {
    id: "filial-efapi-atilio-fontana",
    nome: "Filial Efapi (Atilio Fontana)",
    endereco: "Av. Sen. Atilio Fontana, 2500E - Efapi",
  },
  {
    id: "filial-palmital",
    nome: "Filial Palmital",
    endereco: "Av. Nereu Ramos, 180E - Palmital",
  },
  {
    id: "filial-lider",
    nome: "Filial Lider",
    endereco: "Av. Fernando Machado, 3674D - Lider",
  },
];

const coberturaEntrega = [
  {
    bairro: "Centro",
    filialId: "filial-lider",
    taxaEntrega: 6.9,
    cepPrefixes: ["89801"],
  },
  {
    bairro: "Lider",
    filialId: "filial-lider",
    taxaEntrega: 6.9,
    aliases: ["lider"],
    cepPrefixes: ["89805"],
  },
  {
    bairro: "Passo dos Fortes",
    filialId: "filial-lider",
    taxaEntrega: 6.9,
    cepPrefixes: ["89805"],
  },
  {
    bairro: "Presidente Medici",
    filialId: "filial-lider",
    taxaEntrega: 7.9,
    aliases: ["presidente medici"],
    cepPrefixes: ["89801", "89806"],
  },
  {
    bairro: "Maria Goretti",
    filialId: "filial-lider",
    taxaEntrega: 7.9,
    cepPrefixes: ["89801", "89806"],
  },
  {
    bairro: "Sao Cristovao",
    filialId: "filial-lider",
    taxaEntrega: 7.9,
    aliases: ["sao cristovao"],
    cepPrefixes: ["89803", "89804"],
  },
  {
    bairro: "Jardim America",
    filialId: "filial-lider",
    taxaEntrega: 7.9,
    cepPrefixes: ["89803"],
  },
  {
    bairro: "Jardim Italia",
    filialId: "filial-lider",
    taxaEntrega: 7.9,
    cepPrefixes: ["89802", "89814"],
  },
  {
    bairro: "Bela Vista",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89804"],
  },
  {
    bairro: "Jardins",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89804"],
  },
  {
    bairro: "Parque das Palmeiras",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89803"],
  },
  {
    bairro: "Boa Vista",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89806"],
  },
  {
    bairro: "Bom Pastor",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89806"],
  },
  {
    bairro: "Sao Pedro",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89806"],
  },
  {
    bairro: "Pinheirinho",
    filialId: "filial-lider",
    taxaEntrega: 8.9,
    cepPrefixes: ["89806"],
  },
  {
    bairro: "Bom Retiro",
    filialId: "filial-lider",
    taxaEntrega: 9.9,
    cepPrefixes: ["89805", "89811"],
  },
  {
    bairro: "Santa Paulina",
    filialId: "filial-lider",
    taxaEntrega: 9.9,
    cepPrefixes: ["89805", "89811"],
  },
  {
    bairro: "SAIC",
    filialId: "filial-lider",
    taxaEntrega: 9.9,
    aliases: ["saic"],
    cepPrefixes: ["89802"],
  },
  {
    bairro: "Fronteira Sul",
    filialId: "filial-lider",
    taxaEntrega: 10.9,
    cepPrefixes: ["89808"],
  },
  {
    bairro: "Autodromo",
    filialId: "filial-lider",
    taxaEntrega: 10.9,
    cepPrefixes: ["89808"],
  },
  {
    bairro: "Araras",
    filialId: "filial-lider",
    taxaEntrega: 10.9,
    cepPrefixes: ["89808"],
  },
  {
    bairro: "Desbravador",
    filialId: "filial-lider",
    taxaEntrega: 10.9,
    cepPrefixes: ["89811"],
  },
  {
    bairro: "Lajeado",
    filialId: "filial-lider",
    taxaEntrega: 11.9,
    cepPrefixes: ["89804"],
  },
  {
    bairro: "Jardins do Vale",
    filialId: "filial-lider",
    taxaEntrega: 11.9,
    cepPrefixes: ["89807"],
  },
  {
    bairro: "Sao Lucas",
    filialId: "filial-lider",
    taxaEntrega: 9.9,
    cepPrefixes: ["89806", "89812"],
  },
  {
    bairro: "Paraiso",
    filialId: "filial-lider",
    taxaEntrega: 9.9,
    cepPrefixes: ["89806"],
  },
  {
    bairro: "Efapi",
    filialId: "filial-efapi-tancredo",
    taxaEntrega: 6.9,
    cepPrefixes: ["89809"],
  },
  {
    bairro: "Eldorado",
    filialId: "filial-efapi-tancredo",
    taxaEntrega: 7.9,
    cepPrefixes: ["89810"],
  },
  {
    bairro: "Cristo Rei",
    filialId: "filial-efapi-tancredo",
    taxaEntrega: 7.9,
    cepPrefixes: ["89810"],
  },
  {
    bairro: "Alvorada",
    filialId: "filial-efapi-tancredo",
    taxaEntrega: 8.9,
    cepPrefixes: ["89804", "89810"],
  },
  {
    bairro: "Engenho Braun",
    filialId: "filial-efapi-tancredo",
    taxaEntrega: 9.9,
    cepPrefixes: ["89804", "89809"],
  },
  {
    bairro: "Agua Santa",
    filialId: "filial-efapi-tancredo",
    taxaEntrega: 9.9,
    cepPrefixes: ["89810"],
  },
  {
    bairro: "Belvedere",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 7.9,
    cepPrefixes: ["89810"],
  },
  {
    bairro: "Trevo",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 7.9,
    cepPrefixes: ["89810"],
  },
  {
    bairro: "Vila Rica",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 8.9,
    cepPrefixes: ["89810"],
  },
  {
    bairro: "Alto da Serra",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 12.9,
    cepPrefixes: ["89816"],
  },
  {
    bairro: "Goio-En",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 14.9,
    aliases: ["goio en"],
    cepPrefixes: ["89816"],
  },
  {
    bairro: "Centro Marechal Bormann",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 14.9,
    aliases: ["centro marechal bormann", "marechal bormann"],
    cepPrefixes: ["89816"],
  },
  {
    bairro: "Figueira",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 14.9,
    cepPrefixes: ["89816"],
  },
  {
    bairro: "Vederti",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 14.9,
    cepPrefixes: ["89816"],
  },
  {
    bairro: "Perimetral",
    filialId: "filial-efapi-atilio-fontana",
    taxaEntrega: 14.9,
    cepPrefixes: ["89816"],
  },
  {
    bairro: "Palmital",
    filialId: "filial-palmital",
    taxaEntrega: 6.9,
    cepPrefixes: ["89812", "89814"],
  },
  {
    bairro: "Santo Antonio",
    filialId: "filial-palmital",
    taxaEntrega: 7.9,
    aliases: ["santo antonio"],
    cepPrefixes: ["89815"],
  },
  {
    bairro: "Universitario",
    filialId: "filial-palmital",
    taxaEntrega: 7.9,
    cepPrefixes: ["89812", "89814"],
  },
  {
    bairro: "Seminario",
    filialId: "filial-palmital",
    taxaEntrega: 7.9,
    cepPrefixes: ["89813", "89814"],
  },
  {
    bairro: "Santa Maria",
    filialId: "filial-palmital",
    taxaEntrega: 8.9,
    cepPrefixes: ["89812"],
  },
  {
    bairro: "Esplanada",
    filialId: "filial-palmital",
    taxaEntrega: 8.9,
    cepPrefixes: ["89812"],
  },
  {
    bairro: "Dom Pascoal",
    filialId: "filial-palmital",
    taxaEntrega: 8.9,
    cepPrefixes: ["89814"],
  },
  {
    bairro: "Dom Geronimo",
    filialId: "filial-palmital",
    taxaEntrega: 8.9,
    cepPrefixes: ["89811"],
  },
  {
    bairro: "Monte Belo",
    filialId: "filial-palmital",
    taxaEntrega: 8.9,
    cepPrefixes: ["89812"],
  },
  {
    bairro: "Industrial",
    filialId: "filial-palmital",
    taxaEntrega: 9.9,
    cepPrefixes: ["89813"],
  },
  {
    bairro: "Progresso",
    filialId: "filial-palmital",
    taxaEntrega: 9.9,
    cepPrefixes: ["89813"],
  },
  {
    bairro: "Campestre",
    filialId: "filial-palmital",
    taxaEntrega: 11.9,
    cepPrefixes: ["89814"],
  },
  {
    bairro: "Comunidade Palmital dos Fundos",
    filialId: "filial-palmital",
    taxaEntrega: 12.9,
    aliases: ["palmital dos fundos"],
    cepPrefixes: ["89815"],
  },
  {
    bairro: "Quedas do Palmital",
    filialId: "filial-palmital",
    taxaEntrega: 12.9,
    cepPrefixes: ["89815"],
  },
  {
    bairro: "Santos Dumont",
    filialId: "filial-palmital",
    taxaEntrega: 12.9,
    cepPrefixes: ["89815"],
  },
  {
    bairro: "Area Rural de Chapeco",
    filialId: "filial-palmital",
    taxaEntrega: 18.9,
    aliases: ["area rural", "interior"],
    cepPrefixes: ["89815"],
  },
];

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getFilialById(filialId) {
  return filiais.find((filial) => filial.id === filialId) || null;
}

function buscarCoberturaEntrega({ cep, bairro }) {
  const bairroNormalizado = normalizarTexto(bairro);
  const porBairro = coberturaEntrega.filter((item) =>
    [item.bairro, ...(item.aliases || [])].some((nome) =>
      bairroNormalizado.includes(normalizarTexto(nome)),
    ),
  );
  const cepLimpo = String(cep || "").replace(/\D/g, "");
  const prefixoCep = cepLimpo.slice(0, 5);
  const porCep = prefixoCep
    ? coberturaEntrega.filter((item) =>
        item.cepPrefixes?.some((prefixo) => prefixo === prefixoCep),
      )
    : [];
  const candidatos = porBairro.length > 0 ? porBairro : porCep;
  const cobertura = candidatos
    .filter((item) => getFilialById(item.filialId))
    .sort((a, b) => {
      const taxaDiff = Number(a.taxaEntrega || 0) - Number(b.taxaEntrega || 0);
      if (taxaDiff !== 0) return taxaDiff;

      const distanciaA = Number.isFinite(a.distanciaKm)
        ? Number(a.distanciaKm)
        : Number.POSITIVE_INFINITY;
      const distanciaB = Number.isFinite(b.distanciaKm)
        ? Number(b.distanciaKm)
        : Number.POSITIVE_INFINITY;
      return distanciaA - distanciaB;
    })[0];
  const filial = cobertura ? getFilialById(cobertura.filialId) : null;

  return cobertura && filial ? { ...cobertura, filial } : null;
}

function formatSequentialCode(prefix, value, size) {
  return `${prefix}-${String(value).padStart(size, "0")}`;
}

function assertNonEmptyString(value, message) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", message);
  }
}

function sanitizeText(value, maxLength = 500) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function getPagamentoOnline(pagamento, pedidoId) {
  if (!isPagamentoOnline(pagamento)) return null;

  return {
    provedor: "mercado_pago",
    ambiente: "simulado",
    metodo: pagamento === FORMAS_PAGAMENTO.pix ? "pix" : "cartao",
    status: STATUS_PAGAMENTO.aguardandoConfiguracao,
    transacaoId: null,
    qrCode: null,
    copiaECola: null,
    linkPagamento: null,
    mensagem:
      "Pagamento online preparado. Vincule a conta do provedor para ativar a cobranca automatica.",
    pedidoId,
  };
}

function getMercadoPagoToken() {
  const token =
    mercadoPagoAccessToken.value() || process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    throw new HttpsError(
      "failed-precondition",
      "Token do Mercado Pago nao configurado.",
    );
  }

  return token;
}

function getAmbienteMercadoPago(token) {
  return token.startsWith("TEST-") ? "teste" : "producao";
}

async function buscarPagamentoMercadoPago(paymentId, token) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body?.message || "Falha ao consultar pagamento no Mercado Pago.",
    );
  }

  return body;
}

async function atualizarPedidoPorPagamentoMercadoPago(paymentId, token) {
  const pagamento = await buscarPagamentoMercadoPago(paymentId, token);
  const pedidoId =
    pagamento.external_reference ||
    pagamento.metadata?.pedidoId ||
    pagamento.metadata?.pedido_id;

  if (!pedidoId) {
    return { ok: false, reason: "pedido_nao_informado" };
  }

  const statusPagamento = mapMercadoPagoStatus(pagamento.status);
  const pedidoRef = db.collection("pedidos").doc(String(pedidoId));
  const update = {
    "pagamentoDetalhes.status": statusPagamento,
    "pagamentoOnline.status": statusPagamento,
    "pagamentoOnline.statusProvedor": pagamento.status || null,
    "pagamentoOnline.transacaoId": String(pagamento.id || paymentId),
    "pagamentoOnline.atualizadoEm":
      admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (statusPagamento === STATUS_PAGAMENTO.aprovado) {
    update.statusPagamentoConfirmadoEm =
      admin.firestore.FieldValue.serverTimestamp();
  }

  await pedidoRef.update(update);

  return { ok: true, pedidoId, status: statusPagamento };
}

async function criarPreferenciaCartaoMercadoPago({
  pedidoId,
  pedido,
  token,
  email,
}) {
  const total = Number((pedido.total || 0).toFixed(2));

  if (!Number.isFinite(total) || total <= 0) {
    throw new HttpsError("failed-precondition", "Total do pedido invalido.");
  }

  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${pedidoId}-cartao`,
      },
      body: JSON.stringify({
        items: [
          {
            id: pedidoId,
            title: `Pedido ${pedido.codigoPedido || pedidoId} - Farmacia Super Popular`,
            description: "Pagamento online do pedido",
            quantity: 1,
            currency_id: "BRL",
            unit_price: total,
          },
        ],
        payer: {
          email,
          name: pedido.cliente?.nome || "Cliente",
        },
        external_reference: pedidoId,
        notification_url: mercadoPagoWebhookUrl,
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" },
            { id: "bank_transfer" },
          ],
          installments: 12,
        },
        metadata: {
          pedido_id: pedidoId,
          metodo: "cartao",
        },
      }),
    },
  );

  const preferencia = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Erro Mercado Pago Cartao:", preferencia);
    throw new HttpsError(
      "internal",
      preferencia?.message || "Nao foi possivel gerar o pagamento por cartao.",
    );
  }

  return {
    id: String(preferencia.id || ""),
    initPoint:
      getAmbienteMercadoPago(token) === "teste"
        ? preferencia.sandbox_init_point || preferencia.init_point || null
        : preferencia.init_point || preferencia.sandbox_init_point || null,
    total,
  };
}

function assertSignedIn(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Entre para continuar.");
  }
}

async function isAdminAtivo(uid) {
  const usuarioSnap = await db.collection("usuarios").doc(uid).get();

  return (
    usuarioSnap.exists &&
    usuarioSnap.data().perfil === "admin" &&
    usuarioSnap.data().ativo === true
  );
}

async function getPedidoDoUsuario(pedidoId, uid) {
  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();

  if (!pedidoSnap.exists) {
    throw new HttpsError("not-found", "Pedido nao encontrado.");
  }

  const pedido = pedidoSnap.data();

  if (pedido.userUid !== uid && !(await isAdminAtivo(uid))) {
    throw new HttpsError(
      "permission-denied",
      "Pedido pertence a outro usuario.",
    );
  }

  return { pedidoRef, pedido };
}

exports.criarPedido = onCall(async (request) => {
  assertSignedIn(request);

  const uid = request.auth.uid;
  const email = request.auth.token.email || null;
  const data = request.data || {};
  const itensSolicitados = Array.isArray(data.itens) ? data.itens : [];
  const tipoAtendimento = data.tipoAtendimento;
  const pagamento = normalizarFormaPagamento(data.pagamento);

  if (itensSolicitados.length === 0) {
    throw new HttpsError("invalid-argument", "Adicione itens ao carrinho.");
  }

  if (!["entrega", "retirada"].includes(tipoAtendimento)) {
    throw new HttpsError("invalid-argument", "Tipo de atendimento invalido.");
  }

  if (!pagamento) {
    throw new HttpsError("invalid-argument", "Pagamento invalido.");
  }

  assertNonEmptyString(data.cliente?.nome, "Informe o nome.");
  assertNonEmptyString(data.cliente?.telefone, "Informe o telefone.");

  const usuarioRef = db.collection("usuarios").doc(uid);
  const usuarioSnap = await usuarioRef.get();

  if (!usuarioSnap.exists || usuarioSnap.data().ativo !== true) {
    throw new HttpsError(
      "permission-denied",
      "Conta sem permissao para pedidos.",
    );
  }

  const produtos = [];
  let precisaReceita = false;

  for (const item of itensSolicitados) {
    const produtoId = sanitizeText(item?.id, 120);
    const quantidade = Number(item?.quantidade || 0);

    if (
      !produtoId ||
      !Number.isInteger(quantidade) ||
      quantidade < 1 ||
      quantidade > 99
    ) {
      throw new HttpsError("invalid-argument", "Item do carrinho invalido.");
    }

    const produtoSnap = await db.collection("produtos").doc(produtoId).get();

    if (!produtoSnap.exists) {
      throw new HttpsError("failed-precondition", "Produto nao encontrado.");
    }

    const produto = produtoSnap.data();

    if (
      produto.ativo === false ||
      typeof produto.preco !== "number" ||
      produto.preco <= 0
    ) {
      throw new HttpsError("failed-precondition", "Produto indisponivel.");
    }

    if (produto.exigeReceita === true) {
      precisaReceita = true;
    }

    let tamanho = null;

    if (produto.temTamanhos === true) {
      tamanho = sanitizeText(item?.tamanho, 40);
      const tamanhosValidos = Array.isArray(produto.tamanhos)
        ? produto.tamanhos
        : [];

      if (!tamanho || !tamanhosValidos.includes(tamanho)) {
        throw new HttpsError(
          "invalid-argument",
          `Selecione um tamanho valido para ${sanitizeText(produto.nome, 120)}.`,
        );
      }
    }

    produtos.push({
      id: produtoId,
      refPath: `produtos/${produtoId}`,
      nome: sanitizeText(produto.nome, 120),
      preco: Number(produto.preco),
      quantidade,
      categoria: sanitizeText(produto.categoria || "Produto", 60),
      codigoBarras: sanitizeText(produto.codigoBarras || "", 60),
      tamanho,
      exigeReceita: produto.exigeReceita === true,
      filialId: produto.filialId || null,
      filialIds: Array.isArray(produto.filialIds)
        ? produto.filialIds.filter((id) => typeof id === "string" && id.trim())
        : [],
    });
  }

  // So aceita caminhos de Storage dentro da propria pasta do cliente
  // (receitas/{uid}/...), pra impedir que ele referencie o arquivo de
  // receita de outra pessoa no pedido.
  const receitaPaths = (Array.isArray(data.receitaPaths) ? data.receitaPaths : [])
    .map((caminho) => sanitizeText(caminho, 200))
    .filter((caminho) => caminho.startsWith(`receitas/${uid}/`));

  if (precisaReceita && receitaPaths.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      "Anexe a foto da receita medica para concluir o pedido.",
    );
  }

  const entrega = data.entrega || {};
  const retirada = data.retirada || {};
  let filial = null;
  let entregaNormalizada = null;
  let retiradaNormalizada = null;
  let taxaEntrega = 0;

  if (tipoAtendimento === "entrega") {
    ["cep", "endereco", "numero", "bairro", "cidade", "uf"].forEach((campo) => {
      assertNonEmptyString(entrega[campo], `Informe ${campo}.`);
    });

    const cobertura = buscarCoberturaEntrega({
      cep: entrega.cep,
      bairro: entrega.bairro,
    });

    if (!cobertura) {
      throw new HttpsError(
        "failed-precondition",
        "Endereco fora da cobertura de entrega.",
      );
    }

    filial = cobertura.filial;
    taxaEntrega = Number(cobertura.taxaEntrega);
    entregaNormalizada = {
      id: sanitizeText(entrega.id, 120) || null,
      apelido: sanitizeText(entrega.apelido, 80) || "Endereco principal",
      cep: sanitizeText(entrega.cep, 20),
      endereco: sanitizeText(entrega.endereco, 160),
      numero: sanitizeText(entrega.numero, 30),
      bairro: sanitizeText(entrega.bairro, 100),
      cidade: sanitizeText(entrega.cidade, 100),
      uf: sanitizeText(entrega.uf, 2).toUpperCase(),
      complemento: sanitizeText(entrega.complemento, 120),
      filialId: filial.id,
      filialNome: filial.nome,
      bairroCobertura: cobertura.bairro,
      zonaEntrega: cobertura.zona || null,
      taxaEntrega,
    };
  } else {
    const filialId = sanitizeText(retirada.filialId, 120);
    filial = getFilialById(filialId);

    if (!filial) {
      throw new HttpsError(
        "invalid-argument",
        "Filial para retirada invalida.",
      );
    }

    retiradaNormalizada = {
      filialId: filial.id,
      filialNome: filial.nome,
      filialEndereco: filial.endereco,
      local: filial.nome,
      instrucao: "Retirada no balcao",
    };
  }

  const produtoForaDaFilial = produtos.some((produto) => {
    if (produto.filialIds.length > 0) {
      return !produto.filialIds.includes(filial.id);
    }

    return produto.filialId && produto.filialId !== filial.id;
  });

  if (produtoForaDaFilial) {
    throw new HttpsError(
      "failed-precondition",
      "Ha produto indisponivel para a filial selecionada.",
    );
  }

  const precisaTroco =
    pagamento === FORMAS_PAGAMENTO.dinheiro &&
    data.pagamentoDetalhes?.precisaTroco === true;
  const trocoPara = precisaTroco
    ? Number(String(data.pagamentoDetalhes?.trocoPara || "").replace(",", "."))
    : null;

  if (precisaTroco && !Number.isFinite(trocoPara)) {
    throw new HttpsError("invalid-argument", "Valor de troco invalido.");
  }

  const resultado = await db.runTransaction(async (transaction) => {
    const clientePorUidRef = db.collection("clientesPorUid").doc(uid);
    const clientePorUidDoc = await transaction.get(clientePorUidRef);
    let codigoCliente = clientePorUidDoc.exists
      ? clientePorUidDoc.data().codigoCliente
      : null;
    const clienteSequenceRef = db.collection("sequencias").doc("clientes");
    const pedidoSequenceRef = db.collection("sequencias").doc("pedidos");
    const clienteSequenceDoc = codigoCliente
      ? null
      : await transaction.get(clienteSequenceRef);
    const pedidoSequenceDoc = await transaction.get(pedidoSequenceRef);
    const produtoDocs = await Promise.all(
      produtos.map((produto) => transaction.get(db.doc(produto.refPath))),
    );
    let nextClientNumber = null;

    if (!codigoCliente) {
      const currentClientNumber = clienteSequenceDoc.exists
        ? Number(clienteSequenceDoc.data().valor || 0)
        : 0;
      nextClientNumber = currentClientNumber + 1;
      codigoCliente = formatSequentialCode("Cliente", nextClientNumber, 4);
    }

    const currentOrderNumber = pedidoSequenceDoc.exists
      ? Number(pedidoSequenceDoc.data().valor || 0)
      : 0;
    const nextOrderNumber = currentOrderNumber + 1;
    const codigoPedido = formatSequentialCode("Pedido", nextOrderNumber, 5);
    const clienteRef = db.collection("clientes").doc(codigoCliente);
    const pedidoRef = db.collection("pedidos").doc(codigoPedido);
    const notificacaoAdminRef = db.collection("notificacoes").doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Um mesmo produto pode aparecer mais de uma vez no carrinho (tamanhos
    // diferentes). O Firestore nao permite duas chamadas transaction.update()
    // para o mesmo documento na mesma transacao, entao o update de cada
    // produto e sempre montado uma unica vez, mesmo que ele tenha 2+
    // tamanhos diferentes no carrinho.
    const quantidadeTotalPorProduto = new Map();
    const quantidadeTotalPorProdutoTamanho = new Map();

    produtos.forEach((produtoCarrinho) => {
      quantidadeTotalPorProduto.set(
        produtoCarrinho.id,
        (quantidadeTotalPorProduto.get(produtoCarrinho.id) || 0) +
          produtoCarrinho.quantidade,
      );

      if (produtoCarrinho.tamanho) {
        const chave = `${produtoCarrinho.id}::${produtoCarrinho.tamanho}`;
        quantidadeTotalPorProdutoTamanho.set(
          chave,
          (quantidadeTotalPorProdutoTamanho.get(chave) || 0) +
            produtoCarrinho.quantidade,
        );
      }
    });

    const produtosJaProcessados = new Set();
    const precosAtuais = new Map();

    produtoDocs.forEach((produtoDoc, index) => {
      if (!produtoDoc.exists) {
        throw new HttpsError("failed-precondition", "Produto nao encontrado.");
      }

      const produtoCarrinho = produtos[index];
      const produtoAtual = produtoDoc.data();

      if (produtoAtual.ativo === false) {
        throw new HttpsError("failed-precondition", "Produto indisponivel.");
      }

      if (typeof produtoAtual.preco !== "number" || produtoAtual.preco <= 0) {
        throw new HttpsError(
          "failed-precondition",
          `Produto indisponivel: ${produtoCarrinho.nome}.`,
        );
      }

      // O preco pode ter mudado entre a leitura inicial (fora da transacao) e
      // este ponto - sempre usar o preco lido agora, dentro da transacao,
      // para o pedido cobrar o valor realmente vigente no momento da compra.
      precosAtuais.set(produtoCarrinho.id, Number(produtoAtual.preco));

      if (produtosJaProcessados.has(produtoCarrinho.id)) {
        return;
      }
      produtosJaProcessados.add(produtoCarrinho.id);

      const controlaEstoque = produtoAtual.controlarEstoque === true;

      if (!controlaEstoque) {
        return;
      }

      if (produtoAtual.temTamanhos === true) {
        const tamanhosDoCarrinho = new Set(
          produtos
            .filter((p) => p.id === produtoCarrinho.id && p.tamanho)
            .map((p) => p.tamanho),
        );
        const estoquePorTamanho = produtoAtual.estoquePorTamanho || {};
        const update = { atualizadoEm: now };

        for (const tamanho of tamanhosDoCarrinho) {
          const quantidadeTotal =
            quantidadeTotalPorProdutoTamanho.get(
              `${produtoCarrinho.id}::${tamanho}`,
            ) || 0;
          const estoqueAtualTamanho = Number(estoquePorTamanho[tamanho] || 0);

          if (estoqueAtualTamanho < quantidadeTotal) {
            throw new HttpsError(
              "failed-precondition",
              `Estoque insuficiente para ${produtoCarrinho.nome} (${tamanho}).`,
            );
          }

          update[`estoquePorTamanho.${tamanho}`] =
            estoqueAtualTamanho - quantidadeTotal;
        }

        transaction.update(produtoDoc.ref, update);
        return;
      }

      const estoqueAtual = Number(produtoAtual.estoque || 0);
      const quantidadeTotal =
        quantidadeTotalPorProduto.get(produtoCarrinho.id) || 0;

      if (estoqueAtual < quantidadeTotal) {
        throw new HttpsError(
          "failed-precondition",
          `Estoque insuficiente para ${produtoCarrinho.nome}.`,
        );
      }

      transaction.update(produtoDoc.ref, {
        estoque: estoqueAtual - quantidadeTotal,
        atualizadoEm: now,
      });
    });

    const produtosAtualizados = produtos.map((produto) => ({
      ...produto,
      preco: precosAtuais.get(produto.id) ?? produto.preco,
    }));
    const subtotal = Number(
      produtosAtualizados
        .reduce((soma, item) => soma + item.preco * item.quantidade, 0)
        .toFixed(2),
    );
    const total = Number((subtotal + taxaEntrega).toFixed(2));

    if (precisaTroco && trocoPara <= total) {
      throw new HttpsError("invalid-argument", "Valor de troco invalido.");
    }

    if (nextClientNumber !== null) {
      transaction.set(
        clienteSequenceRef,
        {
          valor: nextClientNumber,
          atualizadoEm: now,
        },
        { merge: true },
      );
    }

    transaction.set(
      pedidoSequenceRef,
      {
        valor: nextOrderNumber,
        atualizadoEm: now,
      },
      { merge: true },
    );

    transaction.set(
      clienteRef,
      {
        codigoCliente,
        uid,
        email,
        atualizadoEm: now,
        ...(!clientePorUidDoc.exists ? { criadoEm: now } : {}),
      },
      { merge: true },
    );

    transaction.set(
      clientePorUidRef,
      {
        codigoCliente,
        uid,
        email,
        atualizadoEm: now,
      },
      { merge: true },
    );

    transaction.set(pedidoRef, {
      codigoPedido,
      codigoCliente,
      userId: codigoCliente,
      userUid: uid,
      filialId: filial.id,
      filialNome: filial.nome,
      filialEndereco: filial.endereco,
      tipoAtendimento,
      cliente: {
        nome: sanitizeText(data.cliente.nome, 120),
        telefone: sanitizeText(data.cliente.telefone, 40),
        email,
      },
      entrega: entregaNormalizada,
      retirada: retiradaNormalizada,
      pagamento,
      pagamentoDetalhes: {
        metodo: pagamento,
        status: getStatusInicialPagamento(pagamento),
        precisaTroco,
        trocoPara,
      },
      pagamentoOnline: getPagamentoOnline(pagamento, codigoPedido),
      observacoes: sanitizeText(data.observacoes, 500),
      subtotal,
      taxaEntrega,
      itens: produtos.map(
        ({ filialId, filialIds, refPath, ...produto }) => produto,
      ),
      total,
      status: precisaReceita ? "aguardando_validacao_farmaceutica" : "recebido",
      receitas: receitaPaths.map((caminho) => ({ caminho, enviadaEm: now })),
      statusReceita: precisaReceita ? "pendente" : null,
      criadoEm: now,
    });

    transaction.set(notificacaoAdminRef, {
      titulo: "Novo pedido recebido",
      mensagem: `${codigoPedido} foi criado por ${sanitizeText(data.cliente.nome, 120)}.`,
      pedidoId: codigoPedido,
      userUid: null,
      perfilDestino: "admin",
      lida: false,
      criadoEm: now,
    });

    return { codigoPedido, total };
  });

  return { ok: true, ...resultado };
});

exports.marcarPedidoEntregue = onCall(async (request) => {
  assertSignedIn(request);

  const { pedidoId } = request.data || {};

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "Informe o pedidoId.");
  }

  const uid = request.auth.uid;
  const usuarioSnap = await db.collection("usuarios").doc(uid).get();
  const usuario = usuarioSnap.exists ? usuarioSnap.data() : null;

  if (!usuario || usuario.perfil !== "entregador" || usuario.ativo !== true) {
    throw new HttpsError(
      "permission-denied",
      "Conta sem permissao de entregador.",
    );
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();

  if (!pedidoSnap.exists) {
    throw new HttpsError("not-found", "Pedido nao encontrado.");
  }

  const pedido = pedidoSnap.data();

  if (pedido.entregadorId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "Este pedido nao esta atribuido a voce.",
    );
  }

  if (pedido.status === "entregue") {
    return { ok: true, jaEstavaEntregue: true };
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const atualizacao = {
    status: "entregue",
    entregueEm: now,
    atualizadoEm: now,
  };

  // Dinheiro e cartao na entrega sao cobrados no ato da entrega, entao
  // confirmar a entrega ja confirma o pagamento. Pix e cartao online tem
  // seu proprio fluxo de confirmacao (Mercado Pago) e nao sao alterados aqui.
  if (!isPagamentoOnline(pedido.pagamento)) {
    atualizacao["pagamentoDetalhes.status"] = STATUS_PAGAMENTO.pago;
  }

  await pedidoRef.update(atualizacao);

  if (pedido.userUid) {
    await db.collection("notificacoes").add({
      titulo: "Pedido entregue",
      mensagem: `${pedido.codigoPedido || pedidoId} foi marcado como entregue.`,
      pedidoId,
      userUid: pedido.userUid,
      perfilDestino: null,
      lida: false,
      criadoEm: now,
    });
  }

  return { ok: true };
});

exports.aceitarEntrega = onCall(async (request) => {
  assertSignedIn(request);

  const { pedidoId } = request.data || {};

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "Informe o pedidoId.");
  }

  const uid = request.auth.uid;
  const usuarioSnap = await db.collection("usuarios").doc(uid).get();
  const usuario = usuarioSnap.exists ? usuarioSnap.data() : null;

  if (!usuario || usuario.perfil !== "entregador" || usuario.ativo !== true) {
    throw new HttpsError(
      "permission-denied",
      "Conta sem permissao de entregador.",
    );
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);

  await db.runTransaction(async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);

    if (!pedidoSnap.exists) {
      throw new HttpsError("not-found", "Pedido nao encontrado.");
    }

    const pedido = pedidoSnap.data();

    if (usuario.filialId && pedido.filialId !== usuario.filialId) {
      throw new HttpsError(
        "permission-denied",
        "Este pedido nao e da sua filial.",
      );
    }

    if (pedido.tipoAtendimento !== "entrega") {
      throw new HttpsError(
        "failed-precondition",
        "Este pedido nao precisa de entregador.",
      );
    }

    // entregadorId e status "entrega" sao sempre definidos juntos, entao
    // checar o status ja cobre o caso de a entrega ter acabado de ser aceita
    // por outra pessoa.
    if (pedido.status !== "pronto_retirada") {
      throw new HttpsError(
        "failed-precondition",
        "Esta entrega ja foi aceita por outro entregador ou nao esta mais disponivel.",
      );
    }

    transaction.update(pedidoRef, {
      entregadorId: uid,
      entregadorNome: usuario.nome || usuario.email || uid,
      status: "entrega",
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

exports.confirmarRetiradaEntrega = onCall(async (request) => {
  assertSignedIn(request);

  const { pedidoId } = request.data || {};

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "Informe o pedidoId.");
  }

  const uid = request.auth.uid;
  const usuarioSnap = await db.collection("usuarios").doc(uid).get();
  const usuario = usuarioSnap.exists ? usuarioSnap.data() : null;

  if (!usuario || usuario.perfil !== "entregador" || usuario.ativo !== true) {
    throw new HttpsError(
      "permission-denied",
      "Conta sem permissao de entregador.",
    );
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();

  if (!pedidoSnap.exists) {
    throw new HttpsError("not-found", "Pedido nao encontrado.");
  }

  const pedido = pedidoSnap.data();

  if (pedido.entregadorId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "Este pedido nao esta atribuido a voce.",
    );
  }

  if (pedido.status === "a_caminho" || pedido.status === "entregue") {
    return { ok: true, jaRetirado: true };
  }

  if (pedido.status !== "entrega") {
    throw new HttpsError(
      "failed-precondition",
      "Este pedido ainda nao esta pronto para retirada.",
    );
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  await pedidoRef.update({
    status: "a_caminho",
    retiradoEm: now,
    atualizadoEm: now,
  });

  if (pedido.userUid) {
    await db.collection("notificacoes").add({
      titulo: "Pedido saiu para entrega",
      mensagem: `${pedido.codigoPedido || pedidoId} saiu para entrega com o entregador.`,
      pedidoId,
      userUid: pedido.userUid,
      perfilDestino: null,
      lida: false,
      criadoEm: now,
    });
  }

  return { ok: true };
});

exports.revisarReceitaPedido = onCall(async (request) => {
  assertSignedIn(request);

  const uid = request.auth.uid;
  const { pedidoId, aprovado, motivoReprovacao } = request.data || {};

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "Informe o pedidoId.");
  }

  if (typeof aprovado !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "Informe se a receita foi aprovada ou reprovada.",
    );
  }

  const usuarioSnap = await db.collection("usuarios").doc(uid).get();
  const usuario = usuarioSnap.exists ? usuarioSnap.data() : null;
  const podeRevisar =
    usuario?.ativo === true &&
    (usuario?.perfil === "admin" || usuario?.perfil === "farmaceutico");

  if (!podeRevisar) {
    throw new HttpsError(
      "permission-denied",
      "Conta sem permissao para validar receitas.",
    );
  }

  const ehAdminGeral =
    usuario.perfil === "admin" &&
    (usuario.adminGeral === true || !usuario.filialId);
  const filialRestrita = !ehAdminGeral && usuario.filialId ? usuario.filialId : null;

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();

  if (!pedidoSnap.exists) {
    throw new HttpsError("not-found", "Pedido nao encontrado.");
  }

  const pedido = pedidoSnap.data();

  if (filialRestrita && pedido.filialId !== filialRestrita) {
    throw new HttpsError(
      "permission-denied",
      "Este pedido nao e da sua filial.",
    );
  }

  if (pedido.status !== "aguardando_validacao_farmaceutica") {
    throw new HttpsError(
      "failed-precondition",
      "Este pedido nao esta aguardando validacao de receita.",
    );
  }

  const motivo = aprovado ? "" : sanitizeText(motivoReprovacao, 300);

  if (!aprovado && !motivo) {
    throw new HttpsError(
      "invalid-argument",
      "Informe o motivo da reprovacao da receita.",
    );
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  await pedidoRef.update({
    status: aprovado ? "recebido" : "receita_reprovada",
    statusReceita: aprovado ? "aprovada" : "reprovada",
    receitaMotivoReprovacao: motivo || null,
    receitaRevisadaPor: uid,
    receitaRevisadaEm: now,
    atualizadoEm: now,
  });

  if (pedido.userUid) {
    await db.collection("notificacoes").add({
      titulo: aprovado ? "Receita aprovada" : "Receita reprovada",
      mensagem: aprovado
        ? `${pedido.codigoPedido || pedidoId}: sua receita foi validada e o pedido segue para separacao.`
        : `${pedido.codigoPedido || pedidoId}: sua receita nao foi aprovada. ${motivo}`,
      pedidoId,
      userUid: pedido.userUid,
      perfilDestino: null,
      lida: false,
      criadoEm: now,
    });
  }

  return { ok: true };
});

exports.criarPagamentoPix = onCall(
  { secrets: [mercadoPagoAccessToken] },
  async (request) => {
    assertSignedIn(request);

    const { pedidoId } = request.data || {};

    if (!pedidoId) {
      throw new HttpsError("invalid-argument", "Informe o pedidoId.");
    }

    const { pedidoRef, pedido } = await getPedidoDoUsuario(
      pedidoId,
      request.auth.uid,
    );
    const token = getMercadoPagoToken();
    const total = Number((pedido.total || 0).toFixed(2));
    const email = pedido.cliente?.email || request.auth.token.email;

    if (!email) {
      throw new HttpsError(
        "failed-precondition",
        "Sua conta precisa ter e-mail para gerar Pix online.",
      );
    }

    if (!Number.isFinite(total) || total <= 0) {
      throw new HttpsError("failed-precondition", "Total do pedido invalido.");
    }

    const formaPagamento = normalizarFormaPagamento(
      pedido.pagamentoDetalhes?.metodo || pedido.pagamento,
    );

    if (formaPagamento !== FORMAS_PAGAMENTO.pix) {
      throw new HttpsError(
        "failed-precondition",
        "Este pedido nao foi criado com pagamento Pix.",
      );
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${pedidoId}-pix`,
      },
      body: JSON.stringify({
        transaction_amount: total,
        description: `Pedido ${pedido.codigoPedido || pedidoId} - Farmacia Super Popular`,
        payment_method_id: "pix",
        external_reference: pedidoId,
        notification_url: mercadoPagoWebhookUrl,
        payer: {
          email,
          first_name: pedido.cliente?.nome || "Cliente",
        },
        metadata: {
          pedido_id: pedidoId,
          user_uid: request.auth.uid,
        },
      }),
    });

    const pagamento = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Erro Mercado Pago Pix:", pagamento);
      throw new HttpsError(
        "internal",
        pagamento?.message || "Nao foi possivel gerar o Pix.",
      );
    }

    const transactionData =
      pagamento.point_of_interaction?.transaction_data || {};
    const statusPagamento = mapMercadoPagoStatus(pagamento.status);

    await pedidoRef.update({
      pagamentoOnline: {
        provedor: "mercado_pago",
        ambiente: getAmbienteMercadoPago(token),
        metodo: "pix",
        status: statusPagamento,
        statusProvedor: pagamento.status || null,
        transacaoId: String(pagamento.id || ""),
        qrCode: transactionData.qr_code_base64 || null,
        copiaECola: transactionData.qr_code || null,
        linkPagamento: transactionData.ticket_url || null,
        mensagem: "Pix gerado. Aguardando confirmacao do Mercado Pago.",
        total,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      },
      "pagamentoDetalhes.status": statusPagamento,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      status: statusPagamento,
      transacaoId: String(pagamento.id || ""),
      qrCode: transactionData.qr_code_base64 || null,
      copiaECola: transactionData.qr_code || null,
      linkPagamento: transactionData.ticket_url || null,
    };
  },
);

exports.criarPagamentoCartao = onCall(
  { secrets: [mercadoPagoAccessToken] },
  async (request) => {
    assertSignedIn(request);

    const { pedidoId } = request.data || {};

    if (!pedidoId) {
      throw new HttpsError("invalid-argument", "Informe pedidoId.");
    }

    const { pedidoRef, pedido } = await getPedidoDoUsuario(
      pedidoId,
      request.auth.uid,
    );
    const token = getMercadoPagoToken();
    const email = pedido.cliente?.email || request.auth.token.email;

    if (!email) {
      throw new HttpsError(
        "failed-precondition",
        "Sua conta precisa ter e-mail para gerar pagamento online.",
      );
    }

    const formaPagamento = normalizarFormaPagamento(
      pedido.pagamentoDetalhes?.metodo || pedido.pagamento,
    );

    if (formaPagamento !== FORMAS_PAGAMENTO.cartaoOnline) {
      throw new HttpsError(
        "failed-precondition",
        "Este pedido nao foi criado com pagamento por cartao online.",
      );
    }

    const preferencia = await criarPreferenciaCartaoMercadoPago({
      pedidoId,
      pedido,
      token,
      email,
    });

    await pedidoRef.update({
      pagamentoOnline: {
        provedor: "mercado_pago",
        ambiente: getAmbienteMercadoPago(token),
        metodo: "cartao",
        status: STATUS_PAGAMENTO.pendente,
        transacaoId: preferencia.id,
        linkPagamento: preferencia.initPoint,
        mensagem:
          "Link de pagamento gerado. Aguardando confirmacao do Mercado Pago.",
        total: preferencia.total,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      },
      "pagamentoDetalhes.status": STATUS_PAGAMENTO.pendente,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      status: STATUS_PAGAMENTO.pendente,
      transacaoId: preferencia.id,
      linkPagamento: preferencia.initPoint,
    };
  },
);

exports.webhookPagamento = onRequest(
  { secrets: [mercadoPagoAccessToken] },
  async (request, response) => {
    try {
      const paymentId =
        request.body?.data?.id ||
        request.body?.id ||
        request.query["data.id"] ||
        request.query.id;

      if (!paymentId) {
        response.status(200).json({ ok: true, ignored: true });
        return;
      }

      const result = await atualizarPedidoPorPagamentoMercadoPago(
        String(paymentId),
        getMercadoPagoToken(),
      );

      response.status(200).json(result);
    } catch (error) {
      console.error("Erro no webhook de pagamento:", error);
      response.status(500).json({ ok: false });
    }
  },
);

// ---------------------------------------------------------------------
// Sincronizacao do Bulario Eletronico da ANVISA -> colecao Firestore
// medicamentosAnvisa. Ver docs/bulario-anvisa.md para detalhes de setup.
// ---------------------------------------------------------------------

const anvisaSyncToken = defineSecret("ANVISA_SYNC_TOKEN");

const ANVISA_BASE = "https://consultas.anvisa.gov.br/api";
const ANVISA_PAGE_SIZE = 100;
const ANVISA_REQUEST_DELAY_MS = 400; // nao martelar o servidor publico da ANVISA
const ANVISA_MAX_RETRIES = 3;
const ANVISA_MAX_PAGINAS_POR_EXECUCAO = 20; // ~2000 itens por execucao, para caber no timeout

// O dominio fica atras do Cloudflare: sem User-Agent/Referer de navegador,
// as requisicoes tomam 403 antes mesmo de chegar no backend da ANVISA.
const ANVISA_HEADERS = {
  Authorization: "Guest",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  Referer: "https://consultas.anvisa.gov.br/",
};

function anvisaSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function anvisaFetchComRetry(url, tentativa = 1) {
  try {
    const res = await fetch(url, { headers: ANVISA_HEADERS });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} em ${url}`);
    }

    return await res.json();
  } catch (error) {
    if (tentativa < ANVISA_MAX_RETRIES) {
      const espera = 1000 * tentativa;
      console.warn(
        `Falha ao buscar ${url} (${error.message}), tentativa ${tentativa}/${ANVISA_MAX_RETRIES}`,
      );
      await anvisaSleep(espera);
      return anvisaFetchComRetry(url, tentativa + 1);
    }
    throw error;
  }
}

function anvisaBuscarPagina(page) {
  // filter[nomeProduto] precisa estar presente na URL (mesmo vazio) - sem
  // ele a API responde {"detail":"Erro inesperado"} em vez da listagem.
  return anvisaFetchComRetry(
    `${ANVISA_BASE}/consulta/bulario?count=${ANVISA_PAGE_SIZE}&filter%5BnomeProduto%5D=&page=${page}`,
  );
}

function anvisaBuscarDetalhes(numeroProcesso) {
  return anvisaFetchComRetry(
    `${ANVISA_BASE}/consulta/medicamento/produtos/${numeroProcesso}`,
  );
}

/**
 * Nomes de campo vindos de engenharia reversa do bulario publico, nao de
 * documentacao oficial da ANVISA. Se a ANVISA mudar a estrutura do site,
 * confira o formato real (console.log do item bruto) e ajuste aqui.
 */
function anvisaNormalizarItem(item) {
  return {
    numeroProcesso: String(item.numProcesso ?? item.numeroProcesso ?? ""),
    nomeProduto: String(item.nomeProduto ?? item.nome ?? ""),
    empresa: item.razaoSocial ?? item.empresa ?? null,
    categoriaRegulatoria: item.categoriaRegulatoria ?? item.categoria ?? null,
    situacaoRegistro: item.situacaoRegistro ?? null,
    dataAtualizacaoAnvisa:
      item.dataFinalizacaoProcesso ?? item.dataAtualizacao ?? null,
  };
}

/**
 * NOTA: os IDs de bula (codigoBulaPaciente/codigoBulaProfissional, no
 * endpoint de detalhes) sao tokens JWT que expiram em ~5 minutos - por
 * isso NAO buscamos nem gravamos eles aqui. A sincronizacao so espelha o
 * catalogo (nome, empresa, situacao do registro), que nao expira. O
 * acesso a bula em si e feito ao vivo pela function abrirBulaAnvisa,
 * bem mais abaixo, no momento em que o usuario clica em "Ver bula".
 *
 * Le e grava a pagina inteira em lote (getAll + batch) em vez de um
 * get()+set() por item - com 100 itens por pagina, um loop item a item
 * fazia ate 200 idas e vindas ao Firestore por pagina, o que estourava o
 * timeout da function bem antes de terminar as 20 paginas da execucao.
 */
async function anvisaProcessarPagina(itensBrutos, forcarEscrita) {
  const itens = itensBrutos
    .map(anvisaNormalizarItem)
    .filter((item) => item.numeroProcesso);

  if (itens.length === 0) {
    return { totalItens: 0, totalCriados: 0, totalAtualizados: 0 };
  }

  const refs = itens.map((item) =>
    db.collection("medicamentosAnvisa").doc(item.numeroProcesso),
  );
  const snapshots = await db.getAll(...refs);

  const batch = db.batch();
  let totalCriados = 0;
  let totalAtualizados = 0;

  itens.forEach((item, index) => {
    const snapshot = snapshots[index];
    const existente = snapshot.exists ? snapshot.data() : null;
    const mudou =
      !existente ||
      existente.dataAtualizacaoAnvisa !== item.dataAtualizacaoAnvisa;

    if (!mudou && !forcarEscrita) return;

    batch.set(
      refs[index],
      {
        numeroProcesso: item.numeroProcesso,
        nomeProduto: item.nomeProduto,
        nomeProdutoBusca: item.nomeProduto.toLowerCase(),
        empresa: item.empresa,
        categoriaRegulatoria: item.categoriaRegulatoria,
        situacaoRegistro: item.situacaoRegistro,
        dataAtualizacaoAnvisa: item.dataAtualizacaoAnvisa,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (existente) totalAtualizados++;
    else totalCriados++;
  });

  await batch.commit();

  return { totalItens: itens.length, totalCriados, totalAtualizados };
}

/**
 * Processa ate ANVISA_MAX_PAGINAS_POR_EXECUCAO paginas a partir de onde a
 * ultima execucao parou (checkpoint em anvisaSync/estado). Uma varredura
 * completa do bulario (~7 mil itens) leva varias execucoes para concluir -
 * isso e esperado, dado o limite de tempo de uma Cloud Function.
 */
async function executarSyncAnvisa({ forcarFull = false } = {}) {
  const estadoRef = db.collection("anvisaSync").doc("estado");
  const estadoSnap = await estadoRef.get();
  const estadoAtual = estadoSnap.exists ? estadoSnap.data() : {};

  let pagina = forcarFull ? 1 : estadoAtual.paginaAtual || 1;
  const full = forcarFull || estadoAtual.full === true;

  let totalItens = 0;
  let totalCriados = 0;
  let totalAtualizados = 0;
  let totalErros = 0;
  let paginasProcessadas = 0;
  let concluiuVarreduraCompleta = false;

  console.log(
    `Iniciando sync ANVISA (${full ? "full" : "incremental"}) a partir da pagina ${pagina}`,
  );

  while (paginasProcessadas < ANVISA_MAX_PAGINAS_POR_EXECUCAO) {
    const data = await anvisaBuscarPagina(pagina);
    const itens = data.content ?? data.items ?? [];

    if (itens.length === 0) {
      concluiuVarreduraCompleta = true;
      break;
    }

    try {
      const resultadoPagina = await anvisaProcessarPagina(itens, full);
      totalItens += resultadoPagina.totalItens;
      totalCriados += resultadoPagina.totalCriados;
      totalAtualizados += resultadoPagina.totalAtualizados;
    } catch (error) {
      totalErros += itens.length;
      console.error(`Erro ao processar pagina ${pagina}: ${error.message}`);
    }

    paginasProcessadas++;
    pagina++;
    await anvisaSleep(ANVISA_REQUEST_DELAY_MS);
  }

  const novoEstado = concluiuVarreduraCompleta
    ? {
        paginaAtual: 1,
        full: false,
        ultimaExecucaoCompletaEm: admin.firestore.FieldValue.serverTimestamp(),
      }
    : { paginaAtual: pagina, full };

  await estadoRef.set(novoEstado, { merge: true });

  await db.collection("anvisaSyncLog").add({
    tipo: full ? "full" : "incremental",
    paginasProcessadas,
    totalItens,
    totalCriados,
    totalAtualizados,
    totalErros,
    concluiuVarreduraCompleta,
    executadoEm: admin.firestore.FieldValue.serverTimestamp(),
  });

  const resumo = {
    tipo: full ? "full" : "incremental",
    paginasProcessadas,
    totalItens,
    totalCriados,
    totalAtualizados,
    totalErros,
    concluiuVarreduraCompleta,
  };

  console.log("Sync ANVISA (trecho) concluido:", resumo);
  return resumo;
}

// Roda a cada 10 minutos, processando um lote de paginas por vez ate cobrir
// o bulario inteiro; depois disso, cada passagem so grava o que mudou.
exports.sincronizarBularioAnvisa = onSchedule(
  { schedule: "every 10 minutes", timeoutSeconds: 300 },
  async () => {
    await executarSyncAnvisa({ forcarFull: false });
  },
);

// Disparo manual (ex.: curl com o token) para forcar uma varredura completa,
// reprocessando tudo a partir da pagina 1 nas proximas execucoes agendadas.
exports.sincronizarBularioAnvisaManual = onRequest(
  { secrets: [anvisaSyncToken], timeoutSeconds: 300 },
  async (request, response) => {
    const token = request.query.token || request.headers["x-anvisa-token"];

    if (token !== anvisaSyncToken.value()) {
      response.status(401).json({ ok: false, erro: "Token invalido." });
      return;
    }

    const full = request.query.full === "true";

    try {
      const resumo = await executarSyncAnvisa({ forcarFull: full });
      response.status(200).json({ ok: true, ...resumo });
    } catch (error) {
      console.error("Erro na sincronizacao manual da ANVISA:", error);
      response.status(500).json({ ok: false, erro: error.message });
    }
  },
);

/**
 * Serve o PDF da bula direto, buscando um token de acesso na hora (ao
 * vivo). Os IDs que o endpoint de detalhes devolve (codigoBulaPaciente /
 * codigoBulaProfissional) sao tokens JWT que expiram em ~5 minutos -
 * por isso NAO ficam salvos no Firestore, e essa function busca um token
 * novo a cada chamada, exatamente quando o usuario clica em "Ver bula".
 *
 * Uso: /abrirBulaAnvisa?numeroProcesso=XXXX[&tipo=paciente|profissional]
 * Essa URL e o que deve ser colado no campo "Link da bula" do produto.
 */
exports.abrirBulaAnvisa = onRequest(async (request, response) => {
  const numeroProcesso = String(request.query.numeroProcesso || "").trim();
  const tipo =
    request.query.tipo === "profissional" ? "profissional" : "paciente";

  if (!numeroProcesso) {
    response.status(400).json({ ok: false, erro: "Informe numeroProcesso." });
    return;
  }

  try {
    const detalhes = await anvisaBuscarDetalhes(numeroProcesso);
    const tokenBula =
      tipo === "profissional"
        ? detalhes?.codigoBulaProfissional
        : detalhes?.codigoBulaPaciente;

    if (!tokenBula) {
      response
        .status(404)
        .json({ ok: false, erro: "Bula nao encontrada para este processo." });
      return;
    }

    const pdfRes = await fetch(
      `${ANVISA_BASE}/consulta/medicamentos/arquivo/bula/parecer/${tokenBula}/?Authorization=`,
      { headers: ANVISA_HEADERS },
    );

    if (!pdfRes.ok) {
      response
        .status(502)
        .json({ ok: false, erro: "Falha ao baixar o PDF da bula na ANVISA." });
      return;
    }

    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    response.set("Content-Type", "application/pdf");
    response.set("Cache-Control", "no-store");
    response.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao abrir bula da ANVISA:", error);
    response.status(500).json({ ok: false, erro: error.message });
  }
});
