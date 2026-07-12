import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
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

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  pedidoId?: string | null;
  lida?: boolean;
  criadoEm?: any;
};

export default function NotificacoesScreen() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const notificacoesPorId = new Map<string, Notificacao>();

    const atualizarLista = () => {
      const dados = Array.from(notificacoesPorId.values()).sort((a, b) => {
        const dataA = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : 0;
        const dataB = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : 0;
        return dataB - dataA;
      });

      setNotificacoes(dados);
      setLoading(false);
    };

    const unsubscribes = [
      onSnapshot(
        query(collection(db, "notificacoes"), where("userUid", "==", user.uid)),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              notificacoesPorId.delete(change.doc.id);
              return;
            }

            notificacoesPorId.set(change.doc.id, {
              id: change.doc.id,
              ...change.doc.data(),
            } as Notificacao);
          });
          atualizarLista();
        },
        () => setLoading(false),
      ),
    ];

    if (perfil?.perfil === "admin" && perfil.ativo) {
      const isAdminGeral = perfil.adminGeral === true || !perfil.filialId;
      const notificacoesAdminQuery = isAdminGeral
        ? query(collection(db, "notificacoes"), where("perfilDestino", "==", "admin"))
        : query(
            collection(db, "notificacoes"),
            where("perfilDestino", "==", "admin"),
            where("filialId", "==", perfil.filialId),
          );

      unsubscribes.push(
        onSnapshot(
          notificacoesAdminQuery,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "removed") {
                notificacoesPorId.delete(change.doc.id);
                return;
              }

              notificacoesPorId.set(change.doc.id, {
                id: change.doc.id,
                ...change.doc.data(),
              } as Notificacao);
            });
            atualizarLista();
          },
          () => setLoading(false),
        ),
      );
    }

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [perfil, user]);

  const naoLidas = useMemo(
    () => notificacoes.filter((item) => !item.lida).length,
    [notificacoes],
  );

  const abrirNotificacao = async (item: Notificacao) => {
    if (!item.lida) {
      await updateDoc(doc(db, "notificacoes", item.id), { lida: true });
    }

    if (item.pedidoId) {
      router.push({
        pathname: "/pedido-detalhes",
        params: { id: item.pedidoId },
      } as any);
    }
  };

  const renderItem = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
      style={[styles.card, !item.lida && styles.cardNaoLido]}
      onPress={() => abrirNotificacao(item)}
      activeOpacity={0.9}
    >
      <View style={styles.iconeArea}>
        <Ionicons
          name={item.lida ? "notifications-outline" : "notifications"}
          size={22}
          color="#1b5e20"
        />
      </View>

      <View style={styles.cardTexto}>
        <Text style={styles.cardTitulo}>{item.titulo}</Text>
        <Text style={styles.cardMensagem}>{item.mensagem}</Text>
        {item.pedidoId && <Text style={styles.cardLink}>Ver pedido</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <View style={styles.headerTexto}>
          <Text style={styles.titulo}>Notificações</Text>
          <Text style={styles.subtitulo}>
            {naoLidas} {naoLidas === 1 ? "nova notificação" : "novas notificações"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-outline" size={48} color="#1b5e20" />
              <Text style={styles.emptyTitulo}>Nada novo por aqui</Text>
              <Text style={styles.emptyTexto}>
                Atualizações de pedidos vão aparecer nesta tela.
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
  headerTexto: { flex: 1 },
  titulo: { fontSize: 22, fontWeight: "800", color: "#1b5e20" },
  subtitulo: { color: "#6b7280", fontSize: 13, fontWeight: "700", marginTop: 3 },
  lista: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  cardNaoLido: { borderColor: "#1b5e20", backgroundColor: "#f7fbf7" },
  iconeArea: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTexto: { flex: 1 },
  cardTitulo: { color: "#1f2937", fontSize: 15, fontWeight: "800" },
  cardMensagem: { color: "#4b5563", fontSize: 13, lineHeight: 18, marginTop: 4 },
  cardLink: { color: "#1b5e20", fontSize: 12, fontWeight: "800", marginTop: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
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
});
