import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarrinho } from "../context/CarContext";
import { formatarMoeda } from "../services/formatters";
import { FloatingWhatsAppButton } from "./FloatingWhatsAppButton";
import { ProductFilialAvailability } from "./ProductFilialAvailability";
import { SeletorTamanhoModal } from "./SeletorTamanhoModal";

export type CatalogProduct = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  imagem?: ImageSourcePropType;
  imagemUrl?: string;
  descricao?: string;
  filialId?: string | null;
  filialIds?: string[];
  filialNome?: string;
  controlarEstoque?: boolean;
  estoque?: number;
  estoqueMinimo?: number;
  temTamanhos?: boolean;
  tamanhos?: string[];
  estoquePorTamanho?: Record<string, number>;
};

type ProductCatalogScreenProps = {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  productDescription: string;
  products: CatalogProduct[];
  showCartBar?: boolean;
  headerExtra?: React.ReactNode;
};

export function ProductCatalogScreen({
  title,
  subtitle,
  searchPlaceholder = "Buscar produtos",
  productDescription,
  products,
  showCartBar = false,
  headerExtra,
}: ProductCatalogScreenProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [produtoParaTamanho, setProdutoParaTamanho] =
    useState<CatalogProduct | null>(null);

  const {
    adicionarAoCarrinho,
    removerUmaUnidade,
    obterQuantidade,
    obterQuantidadeTotal,
    carrinho,
    totalCarrinho,
  } = useCarrinho();

  const totalItens = useMemo(
    () => carrinho.reduce((total, item) => total + item.quantidade, 0),
    [carrinho],
  );

  const produtosFiltrados = useMemo(() => {
    return products.filter((item) =>
      [item.nome, item.categoria, item.descricao]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(busca.toLowerCase()),
    );
  }, [busca, products]);

  const renderItem = ({ item }: { item: CatalogProduct }) => {
    const temTamanhos = item.temTamanhos === true && (item.tamanhos?.length || 0) > 0;
    const quantidade = temTamanhos
      ? obterQuantidadeTotal(item.id)
      : obterQuantidade(item.id);
    const estoqueDisponivel = temTamanhos
      ? Object.values(item.estoquePorTamanho || {}).reduce(
          (total, valor) => total + Number(valor || 0),
          0,
        )
      : Number(item.estoque || 0);
    const controlaEstoque = item.controlarEstoque === true;
    const semEstoque = controlaEstoque && estoqueDisponivel <= 0;
    const atingiuEstoque = controlaEstoque && quantidade >= estoqueDisponivel;
    const imagemSource = item.imagemUrl
      ? { uri: item.imagemUrl }
      : item.imagem || require("../assets/images/logo.png");

    return (
      <View style={styles.cardProduto}>
        <View style={styles.topoCard}>
          <Text style={styles.categoriaProduto}>{item.categoria}</Text>
        </View>

        <Image
          source={imagemSource}
          style={styles.imagemProduto}
          resizeMode="contain"
        />

        <Text style={styles.nomeProduto} numberOfLines={2}>
          {item.nome}
        </Text>

        <Text style={styles.descricaoProduto}>
          {item.descricao || productDescription}
        </Text>

        <ProductFilialAvailability
          filialId={item.filialId}
          filialIds={item.filialIds}
        />

        {controlaEstoque ? (
          <Text style={[styles.estoqueTexto, semEstoque && styles.estoqueZerado]}>
            {semEstoque ? "Indisponivel" : `${estoqueDisponivel} em estoque`}
          </Text>
        ) : null}

        <View style={styles.precoLinha}>
          <Text style={styles.precoLabel}>A partir de</Text>
          <Text style={styles.precoProduto}>
            {formatarMoeda(item.preco)}
          </Text>
        </View>

        {temTamanhos ? (
          <View style={styles.quantidadeEspaco} />
        ) : (
          <View style={styles.quantidadeContainer}>
            <TouchableOpacity
              style={[
                styles.botaoMenos,
                quantidade === 0 && styles.botaoMenosDesativado,
              ]}
              onPress={() => removerUmaUnidade(item.id)}
              disabled={quantidade === 0}
              activeOpacity={0.85}
            >
              <Ionicons
                name="remove"
                size={18}
                color={quantidade === 0 ? "#8fa393" : "#1b5e20"}
              />
            </TouchableOpacity>

            <Text style={styles.quantidadeTexto}>{quantidade}</Text>

            <TouchableOpacity
              style={[
                styles.botaoMais,
                (semEstoque || atingiuEstoque) && styles.botaoMaisDesativado,
              ]}
              onPress={() => adicionarAoCarrinho(item)}
              disabled={semEstoque || atingiuEstoque}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={18}
                color={semEstoque || atingiuEstoque ? "#8fa393" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.botaoAdicionar,
            (semEstoque || atingiuEstoque) && styles.botaoAdicionarDesativado,
          ]}
          onPress={() =>
            temTamanhos ? setProdutoParaTamanho(item) : adicionarAoCarrinho(item)
          }
          disabled={semEstoque || atingiuEstoque}
          activeOpacity={0.85}
        >
          <Ionicons
            name={semEstoque ? "alert-circle-outline" : "cart-outline"}
            size={16}
            color="#1f2937"
          />
          <Text style={styles.textoBotaoAdicionar}>
            {semEstoque
              ? "Sem estoque"
              : atingiuEstoque
                ? "Limite no carrinho"
                : temTamanhos
                  ? quantidade > 0
                    ? `Escolher tamanho (${quantidade})`
                    : "Escolher tamanho"
                  : quantidade > 0
                    ? "Adicionar mais"
                    : "Adicionar"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.replace("/")}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>

        <View style={styles.topoTexto}>
          <Text style={styles.titulo}>{title}</Text>
          <Text style={styles.subtitulo}>{subtitle}</Text>
        </View>

        <View style={styles.espacoDireita} />
      </View>

      <View style={styles.buscaContainer}>
        <Ionicons name="search" size={20} color="#7a7a7a" />
        <TextInput
          placeholder={searchPlaceholder}
          placeholderTextColor="#7a7a7a"
          value={busca}
          onChangeText={setBusca}
          style={styles.inputBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca("")} activeOpacity={0.85}>
            <Ionicons name="close-circle" size={20} color="#7a7a7a" />
          </TouchableOpacity>
        )}
      </View>

      {headerExtra ? <View style={styles.headerExtra}>{headerExtra}</View> : null}

      <FlatList
        data={produtosFiltrados}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.linhaProdutos}
        contentContainerStyle={[
          styles.listaConteudo,
          showCartBar && carrinho.length > 0 && styles.listaComBarra,
        ]}
        ListEmptyComponent={
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioTitulo}>Nenhum produto encontrado</Text>
            <Text style={styles.vazioTexto}>Tente buscar por outro nome.</Text>
          </View>
        }
      />

      {showCartBar && carrinho.length > 0 && (
        <TouchableOpacity
          style={styles.barraCarrinho}
          onPress={() => router.push("/carrinho")}
          activeOpacity={0.92}
        >
          <View style={styles.barraEsquerda}>
            <View style={styles.bolinhaCarrinho}>
              <Text style={styles.bolinhaCarrinhoTexto}>{totalItens}</Text>
            </View>

            <View>
              <Text style={styles.barraCarrinhoTexto}>Ver carrinho</Text>
              <Text style={styles.barraCarrinhoSubtexto}>
                {totalItens}{" "}
                {totalItens === 1 ? "item adicionado" : "itens adicionados"}
              </Text>
            </View>
          </View>

          <View style={styles.barraDireita}>
            <Text style={styles.barraCarrinhoValor}>
              {formatarMoeda(totalCarrinho)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      <FloatingWhatsAppButton
        bottom={showCartBar && carrinho.length > 0 ? 104 : 24}
      />

      <SeletorTamanhoModal
        produto={produtoParaTamanho}
        onClose={() => setProdutoParaTamanho(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },

  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  topoTexto: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },

  espacoDireita: {
    width: 44,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b5e20",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },

  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerExtra: {
    marginHorizontal: 14,
  },

  inputBusca: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#222",
  },

  listaConteudo: {
    paddingHorizontal: 14,
    paddingBottom: 120,
  },

  listaComBarra: {
    paddingBottom: 180,
  },

  linhaProdutos: {
    justifyContent: "space-between",
    marginBottom: 14,
  },

  cardProduto: {
    backgroundColor: "#fff",
    width: "48.5%",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  topoCard: {
    marginBottom: 6,
  },

  imagemProduto: {
    width: "100%",
    height: 110,
    marginBottom: 10,
  },

  categoriaProduto: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "700",
  },

  nomeProduto: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
    minHeight: 40,
  },

  descricaoProduto: {
    fontSize: 12,
    color: "#7a7a7a",
    lineHeight: 17,
    marginTop: 5,
    minHeight: 36,
  },
  estoqueTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
  estoqueZerado: {
    color: "#b91c1c",
  },

  precoLinha: {
    marginTop: 10,
    marginBottom: 10,
  },

  precoLabel: {
    fontSize: 11,
    color: "#7b7b7b",
    marginBottom: 2,
  },

  precoProduto: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
  },

  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  quantidadeEspaco: {
    height: 36,
    marginBottom: 10,
  },

  botaoMenos: {
    backgroundColor: "#e8f5e9",
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoMenosDesativado: {
    backgroundColor: "#edf2ee",
  },

  botaoMais: {
    backgroundColor: "#2e7d32",
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  botaoMaisDesativado: {
    backgroundColor: "#edf2ee",
  },

  quantidadeTexto: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  botaoAdicionar: {
    backgroundColor: "#f4c542",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  botaoAdicionarDesativado: {
    opacity: 0.7,
  },

  textoBotaoAdicionar: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },

  vazioContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    paddingHorizontal: 30,
  },

  vazioTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },

  vazioTexto: {
    fontSize: 14,
    color: "#6f7d73",
    textAlign: "center",
  },

  barraCarrinho: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: "#1b5e20",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  barraEsquerda: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  bolinhaCarrinho: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f4c542",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  bolinhaCarrinhoTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },

  barraCarrinhoTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  barraCarrinhoSubtexto: {
    color: "#dff0e1",
    fontSize: 13,
    marginTop: 2,
  },

  barraDireita: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  barraCarrinhoValor: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 4,
  },
});
