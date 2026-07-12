import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { criarNotificacao } from "../../services/notifications";
import {
  formatarFormaPagamento,
  formatarStatusPagamento as formatarStatusPagamentoPadrao,
  formasPagamento,
  normalizarFormaPagamento,
  normalizarStatusPagamento,
} from "../../services/payments";
import { formatarMoeda } from "../../services/formatters";
import { formatarStatusPedido } from "../../services/orderFormatters";

type PedidoAdmin = {
  id: string;
  codigoPedido?: string;
  codigoCliente?: string;
  criadoEm?: any;
  filialId?: string | null;
  filialNome?: string;
  cliente?: {
    nome?: string;
    telefone?: string;
  };
  itens?: {
    id?: string;
    nome: string;
    preco: number;
    quantidade: number;
    codigoBarras?: string;
    tamanho?: string | null;
  }[];
  status?: string;
  total?: number;
  subtotal?: number;
  taxaEntrega?: number;
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
  observacoesInternas?: string;
  tipoAtendimento?: "entrega" | "retirada";
  retirada?: {
    filialId?: string;
    filialNome?: string;
    filialEndereco?: string;
    local?: string;
    instrucao?: string;
  } | null;
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
  entregadorId?: string;
  entregadorNome?: string;
  userUid?: string;
};

type AbaPedidos = "preparando" | "em_rota" | "finalizados";

const statusOptions = [
  { label: "Em preparo", value: "preparo" },
  { label: "Pronto retirada", value: "pronto_retirada" },
  { label: "Finalizado", value: "finalizado" },
];

const statusEncerrados = new Set(["finalizado", "entregue", "cancelado"]);
const statusEmRota = new Set(["a_caminho"]);

