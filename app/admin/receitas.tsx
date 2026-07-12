// app/admin/receitas.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { formatarMoeda } from "@/services/formatters";
import { formatarDataHora } from "@/services/orderFormatters";
import { carregarFotoReceitaComoDataUri } from "@/services/receitas";

type ItemPedido = {
  nome: string;
  preco: number;
  quantidade: number;
  exigeReceita?: boolean;
};

type PedidoReceita = {
  id: string;
  codigoPedido?: string;
  filialId?: string | null;
  filialNome?: string;
  criadoEm?: any;
  total?: number;
  cliente?: {
    nome?: string;
    telefone?: string;
  };
  itens?: ItemPedido[];
  receitas?: { caminho: string; enviadaEm?: any }[];
};

export default function AdminReceitasScreen() {
  const router = useRouter();
  const { perfil } = useAuth();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral =
    isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const isFarmaceuticoAtivo = perfil?.perfil === "farmaceutico" && perfil.ativo;
  const podeValidarReceitas = isAdminAtivo || isFarmaceuticoAtivo;
  const filialUsuarioId = perfil?.filialId || null;

  const [pedidos, setPedidos] = useState<PedidoReceita[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagens, setImagens] = useState<Record<string, string>>({});
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!podeValidarReceitas) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const pedidosQuery = query(
      collection(db, "pedidos"),
      where("status", "==", "aguardando_validacao_farmaceutica"),
    );

    const unsubscribe = onSnapshot(
      pedidosQuery,
      (snapshot) => {
        const dados = snapshot.docs
          .map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...docSnap.data(),
              }) as PedidoReceita,
          )
          .sort((a, b) => {
            const dataA = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : 0;
            const dataB = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : 0;
            return dataA - dataB;
          });

        setPedidos(
          isAdminGeral || !filialUsuarioId
            ? dados
            : dados.filter((pedido) => pedido.filialId === filialUsuarioId),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar receitas pendentes:", error);
        showAlert("Erro", "Não foi possível carregar as receitas pendentes.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [podeValidarReceitas, isAdminGeral, filialUsuarioId]);

  useEffect(() => {
    pedidos.forEach((pedido) => {
      (pedido.receitas || []).forEach((receita) => {
        if (imagens[receita.caminho]) return;

        carregarFotoReceitaComoDataUri(receita.caminho)
          .then((dataUri) => {
            setImagens((prev) => ({ ...prev, [receita.caminho]: dataUri }));
          })
          .catch((error) => {
            console.error("Erro ao carregar foto da receita:", error);
          });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos]);

  const revisar = async (pedido: PedidoReceita, aprovado: boolean) => {
    const motivoReprovacao = motivos[pedido.id]?.trim() || "";

    if (!aprovado && !motivoReprovacao) {
      showAlert(
        "Informe o motivo",
        "Descreva por que a receita está sendo reprovada.",
      );
      return;
    }

    try {
      setProcessandoId(pedido.id);

      const revisarReceitaPedido = httpsCallable(
        getFunctions(),
        "revisarReceitaPedido",
      );

      await revisarReceitaPedido({
        pedidoId: pedido.id,
        aprovado,
        motivoReprovacao: aprovado ? "" : motivoReprovacao,
      });

      setPedidos((atuais) => atuais.filter((item) => item.id !== pedido.id));
    } catch (error: any) {
      console.error("Erro ao revisar receita:", error);
      showAlert(
        "Erro",
        error?.message || "Não foi possível registrar a validação da receita.",
      );
    } finally {
      setProcessandoId(null);
    }
  };

  const renderPedido = ({ item }: { item: PedidoReceita }) => {
    const processando = processandoId === item.id;
    const itensReceita = (item.itens || []).filter(
      (produto) => produto.exigeReceita,
    );

    return (
      <View style={styles.card}>
        <View style={styles.cardTopo}>
          <Text style={styles.codigo}>{item.codigoPedido || item.id}</Text>
          <Text style={styles.data}>{formatarDataHora(item.criadoEm)}</Text>
        </View>

        <Text style={styles.filialTexto}>
          {item.filialNome || "Filial não informada"}
        </Text>

        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.texto}>
          {item.cliente?.nome || "Não informado"} -{" "}
          {item.cliente?.telefone || "sem telefone"}
        </Text>

        <Text style={styles.label}>Itens que exigem receita</Text>
        {itensReceita.length > 0 ? (
          itensReceita.map((produto, index) => (
            <Text key={`${produto.nome}-${index}`} style={styles.texto}>
              {produto.nome} x{produto.quantidade} -{" "}
              {formatarMoeda(produto.preco * produto.quantidade)}
            </Text>
          ))
        ) : (
          <Text style={styles.texto}>Nenhum item identificado.</Text>
        )}

        <Text style={styles.label}>Receita enviada</Text>
        <View style={styles.receitasLista}>
          {(item.receitas || []).length === 0 ? (
            <Text style={styles.texto}>Nenhuma foto anexada.</Text>
          ) : (
            (item.receitas || []).map((receita) => (
              <View key={receita.caminho} style={styles.receitaMiniatura}>
                {imagens[receita.caminho] ? (
                  <Image
                    source={{ uri: imagens[receita.caminho] }}
                    style={styles.receitaImagem}
                  />
                ) : (
                  <ActivityIndicator size="small" color="#1b5e20" />
                )}
              </View>
            ))
          )}
        </View>

        <TextInput
          style={styles.input}
          value={motivos[item.id] || ""}
          onChangeText={(valor) =>
            setMotivos((prev) => ({ ...prev, [item.id]: valor }))
          }
          placeholder="Motivo da reprovação (obrigatório se reprovar)"
          placeholderTextColor="#8a978f"
          multiline
        />

        <View style={styles.acoes}>
          <TouchableOpacity
            style={[styles.botaoReprovar, processando && styles.botaoDesativado]}
            onPress={() => revisar(item, false)}
            disabled={processando}
            activeOpacity={0.9}
          >
            <Text style={styles.botaoReprovarTexto}>Reprovar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoAprovar, processando && styles.botaoDesativado]}
            onPress={() => revisar(item, true)}
            disabled={processando}
            activeOpacity={0.9}
          >
            {processando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.botaoAprovarTexto}>Aprovar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!podeValidarReceitas) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={46} color="#1b5e20" />
          <Text style={styles.titulo}>Acesso restrito</Text>
          <Text style={styles.subtitulo}>
            Este painel é exclusivo da farmácia.
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
        <Text style={styles.titulo}>Validação de receitas</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={48} color="#1b5e20" />
              <Text style={styles.subtitulo}>
                Nenhuma receita aguardando validação.
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
  subtitulo: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
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
  cardTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  codigo: { fontSize: 16, fontWeight: "800", color: "#1f2937" },
  data: { fontSize: 12, color: "#6b7280", fontWeight: "700" },
  filialTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 4,
  },
  texto: { fontSize: 14, color: "#4b5563", lineHeight: 19 },
  receitasLista: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  receitaMiniatura: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#edf2ee",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8faf8",
  },
  receitaImagem: {
    width: "100%",
    height: "100%",
  },
  input: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    fontSize: 14,
    color: "#1f2937",
    minHeight: 44,
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  botaoReprovar: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d32f2f",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoReprovarTexto: {
    color: "#d32f2f",
    fontWeight: "800",
  },
  botaoAprovar: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#1b5e20",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoAprovarTexto: {
    color: "#fff",
    fontWeight: "800",
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
