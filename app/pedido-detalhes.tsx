import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { showAlert } from "@/services/alert";
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
  codigoBarras?: string;
  tamanho?: string | null;
};

type Pedido = {
  id: string;
  codigoPedido?: string;
  codigoCliente?: string;
  filialId?: string | null;
  filialNome?: string;
  filialEndereco?: string;
  criadoEm?: any;
  atualizadoEm?: any;
  entregueEm?: any;
  status?: string;
  total?: number;
  subtotal?: number;
  taxaEntrega?: number;
  cliente?: {
    nome?: string;
    telefone?: string;
  };
  itens?: PedidoItem[];
  pagamento?: string;
  pagamentoDetalhes?: {
    metodo?: string;
    status?: string;
    precisaTroco?: boolean;
    trocoPara?: number | null;
  };
  pagamentoOnline?: {
    provedor?: string;
    ambiente?: string;
    metodo?: string;
    status?: string;
    transacaoId?: string | null;
    qrCode?: string | null;
    copiaECola?: string | null;
    linkPagamento?: string | null;
    mensagem?: string;
  } | null;
  observacoes?: string;
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
    zonaEntrega?: string | null;
  } | null;
  retirada?: {
    filialNome?: string;
    filialEndereco?: string;
    local?: string;
    instrucao?: string;
  } | null;
  entregadorNome?: string;
  statusReceita?: "pendente" | "aprovada" | "reprovada" | null;
  receitaMotivoReprovacao?: string | null;
};

const statusEtapas = [
  { value: "recebido", label: "Recebido", icon: "receipt-outline" },
  {
    value: "aguardando_validacao_farmaceutica",
    label: "Receita",
    icon: "document-text-outline",
  },
  { value: "preparo", label: "Preparo", icon: "medkit-outline" },
  { value: "pronto_retirada", label: "Pronto", icon: "storefront-outline" },
  { value: "entrega", label: "Aceito", icon: "checkmark-done-outline" },
  { value: "a_caminho", label: "A caminho", icon: "bicycle-outline" },
  { value: "entregue", label: "Entregue", icon: "checkmark-circle-outline" },
  { value: "finalizado", label: "Finalizado", icon: "flag-outline" },
] as const;

const statusOrdem = statusEtapas.map((item) => item.value);

