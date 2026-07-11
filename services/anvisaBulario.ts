import {
  collection,
  type DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export type MedicamentoAnvisa = {
  numeroProcesso: string;
  nomeProduto: string;
  empresa: string | null;
  categoriaRegulatoria: string | null;
  situacaoRegistro: string | null;
};

function mapMedicamentoAnvisa(
  id: string,
  data: DocumentData,
): MedicamentoAnvisa {
  return {
    numeroProcesso: id,
    nomeProduto: String(data.nomeProduto || ""),
    empresa: data.empresa || null,
    categoriaRegulatoria: data.categoriaRegulatoria || null,
    situacaoRegistro: data.situacaoRegistro || null,
  };
}

// Code point U+F8FF (area de uso privado do Unicode) usado como limite
// superior no truque classico de "busca por prefixo" do Firestore: bate
// com qualquer string que comece com termoNormalizado.
const LIMITE_SUPERIOR_PREFIXO = "";

/**
 * Busca por "comeca com" no nome do produto sincronizado da ANVISA.
 * Usa o campo nomeProdutoBusca (lowercase) gravado pela Cloud Function de
 * sincronizacao.
 */
export async function buscarMedicamentosAnvisaPorNome(
  termo: string,
  limite = 15,
) {
  const termoNormalizado = termo.trim().toLowerCase();

  if (!termoNormalizado) return [] as MedicamentoAnvisa[];

  const snapshot = await getDocs(
    query(
      collection(db, "medicamentosAnvisa"),
      orderBy("nomeProdutoBusca"),
      where("nomeProdutoBusca", ">=", termoNormalizado),
      where(
        "nomeProdutoBusca",
        "<=",
        termoNormalizado + LIMITE_SUPERIOR_PREFIXO,
      ),
      limit(limite),
    ),
  );

  return snapshot.docs.map((docSnap) =>
    mapMedicamentoAnvisa(docSnap.id, docSnap.data()),
  );
}
