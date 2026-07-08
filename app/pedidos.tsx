// app/pedidos.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import {
  formatarFormaPagamento,
  formatarStatusPagamento as formatarStatusPagamentoPadrao,
  formasPagamento,
  normalizarFormaPagamento,
} from "../services/payments";
import { formatarMoeda } from "../services/formatters";
import {
  formatarDataHora,
  formatarStatusPedido,
} from "../services/orderFormatters";

type PedidoItem = {
  id?: string;
  nome: string;
  preco: number;
  quantidade: number;
};

type Pedido = {
  id: string;
  codigoPedido?: string;
  codigoCliente?: string;
  data?: string;
  criadoEm?: any;
  total: number;
  subtotal?: number;
  taxaEntrega?: number;
  itens: PedidoItem[];
  status?: string;
  pagamento?: string;
  tipoAtendimento?: "entrega" | "retirada";
  entrega?: {
    apelido?: string;
    cep?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    complemento?: string;
    taxaEntrega?: number;
    bairroCobertura?: string;
  } | null;
  retirada?: {
    filialId?: string;
    filialNome?: string;
    filialEndereco?: string;
    local?: string;
    instrucao?: string;
  } | null;
  pagamentoDetalhes?: {
    metodo?: string;
    status?: string;
    precisaTroco?: boolean;
    trocoPara?: number | null;
  };
};

