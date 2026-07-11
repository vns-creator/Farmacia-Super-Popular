import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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
import { showAlert } from "@/services/alert";
import {
  getPerfilLabel,
  useAuth,
  type PerfilUsuario,
} from "../../context/AuthContext";
import { filiais, getFilialById } from "../../constants/filiais";
import { db } from "../../firebaseConfig";

type UsuarioAdmin = {
  id: string;
  uid?: string;
  email?: string;
  nome?: string;
  perfil?: PerfilUsuario;
  ativo?: boolean;
  filialId?: string | null;
  filialNome?: string;
  adminGeral?: boolean;
};

const perfis: PerfilUsuario[] = ["cliente", "entregador", "farmaceutico", "admin"];

export default function AdminUsuariosScreen() {
  const router = useRouter();
  const { perfil } = useAuth();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral = isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminAtivo) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, "usuarios")),
      (snapshot) => {
        const dados = snapshot.docs
          .map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...docSnap.data(),
              }) as UsuarioAdmin,
          )
          .sort((a, b) =>
            String(a.email || a.nome || "").localeCompare(
              String(b.email || b.nome || ""),
            ),
          );

        setUsuarios(
          isAdminGeral
            ? dados
            : dados.filter((usuario) => usuario.filialId === perfil?.filialId),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar usuarios:", error);
        showAlert("Erro", "Não foi possível carregar os usuários.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [isAdminAtivo, isAdminGeral, perfil?.filialId]);

  const atualizarUsuario = async (
    usuario: UsuarioAdmin,
    dados: Partial<UsuarioAdmin>,
  ) => {
    try {
      setAtualizandoId(usuario.id);
      await updateDoc(doc(db, "usuarios", usuario.id), {
        ...dados,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar usuario:", error);
      showAlert("Erro", "Não foi possível atualizar este usuário.");
    } finally {
      setAtualizandoId(null);
    }
  };

  const renderUsuario = ({ item }: { item: UsuarioAdmin }) => {
    const atualizando = atualizandoId === item.id;
    const ehCliente = (item.perfil || "cliente") === "cliente";

    return (
      <View style={styles.card}>
        <View style={styles.cardTopo}>
          <View style={styles.usuarioTexto}>
            <Text style={styles.nome}>{item.nome || item.email || "Usuário"}</Text>
            <Text style={styles.email}>{item.email || item.id}</Text>
          </View>
          <View style={[styles.statusChip, item.ativo && styles.statusChipAtivo]}>
            <Text
              style={[
                styles.statusChipTexto,
                item.ativo && styles.statusChipTextoAtivo,
              ]}
            >
              {item.ativo ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>

        {!ehCliente && (
          <>
            <Text style={styles.label}>Filial</Text>
            <Text style={styles.ajudaFilial}>
              Define qual painel administrativo esta pessoa gerencia. Nao se
              aplica a clientes, que sempre veem produtos de todas as filiais.
            </Text>
            <View style={styles.perfis}>
              {isAdminGeral && (
                <TouchableOpacity
                  style={[
                    styles.perfilBotao,
                    item.adminGeral && styles.perfilBotaoAtivo,
                  ]}
                  disabled={atualizando}
                  onPress={() =>
                    atualizarUsuario(item, {
                      adminGeral: true,
                      filialId: null,
                      filialNome: "Todas as filiais",
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.perfilBotaoTexto,
                      item.adminGeral && styles.perfilBotaoTextoAtivo,
                    ]}
                  >
                    Geral
                  </Text>
                </TouchableOpacity>
              )}

              {filiais.map((filial) => {
                const ativo = item.filialId === filial.id && !item.adminGeral;

                return (
                  <TouchableOpacity
                    key={filial.id}
                    style={[styles.perfilBotao, ativo && styles.perfilBotaoAtivo]}
                    disabled={atualizando || !isAdminGeral}
                    onPress={() =>
                      atualizarUsuario(item, {
                        adminGeral: false,
                        filialId: filial.id,
                        filialNome: filial.nome,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.perfilBotaoTexto,
                        ativo && styles.perfilBotaoTextoAtivo,
                      ]}
                    >
                      {filial.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filialAtual}>
              Atual:{" "}
              {item.adminGeral
                ? "Todas as filiais"
                : getFilialById(item.filialId)?.nome || "Sem filial"}
            </Text>
          </>
        )}

        <Text style={styles.label}>Perfil</Text>
        <View style={styles.perfis}>
          {perfis.map((perfilOpcao) => {
            const ativo = (item.perfil || "cliente") === perfilOpcao;

            return (
              <TouchableOpacity
                key={perfilOpcao}
                style={[styles.perfilBotao, ativo && styles.perfilBotaoAtivo]}
                disabled={atualizando}
                onPress={() =>
                  atualizarUsuario(item, {
                    perfil: perfilOpcao,
                    ativo: item.ativo ?? true,
                  })
                }
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.perfilBotaoTexto,
                    ativo && styles.perfilBotaoTextoAtivo,
                  ]}
                >
                  {getPerfilLabel(perfilOpcao)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.ativarBotao, !item.ativo && styles.ativarBotaoInativo]}
          disabled={atualizando}
          onPress={() => atualizarUsuario(item, { ativo: !item.ativo })}
          activeOpacity={0.9}
        >
          {atualizando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={item.ativo ? "pause-circle-outline" : "play-circle-outline"}
              size={18}
              color="#fff"
            />
          )}
          <Text style={styles.ativarBotaoTexto}>
            {item.ativo ? "Desativar acesso" : "Ativar acesso"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
          <Text style={styles.titulo}>Usuários</Text>
          <Text style={styles.subtitulo}>Gerencie admins e entregadores</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
        <FlatList
          data={usuarios}
          renderItem={renderUsuario}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
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
  titulo: { color: "#1b5e20", fontSize: 22, fontWeight: "800" },
  subtitulo: { color: "#6b7280", fontSize: 13, fontWeight: "700", marginTop: 3 },
  lista: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 16,
    marginBottom: 14,
  },
  cardTopo: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  usuarioTexto: { flex: 1 },
  nome: { color: "#1f2937", fontSize: 16, fontWeight: "800" },
  email: { color: "#6b7280", fontSize: 13, marginTop: 4 },
  statusChip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fee2e2",
  },
  statusChipAtivo: { backgroundColor: "#e8f5e9" },
  statusChipTexto: { color: "#991b1b", fontSize: 12, fontWeight: "800" },
  statusChipTextoAtivo: { color: "#1b5e20" },
  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
  },
  ajudaFilial: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: -4,
    marginBottom: 8,
    lineHeight: 16,
  },
  perfis: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  perfilBotao: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  perfilBotaoAtivo: { backgroundColor: "#1b5e20", borderColor: "#1b5e20" },
  perfilBotaoTexto: { color: "#1b5e20", fontSize: 12, fontWeight: "800" },
  perfilBotaoTextoAtivo: { color: "#fff" },
  filialAtual: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
  ativarBotao: {
    backgroundColor: "#d32f2f",
    borderRadius: 14,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  ativarBotaoInativo: { backgroundColor: "#1b5e20" },
  ativarBotaoTexto: { color: "#fff", fontSize: 14, fontWeight: "800" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
