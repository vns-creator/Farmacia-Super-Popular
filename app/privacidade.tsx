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
import { farmaciaInfo } from "../constants/farmacia";
import { legalInfo } from "../constants/legal";

export default function PrivacidadeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Privacidade</Text>
        <View style={styles.espacoDireita} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitulo}>Politica de Privacidade</Text>
          <Text style={styles.heroTexto}>
            {farmaciaInfo.nome} - ultima atualizacao:{" "}
            {legalInfo.ultimaAtualizacao}
          </Text>
        </View>

        {legalInfo.politicaPrivacidade.map((secao) => (
          <View key={secao.titulo} style={styles.card}>
            <Text style={styles.cardTitulo}>{secao.titulo}</Text>
            <Text style={styles.cardTexto}>{secao.texto}</Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Contato de privacidade</Text>
          <Text style={styles.cardTexto}>{legalInfo.contatoPrivacidade}</Text>
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
    padding: 16,
    marginBottom: 14,
  },
  heroTitulo: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroTexto: { color: "#dff0e1", fontSize: 13, lineHeight: 19, marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 14,
    marginBottom: 12,
  },
  cardTitulo: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardTexto: { color: "#4b5563", fontSize: 14, lineHeight: 20 },
});
