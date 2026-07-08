import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { filiais, getFilialById } from "../../constants/filiais";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { formatarMoeda } from "../../services/formatters";
import { formatarStatusPedido } from "../../services/orderFormatters";
import { formatarFormaPagamento } from "../../services/payments";

type PeriodoFiltro = "hoje" | "7dias" | "30dias" | "todos";

type PedidoRelatorio = {
  id: string;
  criadoEm?: any;
  filialId?: string | null;
  filialNome?: string;
  status?: string;
  total?: number;
  subtotal?: number;
  taxaEntrega?: number;
  pagamento?: string;
  tipoAtendimento?: "entrega" | "retirada";
  itens?: {
    id?: string;
    nome?: string;
    preco?: number;
    quantidade?: number;
  }[];
};

type ProdutoResumo = {
  nome: string;
  quantidade: number;
  total: number;
};

const periodos: { label: string; value: PeriodoFiltro }[] = [
  { label: "Hoje", value: "hoje" },
  { label: "7 dias", value: "7dias" },
  { label: "30 dias", value: "30dias" },
  { label: "Todos", value: "todos" },
];

const statusCancelados = new Set(["cancelado"]);

function obterDataPedido(pedido: PedidoRelatorio) {
  if (pedido.criadoEm?.toDate) return pedido.criadoEm.toDate() as Date;
  if (pedido.criadoEm instanceof Date) return pedido.criadoEm;
  return null;
}

function inicioDoPeriodo(periodo: PeriodoFiltro) {
  const agora = new Date();
  const inicio = new Date(agora);

  if (periodo === "todos") return null;

  inicio.setHours(0, 0, 0, 0);

  if (periodo === "7dias") {
    inicio.setDate(inicio.getDate() - 6);
  }

  if (periodo === "30dias") {
    inicio.setDate(inicio.getDate() - 29);
  }

  return inicio;
}

