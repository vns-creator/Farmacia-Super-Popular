// app/(tabs)/conta.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { getPerfilLabel, useAuth } from "../../context/AuthContext";

export default function ContaScreen() {
  const { user, perfil, logout } = useAuth();
  const router = useRouter();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral =
    isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const isEntregadorAtivo =
    perfil?.perfil === "entregador" && perfil.ativo;
  const isFarmaceuticoAtivo =
    perfil?.perfil === "farmaceutico" && perfil.ativo;

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showAlert("Erro", "Falha ao sair da conta.");
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={24} color="#1b5e20" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={72} color="#1b5e20" />
          <Text style={styles.titulo}>Minha Conta</Text>
          <Text style={styles.subtitulo}>
            Entre ou crie sua conta para acompanhar seus pedidos.
          </Text>
        </View>

        <View style={styles.areaBotoes}>
          <TouchableOpacity
            style={styles.botao}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}
          >
            <Text style={styles.botaoTexto}>Fazer login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => router.push("/register")}
            activeOpacity={0.9}
          >
            <Text style={styles.botaoSecundarioTexto}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#1b5e20" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={72} color="#1b5e20" />
        <Text style={styles.titulo}>Minha Conta</Text>
        <Text style={styles.subtitulo}>Acompanhe seus dados e pedidos</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Conta conectada</Text>
          <Text style={styles.nome}>{user.email}</Text>
          <Text style={styles.info}>E-mail: {user.email}</Text>
          <Text style={styles.info}>Perfil: {getPerfilLabel(perfil?.perfil)}</Text>
        </View>

        <TouchableOpacity
          style={styles.botao}
          onPress={() => router.push("/editar-dados")}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoTexto}>Editar dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.push("/pedidos")}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoSecundarioTexto}>Meus pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.push("/notificacoes")}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoSecundarioTexto}>Notificações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.push("/farmacia")}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoSecundarioTexto}>Dados da farmácia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.push("/termos" as any)}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoSecundarioTexto}>Termos de uso</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.push("/privacidade" as any)}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoSecundarioTexto}>Política de privacidade</Text>
        </TouchableOpacity>

        {isAdminAtivo && (
          <>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/sobre-sistema" as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>Sobre o sistema</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/pedidos")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>Painel da farmácia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/relatorios")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>Relatórios financeiros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/usuarios")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>Gerenciar usuários</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/produtos")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>Gerenciar produtos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/receitas")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>
                Validação de receitas
              </Text>
            </TouchableOpacity>

            {isAdminGeral && (
              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => router.push("/admin/alertas")}
                activeOpacity={0.9}
              >
                <Text style={styles.botaoSecundarioTexto}>Alertas sanitários</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isEntregadorAtivo && (
          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => router.push("/entregador/entregas")}
            activeOpacity={0.9}
          >
            <Text style={styles.botaoSecundarioTexto}>Minhas entregas</Text>
          </TouchableOpacity>
        )}

        {isFarmaceuticoAtivo && (
          <>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/alertas")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>Alertas sanitários</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/admin/receitas")}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoSecundarioTexto}>
                Validação de receitas
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.botaoLogout}
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoLogoutTexto}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#f4f8f5",
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

  header: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 26,
    paddingHorizontal: 24,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1b5e20",
    marginTop: 10,
  },

  subtitulo: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  areaBotoes: {
    paddingHorizontal: 20,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  contentContainer: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },

  cardLabel: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "800",
    marginBottom: 8,
  },

  nome: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 10,
  },

  info: {
    fontSize: 15,
    color: "#555",
  },

  botao: {
    backgroundColor: "#1b5e20",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  botaoTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoSecundario: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  botaoSecundarioTexto: {
    color: "#1b5e20",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoLogout: {
    backgroundColor: "#d32f2f",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },

  botaoLogoutTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
