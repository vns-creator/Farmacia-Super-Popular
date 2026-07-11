import { StyleSheet, Text, View } from "react-native";
import { filiais } from "../constants/filiais";
import {
  getResumoFiliaisProduto,
  normalizarFilialIdsProduto,
} from "../services/productAvailability";

type ProductFilialAvailabilityProps = {
  filialId?: string | null;
  filialIds?: string[];
};

export function ProductFilialAvailability({
  filialId,
  filialIds,
}: ProductFilialAvailabilityProps) {
  const filialIdsNormalizados = normalizarFilialIdsProduto({ filialId, filialIds });
  const disponiveis = new Set(
    filialIdsNormalizados.length > 0
      ? filialIdsNormalizados
      : filiais.map((filial) => filial.id),
  );
  const texto = getResumoFiliaisProduto({ filialId, filialIds }, { curto: true });

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Produto disponível em ${texto}`}
    >
      <View style={styles.barra}>
        {filiais.map((filial) => {
          const disponivel = disponiveis.has(filial.id);

          return (
            <View
              key={filial.id}
              style={[
                styles.segmento,
                disponivel ? styles.segmentoAtivo : styles.segmentoInativo,
              ]}
            />
          );
        })}
      </View>

      <Text style={styles.texto} numberOfLines={2}>
        {texto || "Sem filial vinculada"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  barra: {
    flexDirection: "row",
    gap: 3,
    height: 6,
  },
  segmento: {
    flex: 1,
    borderRadius: 999,
  },
  segmentoAtivo: {
    backgroundColor: "#2e7d32",
  },
  segmentoInativo: {
    backgroundColor: "#dfe7e1",
  },
  texto: {
    color: "#4b6350",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: 4,
  },
});
