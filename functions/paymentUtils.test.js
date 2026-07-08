const assert = require("node:assert/strict");
const test = require("node:test");
const {
  FORMAS_PAGAMENTO,
  STATUS_PAGAMENTO,
  getStatusInicialPagamento,
  isPagamentoOnline,
  mapMercadoPagoStatus,
  normalizarFormaPagamento,
} = require("./paymentUtils");

test("normaliza formas de pagamento atuais", () => {
  assert.equal(normalizarFormaPagamento("Dinheiro"), FORMAS_PAGAMENTO.dinheiro);
  assert.equal(normalizarFormaPagamento("Pix"), FORMAS_PAGAMENTO.pix);
  assert.equal(
    normalizarFormaPagamento("Cartao online"),
    FORMAS_PAGAMENTO.cartaoOnline,
  );
  assert.equal(
    normalizarFormaPagamento("Cartão online"),
    FORMAS_PAGAMENTO.cartaoOnline,
  );
  assert.equal(
    normalizarFormaPagamento("Cartão na entrega"),
    FORMAS_PAGAMENTO.cartaoEntrega,
  );
});

test("normaliza formas de pagamento legadas com encoding quebrado", () => {
  assert.equal(
    normalizarFormaPagamento("CartÃ£o online"),
    FORMAS_PAGAMENTO.cartaoOnline,
  );
  assert.equal(
    normalizarFormaPagamento("CartÃƒÂ£o na entrega"),
    FORMAS_PAGAMENTO.cartaoEntrega,
  );
});

test("rejeita forma de pagamento desconhecida", () => {
  assert.equal(normalizarFormaPagamento("Boleto"), null);
  assert.equal(normalizarFormaPagamento(""), null);
  assert.equal(normalizarFormaPagamento(null), null);
});

test("identifica pagamentos online", () => {
  assert.equal(isPagamentoOnline(FORMAS_PAGAMENTO.pix), true);
  assert.equal(isPagamentoOnline(FORMAS_PAGAMENTO.cartaoOnline), true);
  assert.equal(isPagamentoOnline(FORMAS_PAGAMENTO.dinheiro), false);
  assert.equal(isPagamentoOnline(FORMAS_PAGAMENTO.cartaoEntrega), false);
});

test("define status inicial por forma de pagamento", () => {
  assert.equal(
    getStatusInicialPagamento(FORMAS_PAGAMENTO.dinheiro),
    STATUS_PAGAMENTO.aReceber,
  );
  assert.equal(
    getStatusInicialPagamento(FORMAS_PAGAMENTO.pix),
    STATUS_PAGAMENTO.pendente,
  );
  assert.equal(
    getStatusInicialPagamento(FORMAS_PAGAMENTO.cartaoOnline),
    STATUS_PAGAMENTO.pendente,
  );
  assert.equal(
    getStatusInicialPagamento(FORMAS_PAGAMENTO.cartaoEntrega),
    STATUS_PAGAMENTO.pendente,
  );
});

test("mapeia status do Mercado Pago para status internos", () => {
  assert.equal(mapMercadoPagoStatus("approved"), STATUS_PAGAMENTO.aprovado);
  assert.equal(mapMercadoPagoStatus("pending"), STATUS_PAGAMENTO.pendente);
  assert.equal(mapMercadoPagoStatus("in_process"), STATUS_PAGAMENTO.pendente);
  assert.equal(mapMercadoPagoStatus("rejected"), STATUS_PAGAMENTO.recusado);
  assert.equal(mapMercadoPagoStatus("cancelled"), STATUS_PAGAMENTO.cancelado);
  assert.equal(mapMercadoPagoStatus("refunded"), STATUS_PAGAMENTO.estornado);
  assert.equal(mapMercadoPagoStatus("charged_back"), STATUS_PAGAMENTO.estornado);
  assert.equal(mapMercadoPagoStatus("unknown"), STATUS_PAGAMENTO.pendente);
});