export default function PedidoDetalhesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerandoPagamento, setGerandoPagamento] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, "pedidos", id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setPedido(null);
          setLoading(false);
          return;
        }

        setPedido({
          id: snapshot.id,
          ...snapshot.data(),
        } as Pedido);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar detalhes do pedido:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [id]);

  const statusAtual = pedido?.status || "recebido";
  const formaPagamento = normalizarFormaPagamento(
    pedido?.pagamentoDetalhes?.metodo || pedido?.pagamento,
  );
  const indiceStatusAtual = Math.max(
    0,
    statusOrdem.indexOf(statusAtual as (typeof statusOrdem)[number]),
  );
  const teveValidacaoDeReceita = Boolean(pedido?.statusReceita);
  const etapasVisiveis = teveValidacaoDeReceita
    ? statusEtapas
    : statusEtapas.filter(
        (etapa) => etapa.value !== "aguardando_validacao_farmaceutica",
      );

  const enderecoTexto = useMemo(() => {
    if (!pedido) return "";

    if (pedido.tipoAtendimento === "retirada") {
      return [
        pedido.retirada?.filialNome || pedido.retirada?.local,
        pedido.retirada?.filialEndereco,
      ]
        .filter(Boolean)
        .join(" - ");
    }

    if (!pedido.entrega) return "Endereço não informado";

    return [
      `${pedido.entrega.endereco || ""}, ${pedido.entrega.numero || ""}`,
      pedido.entrega.complemento,
      pedido.entrega.bairro,
      `${pedido.entrega.cidade || ""}/${pedido.entrega.uf || ""}`,
      pedido.entrega.cep ? `CEP ${pedido.entrega.cep}` : "",
    ]
      .filter(Boolean)
      .join(" - ");
  }, [pedido]);

  const renderLinha = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string,
  ) => (
    <View style={styles.infoLinha}>
      <View style={styles.infoIcone}>
        <Ionicons name={icon} size={18} color="#1b5e20" />
      </View>
      <View style={styles.infoTextoArea}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValor}>{value}</Text>
      </View>
    </View>
  );

  const gerarPagamentoOnline = async () => {
    if (!pedido) return;

    const metodo = normalizarFormaPagamento(
      pedido.pagamentoDetalhes?.metodo || pedido.pagamento,
    );

    if (metodo !== formasPagamento.pix && metodo !== formasPagamento.cartaoOnline) {
      showAlert("Pagamento", "Este pedido não usa pagamento online.");
      return;
    }

    try {
      setGerandoPagamento(true);

      const callable = httpsCallable(
        getFunctions(),
        metodo === formasPagamento.pix ? "criarPagamentoPix" : "criarPagamentoCartao",
      );
      const resultado = await callable({ pedidoId: pedido.id });
      const linkPagamento =
        typeof resultado.data === "object" &&
        resultado.data !== null &&
        "linkPagamento" in resultado.data
          ? String((resultado.data as { linkPagamento?: string }).linkPagamento || "")
          : "";

      if (metodo === formasPagamento.cartaoOnline && linkPagamento) {
        await Linking.openURL(linkPagamento);
      }

      showAlert("Pagamento gerado", "A cobrança foi atualizada no pedido.");
    } catch (error: any) {
      console.error("Erro ao gerar pagamento online:", error);
      showAlert("Erro", error?.message || "Não foi possível gerar o pagamento.");
    } finally {
      setGerandoPagamento(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Detalhes do pedido</Text>
        <View style={styles.espacoDireita} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
          <Text style={styles.loadingTexto}>Carregando pedido...</Text>
        </View>
      ) : !pedido ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#1b5e20" />
          <Text style={styles.emptyTitulo}>Pedido não encontrado</Text>
          <Text style={styles.emptyTexto}>
            Confira se você ainda tem acesso a este pedido.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resumoCard}>
            <View style={styles.resumoTopo}>
              <View style={styles.resumoTexto}>
                <Text style={styles.codigo}>{pedido.codigoPedido || pedido.id}</Text>
                <Text style={styles.data}>{formatarDataHora(pedido.criadoEm)}</Text>
              </View>
              <View style={styles.totalArea}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.total}>{formatarMoeda(pedido.total)}</Text>
              </View>
            </View>

            <View style={styles.statusChip}>
              <Text style={styles.statusChipTexto}>
                {formatarStatusPedido(pedido.status)}
              </Text>
            </View>
          </View>

          {pedido.status === "aguardando_validacao_farmaceutica" && (
            <View style={styles.avisoReceitaBox}>
              <Ionicons name="document-text-outline" size={20} color="#92400e" />
              <Text style={styles.avisoReceitaTexto}>
                Sua receita foi recebida e está aguardando validação de um
                farmacêutico. O pedido segue para separação assim que for
                aprovada.
              </Text>
            </View>
          )}

          {pedido.status === "receita_reprovada" && (
            <View style={styles.avisoReceitaReprovadaBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#d32f2f" />
              <View style={styles.avisoReceitaTextoArea}>
                <Text style={styles.avisoReceitaReprovadaTitulo}>
                  Receita reprovada
                </Text>
                <Text style={styles.avisoReceitaTexto}>
                  {pedido.receitaMotivoReprovacao ||
                    "A receita enviada não foi aceita."}{" "}
                  Fale com a farmácia para reenviar uma nova foto.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Acompanhamento</Text>
            <View style={styles.timeline}>
              {etapasVisiveis.map((etapa) => {
                const ativo =
                  statusOrdem.indexOf(etapa.value) <= indiceStatusAtual;

                return (
                  <View key={etapa.value} style={styles.etapa}>
                    <View
                      style={[
                        styles.etapaIcone,
                        ativo && styles.etapaIconeAtiva,
                      ]}
                    >
                      <Ionicons
                        name={etapa.icon}
                        size={17}
                        color={ativo ? "#fff" : "#6b7280"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.etapaTexto,
                        ativo && styles.etapaTextoAtivo,
                      ]}
                    >
                      {etapa.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Pedido</Text>
            {renderLinha(
              pedido.tipoAtendimento === "retirada"
                ? "storefront-outline"
                : "bicycle-outline",
              pedido.tipoAtendimento === "retirada" ? "Retirada" : "Entrega",
              enderecoTexto || "Não informado",
            )}
            {pedido.filialNome &&
              renderLinha(
                "business-outline",
                "Filial",
                [pedido.filialNome, pedido.filialEndereco].filter(Boolean).join(" - "),
              )}
            {pedido.tipoAtendimento === "entrega" &&
              renderLinha(
                "bicycle-outline",
                "Taxa de entrega",
                formatarMoeda(pedido.taxaEntrega ?? pedido.entrega?.taxaEntrega ?? 0),
              )}
            {typeof pedido.subtotal === "number" &&
              renderLinha(
                "receipt-outline",
                "Subtotal dos produtos",
                formatarMoeda(pedido.subtotal),
              )}
            {renderLinha(
              "person-outline",
              "Cliente",
              `${pedido.cliente?.nome || "Não informado"} - ${
                pedido.cliente?.telefone || "sem telefone"
              }`,
            )}
            {pedido.entregadorNome &&
              renderLinha("bicycle-outline", "Entregador", pedido.entregadorNome)}
            {renderLinha(
              "card-outline",
              "Pagamento",
              `${
                formatarFormaPagamento(formaPagamento)
              } - ${formatarStatusPagamentoPadrao(pedido.pagamentoDetalhes?.status)}`,
            )}
            {pedido.pagamentoDetalhes?.precisaTroco &&
              renderLinha(
                "cash-outline",
                "Troco",
                `Troco para ${formatarMoeda(
                  pedido.pagamentoDetalhes.trocoPara,
                )}`,
              )}
            {pedido.pagamentoOnline &&
              renderLinha(
                "shield-checkmark-outline",
                "Pagamento online",
                `${pedido.pagamentoOnline.provedor || "Provedor"} - ${
                  pedido.pagamentoOnline.status || "pendente"
                }`,
              )}
            {pedido.pagamentoOnline?.mensagem &&
              renderLinha(
                "information-circle-outline",
                "Integração",
                pedido.pagamentoOnline.mensagem,
              )}
            {pedido.pagamentoOnline?.qrCode ? (
              <View style={styles.pixBox}>
                <Text style={styles.pixTitulo}>QR Code Pix</Text>
                <Image
                  source={{
                    uri: `data:image/png;base64,${pedido.pagamentoOnline.qrCode}`,
                  }}
                  style={styles.pixQrCode}
                  resizeMode="contain"
                />
              </View>
            ) : null}
            {pedido.pagamentoOnline?.copiaECola ? (
              <View style={styles.pixBox}>
                <Text style={styles.pixTitulo}>Pix copia e cola</Text>
                <Text selectable style={styles.pixCopiaECola}>
                  {pedido.pagamentoOnline.copiaECola}
                </Text>
              </View>
            ) : null}
            {pedido.pagamentoOnline?.linkPagamento ? (
              <TouchableOpacity
                style={styles.botaoPagamentoOnline}
                onPress={() =>
                  pedido.pagamentoOnline?.linkPagamento &&
                  Linking.openURL(pedido.pagamentoOnline.linkPagamento)
                }
                activeOpacity={0.9}
              >
                <Ionicons name="open-outline" size={18} color="#1f2937" />
                <Text style={styles.botaoPagamentoOnlineTexto}>
                  Abrir pagamento
                </Text>
              </TouchableOpacity>
            ) : null}
            {(formaPagamento === formasPagamento.pix ||
              formaPagamento === formasPagamento.cartaoOnline) &&
            pedido.pagamentoDetalhes?.status !== "aprovado" ? (
              <TouchableOpacity
                style={[
                  styles.botaoGerarPagamento,
                  gerandoPagamento && styles.botaoDesativado,
                ]}
                onPress={gerarPagamentoOnline}
                disabled={gerandoPagamento}
                activeOpacity={0.9}
              >
                <Ionicons name="refresh-outline" size={18} color="#1b5e20" />
                <Text style={styles.botaoGerarPagamentoTexto}>
                  {gerandoPagamento ? "Gerando..." : "Gerar pagamento novamente"}
                </Text>
              </TouchableOpacity>
            ) : null}
            {pedido.codigoCliente &&
              renderLinha("key-outline", "Cliente", pedido.codigoCliente)}
          </View>

          {pedido.observacoes ? (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Observações</Text>
              <Text style={styles.textoLivre}>{pedido.observacoes}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Itens</Text>
            {pedido.itens && pedido.itens.length > 0 ? (
              pedido.itens.map((item, index) => (
                <View
                  key={`${item.id || item.nome}-${index}`}
                  style={styles.itemLinha}
                >
                  <View style={styles.itemTextoArea}>
                    <Text style={styles.itemNome}>
                      {item.nome}
                      {item.tamanho ? ` (${item.tamanho})` : ""}
                    </Text>
                    <Text style={styles.itemQtd}>Quantidade: {item.quantidade}</Text>
                    {item.codigoBarras ? (
                      <Text style={styles.itemCodigoBarras}>
                        Cod. barras: {item.codigoBarras}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemValor}>
                    {formatarMoeda(item.preco * item.quantidade)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.textoLivre}>Itens não informados.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Histórico</Text>
            {renderLinha("calendar-outline", "Criado em", formatarDataHora(pedido.criadoEm))}
            {pedido.atualizadoEm &&
              renderLinha(
                "refresh-outline",
                "Atualizado em",
                formatarDataHora(pedido.atualizadoEm),
              )}
            {pedido.entregueEm &&
              renderLinha(
                "checkmark-circle-outline",
                "Entregue em",
                formatarDataHora(pedido.entregueEm),
              )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f8f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  voltar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2ee",
  },
  titulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#1b5e20",
  },
  espacoDireita: { width: 44 },
  content: { padding: 16, paddingBottom: 34 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  loadingTexto: { marginTop: 10, color: "#666", fontWeight: "700" },
  emptyTitulo: {
    color: "#1f2937",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyTexto: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  resumoCard: {
    backgroundColor: "#1b5e20",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  resumoTopo: { flexDirection: "row", justifyContent: "space-between", gap: 14 },
  resumoTexto: { flex: 1 },
  codigo: { color: "#fff", fontSize: 18, fontWeight: "800" },
  data: { color: "#dff0e1", fontSize: 13, fontWeight: "700", marginTop: 4 },
  totalArea: { alignItems: "flex-end" },
  totalLabel: { color: "#dff0e1", fontSize: 12, fontWeight: "800" },
  total: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#f4c542",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
  },
  statusChipTexto: { color: "#1f2937", fontSize: 12, fontWeight: "800" },
  avisoReceitaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fff8db",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#f4d36c",
  },
  avisoReceitaReprovadaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fdecea",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#f5c2c0",
  },
  avisoReceitaTextoArea: {
    flex: 1,
  },
  avisoReceitaReprovadaTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d32f2f",
    marginBottom: 4,
  },
  avisoReceitaTexto: {
    flex: 1,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    marginBottom: 14,
  },
  cardTitulo: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  timeline: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  etapa: {
    width: "30%",
    minWidth: 92,
    alignItems: "center",
    gap: 6,
  },
  etapaIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#edf2ee",
    alignItems: "center",
    justifyContent: "center",
  },
  etapaIconeAtiva: { backgroundColor: "#1b5e20" },
  etapaTexto: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  etapaTextoAtivo: { color: "#1b5e20" },
  infoLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoTextoArea: { flex: 1 },
  infoLabel: { color: "#6b7280", fontSize: 12, fontWeight: "800" },
  infoValor: {
    color: "#1f2937",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  textoLivre: { color: "#4b5563", fontSize: 14, lineHeight: 20 },
  itemLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  itemTextoArea: { flex: 1 },
  itemNome: { color: "#1f2937", fontSize: 14, fontWeight: "800" },
  itemQtd: { color: "#6b7280", fontSize: 12, fontWeight: "700", marginTop: 3 },
  itemCodigoBarras: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  itemValor: { color: "#1b5e20", fontSize: 14, fontWeight: "800" },
  pixBox: {
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  pixTitulo: {
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  pixQrCode: {
    width: 220,
    height: 220,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  pixCopiaECola: {
    color: "#374151",
    fontSize: 12,
    lineHeight: 18,
  },
  botaoPagamentoOnline: {
    backgroundColor: "#f4c542",
    borderRadius: 12,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    marginBottom: 12,
  },
  botaoPagamentoOnlineTexto: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "800",
  },
  botaoGerarPagamento: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: -4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#cfe8d2",
  },
  botaoGerarPagamentoTexto: {
    color: "#1b5e20",
    fontSize: 14,
    fontWeight: "800",
  },
  botaoDesativado: { opacity: 0.7 },
});
