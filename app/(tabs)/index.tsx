import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { farmaciaInfo } from "../../constants/farmacia";
import { FloatingWhatsAppButton } from "../../components/FloatingWhatsAppButton";
import { FilialSelector } from "../../components/FilialSelector";
import { ProductFilialAvailability } from "../../components/ProductFilialAvailability";
import { SeletorTamanhoModal } from "../../components/SeletorTamanhoModal";
import { useCarrinho } from "../../context/CarContext";
import { useFilial } from "../../context/FilialContext";
import { formatarMoeda } from "../../services/formatters";
import { useProdutos } from "../../services/products";

type HomeProduct = {
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

const categorias = [
  {
    id: "1",
    nome: "Ofertas",
    icon: "pricetag",
    rota: "/ofertas",
  },
  {
    id: "2",
    nome: "Medicamentos",
    icon: "medkit",
    rota: "/medicamentos",
  },
  {
    id: "3",
    nome: "Perfumaria",
    icon: "sparkles",
    rota: "/perfumaria",
  },
  {
    id: "4",
    nome: "Higiene",
    icon: "water",
    rota: "/higiene",
  },
  {
    id: "5",
    nome: "Baby",
    icon: "happy",
    rota: "/baby",
  },
];

const destaques = [
  {
    id: "home-1",
    nome: "Dipirona 1g",
    categoria: "Oferta do dia",
    preco: 12.9,
    imagem: require("../../assets/images/dipirona.png"),
  },
  {
    id: "home-2",
    nome: "Vitamina C",
    categoria: "Mais vendido",
    preco: 19.9,
    imagem: require("../../assets/images/vitaminac.png"),
  },
  {
    id: "home-3",
    nome: "Fralda Baby",
    categoria: "Baby",
    preco: 39.9,
    imagem: require("../../assets/images/fraldababy.png"),
  },
  {
    id: "home-4",
    nome: "Protetor Solar",
    categoria: "Perfumaria",
    preco: 32.9,
    imagem: require("../../assets/images/protetorsolar.png"),
  },
];

const catalogoBusca = [
  ...destaques,
  {
    id: "busca-dipirona",
    nome: "Dipirona",
    categoria: "Medicamentos",
    preco: 12.9,
    imagem: require("../../assets/images/dipirona.png"),
  },
  {
    id: "busca-paracetamol",
    nome: "Paracetamol",
    categoria: "Medicamentos",
    preco: 9.9,
    imagem: require("../../assets/images/paracetamol.png"),
  },
  {
    id: "busca-sabonete",
    nome: "Sabonete Liquido",
    categoria: "Higiene",
    preco: 14.9,
    imagem: require("../../assets/images/saboneteliquido.png"),
  },
  {
    id: "busca-creme-dental",
    nome: "Creme Dental",
    categoria: "Higiene",
    preco: 8.9,
    imagem: require("../../assets/images/cremedental.png"),
  },
  {
    id: "busca-shampoo",
    nome: "Shampoo",
    categoria: "Perfumaria",
    preco: 18.9,
    imagem: require("../../assets/images/shampoo.png"),
  },
  {
    id: "busca-protetor",
    nome: "Protetor Solar",
    categoria: "Perfumaria",
    preco: 32.9,
    imagem: require("../../assets/images/protetorsolar.png"),
  },
  {
    id: "busca-fralda",
    nome: "Fralda Baby",
    categoria: "Baby",
    preco: 39.9,
    imagem: require("../../assets/images/fraldababy.png"),
  },
  {
    id: "busca-lenco",
    nome: "Lenco Umedecido",
    categoria: "Baby",
    preco: 11.9,
    imagem: require("../../assets/images/lencoumedecido.png"),
  },
  {
    id: "busca-melatonina",
    nome: "Melatonina",
    categoria: "Medicamentos",
    preco: 29.9,
    imagem: require("../../assets/images/melatonina.png"),
  },
  {
    id: "busca-omega3",
    nome: "Omega 3",
    categoria: "Medicamentos",
    preco: 34.9,
    imagem: require("../../assets/images/omega3manipulado.png"),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const { filialId } = useFilial();
  const { produtos: produtosCatalogo } = useProdutos({ filialId });
  const { produtos: produtosDestaque } = useProdutos({ destaques: true, filialId });

  const {
    adicionarAoCarrinho,
    removerUmaUnidade,
    obterQuantidade,
    obterQuantidadeTotal,
    carrinho,
    totalCarrinho,
  } = useCarrinho();
  const [produtoParaTamanho, setProdutoParaTamanho] =
    useState<HomeProduct | null>(null);

  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  const produtosFiltrados = useMemo<HomeProduct[]>(() => {
    const termo = busca.trim().toLowerCase();
    const produtosBase =
      produtosDestaque.length > 0
        ? produtosDestaque.map((produto) => ({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.emOferta
              ? "Oferta"
              : produto.categoriaLabel || produto.categoria,
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
          }))
        : destaques;

    if (!termo) return produtosBase;

    if (produtosCatalogo.length > 0) {
      return produtosCatalogo
        .map((produto) => ({
          id: produto.id,
          nome: produto.nome,
          categoria: produto.emOferta
            ? "Oferta"
            : produto.categoriaLabel || produto.categoria,
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
        }))
        .filter((item) =>
          [item.nome, item.categoria, item.descricao]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(termo),
        );
    }

    return [...produtosBase, ...catalogoBusca].filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo),
    );
  }, [busca, produtosCatalogo, produtosDestaque]);

  const renderProduto = ({ item }: { item: HomeProduct }) => {
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
      : item.imagem || require("../../assets/images/logo.png");

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
          {item.descricao || "Cuidado e qualidade para o seu dia a dia"}
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
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderProduto}
        numColumns={2}
        columnWrapperStyle={styles.linhaProdutos}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listaConteudo}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.logoArea}>
                  <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <View style={styles.textoHeader}>
                    <Text style={styles.boasVindas}>Bem-vindo</Text>
                    <Text style={styles.nomeFarmacia}>
                      Farmácia Super Popular
                    </Text>
                    <Text style={styles.subtituloFarmacia}>
                      Seu cuidado começa aqui
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.botaoConta}
                  onPress={() => router.push("/conta")}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={28}
                    color="#1b5e20"
                  />
                </TouchableOpacity>
              </View>

              <FilialSelector />

              <View style={styles.buscaContainer}>
                <Ionicons name="search" size={20} color="#7a7a7a" />
                <TextInput
                  placeholder="Buscar produtos em destaque"
                  placeholderTextColor="#7a7a7a"
                  value={busca}
                  onChangeText={setBusca}
                  style={styles.inputBusca}
                />
                {busca.length > 0 && (
                  <TouchableOpacity onPress={() => setBusca("")}>
                    <Ionicons name="close-circle" size={20} color="#7a7a7a" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.banner}>
              <View style={styles.bannerTextoArea}>
                <Text style={styles.bannerTag}>{farmaciaInfo.horario}</Text>
                <Text style={styles.bannerTitulo}>
                  Ofertas e cuidado todo dia
                </Text>
                <Text style={styles.bannerSubtitulo}>
                  Encontre medicamentos, higiene, perfumaria e muito mais.
                </Text>
              </View>

              <View style={styles.bannerIconeContainer}>
                <MaterialCommunityIcons name="pill" size={42} color="#ffffff" />
              </View>
            </View>

            <View style={styles.secao}>
              <Text style={styles.tituloSecao}>Categorias</Text>
              <Text style={styles.subtituloSecao}>
                Navegue pelas principais áreas da farmácia
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriasContainer}
            >
              {categorias.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  style={styles.categoriaCard}
                  onPress={() => router.push(categoria.rota as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.categoriaIcone}>
                    <Ionicons
                      name={categoria.icon as any}
                      size={22}
                      color="#1b5e20"
                    />
                  </View>
                  <Text style={styles.categoriaNome}>{categoria.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.secao}>
              <Text style={styles.tituloSecao}>Destaques para você</Text>
              <Text style={styles.subtituloSecao}>
                Produtos selecionados com mais procura
              </Text>
            </View>
          </>
        }
      />

      {carrinho.length > 0 && (
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

      <FloatingWhatsAppButton bottom={carrinho.length > 0 ? 104 : 24} />

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

  listaConteudo: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 180,
  },

  header: {
    marginBottom: 16,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  logoArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  textoHeader: {
    flex: 1,
  },

  logo: {
    width: 58,
    height: 58,
    marginRight: 12,
    borderRadius: 14,
  },

  boasVindas: {
    fontSize: 13,
    color: "#666",
    marginBottom: 1,
  },

  nomeFarmacia: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
  },

  subtituloFarmacia: {
    fontSize: 12,
    color: "#6f7d73",
    marginTop: 2,
  },

  botaoConta: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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

  inputBusca: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#222",
  },

  banner: {
    backgroundColor: "#1b5e20",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bannerTextoArea: {
    flex: 1,
    paddingRight: 12,
  },

  bannerTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f4c542",
    marginBottom: 6,
    letterSpacing: 0.8,
  },

  bannerTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },

  bannerSubtitulo: {
    fontSize: 14,
    color: "#dff0e1",
    lineHeight: 20,
  },

  bannerIconeContainer: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  contatoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#edf2ee",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  contatoTextoArea: {
    flex: 1,
  },

  contatoTitulo: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "800",
  },

  contatoTexto: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 3,
  },

  secao: {
    marginBottom: 12,
  },

  tituloSecao: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
  },

  subtituloSecao: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  categoriasContainer: {
    paddingBottom: 18,
    paddingRight: 8,
  },

  categoriaCard: {
    width: 108,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eef3ef",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  categoriaIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  categoriaNome: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
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

