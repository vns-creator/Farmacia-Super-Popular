export function formatarMoeda(valor?: number | null) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return "R$ 0,00";
  }

  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export function parseNumeroDecimal(valor: string) {
  return Number(String(valor || "0").replace(",", "."));
}
