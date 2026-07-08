const statusPedidoLabels = {
  novo: { completo: "Recebido", curto: "Recebido" },
  recebido: { completo: "Recebido", curto: "Recebido" },
  preparo: { completo: "Em preparo", curto: "Em preparo" },
  pronto_retirada: {
    completo: "Pronto para retirada",
    curto: "Pronto retirada",
  },
  entrega: { completo: "Saiu para entrega", curto: "Saiu entrega" },
  entregue: { completo: "Entregue", curto: "Entregue" },
  finalizado: { completo: "Finalizado", curto: "Finalizado" },
  cancelado: { completo: "Cancelado", curto: "Cancelado" },
} as const;

type StatusPedido = keyof typeof statusPedidoLabels;

export function formatarStatusPedido(
  status?: string,
  options: { curto?: boolean } = {},
) {
  const statusNormalizado = (status || "recebido") as StatusPedido;
  const labels = statusPedidoLabels[statusNormalizado];

  if (!labels) return status || "Recebido";

  return options.curto ? labels.curto : labels.completo;
}

type TimestampLike = {
  toDate: () => Date;
};

function isTimestampLike(valor: unknown): valor is TimestampLike {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as TimestampLike).toDate === "function"
  );
}

export function formatarDataHora(valor?: unknown, fallback = "Nao informado") {
  if (!valor) return fallback;
  if (isTimestampLike(valor)) return valor.toDate().toLocaleString("pt-BR");
  if (valor instanceof Date) return valor.toLocaleString("pt-BR");
  return fallback;
}