export default function AdminRelatoriosScreen() {
  const router = useRouter();
  const { perfil } = useAuth();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral =
    isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const filialUsuarioId = perfil?.filialId || null;
  const [pedidos, setPedidos] = useState<PedidoRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30dias");
  const [filialFiltro, setFilialFiltro] = useState<string>(
    isAdminGeral ? "todas" : filialUsuarioId || "todas",
  );

  useEffect(() => {
    if (!isAdminAtivo) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "pedidos"),
      (snapshot) => {
        const dados = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
            }) as PedidoRelatorio,
        );

        setPedidos(
          isAdminGeral
            ? dados
            : dados.filter((pedido) => pedido.filialId === filialUsuarioId),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar relatorios:", error);
        showAlert("Erro", "Nao foi possivel carregar os relatorios.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [filialUsuarioId, isAdminAtivo, isAdminGeral]);

  useEffect(() => {
    if (!isAdminGeral && filialUsuarioId) {
      setFilialFiltro(filialUsuarioId);
    }
  }, [filialUsuarioId, isAdminGeral]);

  const pedidosFiltrados = useMemo(() => {
    const inicio = inicioDoPeriodo(periodo);

    return pedidos.filter((pedido) => {
      const dataPedido = obterDataPedido(pedido);
      const batePeriodo = !inicio || (dataPedido && dataPedido >= inicio);
      const bateFilial =
        filialFiltro === "todas" || pedido.filialId === filialFiltro;

      return batePeriodo && bateFilial;
    });
  }, [filialFiltro, pedidos, periodo]);

  const resumo = useMemo(() => {
    const pedidosValidos = pedidosFiltrados.filter(
      (pedido) => !statusCancelados.has(pedido.status || ""),
    );
    const faturamento = pedidosValidos.reduce(
      (total, pedido) => total + Number(pedido.total || 0),
      0,
    );
    const subtotalProdutos = pedidosValidos.reduce(
      (total, pedido) => total + Number(pedido.subtotal || 0),
      0,
    );
    const entregaTotal = pedidosValidos.reduce(
      (total, pedido) => total + Number(pedido.taxaEntrega || 0),
      0,
    );
    const ticketMedio =
      pedidosValidos.length > 0 ? faturamento / pedidosValidos.length : 0;
    const entregas = pedidosValidos.filter(
      (pedido) => pedido.tipoAtendimento === "entrega",
    ).length;
    const retiradas = pedidosValidos.filter(
      (pedido) => pedido.tipoAtendimento === "retirada",
    ).length;

    return {
      pedidosValidos,
      faturamento,
      subtotalProdutos,
      entregaTotal,
      ticketMedio,
      entregas,
      retiradas,
    };
  }, [pedidosFiltrados]);

  const porPagamento = useMemo(() => {
    const mapa = new Map<string, { total: number; quantidade: number }>();

    resumo.pedidosValidos.forEach((pedido) => {
      const chave = formatarFormaPagamento(pedido.pagamento);
      const atual = mapa.get(chave) || { total: 0, quantidade: 0 };

      mapa.set(chave, {
        total: atual.total + Number(pedido.total || 0),
        quantidade: atual.quantidade + 1,
      });
    });

    return Array.from(mapa.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [resumo.pedidosValidos]);

  const porStatus = useMemo(() => {
    const mapa = new Map<string, number>();

    pedidosFiltrados.forEach((pedido) => {
      const chave = pedido.status || "recebido";
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });

    return Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);
  }, [pedidosFiltrados]);

  const porFilial = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number; quantidade: number }>();

    resumo.pedidosValidos.forEach((pedido) => {
      const filialId = pedido.filialId || "sem-filial";
      const filial = getFilialById(filialId);
      const atual = mapa.get(filialId) || {
        nome: pedido.filialNome || filial?.nome || "Sem filial",
        total: 0,
        quantidade: 0,
      };

      mapa.set(filialId, {
        ...atual,
        total: atual.total + Number(pedido.total || 0),
        quantidade: atual.quantidade + 1,
      });
    });

    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [resumo.pedidosValidos]);

  const produtosMaisVendidos = useMemo(() => {
    const mapa = new Map<string, ProdutoResumo>();

    resumo.pedidosValidos.forEach((pedido) => {
      (pedido.itens || []).forEach((item) => {
        const nome = item.nome || "Produto sem nome";
        const quantidade = Number(item.quantidade || 0);
        const preco = Number(item.preco || 0);
        const atual = mapa.get(nome) || { nome, quantidade: 0, total: 0 };

        mapa.set(nome, {
          nome,
          quantidade: atual.quantidade + quantidade,
          total: atual.total + preco * quantidade,
        });
      });
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [resumo.pedidosValidos]);

  const filiaisDisponiveis = isAdminGeral
    ? [{ id: "todas", nome: "Todas" }, ...filiais]
    : filiais.filter((filial) => filial.id === filialUsuarioId);

  if (!isAdminAtivo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={48} color="#1b5e20" />
          <Text style={styles.titulo}>Acesso restrito</Text>
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
        <View style={styles.headerTexto}>
          <Text style={styles.titulo}>Relatorios</Text>
          <Text style={styles.subtitulo}>Vendas, pagamentos e desempenho</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.filtros}>
            <Text style={styles.label}>Periodo</Text>
            <View style={styles.chips}>
              {periodos.map((item) => {
                const ativo = periodo === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setPeriodo(item.value)}
                    activeOpacity={0.86}
                  >
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Filial</Text>
            <View style={styles.chips}>
              {filiaisDisponiveis.map((filial) => {
                const ativo = filialFiltro === filial.id;

                return (
                  <TouchableOpacity
                    key={filial.id}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setFilialFiltro(filial.id)}
                    activeOpacity={0.86}
                  >
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                      {filial.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiPrincipal}>
              <Text style={styles.kpiLabel}>Faturamento</Text>
              <Text style={styles.kpiValorPrincipal}>
                {formatarMoeda(resumo.faturamento)}
              </Text>
              <Text style={styles.kpiAjuda}>
                {resumo.pedidosValidos.length} pedido(s) validos
              </Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Ticket medio</Text>
              <Text style={styles.kpiValor}>{formatarMoeda(resumo.ticketMedio)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Produtos</Text>
              <Text style={styles.kpiValor}>
                {formatarMoeda(resumo.subtotalProdutos)}
              </Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Taxas entrega</Text>
              <Text style={styles.kpiValor}>{formatarMoeda(resumo.entregaTotal)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Atendimento</Text>
            <View style={styles.duasColunas}>
              <View style={styles.miniBox}>
                <Ionicons name="bicycle-outline" size={20} color="#1b5e20" />
                <Text style={styles.miniNumero}>{resumo.entregas}</Text>
                <Text style={styles.miniLabel}>Entregas</Text>
              </View>
              <View style={styles.miniBox}>
                <Ionicons name="storefront-outline" size={20} color="#1b5e20" />
                <Text style={styles.miniNumero}>{resumo.retiradas}</Text>
                <Text style={styles.miniLabel}>Retiradas</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Por forma de pagamento</Text>
            {porPagamento.length > 0 ? (
              porPagamento.map(([nome, dados]) => (
                <View key={nome} style={styles.linha}>
                  <View style={styles.linhaTextoArea}>
                    <Text style={styles.linhaTitulo}>{nome}</Text>
                    <Text style={styles.linhaSubtitulo}>
                      {dados.quantidade} pedido(s)
                    </Text>
                  </View>
                  <Text style={styles.linhaValor}>{formatarMoeda(dados.total)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.vazio}>Nenhum pedido no periodo.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Por filial</Text>
            {porFilial.length > 0 ? (
              porFilial.map((item) => (
                <View key={item.nome} style={styles.linha}>
                  <View style={styles.linhaTextoArea}>
                    <Text style={styles.linhaTitulo}>{item.nome}</Text>
                    <Text style={styles.linhaSubtitulo}>
                      {item.quantidade} pedido(s)
                    </Text>
                  </View>
                  <Text style={styles.linhaValor}>{formatarMoeda(item.total)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.vazio}>Nenhum pedido no periodo.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Status dos pedidos</Text>
            {porStatus.length > 0 ? (
              porStatus.map(([status, quantidade]) => (
                <View key={status} style={styles.linhaCompacta}>
                  <Text style={styles.linhaTitulo}>
                    {formatarStatusPedido(status, { curto: true })}
                  </Text>
                  <Text style={styles.badge}>{quantidade}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.vazio}>Nenhum pedido no periodo.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Produtos mais vendidos</Text>
            {produtosMaisVendidos.length > 0 ? (
              produtosMaisVendidos.map((produto, index) => (
                <View key={`${produto.nome}-${index}`} style={styles.linha}>
                  <View style={styles.ranking}>
                    <Text style={styles.rankingTexto}>{index + 1}</Text>
                  </View>
                  <View style={styles.linhaTextoArea}>
                    <Text style={styles.linhaTitulo}>{produto.nome}</Text>
                    <Text style={styles.linhaSubtitulo}>
                      {produto.quantidade} unidade(s)
                    </Text>
                  </View>
                  <Text style={styles.linhaValor}>{formatarMoeda(produto.total)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.vazio}>Nenhum produto vendido no periodo.</Text>
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
    borderWidth: 1,
    borderColor: "#edf2ee",
  },
  headerTexto: { flex: 1 },
  titulo: { fontSize: 22, fontWeight: "800", color: "#1b5e20" },
  subtitulo: { color: "#6b7280", fontSize: 13, fontWeight: "700", marginTop: 3 },
  content: { padding: 16, paddingBottom: 32 },
  filtros: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    marginBottom: 14,
  },
  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d7e7d9",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  chipAtivo: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },
  chipTexto: { color: "#1b5e20", fontSize: 12, fontWeight: "800" },
  chipTextoAtivo: { color: "#fff" },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  kpiPrincipal: {
    width: "100%",
    backgroundColor: "#1b5e20",
    borderRadius: 16,
    padding: 16,
  },
  kpi: {
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },
  kpiLabel: { color: "#6b7280", fontSize: 12, fontWeight: "800" },
  kpiValorPrincipal: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
  },
  kpiAjuda: { color: "#d8f0dc", fontSize: 12, fontWeight: "800", marginTop: 5 },
  kpiValor: { color: "#1f2937", fontSize: 17, fontWeight: "900", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    marginBottom: 14,
  },
  cardTitulo: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  duasColunas: { flexDirection: "row", gap: 10 },
  miniBox: {
    flex: 1,
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },
  miniNumero: {
    color: "#1f2937",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  miniLabel: { color: "#6b7280", fontSize: 12, fontWeight: "800" },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  linhaCompacta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  linhaTextoArea: { flex: 1 },
  linhaTitulo: { color: "#1f2937", fontSize: 14, fontWeight: "800" },
  linhaSubtitulo: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  linhaValor: { color: "#1b5e20", fontSize: 14, fontWeight: "900" },
  badge: {
    color: "#1b5e20",
    backgroundColor: "#e8f5e9",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "900",
  },
  ranking: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  rankingTexto: { color: "#1b5e20", fontSize: 12, fontWeight: "900" },
  vazio: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
