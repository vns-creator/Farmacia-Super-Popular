import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { filiais } from "../constants/filiais";
import { useFilial } from "../context/FilialContext";
import { useCarrinho } from "../context/CarContext";

export function FilialSelector() {
  const { filialId, filialNome, setFilialId } = useFilial();
  const { carrinho, limparCarrinho } = useCarrinho();

  const selecionarFilial = (novoFilialId: string | null) => {
    if (novoFilialId === filialId) return;

    if (carrinho.length > 0) {
      showAlert(
        "Trocar filial",
        "Ao trocar a filial, o carrinho sera limpo para evitar produtos indisponiveis.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Trocar",
            style: "destructive",
            onPress: () => {
              limparCarrinho();
              setFilialId(novoFilialId);
            },
          },
        ],
      );
      return;
    }

    setFilialId(novoFilialId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <Ionicons name="storefront-outline" size={18} color="#1b5e20" />
        <View style={styles.textoArea}>
          <Text style={styles.label}>Catalogo filtrado por filial</Text>
          <Text style={styles.valor}>{filialNome}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <TouchableOpacity
          style={[styles.chip, filialId === null && styles.chipAtivo]}
          onPress={() => selecionarFilial(null)}
          activeOpacity={0.85}
        >
          <Text style={[styles.chipTexto, filialId === null && styles.chipTextoAtivo]}>
            Todas
          </Text>
        </TouchableOpacity>

        {filiais.map((filial) => {
          const ativo = filialId === filial.id;

          return (
            <TouchableOpacity
              key={filial.id}
              style={[styles.chip, ativo && styles.chipAtivo]}
              onPress={() => selecionarFilial(filial.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                {filial.nome.replace("Filial ", "")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginBottom: 14,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  textoArea: { flex: 1 },
  label: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "800",
  },
  valor: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  chips: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: "#fff",
  },
  chipAtivo: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },
  chipTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextoAtivo: {
    color: "#fff",
  },
});
