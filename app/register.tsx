// app/register.tsx

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

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      showAlert("Erro", "Preencha e-mail, senha e confirmacao de senha.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Erro", "As senhas nao coincidem.");
      return;
    }

    if (password.length < 6) {
      showAlert("Erro", "A senha deve ter no minimo 6 caracteres.");
      return;
    }

    if (!aceitouTermos) {
      showAlert(
        "Aceite necessario",
        "Leia e aceite os Termos de Uso e a Politica de Privacidade.",
      );
      return;
    }

    setLoading(true);

    try {
      await register(email.trim(), password);

      showAlert("Sucesso", "Usuario cadastrado com sucesso!", [
        {
          text: "OK",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      showAlert("Erro ao cadastrar", error?.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Cadastre-se para acompanhar seus pedidos com mais facilidade.
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

          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite novamente sua senha"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.aceiteLinha}
            onPress={() => setAceitouTermos((valor) => !valor)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, aceitouTermos && styles.checkboxAtivo]}>
              {aceitouTermos ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : null}
            </View>
            <Text style={styles.aceiteTexto}>
              Li e aceito os Termos de Uso e a Politica de Privacidade.
            </Text>
          </TouchableOpacity>

          <View style={styles.linksLegais}>
            <TouchableOpacity onPress={() => router.push("/termos" as any)}>
              <Text style={styles.linkLegal}>Termos de Uso</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/privacidade" as any)}>
              <Text style={styles.linkLegal}>Privacidade</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.link}>Ja tem conta? Faca login</Text>
          </TouchableOpacity>
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
    marginBottom: 14,
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
  link: {
    textAlign: "center",
    color: "#1b5e20",
    fontWeight: "700",
    fontSize: 14,
  },
  aceiteLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 2,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b7d4bb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxAtivo: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },
  aceiteTexto: {
    flex: 1,
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  linksLegais: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  linkLegal: {
    color: "#1b5e20",
    fontSize: 13,
    fontWeight: "800",
  },
});
