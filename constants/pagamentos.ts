export const formasPagamento = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartaoOnline: "Cartao online",
  cartaoEntrega: "Cartao na entrega",
} as const;

export type FormaPagamento =
  (typeof formasPagamento)[keyof typeof formasPagamento];

export const formasPagamentoLabels: Record<FormaPagamento, string> = {
  [formasPagamento.dinheiro]: "Dinheiro",
  [formasPagamento.pix]: "Pix",
  [formasPagamento.cartaoOnline]: "Cartão online",
  [formasPagamento.cartaoEntrega]: "Cartão na entrega",
};

export const pagamentoOnlineConfig = {
  provedor: "mercado_pago",
  ambiente: "mercado_pago",
  // Desativado temporariamente para o lancamento no Vercel (evitar
  // problemas com o fluxo de pagamento online ainda nao testado na web).
  pixAtivo: false,
  cartaoAtivo: false,
};

export const pagamentoOnlineStatus = {
  aReceber: "a_receber",
  aguardandoConfiguracao: "aguardando_configuracao",
  pendente: "pendente",
  aprovado: "aprovado",
  pago: "pago",
  recusado: "recusado",
  cancelado: "cancelado",
  estornado: "estornado",
  expirado: "expirado",
} as const;

export type StatusPagamento =
  (typeof pagamentoOnlineStatus)[keyof typeof pagamentoOnlineStatus];

export const pagamentoStatusLabels: Record<StatusPagamento, string> = {
  [pagamentoOnlineStatus.aReceber]: "A receber",
  [pagamentoOnlineStatus.aguardandoConfiguracao]: "Aguardando configuração",
  [pagamentoOnlineStatus.pendente]: "Pendente",
  [pagamentoOnlineStatus.aprovado]: "Aprovado",
  [pagamentoOnlineStatus.pago]: "Pago",
  [pagamentoOnlineStatus.recusado]: "Recusado",
  [pagamentoOnlineStatus.cancelado]: "Cancelado",
  [pagamentoOnlineStatus.estornado]: "Estornado",
  [pagamentoOnlineStatus.expirado]: "Expirado",
};
