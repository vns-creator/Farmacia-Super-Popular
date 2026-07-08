import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";

export default function EditarDadosScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const clienteRef = doc(db, "clientesPorUid", user.uid);
      const clienteDoc = await getDoc(clienteRef);

      if (clienteDoc.exists()) {
        const dados = clienteDoc.data();
        setNome(String(dados.nome || ""));
        setTelefone(String(dados.telefone || ""));
        setEndereco(String(dados.endereco || ""));
        setNumero(String(dados.numero || ""));
        setBairro(String(dados.bairro || ""));
        setCidade(String(dados.cidade || ""));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error);
      showAlert("Erro", "Não foi possível carregar seus dados.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvar = async () => {
    if (!user) return;

    if (!nome || !telefone) {
      showAlert("Erro", "Preencha pelo menos nome e telefone.");
      return;
    }

    try {
      setSalvando(true);
      const dadosCliente = {
        uid: user.uid,
        email: user.email,
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        atualizadoEm: serverTimestamp(),
      };

      await Promise.all([
        setDoc(doc(db, "clientesPorUid", user.uid), dadosCliente, {
          merge: true,
        }),
        setDoc(
          doc(db, "usuarios", user.uid),
          {
            uid: user.uid,
            email: user.email,
            nome: nome.trim(),
            atualizadoEm: serverTimestamp(),
          },
          { merge: true },
        ),
      ]);

      showAlert("Sucesso", "Dados atualizados com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar dados do cliente:", error);
      showAlert("Erro", "Não foi possível salvar seus dados.");
    } finally {
      setSalvando(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.botaoVoltar}
          >
            <Ionicons name="arrow-back" size={24} color="#1b5e20" />
          </TouchableOpacity>
        </View>
        <Text style={styles.erro}>Você precisa estar logado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botaoVoltar}
        >
          <Ionicons name="arrow-back" size={24} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Editar Dados</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1b5e20" />
        </View>
      ) : (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="(XX) 9XXXX-XXXX"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Endereço</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua/Avenida"
          value={endereco}
          onChangeText={setEndereco}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Número</Text>
        <TextInput
          style={styles.input}
          placeholder="Número do endereço"
          value={numero}
          onChangeText={setNumero}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Bairro</Text>
        <TextInput
          style={styles.input}
          placeholder="Bairro"
          value={bairro}
          onChangeText={setBairro}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Cidade</Text>
        <TextInput
          style={styles.input}
          placeholder="Cidade"
          value={cidade}
          onChangeText={setCidade}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.botaoSalvar, salvando && styles.botaoDesativado]}
          onPress={handleSalvar}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          )}
          <Text style={styles.botaoSalvarTexto}>
            {salvando ? "Salvando..." : "Salvar dados"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoCancelar}
          onPress={() => router.back()}
        >
          <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f8",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f5f7f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  botaoVoltar: {
    padding: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b5e20",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  botaoSalvar: {
    backgroundColor: "#1b5e20",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 10,
    gap: 8,
  },
  botaoDesativado: {
    opacity: 0.75,
  },
  botaoSalvarTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  botaoCancelar: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  botaoCancelarTexto: {
    color: "#1b5e20",
    fontSize: 16,
    fontWeight: "700",
  },
  erro: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 50,
  },
});

