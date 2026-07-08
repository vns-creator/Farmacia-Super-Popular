const admin = require("firebase-admin");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
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
  { bairro: "Centro", filialId: "filial-lider", taxaEntrega: 6.9, cepPrefixes: ["89801"] },
  { bairro: "Lider", filialId: "filial-lider", taxaEntrega: 6.9, aliases: ["lider"], cepPrefixes: ["89805"] },
  { bairro: "Passo dos Fortes", filialId: "filial-lider", taxaEntrega: 6.9, cepPrefixes: ["89805"] },
  { bairro: "Presidente Medici", filialId: "filial-lider", taxaEntrega: 7.9, aliases: ["presidente medici"], cepPrefixes: ["89801", "89806"] },
  { bairro: "Maria Goretti", filialId: "filial-lider", taxaEntrega: 7.9, cepPrefixes: ["89801", "89806"] },
  { bairro: "Sao Cristovao", filialId: "filial-lider", taxaEntrega: 7.9, aliases: ["sao cristovao"], cepPrefixes: ["89803", "89804"] },
  { bairro: "Jardim America", filialId: "filial-lider", taxaEntrega: 7.9, cepPrefixes: ["89803"] },
  { bairro: "Jardim Italia", filialId: "filial-lider", taxaEntrega: 7.9, cepPrefixes: ["89802", "89814"] },
  { bairro: "Bela Vista", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89804"] },
  { bairro: "Jardins", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89804"] },
  { bairro: "Parque das Palmeiras", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89803"] },
  { bairro: "Boa Vista", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89806"] },
  { bairro: "Bom Pastor", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89806"] },
  { bairro: "Sao Pedro", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89806"] },
  { bairro: "Pinheirinho", filialId: "filial-lider", taxaEntrega: 8.9, cepPrefixes: ["89806"] },
  { bairro: "Bom Retiro", filialId: "filial-lider", taxaEntrega: 9.9, cepPrefixes: ["89805", "89811"] },
  { bairro: "Santa Paulina", filialId: "filial-lider", taxaEntrega: 9.9, cepPrefixes: ["89805", "89811"] },
  { bairro: "SAIC", filialId: "filial-lider", taxaEntrega: 9.9, aliases: ["saic"], cepPrefixes: ["89802"] },
  { bairro: "Fronteira Sul", filialId: "filial-lider", taxaEntrega: 10.9, cepPrefixes: ["89808"] },
  { bairro: "Autodromo", filialId: "filial-lider", taxaEntrega: 10.9, cepPrefixes: ["89808"] },
  { bairro: "Araras", filialId: "filial-lider", taxaEntrega: 10.9, cepPrefixes: ["89808"] },
  { bairro: "Desbravador", filialId: "filial-lider", taxaEntrega: 10.9, cepPrefixes: ["89811"] },
  { bairro: "Lajeado", filialId: "filial-lider", taxaEntrega: 11.9, cepPrefixes: ["89804"] },
  { bairro: "Jardins do Vale", filialId: "filial-lider", taxaEntrega: 11.9, cepPrefixes: ["89807"] },
  { bairro: "Sao Lucas", filialId: "filial-lider", taxaEntrega: 9.9, cepPrefixes: ["89806", "89812"] },
  { bairro: "Paraiso", filialId: "filial-lider", taxaEntrega: 9.9, cepPrefixes: ["89806"] },
  { bairro: "Efapi", filialId: "filial-efapi-tancredo", taxaEntrega: 6.9, cepPrefixes: ["89809"] },
  { bairro: "Eldorado", filialId: "filial-efapi-tancredo", taxaEntrega: 7.9, cepPrefixes: ["89810"] },
  { bairro: "Cristo Rei", filialId: "filial-efapi-tancredo", taxaEntrega: 7.9, cepPrefixes: ["89810"] },
  { bairro: "Alvorada", filialId: "filial-efapi-tancredo", taxaEntrega: 8.9, cepPrefixes: ["89804", "89810"] },
  { bairro: "Engenho Braun", filialId: "filial-efapi-tancredo", taxaEntrega: 9.9, cepPrefixes: ["89804", "89809"] },
  { bairro: "Agua Santa", filialId: "filial-efapi-tancredo", taxaEntrega: 9.9, cepPrefixes: ["89810"] },
  { bairro: "Belvedere", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 7.9, cepPrefixes: ["89810"] },
  { bairro: "Trevo", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 7.9, cepPrefixes: ["89810"] },
  { bairro: "Vila Rica", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 8.9, cepPrefixes: ["89810"] },
  { bairro: "Alto da Serra", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 12.9, cepPrefixes: ["89816"] },
  { bairro: "Goio-En", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, aliases: ["goio en"], cepPrefixes: ["89816"] },
  { bairro: "Centro Marechal Bormann", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, aliases: ["centro marechal bormann", "marechal bormann"], cepPrefixes: ["89816"] },
  { bairro: "Figueira", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, cepPrefixes: ["89816"] },
  { bairro: "Vederti", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, cepPrefixes: ["89816"] },
  { bairro: "Perimetral", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, cepPrefixes: ["89816"] },
  { bairro: "Palmital", filialId: "filial-palmital", taxaEntrega: 6.9, cepPrefixes: ["89812", "89814"] },
  { bairro: "Santo Antonio", filialId: "filial-palmital", taxaEntrega: 7.9, aliases: ["santo antonio"], cepPrefixes: ["89815"] },
  { bairro: "Universitario", filialId: "filial-palmital", taxaEntrega: 7.9, cepPrefixes: ["89812", "89814"] },
  { bairro: "Seminario", filialId: "filial-palmital", taxaEntrega: 7.9, cepPrefixes: ["89813", "89814"] },
  { bairro: "Santa Maria", filialId: "filial-palmital", taxaEntrega: 8.9, cepPrefixes: ["89812"] },
  { bairro: "Esplanada", filialId: "filial-palmital", taxaEntrega: 8.9, cepPrefixes: ["89812"] },
  { bairro: "Dom Pascoal", filialId: "filial-palmital", taxaEntrega: 8.9, cepPrefixes: ["89814"] },
  { bairro: "Dom Geronimo", filialId: "filial-palmital", taxaEntrega: 8.9, cepPrefixes: ["89811"] },
  { bairro: "Monte Belo", filialId: "filial-palmital", taxaEntrega: 8.9, cepPrefixes: ["89812"] },
  { bairro: "Industrial", filialId: "filial-palmital", taxaEntrega: 9.9, cepPrefixes: ["89813"] },
  { bairro: "Progresso", filialId: "filial-palmital", taxaEntrega: 9.9, cepPrefixes: ["89813"] },
  { bairro: "Campestre", filialId: "filial-palmital", taxaEntrega: 11.9, cepPrefixes: ["89814"] },
  { bairro: "Comunidade Palmital dos Fundos", filialId: "filial-palmital", taxaEntrega: 12.9, aliases: ["palmital dos fundos"], cepPrefixes: ["89815"] },
  { bairro: "Quedas do Palmital", filialId: "filial-palmital", taxaEntrega: 12.9, cepPrefixes: ["89815"] },
  { bairro: "Santos Dumont", filialId: "filial-palmital", taxaEntrega: 12.9, cepPrefixes: ["89815"] },
  { bairro: "Area Rural de Chapeco", filialId: "filial-palmital", taxaEntrega: 18.9, aliases: ["area rural", "interior"], cepPrefixes: ["89815"] },
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
  return String(value || "").trim().slice(0, maxLength);
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
    "pagamentoOnline.atualizadoEm": admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (statusPagamento === STATUS_PAGAMENTO.aprovado) {
    update.statusPagamentoConfirmadoEm =
      admin.firestore.FieldValue.serverTimestamp();
  }

  await pedidoRef.update(update);

  return { ok: true, pedidoId, status: statusPagamento };
}

async function criarPreferenciaCartaoMercadoPago({ pedidoId, pedido, token, email }) {
  const total = Number((pedido.total || 0).toFixed(2));

  if (!Number.isFinite(total) || total <= 0) {
    throw new HttpsError("failed-precondition", "Total do pedido invalido.");
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
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
  });

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
    throw new HttpsError("permission-denied", "Pedido pertence a outro usuario.");
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
    throw new HttpsError("permission-denied", "Conta sem permissao para pedidos.");
  }

  const produtos = [];

  for (const item of itensSolicitados) {
    const produtoId = sanitizeText(item?.id, 120);
    const quantidade = Number(item?.quantidade || 0);

    if (!produtoId || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
      throw new HttpsError("invalid-argument", "Item do carrinho invalido.");
    }

    const produtoSnap = await db.collection("produtos").doc(produtoId).get();

    if (!produtoSnap.exists) {
      throw new HttpsError("failed-precondition", "Produto nao encontrado.");
    }

    const produto = produtoSnap.data();

    if (produto.ativo === false || typeof produto.preco !== "number" || produto.preco <= 0) {
      throw new HttpsError("failed-precondition", "Produto indisponivel.");
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
      filialId: produto.filialId || null,
      filialIds: Array.isArray(produto.filialIds)
        ? produto.filialIds.filter((id) => typeof id === "string" && id.trim())
        : [],
    });
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
      throw new HttpsError("invalid-argument", "Filial para retirada invalida.");
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

  const subtotal = Number(
    produtos
      .reduce((total, item) => total + item.preco * item.quantidade, 0)
      .toFixed(2),
  );
  const total = Number((subtotal + taxaEntrega).toFixed(2));
  const precisaTroco =
    pagamento === FORMAS_PAGAMENTO.dinheiro &&
    data.pagamentoDetalhes?.precisaTroco === true;
  const trocoPara = precisaTroco
    ? Number(String(data.pagamentoDetalhes?.trocoPara || "").replace(",", "."))
    : null;

  if (precisaTroco && (!Number.isFinite(trocoPara) || trocoPara <= total)) {
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

    produtoDocs.forEach((produtoDoc, index) => {
      if (!produtoDoc.exists) {
        throw new HttpsError("failed-precondition", "Produto nao encontrado.");
      }

      const produtoCarrinho = produtos[index];
      const produtoAtual = produtoDoc.data();

      if (produtoAtual.ativo === false) {
        throw new HttpsError("failed-precondition", "Produto indisponivel.");
      }

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
      itens: produtos.map(({ filialId, filialIds, refPath, ...produto }) => produto),
      total,
      status: "recebido",
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

  await pedidoRef.update({
    status: "entregue",
    entregueEm: now,
    atualizadoEm: now,
  });

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

exports.criarPagamentoPix = onCall({ secrets: [mercadoPagoAccessToken] }, async (request) => {
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

  const transactionData = pagamento.point_of_interaction?.transaction_data || {};
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
});

exports.criarPagamentoCartao = onCall({ secrets: [mercadoPagoAccessToken] }, async (request) => {
  assertSignedIn(request);

  const { pedidoId } = request.data || {};

  if (!pedidoId) {
    throw new HttpsError(
      "invalid-argument",
      "Informe pedidoId.",
    );
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
      mensagem: "Link de pagamento gerado. Aguardando confirmacao do Mercado Pago.",
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
});

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
