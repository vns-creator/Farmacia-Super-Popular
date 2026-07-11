import {
  type FormaPagamento,
  type StatusPagamento,
  formasPagamento,
  formasPagamentoLabels,
  pagamentoOnlineConfig,
  pagamentoOnlineStatus,
  pagamentoStatusLabels,
} from "../constants/pagamentos";

export type { FormaPagamento };
export {
  formasPagamento,
  formasPagamentoLabels,
  pagamentoOnlineConfig,
  pagamentoOnlineStatus,
};

export type MetodoPagamentoOnline = "pix" | "cartao";

export type PagamentoOnlinePreparado = {
  provedor: string;
  ambiente: string;
  metodo: MetodoPagamentoOnline;
  status: string;
  transacaoId: string | null;
  qrCode?: string | null;
  copiaECola?: string | null;
  linkPagamento?: string | null;
  mensagem: string;
};

type PrepararPagamentoParams = {
  metodo: MetodoPagamentoOnline;
  pedidoId: string;
};

export function normalizarFormaPagamento(
  pagamento?: string | null,
): FormaPagamento | null {
  const original = String(pagamento || "").trim();
  const chave = original
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const legado = original.toLowerCase();

  if (chave === "dinheiro") return formasPagamento.dinheiro;
  if (chave === "pix") return formasPagamento.pix;
  if (chave === "cartao online") return formasPagamento.cartaoOnline;
  if (chave === "cartao na entrega") return formasPagamento.cartaoEntrega;
  if (legado === "cartã£o online" || legado === "cartãƒâ£o online") {
    return formasPagamento.cartaoOnline;
  }
  if (
    legado === "cartã£o na entrega" ||
    legado === "cartãƒâ£o na entrega"
  ) {
    return formasPagamento.cartaoEntrega;
  }

  return null;
}

export function formatarFormaPagamento(pagamento?: string | null) {
  const forma = normalizarFormaPagamento(pagamento);
  return forma ? formasPagamentoLabels[forma] : pagamento || "Não informado";
}

export function normalizarStatusPagamento(
  status?: string | null,
): StatusPagamento | null {
  const chave = String(status || "").trim() as StatusPagamento;
  return Object.values(pagamentoOnlineStatus).includes(chave) ? chave : null;
}

export function formatarStatusPagamento(status?: string | null) {
  const statusNormalizado = normalizarStatusPagamento(status);
  return statusNormalizado
    ? pagamentoStatusLabels[statusNormalizado]
    : status || "Não informado";
}

export function prepararPagamentoOnline({
  metodo,
  pedidoId,
}: PrepararPagamentoParams): PagamentoOnlinePreparado {
  const ativo =
    metodo === "pix"
      ? pagamentoOnlineConfig.pixAtivo
      : pagamentoOnlineConfig.cartaoAtivo;

  if (!ativo) {
    return {
      provedor: pagamentoOnlineConfig.provedor,
      ambiente: pagamentoOnlineConfig.ambiente,
      metodo,
      status: pagamentoOnlineStatus.aguardandoConfiguracao,
      transacaoId: null,
      qrCode: null,
      copiaECola: null,
      linkPagamento: null,
      mensagem:
        "Pagamento online preparado. Vincule a conta do provedor para ativar a cobrança automática.",
    };
  }

  return {
    provedor: pagamentoOnlineConfig.provedor,
    ambiente: pagamentoOnlineConfig.ambiente,
    metodo,
    status: pagamentoOnlineStatus.pendente,
    transacaoId: `pendente-${pedidoId}`,
    qrCode: null,
    copiaECola: null,
    linkPagamento: null,
    mensagem: "Pagamento criado e aguardando confirmação do provedor.",
  };
}

export function isPagamentoOnline(pagamento: string) {
  const forma = normalizarFormaPagamento(pagamento);
  return forma === formasPagamento.pix || forma === formasPagamento.cartaoOnline;
}

export function getMetodoPagamentoOnline(
  pagamento: string,
): MetodoPagamentoOnline | null {
  const forma = normalizarFormaPagamento(pagamento);

  if (forma === formasPagamento.pix) return "pix";
  if (forma === formasPagamento.cartaoOnline) return "cartao";

  return null;
}
