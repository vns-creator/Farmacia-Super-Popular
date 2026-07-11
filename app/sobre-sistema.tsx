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
import { sistemaInfo } from "../constants/sistema";

export default function SobreSistemaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Sobre o sistema</Text>
        <View style={styles.espacoDireita} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="cube-outline" size={34} color="#fff" />
          <Text style={styles.heroTitulo}>{sistemaInfo.nome}</Text>
          <Text style={styles.heroTexto}>{sistemaInfo.resumo}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Recursos principais</Text>
          {sistemaInfo.recursos.map((recurso) => (
            <View key={recurso.titulo} style={styles.recursoLinha}>
              <View style={styles.recursoIcone}>
                <Ionicons name="checkmark" size={16} color="#1b5e20" />
              </View>
              <View style={styles.recursoTextoArea}>
                <Text style={styles.recursoTitulo}>{recurso.titulo}</Text>
                <Text style={styles.recursoTexto}>{recurso.descricao}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Roteiro de demonstração</Text>
          {sistemaInfo.roteiro.map((passo, index) => (
            <View key={passo} style={styles.passoLinha}>
              <Text style={styles.passoNumero}>{index + 1}</Text>
              <Text style={styles.passoTexto}>{passo}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f8f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
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
  titulo: {
    flex: 1,
    textAlign: "center",
    color: "#1b5e20",
    fontSize: 22,
    fontWeight: "800",
  },
  espacoDireita: { width: 44 },
  content: { padding: 16, paddingBottom: 34 },
  hero: {
    backgroundColor: "#1b5e20",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  heroTitulo: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 10 },
  heroTexto: { color: "#dff0e1", fontSize: 14, lineHeight: 20, marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 16,
    marginBottom: 14,
  },
  cardTitulo: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  recursoLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  recursoIcone: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  recursoTextoArea: { flex: 1 },
  recursoTitulo: { color: "#1f2937", fontSize: 14, fontWeight: "800" },
  recursoTexto: { color: "#4b5563", fontSize: 13, lineHeight: 18, marginTop: 3 },
  passoLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  passoNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1b5e20",
    color: "#fff",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 28,
  },
  passoTexto: { flex: 1, color: "#374151", fontSize: 14, lineHeight: 20 },
});
