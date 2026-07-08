import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { farmaciaInfo } from "../constants/farmacia";

export default function FarmaciaScreen() {
  const router = useRouter();

  const abrirWhatsApp = (whatsapp: string, destino: string) => {
    const mensagem = encodeURIComponent(
      `Ola, gostaria de atendimento pelo WhatsApp ${destino}.`,
    );

    void Linking.openURL(`https://wa.me/${whatsapp}?text=${mensagem}`);
  };

  const ligar = (telefone: string) => {
    void Linking.openURL(`tel:${telefone.replace(/\D/g, "")}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Atendimento</Text>
        <View style={styles.espacoDireita} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="logo-whatsapp" size={34} color="#fff" />
          <Text style={styles.heroTitulo}>Fale com a farmacia</Text>
          <Text style={styles.heroTexto}>
            Escolha o atendimento central ou uma filial para tirar duvidas sobre
            manipulados, receitas, disponibilidade e medicamentos controlados.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Atendimento central</Text>
          <InfoLinha
            icon="medical-outline"
            label="Farmacia"
            value={farmaciaInfo.nome}
          />
          <InfoLinha
            icon="time-outline"
            label="Horario"
            value={farmaciaInfo.horario}
          />
          <InfoLinha icon="mail-outline" label="E-mail" value={farmaciaInfo.email} />
          <ContatoTelefone
            nome="Central da farmacia"
            telefone={farmaciaInfo.telefone}
            whatsapp={farmaciaInfo.whatsapp}
            onLigar={ligar}
            onWhatsApp={abrirWhatsApp}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Contatos por filial</Text>
          {farmaciaInfo.filiais.map((filial) => (
            <View key={filial.id} style={styles.contatoFilialCard}>
              <View style={styles.filialHeader}>
                <View style={styles.filialIcone}>
                  <Ionicons name="storefront-outline" size={19} color="#1b5e20" />
                </View>
                <View style={styles.filialTexto}>
                  <Text style={styles.filialNome}>{filial.nome}</Text>
                  <Text style={styles.filialEndereco}>{filial.endereco}</Text>
                </View>
              </View>

              <ContatoTelefone
                nome={filial.nome}
                telefone={filial.telefone}
                whatsapp={filial.whatsapp}
                onLigar={ligar}
                onWhatsApp={abrirWhatsApp}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Dados das filiais</Text>
          {farmaciaInfo.filiais.map((filial) => (
            <View key={filial.id} style={styles.filialCard}>
              <View style={styles.filialHeader}>
                <View style={styles.filialIcone}>
                  <Ionicons name="storefront-outline" size={19} color="#1b5e20" />
                </View>
                <View style={styles.filialTexto}>
                  <Text style={styles.filialNome}>{filial.nome}</Text>
                  <Text style={styles.filialEndereco}>{filial.endereco}</Text>
                </View>
              </View>

              <View style={styles.filialDetalhes}>
                <InfoLinha
                  icon="time-outline"
                  label="Horario"
                  value={filial.horario}
                />
                <InfoLinha
                  icon="business-outline"
                  label="Razao social"
                  value={filial.razaoSocial}
                />
                <InfoLinha
                  icon="document-text-outline"
                  label="CNPJ"
                  value={filial.cnpj}
                />
                <InfoLinha
                  icon="medkit-outline"
                  label="Responsavel tecnico"
                  value={filial.responsavelTecnico}
                />
                <InfoLinha
                  icon="shield-checkmark-outline"
                  label="CRF"
                  value={filial.crf}
                />
                <InfoLinha icon="ribbon-outline" label="AFE" value={filial.afe} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Documentos</Text>
          <TouchableOpacity
            style={styles.documentoLinha}
            onPress={() => router.push("/termos" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.documentoTexto}>Termos de uso</Text>
            <Ionicons name="chevron-forward" size={18} color="#1b5e20" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.documentoLinha}
            onPress={() => router.push("/privacidade" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.documentoTexto}>Politica de privacidade</Text>
            <Ionicons name="chevron-forward" size={18} color="#1b5e20" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContatoTelefone({
  nome,
  telefone,
  whatsapp,
  onLigar,
  onWhatsApp,
}: {
  nome: string;
  telefone: string;
  whatsapp: string;
  onLigar: (telefone: string) => void;
  onWhatsApp: (whatsapp: string, destino: string) => void;
}) {
  return (
    <View style={styles.contatoLinha}>
      <View style={styles.contatoInfo}>
        <Text style={styles.infoLabel}>Telefone</Text>
        <Text style={styles.infoValor}>{telefone}</Text>
      </View>

      <View style={styles.contatoAcoes}>
        <TouchableOpacity
          style={styles.botaoIconeSecundario}
          onPress={() => onLigar(telefone)}
          activeOpacity={0.85}
        >
          <Ionicons name="call-outline" size={18} color="#1b5e20" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoWhatsApp}
          onPress={() => onWhatsApp(whatsapp, nome)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.botaoWhatsAppTexto}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoLinha({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoLinha}>
      <View style={styles.infoIcone}>
        <Ionicons name={icon} size={18} color="#1b5e20" />
      </View>
      <View style={styles.infoTexto}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValor}>{value}</Text>
      </View>
    </View>
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
  },
  titulo: {
    flex: 1,
    textAlign: "center",
    color: "#1b5e20",
    fontSize: 22,
    fontWeight: "800",
  },
  espacoDireita: { width: 44 },
  content: { padding: 16, paddingBottom: 32 },
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
  infoLinha: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  infoIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoTexto: { flex: 1 },
  infoLabel: { color: "#6b7280", fontSize: 12, fontWeight: "800" },
  infoValor: { color: "#1f2937", fontSize: 14, lineHeight: 20, marginTop: 2 },
  contatoLinha: {
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginTop: 4,
    gap: 10,
  },
  contatoInfo: { flex: 1 },
  contatoAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botaoIconeSecundario: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoWhatsApp: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#1b5e20",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  botaoWhatsAppTexto: { color: "#fff", fontSize: 14, fontWeight: "800" },
  contatoFilialCard: {
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginBottom: 12,
  },
  filialCard: {
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginBottom: 12,
  },
  filialHeader: { flexDirection: "row", gap: 10, marginBottom: 12 },
  filialIcone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  filialTexto: { flex: 1 },
  filialNome: { color: "#1f2937", fontSize: 14, fontWeight: "800" },
  filialEndereco: { color: "#6b7280", fontSize: 13, lineHeight: 18, marginTop: 3 },
  filialDetalhes: {
    borderTopWidth: 1,
    borderTopColor: "#edf2ee",
    paddingTop: 10,
  },
  documentoLinha: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  documentoTexto: { color: "#1b5e20", fontSize: 14, fontWeight: "800" },
});
