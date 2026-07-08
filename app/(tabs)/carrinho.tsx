import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { type ItemCarrinho, useCarrinho } from "../../context/CarContext";
import { formatarMoeda } from "../../services/formatters";
import {
  getAlertasParaItens,
  useAlertasSanitarios,
} from "../../services/alertasSanitarios";

export default function CarrinhoScreen() {
  const router = useRouter();
  const {
    carrinho,
    adicionarAoCarrinho,
    removerUmaUnidade,
    obterQuantidadeTotal,
    limparCarrinho,
    totalCarrinho,
  } = useCarrinho();
  const { alertas } = useAlertasSanitarios();

  const alertasAtivos = useMemo(
    () => getAlertasParaItens(carrinho, alertas),
    [carrinho, alertas],
  );

  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  const renderItem = ({ item }: { item: ItemCarrinho }) => {
    const estoqueDisponivel = Number(item.estoque || 0);
    const controlaEstoque = item.controlarEstoque === true;
    const atingiuEstoque =
      controlaEstoque && obterQuantidadeTotal(item.id) >= estoqueDisponivel;
    const imagemSource = item.imagemUrl
      ? { uri: item.imagemUrl }
      : item.imagem || require("../../assets/images/logo.png");

    return (
      <View style={styles.card}>
        <Image
          source={imagemSource}
          style={styles.imagem}
          resizeMode="contain"
        />

        <View style={styles.infoContainer}>
          <Text style={styles.categoria}>{item.categoria || "Produto"}</Text>

          <Text style={styles.nome} numberOfLines={2}>
            {item.nome}
          </Text>

          <Text style={styles.precoUnitario}>
            {formatarMoeda(item.preco)} / un
          </Text>
          {item.tamanhoSelecionado ? (
            <Text style={styles.tamanhoTexto}>
              Tamanho: {item.tamanhoSelecionado}
            </Text>
          ) : null}
          {controlaEstoque ? (
            <Text style={styles.estoqueTexto}>
              {estoqueDisponivel} em estoque no app
            </Text>
          ) : null}

          <View style={styles.rodapeCard}>
            <View style={styles.controleQuantidade}>
              <TouchableOpacity
                style={[
                  styles.botaoMenos,
                  item.quantidade === 1 && styles.botaoMenosDesativado,
                ]}
                onPress={() =>
                  removerUmaUnidade(item.id, item.tamanhoSelecionado)
                }
              >
                <Ionicons
                  name={item.quantidade === 1 ? "trash-outline" : "remove"}
                  size={18}
                  color={item.quantidade === 1 ? "#9ca3af" : "#1b5e20"}
                />
              </TouchableOpacity>

              <Text style={styles.quantidadeTexto}>{item.quantidade}</Text>

              <TouchableOpacity
                style={[
                  styles.botaoMais,
                  atingiuEstoque && styles.botaoMaisDesativado,
                ]}
                onPress={() =>
                  adicionarAoCarrinho(item, item.tamanhoSelecionado)
                }
                disabled={atingiuEstoque}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={atingiuEstoque ? "#8fa393" : "#fff"}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtotal}>
              {formatarMoeda(item.preco * item.quantidade)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (carrinho.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topo}>
          <Text style={styles.titulo}>Carrinho</Text>
          <Text style={styles.subtitulo}>Seu pedido começa aqui</Text>
        </View>

        <View style={styles.vazioContainer}>
          <View style={styles.iconeVazio}>
            <Ionicons name="cart-outline" size={44} color="#2e7d32" />
          </View>

          <Text style={styles.vazioTitulo}>Seu carrinho está vazio</Text>

          <Text style={styles.vazioTexto}>
            Adicione produtos para começar seu pedido.
          </Text>

          <TouchableOpacity
            style={styles.botaoContinuar}
            onPress={() => router.push("/")}
          >
            <Text style={styles.textoBotaoContinuar}>Ver produtos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <Text style={styles.titulo}>Carrinho</Text>
        <Text style={styles.subtitulo}>
          {totalItens} {totalItens === 1 ? "item" : "itens"}
        </Text>
      </View>

      <FlatList
        data={carrinho}
        keyExtractor={(item) => `${item.id}-${item.tamanhoSelecionado || "unico"}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
      />

      <View style={styles.resumoContainer}>
        {alertasAtivos.length > 0 ? (
          <View style={styles.alertaSanitarioBox}>
            <Ionicons name="warning-outline" size={18} color="#92400e" />
            <View style={styles.alertaSanitarioTextos}>
              {alertasAtivos.map((mensagem) => (
                <Text key={mensagem} style={styles.alertaSanitarioTexto}>
                  {mensagem}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.resumoLinha}>
          <Text style={styles.resumoLabel}>Itens</Text>
          <Text style={styles.resumoValor}>{totalItens}</Text>
        </View>

        <View style={styles.resumoLinha}>
          <Text style={styles.resumoLabelTotal}>Total</Text>
          <Text style={styles.resumoValorTotal}>
            {formatarMoeda(totalCarrinho)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoFinalizar}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.textoBotaoFinalizar}>Finalizar pedido</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoLimpar} onPress={limparCarrinho}>
          <Text style={styles.textoBotaoLimpar}>Limpar carrinho</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },

  topo: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1b5e20",
  },

  subtitulo: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  lista: {
    paddingHorizontal: 14,
    paddingBottom: 220,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  imagem: {
    width: 90,
    height: 90,
    borderRadius: 14,
    marginRight: 12,
  },

  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },

  categoria: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "700",
  },

  nome: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
    marginVertical: 4,
  },

  precoUnitario: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },

  tamanhoTexto: {
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "700",
    marginBottom: 4,
  },

  estoqueTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  rodapeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  controleQuantidade: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  botaoMenos: {
    backgroundColor: "#e8f5e9",
    width: 36,
    height: 36,
    borderRadius: 12,
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
    borderRadius: 12,
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

  subtotal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
  },

  resumoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },

  alertaSanitarioBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },

  alertaSanitarioTextos: {
    flex: 1,
    gap: 4,
  },

  alertaSanitarioTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
  },

  resumoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  resumoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  resumoValor: {
    fontSize: 15,
    color: "#222",
    fontWeight: "700",
  },

  resumoLabelTotal: {
    fontSize: 18,
    fontWeight: "800",
  },

  resumoValorTotal: {
    fontSize: 24,
    color: "#1b5e20",
    fontWeight: "800",
  },

  botaoFinalizar: {
    marginTop: 16,
    backgroundColor: "#f4c542",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  textoBotaoFinalizar: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },

  botaoLimpar: {
    marginTop: 10,
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },

  textoBotaoLimpar: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1b5e20",
  },

  vazioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  iconeVazio: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  vazioTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
  },

  vazioTexto: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  botaoContinuar: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },

  textoBotaoContinuar: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});