export default function AdminPedidosScreen() {
  const router = useRouter();
  const { perfil } = useAuth();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral = isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const filialUsuarioId = perfil?.filialId || null;
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaSelecionada, setAbaSelecionada] =
    useState<AbaPedidos>("preparando");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [observacoesInternas, setObservacoesInternas] = useState<
    Record<string, string>
  >({});
  const [gerandoPagamentoId, setGerandoPagamentoId] = useState<string | null>(
    null,
  );

  const pedidosPreparando = pedidos.filter(
    (pedido) =>
      !statusEncerrados.has(pedido.status || "recebido") &&
      !statusEmRota.has(pedido.status || ""),
  );
  const pedidosEmRota = pedidos.filter((pedido) =>
    statusEmRota.has(pedido.status || ""),
  );
  const pedidosFinalizados = pedidos.filter((pedido) =>
    statusEncerrados.has(pedido.status || ""),
  );
  const statusDisponiveis = useMemo(() => {
    const statusSet = new Set(
      pedidos.map((pedido) => pedido.status || "recebido"),
    );

    return ["todos", ...Array.from(statusSet)];
  }, [pedidos]);

  const pedidosVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base =
      abaSelecionada === "preparando"
        ? pedidosPreparando
        : abaSelecionada === "em_rota"
          ? pedidosEmRota
          : pedidosFinalizados;

    return base.filter((pedido) => {
      const textoBusca = [
        pedido.codigoPedido,
        pedido.codigoCliente,
        pedido.cliente?.nome,
        pedido.cliente?.telefone,
        pedido.entrega?.bairro,
        pedido.entrega?.endereco,
        pedido.retirada?.filialNome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const bateBusca = !termo || textoBusca.includes(termo);
      const bateStatus =
        statusFiltro === "todos" || (pedido.status || "recebido") === statusFiltro;

      return bateBusca && bateStatus;
    });
  }, [
    abaSelecionada,
    busca,
    pedidosPreparando,
    pedidosEmRota,
    pedidosFinalizados,
    statusFiltro,
  ]);

  const abrirWhatsApp = async (pedido: PedidoAdmin) => {
    const telefone = (pedido.cliente?.telefone || "").replace(/\D/g, "");

    if (!telefone) {
      showAlert("Telefone não informado", "Este pedido não possui telefone.");
      return;
    }

    const telefoneComDdd = telefone.startsWith("55") ? telefone : `55${telefone}`;
    const codigo = pedido.codigoPedido || pedido.id;
    const mensagem = encodeURIComponent(
      `Olá, aqui é da farmácia. Estamos falando sobre o pedido ${codigo}.`,
    );

    try {
      await Linking.openURL(`https://wa.me/${telefoneComDdd}?text=${mensagem}`);
    } catch {
      showAlert("Erro", "Não foi possível abrir o WhatsApp.");
    }
  };

  const abrirPagamentoOnline = async (pedido: PedidoAdmin) => {
    const link = pedido.pagamentoOnline?.linkPagamento;

    if (!link) {
      showAlert("Pagamento sem link", "Gere a cobrança online primeiro.");
      return;
    }

    try {
      await Linking.openURL(link);
    } catch {
      showAlert("Erro", "Não foi possível abrir o link de pagamento.");
    }
  };

  const gerarPagamentoOnline = async (pedido: PedidoAdmin) => {
    const metodo = normalizarFormaPagamento(
      pedido.pagamentoDetalhes?.metodo || pedido.pagamento,
    );

    if (metodo !== formasPagamento.pix && metodo !== formasPagamento.cartaoOnline) {
      showAlert("Forma de pagamento", "Este pedido não usa Pix ou cartão online.");
      return;
    }

    try {
      setGerandoPagamentoId(pedido.id);

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

      showAlert("Pagamento gerado", "A cobrança online foi atualizada no pedido.");
    } catch (error: any) {
      console.error("Erro ao gerar pagamento online:", error);
      showAlert("Erro", error?.message || "Não foi possível gerar a cobrança.");
    } finally {
      setGerandoPagamentoId(null);
    }
  };

  const enviarPagamentoWhatsApp = async (pedido: PedidoAdmin) => {
    const telefone = (pedido.cliente?.telefone || "").replace(/\D/g, "");

    if (!telefone) {
      showAlert("Telefone não informado", "Este pedido não possui telefone.");
      return;
    }

    const link = pedido.pagamentoOnline?.linkPagamento;
    const copiaECola = pedido.pagamentoOnline?.copiaECola;

    if (!link && !copiaECola) {
      showAlert("Pagamento não gerado", "Gere a cobrança online antes de enviar.");
      return;
    }

    const telefoneComDdd = telefone.startsWith("55") ? telefone : `55${telefone}`;
    const codigo = pedido.codigoPedido || pedido.id;
    const mensagem = encodeURIComponent(
      [
        `Olá, aqui é da farmácia. Segue o pagamento do pedido ${codigo}.`,
        link ? `Link: ${link}` : "",
        copiaECola ? `Pix cópia e cola: ${copiaECola}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );

    try {
      await Linking.openURL(`https://wa.me/${telefoneComDdd}?text=${mensagem}`);
    } catch {
      showAlert("Erro", "Não foi possível abrir o WhatsApp.");
    }
  };

  const ordenarPedidos = (dados: PedidoAdmin[]) => {
    return dados.sort((a, b) => {
      const dataA = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : 0;
      const dataB = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : 0;
      return dataB - dataA;
    });
  };

  useEffect(() => {
    if (!isAdminAtivo) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribePedidos = onSnapshot(
      collection(db, "pedidos"),
      (snapshot) => {
        const dados = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
            }) as PedidoAdmin,
        );

        setPedidos(
          ordenarPedidos(
            isAdminGeral
              ? dados
              : dados.filter((pedido) => pedido.filialId === filialUsuarioId),
          ),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar pedidos admin:", error);
        showAlert("Erro", "Não foi possível acompanhar os pedidos.");
        setLoading(false);
      },
    );

    return unsubscribePedidos;
  }, [filialUsuarioId, isAdminAtivo, isAdminGeral]);

  const atualizarPedido = async (pedidoId: string, dados: Record<string, any>) => {
    const pedidoAtual = pedidos.find((pedido) => pedido.id === pedidoId);

    try {
      await updateDoc(doc(db, "pedidos", pedidoId), {
        ...dados,
        atualizadoEm: new Date(),
      });

      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((pedido) =>
          pedido.id === pedidoId ? { ...pedido, ...dados } : pedido,
        ),
      );

      if (dados.status && pedidoAtual?.userUid) {
        await criarNotificacao({
          titulo: "Status do pedido atualizado",
          mensagem: `${pedidoAtual.codigoPedido || pedidoId}: ${dados.status}`,
          pedidoId,
          userUid: pedidoAtual.userUid,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      showAlert("Erro", "Não foi possível atualizar o pedido.");
    }
  };

  const salvarObservacaoInterna = (pedido: PedidoAdmin) => {
    const observacao =
      observacoesInternas[pedido.id] ?? pedido.observacoesInternas ?? "";

    atualizarPedido(pedido.id, {
      observacoesInternas: observacao.trim(),
    });
  };

  const renderPedido = ({ item }: { item: PedidoAdmin }) => {
    const enderecoRetirada = [
      item.retirada?.filialNome || item.retirada?.local,
      item.retirada?.filialEndereco,
    ]
      .filter(Boolean)
      .join(" - ");
    const local =
      item.tipoAtendimento === "retirada"
        ? enderecoRetirada || "Filial não informada"
        : `${item.entrega?.endereco || ""}, ${item.entrega?.numero || ""} - ${
            item.entrega?.bairro || ""
          }`;
    const metodoPagamentoCanonico = normalizarFormaPagamento(
      item.pagamentoDetalhes?.metodo || item.pagamento,
    );
    const metodoPagamento = formatarFormaPagamento(metodoPagamentoCanonico);
    const statusPagamento = formatarStatusPagamentoPadrao(
      item.pagamentoDetalhes?.status,
    );
    const statusPagamentoRaw =
      normalizarStatusPagamento(item.pagamentoDetalhes?.status) || "";
    const pagamentoOnline = item.pagamentoOnline;
    const pagamentoOnlineAtivo =
      metodoPagamentoCanonico === formasPagamento.pix ||
      metodoPagamentoCanonico === formasPagamento.cartaoOnline;
    const pagamentoChipStyle =
      statusPagamentoRaw === "aprovado"
        ? styles.pagamentoOk
        : statusPagamentoRaw === "recusado" || statusPagamentoRaw === "cancelado"
          ? styles.pagamentoErro
          : statusPagamentoRaw === "a_receber"
            ? styles.pagamentoAberto
            : styles.pagamentoPendente;
    const pagamentoChipTextoStyle =
      statusPagamentoRaw === "aprovado"
        ? styles.pagamentoOkTexto
        : statusPagamentoRaw === "recusado" || statusPagamentoRaw === "cancelado"
          ? styles.pagamentoErroTexto
          : statusPagamentoRaw === "a_receber"
            ? styles.pagamentoAbertoTexto
            : styles.pagamentoPendenteTexto;
    const trocoTexto =
      item.pagamentoDetalhes?.precisaTroco && item.pagamentoDetalhes.trocoPara
        ? `Troco para ${formatarMoeda(item.pagamentoDetalhes.trocoPara)}`
        : "Sem troco";
    const taxaEntrega =
      typeof item.taxaEntrega === "number"
        ? item.taxaEntrega
        : item.entrega?.taxaEntrega;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/pedido-detalhes",
              params: { id: item.id },
            } as any)
          }
          activeOpacity={0.85}
        >
          <View style={styles.cardTopo}>
            <View style={styles.cardTopoTexto}>
              <Text style={styles.codigo}>{item.codigoPedido || item.id}</Text>
              <Text style={styles.subtexto}>{item.codigoCliente}</Text>
            </View>
            <View style={styles.totalArea}>
              <Text style={styles.total}>{formatarMoeda(item.total)}</Text>
              <Text style={styles.detalhesLink}>Ver detalhes</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.statusLinha}>
          <Text style={styles.statusTexto}>
            Status: {formatarStatusPedido(item.status, { curto: true })}
          </Text>
          <Text style={styles.statusTexto}>
            {item.tipoAtendimento === "retirada" ? "Retirada" : "Entrega"}
          </Text>
        </View>

        <Text style={styles.filialTexto}>
          {item.filialNome || "Filial não informada"}
        </Text>

        <Text style={styles.local}>{local}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValor}>
              {item.cliente?.nome || "Não informado"}
            </Text>
            <Text style={styles.infoTexto}>
              {item.cliente?.telefone || "Sem telefone"}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Pagamento</Text>
            <Text style={styles.infoValor}>
              {metodoPagamento || "Não informado"}
            </Text>
            <View style={[styles.pagamentoChip, pagamentoChipStyle]}>
              <Text style={[styles.pagamentoChipTexto, pagamentoChipTextoStyle]}>
                {statusPagamento}
              </Text>
            </View>
            {pagamentoOnline?.mensagem ? (
              <Text style={styles.infoTexto}>{pagamentoOnline.mensagem}</Text>
            ) : null}
            {metodoPagamentoCanonico === formasPagamento.dinheiro && (
              <Text style={styles.infoTexto}>{trocoTexto}</Text>
            )}
            {item.tipoAtendimento === "entrega" && (
              <Text style={styles.infoTexto}>
                Entrega: {formatarMoeda(taxaEntrega || 0)}
              </Text>
            )}
          </View>
        </View>

        {item.observacoes ? (
          <View style={styles.secao}>
            <Text style={styles.label}>Observações</Text>
            <Text style={styles.infoTexto}>{item.observacoes}</Text>
          </View>
        ) : null}

        <View style={styles.acoesRapidas}>
          <TouchableOpacity
            style={styles.botaoWhatsApp}
            onPress={() => abrirWhatsApp(item)}
            activeOpacity={0.88}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            <Text style={styles.botaoWhatsAppTexto}>WhatsApp</Text>
          </TouchableOpacity>
          {pagamentoOnlineAtivo ? (
            <>
              <TouchableOpacity
                style={[
                  styles.botaoPagamento,
                  gerandoPagamentoId === item.id && styles.botaoDesativado,
                ]}
                onPress={() =>
                  pagamentoOnline?.linkPagamento
                    ? abrirPagamentoOnline(item)
                    : gerarPagamentoOnline(item)
                }
                disabled={gerandoPagamentoId === item.id}
                activeOpacity={0.88}
              >
                <Ionicons name="card-outline" size={16} color="#1f2937" />
                <Text style={styles.botaoPagamentoTexto}>
                  {pagamentoOnline?.linkPagamento ? "Abrir pagamento" : "Gerar cobrança"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoEnviarPagamento}
                onPress={() => enviarPagamentoWhatsApp(item)}
                activeOpacity={0.88}
              >
                <Ionicons name="send-outline" size={16} color="#1b5e20" />
                <Text style={styles.botaoEnviarPagamentoTexto}>Enviar pagamento</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={styles.secao}>
          <Text style={styles.label}>Observação interna</Text>
          <TextInput
            style={styles.inputObservacao}
            value={observacoesInternas[item.id] ?? item.observacoesInternas ?? ""}
            onChangeText={(texto) =>
              setObservacoesInternas((prev) => ({ ...prev, [item.id]: texto }))
            }
            placeholder="Ex: separar item no balcão"
            placeholderTextColor="#8a978f"
            multiline
          />
          <TouchableOpacity
            style={styles.botaoSalvarObservacao}
            onPress={() => salvarObservacaoInterna(item)}
            activeOpacity={0.88}
          >
            <Text style={styles.botaoSalvarObservacaoTexto}>Salvar observação</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secao}>
          <Text style={styles.label}>Itens do pedido</Text>
          {item.itens && item.itens.length > 0 ? (
            item.itens.map((produto, index) => (
              <View
                key={`${produto.id || produto.nome}-${index}`}
                style={styles.itemLinha}
              >
                <View style={styles.itemTextoArea}>
                  <Text style={styles.itemNome}>
                    {produto.nome}
                    {produto.tamanho ? ` (${produto.tamanho})` : ""} x
                    {produto.quantidade}
                  </Text>
                  {produto.codigoBarras ? (
                    <Text style={styles.itemCodigoBarras}>
                      Cod. barras: {produto.codigoBarras}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.itemPreco}>
                  {formatarMoeda(produto.preco * produto.quantidade)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.infoTexto}>Itens não informados.</Text>
          )}
        </View>

        {abaSelecionada === "preparando" && (
          <View style={styles.acoes}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={styles.acaoBotao}
                onPress={() =>
                  atualizarPedido(item.id, { status: status.value })
                }
              >
                <Text style={styles.acaoTexto}>{status.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {item.tipoAtendimento === "entrega" && (
          <View style={styles.entregadorBox}>
            <Text style={styles.label}>Entregador</Text>
            <Text style={styles.local}>
              {item.entregadorNome
                ? item.entregadorNome
                : item.status === "pronto_retirada"
                  ? "Aguardando um entregador aceitar"
                  : "Ainda sem entregador"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!isAdminAtivo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={46} color="#1b5e20" />
          <Text style={styles.titulo}>Acesso restrito</Text>
          <Text style={styles.subtitulo}>Este painel é exclusivo da farmácia.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Pedidos da farmácia</Text>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "preparando" && styles.abaBotaoAtiva,
          ]}
          onPress={() => setAbaSelecionada("preparando")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "preparando" && styles.abaTextoAtivo,
            ]}
          >
            Preparando ({pedidosPreparando.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "em_rota" && styles.abaBotaoAtiva,
          ]}
          onPress={() => setAbaSelecionada("em_rota")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "em_rota" && styles.abaTextoAtivo,
            ]}
          >
            Em rota ({pedidosEmRota.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "finalizados" && styles.abaBotaoAtiva,
          ]}
          onPress={() => setAbaSelecionada("finalizados")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "finalizados" && styles.abaTextoAtivo,
            ]}
          >
            Finalizados ({pedidosFinalizados.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtrosBox}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            style={styles.buscaInput}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por pedido, cliente, telefone ou bairro"
            placeholderTextColor="#8a978f"
          />
          {busca.length > 0 ? (
            <TouchableOpacity onPress={() => setBusca("")} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statusFiltros}>
          {statusDisponiveis.map((status) => {
            const active = statusFiltro === status;

            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusFiltroBotao, active && styles.statusFiltroAtivo]}
                onPress={() => setStatusFiltro(status)}
                activeOpacity={0.86}
              >
                <Text
                  style={[
                    styles.statusFiltroTexto,
                    active && styles.statusFiltroTextoAtivo,
                  ]}
                >
                  {status === "todos"
                    ? "Todos"
                    : formatarStatusPedido(status, { curto: true })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.resultadoTexto}>
          {pedidosVisiveis.length} pedido(s) nesta visão
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
        <FlatList
          data={pedidosVisiveis}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={48} color="#1b5e20" />
              <Text style={styles.subtitulo}>
                {abaSelecionada === "preparando"
                  ? "Nenhum pedido em preparo no momento."
                  : abaSelecionada === "em_rota"
                    ? "Nenhum pedido a caminho no momento."
                    : "Nenhum pedido finalizado ainda."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f8f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  voltar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 22, fontWeight: "800", color: "#1b5e20" },
  subtitulo: { fontSize: 14, color: "#666", marginTop: 8, textAlign: "center" },
  abas: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  abaBotao: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  abaBotaoAtiva: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },
  abaTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  abaTextoAtivo: {
    color: "#fff",
  },
  filtrosBox: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  buscaContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 44,
  },
  buscaInput: {
    flex: 1,
    color: "#1f2937",
    fontSize: 14,
    paddingVertical: 10,
    marginLeft: 8,
  },
  statusFiltros: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  statusFiltroBotao: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  statusFiltroAtivo: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },
  statusFiltroTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
  },
  statusFiltroTextoAtivo: { color: "#fff" },
  resultadoTexto: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
  lista: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    marginBottom: 14,
  },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardTopoTexto: { flex: 1 },
  codigo: { fontSize: 16, fontWeight: "800", color: "#1f2937" },
  subtexto: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  totalArea: { alignItems: "flex-end" },
  total: { fontSize: 18, fontWeight: "800", color: "#1b5e20" },
  detalhesLink: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  statusLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statusTexto: { fontSize: 13, fontWeight: "800", color: "#1b5e20" },
  filialTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
  local: { fontSize: 14, color: "#4b5563", marginTop: 10, lineHeight: 19 },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "800",
    marginBottom: 4,
  },
  infoValor: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "800",
  },
  infoTexto: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
    marginTop: 3,
  },
  secao: {
    marginTop: 12,
  },
  acoesRapidas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  botaoWhatsApp: {
    backgroundColor: "#128c7e",
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  botaoWhatsAppTexto: { color: "#fff", fontSize: 13, fontWeight: "800" },
  botaoDesativado: { opacity: 0.7 },
  botaoPagamento: {
    backgroundColor: "#f4c542",
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  botaoPagamentoTexto: {
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "800",
  },
  botaoEnviarPagamento: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#cfe8d2",
  },
  botaoEnviarPagamentoTexto: {
    color: "#1b5e20",
    fontSize: 13,
    fontWeight: "800",
  },
  pagamentoChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 6,
  },
  pagamentoChipTexto: {
    fontSize: 11,
    fontWeight: "900",
  },
  pagamentoOk: { backgroundColor: "#dcfce7" },
  pagamentoOkTexto: { color: "#166534" },
  pagamentoPendente: { backgroundColor: "#fff7ed" },
  pagamentoPendenteTexto: { color: "#92400e" },
  pagamentoAberto: { backgroundColor: "#e8f5e9" },
  pagamentoAbertoTexto: { color: "#1b5e20" },
  pagamentoErro: { backgroundColor: "#fee2e2" },
  pagamentoErroTexto: { color: "#991b1b" },
  inputObservacao: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    color: "#1f2937",
    fontSize: 13,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 8,
    textAlignVertical: "top",
  },
  botaoSalvarObservacao: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  botaoSalvarObservacaoTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
  },
  itemLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  itemTextoArea: {
    flex: 1,
  },
  itemNome: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
  },
  itemCodigoBarras: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  itemPreco: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "800",
  },
  acoes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  acaoBotao: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  acaoTexto: { color: "#1b5e20", fontSize: 12, fontWeight: "800" },
  entregadorBox: { gap: 8, marginTop: 12 },
  label: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
