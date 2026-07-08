import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";

type Entrega = {
  id: string;
  codigoPedido?: string;
  filialId?: string | null;
  filialNome?: string;
  criadoEm?: any;
  entregueEm?: any;
  atualizadoEm?: any;
  status?: string;
  total?: number;
  userUid?: string;
  cliente?: {
    nome?: string;
    telefone?: string;
  };
  entrega?: {
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    complemento?: string;
  } | null;
};

type AbaEntregas = "ativas" | "entregues";

const statusEncerrados = new Set(["finalizado", "entregue", "cancelado"]);

export default function EntregasScreen() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const isEntregadorAtivo = perfil?.perfil === "entregador" && perfil.ativo;
  const filialUsuarioId = perfil?.filialId || null;
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [entregaAtualizandoId, setEntregaAtualizandoId] = useState<
    string | null
  >(null);
  const [abaSelecionada, setAbaSelecionada] = useState<AbaEntregas>("ativas");

  const entregasAtivas = entregas.filter(
    (entrega) => !statusEncerrados.has(entrega.status || ""),
  );
  const entregasFinalizadas = entregas.filter((entrega) =>
    statusEncerrados.has(entrega.status || ""),
  );
  const entregasVisiveis =
    abaSelecionada === "ativas" ? entregasAtivas : entregasFinalizadas;

  useEffect(() => {
    if (!user || !isEntregadorAtivo) {
      setEntregas([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const entregasQuery = query(
      collection(db, "pedidos"),
      where("entregadorId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      entregasQuery,
      (snapshot) => {
        const entregasData = snapshot.docs
          .map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...docSnap.data(),
              }) as Entrega,
          )
          .sort((a, b) => {
            const dataA = a.criadoEm?.toDate
              ? a.criadoEm.toDate().getTime()
              : 0;
            const dataB = b.criadoEm?.toDate
              ? b.criadoEm.toDate().getTime()
              : 0;
            return dataB - dataA;
          });

        setEntregas(
          filialUsuarioId
            ? entregasData.filter((entrega) => entrega.filialId === filialUsuarioId)
            : entregasData,
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar entregas:", error);
        showAlert("Erro", "Nao foi possivel acompanhar suas entregas.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [filialUsuarioId, isEntregadorAtivo, user]);

  const confirmarEntrega = (entrega: Entrega) => {
    if (Platform.OS === "web") {
      marcarEntregue(entrega);
      return;
    }

    showAlert(
      "Confirmar entrega",
      "Deseja marcar este pedido como entregue?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => marcarEntregue(entrega),
        },
      ],
    );
  };

  const marcarEntregue = async (entrega: Entrega) => {
    try {
      setEntregaAtualizandoId(entrega.id);

      const marcarPedidoEntregue = httpsCallable(
        getFunctions(),
        "marcarPedidoEntregue",
      );

      await marcarPedidoEntregue({ pedidoId: entrega.id });

      setEntregas((entregasAtuais) =>
        entregasAtuais.map((item) =>
          item.id === entrega.id
            ? {
                ...item,
                status: "entregue",
                entregueEm: new Date(),
                atualizadoEm: new Date(),
              }
            : item,
        ),
      );
      setAbaSelecionada("entregues");
    } catch (error: any) {
      console.error("Erro ao marcar entrega:", error);
      showAlert(
        "Erro",
        error?.message || "Não foi possível marcar como entregue.",
      );
    } finally {
      setEntregaAtualizandoId(null);
    }
  };

  const formatarData = (data?: any) => {
    if (!data) return "Data não informada";
    if (data.toDate) return data.toDate().toLocaleString("pt-BR");
    if (data instanceof Date) return data.toLocaleString("pt-BR");
    return "Data não informada";
  };

  const formatarStatus = (status?: string) => {
    const statusMap: Record<string, string> = {
      entrega: "Em entrega",
      entregue: "Entregue",
      finalizado: "Finalizado",
      cancelado: "Cancelado",
    };

    return statusMap[status || "entrega"] || status || "Em entrega";
  };

  const renderEntrega = ({ item }: { item: Entrega }) => {
    const atualizando = entregaAtualizandoId === item.id;
    const finalizada = statusEncerrados.has(item.status || "");
    const endereco = item.entrega
      ? `${item.entrega.endereco || ""}, ${item.entrega.numero || ""}${
          item.entrega.complemento ? ` - ${item.entrega.complemento}` : ""
        } - ${item.entrega.bairro || ""}, ${item.entrega.cidade || ""}/${
          item.entrega.uf || ""
        }`
      : "Endereço não informado";

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
            <Text style={styles.codigo}>{item.codigoPedido || item.id}</Text>
            <View style={styles.statusArea}>
              <Text style={styles.status}>{formatarStatus(item.status)}</Text>
              <Text style={styles.detalhesLink}>Ver detalhes</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.filialTexto}>
          {item.filialNome || "Filial nao informada"}
        </Text>
        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.texto}>
          {item.cliente?.nome || "Não informado"} -{" "}
          {item.cliente?.telefone || "sem telefone"}
        </Text>

        <Text style={styles.label}>Endereço</Text>
        <Text style={styles.texto}>{endereco}</Text>

        {finalizada ? (
          <View style={styles.entregueBox}>
            <Ionicons name="checkmark-circle" size={20} color="#1b5e20" />
            <View style={styles.entregueTextoArea}>
              <Text style={styles.entregueTitulo}>Pedido entregue</Text>
              <Text style={styles.entregueTexto}>
                {formatarData(item.entregueEm || item.atualizadoEm)}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.botao, atualizando && styles.botaoDesativado]}
            onPress={() => confirmarEntrega(item)}
            disabled={atualizando}
            activeOpacity={0.9}
          >
            {atualizando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
            )}
            <Text style={styles.botaoTexto}>
              {atualizando ? "Atualizando..." : "Marcar como entregue"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!isEntregadorAtivo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={46} color="#1b5e20" />
          <Text style={styles.titulo}>Acesso restrito</Text>
          <Text style={styles.subtitulo}>
            Este painel é exclusivo para entregadores.
          </Text>
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
        <Text style={styles.titulo}>Minhas entregas</Text>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "ativas" && styles.abaBotaoAtiva,
          ]}
          onPress={() => setAbaSelecionada("ativas")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "ativas" && styles.abaTextoAtivo,
            ]}
          >
            Em andamento ({entregasAtivas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "entregues" && styles.abaBotaoAtiva,
          ]}
          onPress={() => setAbaSelecionada("entregues")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "entregues" && styles.abaTextoAtivo,
            ]}
          >
            Entregues ({entregasFinalizadas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
        <FlatList
          data={entregasVisiveis}
          renderItem={renderEntrega}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bicycle-outline" size={48} color="#1b5e20" />
              <Text style={styles.subtitulo}>
                {abaSelecionada === "ativas"
                  ? "Nenhuma entrega em andamento."
                  : "Nenhum pedido entregue ainda."}
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
  codigo: { fontSize: 16, fontWeight: "800", color: "#1f2937" },
  statusArea: { alignItems: "flex-end" },
  status: { fontSize: 13, color: "#1b5e20", fontWeight: "800" },
  filialTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
  },
  detalhesLink: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 4,
  },
  texto: { fontSize: 14, color: "#4b5563", lineHeight: 19 },
  botao: {
    backgroundColor: "#1b5e20",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  botaoDesativado: {
    opacity: 0.75,
  },
  botaoTexto: { color: "#fff", fontSize: 15, fontWeight: "800" },
  entregueBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  entregueTextoArea: {
    flex: 1,
  },
  entregueTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1b5e20",
  },
  entregueTexto: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
