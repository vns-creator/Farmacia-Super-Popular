import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarrinho } from "../context/CarContext";
import { useFilial } from "../context/FilialContext";
import {
  ANVISA_BULARIO_URL,
  encontrarAlertaRevisado,
  useAlertasSanitarios,
} from "../services/alertasSanitarios";
import { formatarMoeda } from "../services/formatters";
import { useProdutos, type ProdutoFirestore } from "../services/products";
import { FilialSelector } from "./FilialSelector";
import { FloatingWhatsAppButton } from "./FloatingWhatsAppButton";
import { ProductFilialAvailability } from "./ProductFilialAvailability";
import { SeletorTamanhoModal } from "./SeletorTamanhoModal";

export function MedicamentosCatalogScreen() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const { filialId } = useFilial();
  const { produtos, loading } = useProdutos({
    categoria: "medicamentos",
    filialId,
  });
  const { alertas } = useAlertasSanitarios();

  const [produtoParaTamanho, setProdutoParaTamanho] =
    useState<ProdutoFirestore | null>(null);

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
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;

    return produtos.filter((item) =>
      [item.nome, item.descricao, item.principioAtivo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca, produtos]);

  const abrirBula = (bulaUrl?: string) => {
    void Linking.openURL(bulaUrl || ANVISA_BULARIO_URL);
  };

  const renderItem = ({ item }: { item: ProdutoFirestore }) => {
    const temTamanhos =
      item.temTamanhos === true && (item.tamanhos?.length || 0) > 0;
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
      : require("../assets/images/logo.png");
    const temPmc = typeof item.pmc === "number" && item.pmc > item.preco;
    const alertaRevisado = encontrarAlertaRevisado(
      item.principioAtivo,
      alertas,
    );
    const linhasAlerta = alertaRevisado
      ? [...alertaRevisado.alertas, ...alertaRevisado.contraindicacoes].slice(
          0,
          6,
        )
      : [];

    return (
      <View style={styles.cardProduto}>
        <Image
          source={imagemSource}
          style={styles.imagemProduto}
          resizeMode="contain"
        />

        <View style={styles.infoArea}>
          <View style={styles.infoTopo}>
            <Text style={styles.nomeProduto} numberOfLines={2}>
              {item.nome}
            </Text>

            <TouchableOpacity
              style={styles.bulaBotao}
              onPress={() => abrirBula(item.bulaUrl)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#1b5e20"
              />
              <Text style={styles.bulaBotaoTexto}>Bula</Text>
            </TouchableOpacity>
          </View>

          {item.principioAtivo ? (
            <Text style={styles.principioAtivo}>{item.principioAtivo}</Text>
          ) : null}

          <Text style={styles.descricaoProduto} numberOfLines={2}>
            {item.descricao || "Fórmula preparada com cuidado"}
          </Text>

          <ProductFilialAvailability
            filialId={item.filialId}
            filialIds={item.filialIds}
          />

          {controlaEstoque ? (
            <Text
              style={[styles.estoqueTexto, semEstoque && styles.estoqueZerado]}
            >
              {semEstoque ? "Indisponível" : `${estoqueDisponivel} em estoque`}
            </Text>
          ) : null}

          {linhasAlerta.length > 0 ? (
            <View style={styles.alertaMedicamentoBox}>
              <View style={styles.alertaMedicamentoTopo}>
                <Ionicons name="warning-outline" size={14} color="#92400e" />
                <Text style={styles.alertaMedicamentoTitulo}>Atenção</Text>
              </View>
              {linhasAlerta.map((linha, index) => (
                <Text key={index} style={styles.alertaMedicamentoTexto}>
                  {"• "}
                  {linha}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.precoArea}>
            {temPmc ? (
              <Text style={styles.pmcTexto}>PMC {formatarMoeda(item.pmc)}</Text>
            ) : null}
            <Text style={styles.precoProduto}>{formatarMoeda(item.preco)}</Text>
          </View>

          <View style={styles.acoesArea}>
            {temTamanhos ? null : (
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
                    size={16}
                    color={quantidade === 0 ? "#8fa393" : "#1b5e20"}
                  />
                </TouchableOpacity>

                <Text style={styles.quantidadeTexto}>{quantidade}</Text>

                <TouchableOpacity
                  style={[
                    styles.botaoMais,
                    (semEstoque || atingiuEstoque) &&
                      styles.botaoMaisDesativado,
                  ]}
                  onPress={() => adicionarAoCarrinho(item)}
                  disabled={semEstoque || atingiuEstoque}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={semEstoque || atingiuEstoque ? "#8fa393" : "#fff"}
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.botaoAdicionar,
                (semEstoque || atingiuEstoque) &&
                  styles.botaoAdicionarDesativado,
              ]}
              onPress={() =>
                temTamanhos
                  ? setProdutoParaTamanho(item)
                  : adicionarAoCarrinho(item)
              }
              disabled={semEstoque || atingiuEstoque}
              activeOpacity={0.85}
            >
              <Ionicons
                name={semEstoque ? "alert-circle-outline" : "cart-outline"}
                size={15}
                color="#1f2937"
              />
              <Text style={styles.textoBotaoAdicionar}>
                {semEstoque
                  ? "Sem estoque"
                  : atingiuEstoque
                    ? "Limite"
                    : temTamanhos
                      ? quantidade > 0
                        ? `Tamanho (${quantidade})`
                        : "Escolher tamanho"
                      : quantidade > 0
                        ? "Adicionar mais"
                        : "Adicionar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
          <Text style={styles.titulo}>Medicamentos</Text>
          <Text style={styles.subtitulo}>Encontre seus medicamentos</Text>
        </View>

        <View style={styles.espacoDireita} />
      </View>

      <View style={styles.buscaContainer}>
        <Ionicons name="search" size={20} color="#7a7a7a" />
        <TextInput
          placeholder="Buscar medicamentos"
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

      <TouchableOpacity
        style={styles.avisoBox}
        onPress={() => router.push("/farmacia" as any)}
        activeOpacity={0.88}
      >
        <View style={styles.avisoIconeContainer}>
          <Ionicons name="alert-circle" size={24} color="#fff" />
        </View>
        <Text style={styles.avisoTexto}>
          Para medicamentos tarjados e manipulados, entrar em contato via{" "}
          <Text style={styles.avisoTextoDestaque}>WhatsApp</Text>
        </Text>
        <View style={styles.avisoAcao}>
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text
        style={styles.disclaimerGeral}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        Os alertas exibidos são um resumo e não substituem a bula completa nem a
        orientação de um médico ou farmacêutico.
      </Text>

      <View style={styles.headerExtra}>
        <FilialSelector />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
          <Text style={styles.loadingTexto}>Carregando medicamentos...</Text>
        </View>
      ) : (
        <FlatList
          data={produtosFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listaConteudo,
            carrinho.length > 0 && styles.listaComBarra,
          ]}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioTitulo}>
                Nenhum medicamento encontrado
              </Text>
              <Text style={styles.vazioTexto}>
                Tente buscar por outro nome.
              </Text>
            </View>
          }
        />
      )}

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
    marginBottom: 12,
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
    marginBottom: 4,
  },

  avisoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#d97706",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f4c542",
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#92400e",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  avisoIconeContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  avisoTexto: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  avisoTextoDestaque: {
    fontWeight: "900",
    textDecorationLine: "underline",
  },

  avisoAcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  disclaimerGeral: {
    marginHorizontal: 14,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "800",
    color: "#8a978f",
    lineHeight: 17,
    fontStyle: "italic",
  },

  alertaMedicamentoBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 8,
    marginTop: 8,
  },

  alertaMedicamentoTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },

  alertaMedicamentoTitulo: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "800",
  },

  alertaMedicamentoTexto: {
    color: "#92400e",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },

  inputBusca: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#222",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTexto: {
    color: "#666",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },

  listaConteudo: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 120,
  },

  listaComBarra: {
    paddingBottom: 180,
  },

  cardProduto: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  imagemProduto: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: "#f4f8f5",
    marginRight: 12,
  },

  infoArea: {
    flex: 1,
  },

  infoTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  nomeProduto: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  bulaBotao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  bulaBotaoTexto: {
    color: "#1b5e20",
    fontSize: 11,
    fontWeight: "800",
  },

  principioAtivo: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "700",
    marginTop: 2,
  },

  descricaoProduto: {
    fontSize: 12,
    color: "#7a7a7a",
    lineHeight: 16,
    marginTop: 4,
  },

  estoqueTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },

  estoqueZerado: {
    color: "#b91c1c",
  },

  precoArea: {
    marginTop: 8,
  },

  pmcTexto: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },

  precoProduto: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
  },

  acoesArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },

  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  botaoMenos: {
    backgroundColor: "#e8f5e9",
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoMenosDesativado: {
    backgroundColor: "#edf2ee",
  },

  botaoMais: {
    backgroundColor: "#2e7d32",
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoMaisDesativado: {
    backgroundColor: "#edf2ee",
  },

  quantidadeTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222",
    minWidth: 16,
    textAlign: "center",
  },

  botaoAdicionar: {
    backgroundColor: "#f4c542",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  botaoAdicionarDesativado: {
    opacity: 0.7,
  },

  textoBotaoAdicionar: {
    fontSize: 12,
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
