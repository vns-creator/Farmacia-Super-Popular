import { getFilialById } from "../constants/filiais";

export type ProductFilialFields = {
  filialId?: string | null;
  filialIds?: string[];
};

export function normalizarFilialIdsProduto(produto: ProductFilialFields) {
  const filialIds = Array.isArray(produto.filialIds)
    ? produto.filialIds.filter(
        (filialId) => typeof filialId === "string" && filialId.trim().length > 0,
      )
    : [];

  if (filialIds.length > 0) {
    return [...new Set(filialIds)];
  }

  return produto.filialId ? [produto.filialId] : [];
}

export function produtoDisponivelNaFilial(
  produto: ProductFilialFields,
  filialId?: string | null,
) {
  if (!filialId) return true;

  const filialIds = normalizarFilialIdsProduto(produto);

  return filialIds.length === 0 || filialIds.includes(filialId);
}

export function getFilialIdsParaSalvar({
  isAdminGeral,
  filialUsuarioId,
  filialIdsForm,
}: {
  isAdminGeral: boolean;
  filialUsuarioId?: string | null;
  filialIdsForm: string[];
}) {
  if (isAdminGeral) {
    return normalizarFilialIdsProduto({ filialIds: filialIdsForm });
  }

  return filialUsuarioId ? [filialUsuarioId] : [];
}

export function getResumoFiliaisProduto(
  produto: ProductFilialFields,
  options: { curto?: boolean } = {},
) {
  const filialIds = normalizarFilialIdsProduto(produto);

  if (filialIds.length === 0) return "Todas as filiais";

  return filialIds
    .map((filialId) => {
      const nome = getFilialById(filialId)?.nome;
      return nome && options.curto ? getNomeCurtoFilial(nome) : nome;
    })
    .filter(Boolean)
    .join(", ");
}

export function getNomeCurtoFilial(nome: string) {
  return nome
    .replace("Filial ", "")
    .replace("Efapi (Tancredo)", "Efapi T.")
    .replace("Efapi (Atilio Fontana)", "Efapi A.");
}
