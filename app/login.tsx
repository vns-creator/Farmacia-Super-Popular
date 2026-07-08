// app/login.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);

  const { login, recuperarSenha } = useAuth();
  const router = useRouter();

  const voltar = () => {
    router.replace("/conta");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Erro", "Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (error: any) {
      console.error("Erro no login:", error);
      showAlert("Erro ao entrar", error?.message || "Nao foi possivel entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarSenha = async () => {
    const emailLimpo = email.trim();

    if (!emailLimpo) {
      showAlert(
        "Informe seu e-mail",
        "Digite o e-mail da conta para receber o link de redefinicao.",
      );
      return;
    }

    setEnviandoRecuperacao(true);

    try {
      await recuperarSenha(emailLimpo);
      showAlert(
        "E-mail enviado",
        "Se existir uma conta com este e-mail, voce recebera um link para criar uma nova senha.",
      );
    } catch (error: any) {
      console.error("Erro ao enviar recuperacao de senha:", error);
      showAlert(
        "Nao foi possivel enviar",
        error?.message || "Confira o e-mail informado e tente novamente.",
      );
    } finally {
      setEnviandoRecuperacao(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.botaoVoltar} onPress={voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Entrar na conta</Text>
          <Text style={styles.subtitle}>
            Acesse sua conta para acompanhar seus pedidos.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recuperarSenhaBotao}
            onPress={handleRecuperarSenha}
            disabled={enviandoRecuperacao}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={17} color="#1b5e20" />
            <Text style={styles.recuperarSenhaTexto}>
              {enviandoRecuperacao
                ? "Enviando e-mail..."
                : "Esqueci minha senha"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.link}>Nao tem conta? Cadastre-se</Text>
          </TouchableOpacity>

          <View style={styles.linksLegais}>
            <TouchableOpacity onPress={() => router.push("/termos" as any)}>
              <Text style={styles.linkLegal}>Termos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/privacidade" as any)}>
              <Text style={styles.linkLegal}>Privacidade</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f8f5",
  },
  botaoVoltar: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2ee",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
    color: "#1b5e20",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#edf2ee",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f8faf8",
    fontSize: 15,
    color: "#1f2937",
  },
  button: {
    backgroundColor: "#1b5e20",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "#999",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  recuperarSenhaBotao: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginBottom: 12,
  },
  recuperarSenhaTexto: {
    color: "#1b5e20",
    fontSize: 13,
    fontWeight: "800",
  },
  link: {
    textAlign: "center",
    color: "#1b5e20",
    fontWeight: "700",
    fontSize: 14,
  },
  linksLegais: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
  },
  linkLegal: {
    color: "#1b5e20",
    fontSize: 13,
    fontWeight: "800",
  },
});