export default function PedidosScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/conta");
    }
  };

  const formatarData = (pedido: Pedido) => {
    if (pedido.data) return pedido.data;
    return formatarDataHora(pedido.criadoEm, "Data não informada");
  };


  useEffect(() => {
    if (!user) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const pedidosPorId = new Map<string, Pedido>();

    const atualizarLista = () => {
      const pedidosData = Array.from(pedidosPorId.values());

      pedidosData.sort((a, b) => {
        const dataA = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : 0;
        const dataB = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : 0;
        return dataB - dataA;
      });

      setPedidos(pedidosData);
      setLoading(false);
    };

    const assinarPedidos = (campo: "userUid" | "userId") =>
      onSnapshot(
        query(collection(db, "pedidos"), where(campo, "==", user.uid)),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              pedidosPorId.delete(change.doc.id);
              return;
            }

            pedidosPorId.set(change.doc.id, {
              id: change.doc.id,
              ...change.doc.data(),
            } as Pedido);
          });

          atualizarLista();
        },
        (error) => {
          console.error("Erro ao acompanhar pedidos:", error);
          setLoading(false);
        },
      );

    const unsubscribeNovos = assinarPedidos("userUid");
    const unsubscribeLegados = assinarPedidos("userId");

    return () => {
      unsubscribeNovos();
      unsubscribeLegados();
    };
  }, [user]);

  const renderInfoLinha = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string,
  ) => (
    <View style={styles.infoLinha}>
      <View style={styles.infoIcone}>
        <Ionicons name={icon} size={17} color="#1b5e20" />
      </View>
      <View style={styles.infoTextoArea}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValor}>{value}</Text>
      </View>
    </View>
  );

  const renderPedido = ({ item }: { item: Pedido }) => {
    const tipoAtendimento = item.tipoAtendimento || "entrega";
    const metodoPagamentoCanonico = normalizarFormaPagamento(
      item.pagamentoDetalhes?.metodo || item.pagamento,
    );
    const metodoPagamento = formatarFormaPagamento(metodoPagamentoCanonico);
    const statusPagamento = formatarStatusPagamentoPadrao(
      item.pagamentoDetalhes?.status,
    );
    const trocoTexto =
      item.pagamentoDetalhes?.precisaTroco && item.pagamentoDetalhes.trocoPara
        ? `Troco para ${formatarMoeda(item.pagamentoDetalhes.trocoPara)}`
        : "Sem troco";

    const entregaTexto = item.entrega
      ? `${item.entrega.endereco || ""}, ${item.entrega.numero || ""}${
          item.entrega.complemento ? ` - ${item.entrega.complemento}` : ""
        } - ${item.entrega.bairro || ""}, ${item.entrega.cidade || ""}/${
          item.entrega.uf || ""
        }`
      : "Endereço não informado";

    const retiradaTexto =
      item.retirada?.filialNome && item.retirada?.filialEndereco
        ? `${item.retirada.filialNome} - ${item.retirada.filialEndereco}`
        : item.retirada?.instrucao || item.retirada?.local || "Retirada no balcão";

    return (
      <TouchableOpacity
        style={styles.pedidoCard}
        onPress={() =>
          router.push({
            pathname: "/pedido-detalhes",
            params: { id: item.id },
          } as any)
        }
        activeOpacity={0.9}
      >
        <View style={styles.pedidoTopo}>
          <View style={styles.pedidoTopoTexto}>
            <Text style={styles.pedidoCodigo}>
              {item.codigoPedido || item.id}
            </Text>
            <Text style={styles.pedidoData}>{formatarData(item)}</Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipTexto}>
                {formatarStatusPedido(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.totalArea}>
            <Text style={styles.totalLabelCard}>Total</Text>
            <Text style={styles.pedidoTotal}>{formatarMoeda(item.total)}</Text>
          </View>
        </View>

        <View style={styles.divisor} />

        <View style={styles.infoGrid}>
          {renderInfoLinha(
            tipoAtendimento === "entrega"
              ? "bicycle-outline"
              : "storefront-outline",
            tipoAtendimento === "entrega" ? "Entrega" : "Retirada",
            tipoAtendimento === "entrega" ? entregaTexto : retiradaTexto,
          )}

          {renderInfoLinha(
            "card-outline",
            "Pagamento",
            `${metodoPagamento || "Não informado"} - ${statusPagamento}`,
          )}

          {metodoPagamentoCanonico === formasPagamento.dinheiro &&
            renderInfoLinha("cash-outline", "Troco", trocoTexto)}
        </View>

        <View style={styles.divisor} />

        <Text style={styles.label}>Itens</Text>
        <View style={styles.itensLista}>
          {item.itens && item.itens.length > 0 ? (
            item.itens.map((produto, index) => (
              <View
                key={`${produto.id || produto.nome}-${index}`}
                style={styles.itemLinha}
              >
                <Text style={styles.itemNome}>
                  {produto.nome} x{produto.quantidade}
                </Text>
                <Text style={styles.itemValor}>
                  {formatarMoeda(produto.preco * produto.quantidade)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.pedidoItens}>Itens não informados</Text>
          )}
        </View>

        {item.codigoCliente && (
          <Text style={styles.codigoCliente}>{item.codigoCliente}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={24} color="#1b5e20" />
          </TouchableOpacity>

          <Text style={styles.titulo}>Meus pedidos</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={54} color="#1b5e20" />
          <Text style={styles.emptyTitulo}>Entre para ver seus pedidos</Text>
          <Text style={styles.emptyTexto}>
            Faça login para acompanhar os pedidos realizados pela sua conta.
          </Text>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}
          >
            <Text style={styles.botaoTexto}>Fazer login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#1b5e20" />
        </TouchableOpacity>

        <Text style={styles.titulo}>Meus pedidos</Text>

        <View style={styles.espacoDireita} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1b5e20" />
          <Text style={styles.loadingTexto}>Carregando pedidos...</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={54} color="#1b5e20" />
              <Text style={styles.emptyTitulo}>Nenhum pedido encontrado</Text>
              <Text style={styles.emptyTexto}>
                Quando você finalizar um pedido, ele aparecerá aqui.
              </Text>

              <TouchableOpacity
                style={styles.botao}
                onPress={() => router.replace("/")}
                activeOpacity={0.9}
              >
                <Text style={styles.botaoTexto}>Ver produtos</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },

  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ffffff",
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

  titulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#1b5e20",
  },

  espacoDireita: {
    width: 44,
  },

  lista: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  pedidoCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  pedidoTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  pedidoTopoTexto: {
    flex: 1,
  },

  pedidoCodigo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },

  pedidoData: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 8,
  },

  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusChipTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
  },

  totalArea: {
    alignItems: "flex-end",
  },

  totalLabelCard: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 3,
  },

  pedidoTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
  },

  divisor: {
    height: 1,
    backgroundColor: "#edf2ee",
    marginVertical: 12,
  },

  infoGrid: {
    gap: 10,
  },

  infoLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIcone: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  infoTextoArea: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "800",
    marginBottom: 2,
  },

  infoValor: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 19,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 8,
  },

  itensLista: {
    gap: 8,
  },

  itemLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  itemNome: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
  },

  itemValor: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "800",
  },

  pedidoItens: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  codigoCliente: {
    marginTop: 12,
    alignSelf: "flex-start",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "800",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingTexto: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 80,
  },

  emptyTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 14,
    marginBottom: 8,
    textAlign: "center",
  },

  emptyTexto: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },

  botao: {
    backgroundColor: "#1b5e20",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },

  botaoTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
