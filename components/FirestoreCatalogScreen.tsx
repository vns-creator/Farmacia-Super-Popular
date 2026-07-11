import { createElement } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { ProductCatalogScreen } from "./ProductCatalogScreen";
import { FilialSelector } from "./FilialSelector";
import { useFilial } from "../context/FilialContext";
import {
  type CategoriaProduto,
  getCategoriaLabel,
  useProdutos,
} from "../services/products";

type FirestoreCatalogScreenProps = {
  title: string;
  subtitle: string;
  categoria?: CategoriaProduto;
  ofertas?: boolean;
  searchPlaceholder?: string;
  productDescription: string;
};

export function FirestoreCatalogScreen({
  title,
  subtitle,
  categoria,
  ofertas = false,
  searchPlaceholder,
  productDescription,
}: FirestoreCatalogScreenProps) {
  const { filialId } = useFilial();
  const { produtos, loading } = useProdutos({ categoria, ofertas, filialId });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1b5e20" />
        <Text style={styles.loadingTexto}>Carregando produtos...</Text>
      </View>
    );
  }

  return createElement(ProductCatalogScreen, {
    title,
    subtitle,
    searchPlaceholder,
    productDescription,
    products: produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.emOferta
        ? "Oferta"
        : produto.categoriaLabel || getCategoriaLabel(produto.categoria),
      preco: produto.preco,
      imagemUrl: produto.imagemUrl,
      descricao: produto.descricao,
      filialId: produto.filialId,
      filialIds: produto.filialIds,
      filialNome: produto.filialNome,
      controlarEstoque: produto.controlarEstoque,
      estoque: produto.estoque,
      estoqueMinimo: produto.estoqueMinimo,
      temTamanhos: produto.temTamanhos,
      tamanhos: produto.tamanhos,
      estoquePorTamanho: produto.estoquePorTamanho,
    })),
    showCartBar: true,
    headerExtra: createElement(FilialSelector),
  });
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f8f5",
  },
  loadingTexto: {
    color: "#666",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
});
