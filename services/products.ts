import { useEffect, useMemo, useState } from "react";
import {
  collection,
  type DocumentData,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  normalizarFilialIdsProduto,
  produtoDisponivelNaFilial,
} from "./productAvailability";

export type CategoriaProduto =
  | "ofertas"
  | "medicamentos"
  | "perfumaria"
  | "higiene"
  | "baby";

export type ProdutoFirestore = {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  categoriaLabel?: string;
  preco: number;
  descricao?: string;
  imagemUrl?: string;
  ativo: boolean;
  emOferta?: boolean;
  destaque?: boolean;
  filialId?: string | null;
  filialIds?: string[];
  filialNome?: string;
  controlarEstoque?: boolean;
  estoque?: number;
  estoqueMinimo?: number;
  isMedicamento?: boolean;
  principioAtivo?: string;
  codigoBarras?: string;
  temTamanhos?: boolean;
  tamanhos?: string[];
  estoquePorTamanho?: Record<string, number>;
  pmc?: number;
  bulaUrl?: string;
  exigeReceita?: boolean;
};

type ProductFilters = {
  categoria?: CategoriaProduto;
  ofertas?: boolean;
  destaques?: boolean;
  filialId?: string | null;
};

const categoriaLabels: Record<CategoriaProduto, string> = {
  ofertas: "Ofertas",
  medicamentos: "Medicamentos",
  perfumaria: "Perfumaria",
  higiene: "Higiene",
  baby: "Baby",
};

export const getCategoriaLabel = (categoria: CategoriaProduto) => {
  return categoriaLabels[categoria] || "Produto";
};

export function mapProdutoFirestore(
  id: string,
  data: DocumentData,
): ProdutoFirestore {
  const categoria = (data.categoria || "ofertas") as CategoriaProduto;
  const filialId = data.filialId || null;
  const filialIds = normalizarFilialIdsProduto({
    filialId,
    filialIds: data.filialIds,
  });

  return {
    id,
    nome: String(data.nome || ""),
    categoria,
    categoriaLabel: String(data.categoriaLabel || getCategoriaLabel(categoria)),
    preco: Number(data.preco || 0),
    descricao: String(data.descricao || ""),
    imagemUrl: String(data.imagemUrl || ""),
    ativo: data.ativo !== false,
    emOferta: data.emOferta === true,
    destaque: data.destaque === true,
    filialId,
    filialIds,
    filialNome: String(data.filialNome || ""),
    controlarEstoque: data.controlarEstoque === true,
    estoque: Number(data.estoque || 0),
    estoqueMinimo: Number(data.estoqueMinimo || 0),
    isMedicamento: data.isMedicamento === true,
    principioAtivo: String(data.principioAtivo || ""),
    codigoBarras: String(data.codigoBarras || ""),
    temTamanhos: data.temTamanhos === true,
    tamanhos: Array.isArray(data.tamanhos)
      ? data.tamanhos.filter((tamanho: unknown) => typeof tamanho === "string")
      : [],
    estoquePorTamanho:
      data.estoquePorTamanho && typeof data.estoquePorTamanho === "object"
        ? Object.fromEntries(
            Object.entries(data.estoquePorTamanho).map(([tamanho, valor]) => [
              tamanho,
              Number(valor) || 0,
            ]),
          )
        : {},
    pmc: data.pmc ? Number(data.pmc) : undefined,
    bulaUrl: String(data.bulaUrl || ""),
    exigeReceita: data.exigeReceita === true,
  };
}

export function useProdutos(filters: ProductFilters = {}) {
  const [produtos, setProdutos] = useState<ProdutoFirestore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "produtos")),
      (snapshot) => {
        const dados = snapshot.docs.map((docSnap) =>
          mapProdutoFirestore(docSnap.id, docSnap.data()),
        );

        setProdutos(dados);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar produtos:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const produtosFiltrados = useMemo(() => {
    return produtos
      .filter((produto) => produto.ativo)
      .filter((produto) =>
        filters.categoria ? produto.categoria === filters.categoria : true,
      )
      .filter((produto) =>
        produtoDisponivelNaFilial(produto, filters.filialId),
      )
      .filter((produto) => (filters.ofertas ? produto.emOferta : true))
      .filter((produto) => (filters.destaques ? produto.destaque : true))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [
    filters.categoria,
    filters.destaques,
    filters.filialId,
    filters.ofertas,
    produtos,
  ]);

  return { produtos: produtosFiltrados, loading };
}
