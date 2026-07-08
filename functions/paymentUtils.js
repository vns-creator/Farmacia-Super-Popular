const FORMAS_PAGAMENTO = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartaoOnline: "Cartao online",
  cartaoEntrega: "Cartao na entrega",
};

const STATUS_PAGAMENTO = {
  aReceber: "a_receber",
  aguardandoConfiguracao: "aguardando_configuracao",
  pendente: "pendente",
  aprovado: "aprovado",
  pago: "pago",
  recusado: "recusado",
  cancelado: "cancelado",
  estornado: "estornado",
};

function normalizarFormaPagamento(value) {
  const original = String(value || "").trim();
  const normalized = original
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const legacy = original.toLowerCase();

  if (normalized === "dinheiro") return FORMAS_PAGAMENTO.dinheiro;
  if (normalized === "pix") return FORMAS_PAGAMENTO.pix;
  if (normalized === "cartao online") return FORMAS_PAGAMENTO.cartaoOnline;
  if (normalized === "cartao na entrega") return FORMAS_PAGAMENTO.cartaoEntrega;
  if (legacy === "cartã£o online" || legacy === "cartãƒâ£o online") {
    return FORMAS_PAGAMENTO.cartaoOnline;
  }
  if (
    legacy === "cartã£o na entrega" ||
    legacy === "cartãƒâ£o na entrega"
  ) {
    return FORMAS_PAGAMENTO.cartaoEntrega;
  }

  return null;
}

function isPagamentoOnline(pagamento) {
  return (
    pagamento === FORMAS_PAGAMENTO.pix ||
    pagamento === FORMAS_PAGAMENTO.cartaoOnline
  );
}

function getStatusInicialPagamento(pagamento) {
  return isPagamentoOnline(pagamento) ||
    pagamento === FORMAS_PAGAMENTO.cartaoEntrega
    ? STATUS_PAGAMENTO.pendente
    : STATUS_PAGAMENTO.aReceber;
}

function mapMercadoPagoStatus(status) {
  const statusMap = {
    approved: STATUS_PAGAMENTO.aprovado,
    pending: STATUS_PAGAMENTO.pendente,
    in_process: STATUS_PAGAMENTO.pendente,
    rejected: STATUS_PAGAMENTO.recusado,
    cancelled: STATUS_PAGAMENTO.cancelado,
    refunded: STATUS_PAGAMENTO.estornado,
    charged_back: STATUS_PAGAMENTO.estornado,
  };

  return statusMap[status] || STATUS_PAGAMENTO.pendente;
}

module.exports = {
  FORMAS_PAGAMENTO,
  STATUS_PAGAMENTO,
  getStatusInicialPagamento,
  isPagamentoOnline,
  mapMercadoPagoStatus,
  normalizarFormaPagamento,
};
