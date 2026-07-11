// context/CarContext.tsx

import React, { createContext, ReactNode, useContext, useState } from "react";

export type Produto = {
  id: string;
  nome: string;
  preco: number;
  imagemUrl?: string;
  categoria?: string;
  descricao?: string;
  filialId?: string | null;
  filialIds?: string[];
  filialNome?: string;
  controlarEstoque?: boolean;
  estoque?: number;
  estoqueMinimo?: number;
  isMedicamento?: boolean;
  principioAtivo?: string;
  temTamanhos?: boolean;
  tamanhos?: string[];
  estoquePorTamanho?: Record<string, number>;
};

export type ItemCarrinho = Produto & {
  quantidade: number;
  tamanhoSelecionado?: string;
};

type CarrinhoContextType = {
  carrinho: ItemCarrinho[];
  adicionarAoCarrinho: (produto: Produto, tamanho?: string) => void;
  removerUmaUnidade: (id: string, tamanho?: string) => void;
  obterQuantidade: (id: string, tamanho?: string) => number;
  obterQuantidadeTotal: (id: string) => number;
  limparCarrinho: () => void;
  totalCarrinho: number;
};

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(
  undefined,
);

function mesmoItem(
  item: ItemCarrinho,
  id: string,
  tamanho: string | undefined,
) {
  return item.id === id && (item.tamanhoSelecionado || null) === (tamanho || null);
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const adicionarAoCarrinho = (produto: Produto, tamanho?: string) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) =>
        mesmoItem(item, produto.id, tamanho),
      );

      if (produto.controlarEstoque) {
        if (tamanho && produto.temTamanhos) {
          const estoqueTamanho = Number(
            produto.estoquePorTamanho?.[tamanho] || 0,
          );
          const quantidadeAtualTamanho = itemExistente?.quantidade || 0;

          if (quantidadeAtualTamanho >= estoqueTamanho) {
            return prev;
          }
        } else {
          const estoqueDisponivel = Number(produto.estoque || 0);
          const quantidadeTotalAtual = prev
            .filter((item) => item.id === produto.id)
            .reduce((total, item) => total + item.quantidade, 0);

          if (quantidadeTotalAtual >= estoqueDisponivel) {
            return prev;
          }
        }
      }

      if (itemExistente) {
        return prev.map((item) =>
          mesmoItem(item, produto.id, tamanho)
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        );
      }

      return [
        ...prev,
        { ...produto, tamanhoSelecionado: tamanho, quantidade: 1 },
      ];
    });
  };

  const removerUmaUnidade = (id: string, tamanho?: string) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => mesmoItem(item, id, tamanho));

      if (!itemExistente) return prev;

      if (itemExistente.quantidade === 1) {
        return prev.filter((item) => !mesmoItem(item, id, tamanho));
      }

      return prev.map((item) =>
        mesmoItem(item, id, tamanho)
          ? { ...item, quantidade: item.quantidade - 1 }
          : item,
      );
    });
  };

  const obterQuantidade = (id: string, tamanho?: string) => {
    const item = carrinho.find((item) => mesmoItem(item, id, tamanho));
    return item ? item.quantidade : 0;
  };

  const obterQuantidadeTotal = (id: string) => {
    return carrinho
      .filter((item) => item.id === id)
      .reduce((total, item) => total + item.quantidade, 0);
  };

  const limparCarrinho = () => {
    setCarrinho([]);
  };

  const totalCarrinho = carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0,
  );

  return (
    <CarrinhoContext.Provider
      value={{
        carrinho,
        adicionarAoCarrinho,
        removerUmaUnidade,
        obterQuantidade,
        obterQuantidadeTotal,
        limparCarrinho,
        totalCarrinho,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const context = useContext(CarrinhoContext);

  if (!context) {
    throw new Error("useCarrinho deve ser usado dentro de um CarrinhoProvider");
  }

  return context;
}
