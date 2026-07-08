import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCarrinho } from "../context/CarContext";

type ProdutoComTamanhos = {
  id: string;
  nome: string;
  preco: number;
  tamanhos?: string[];
  controlarEstoque?: boolean;
  estoque?: number;
  estoquePorTamanho?: Record<string, number>;
};

type SeletorTamanhoModalProps = {
  produto: ProdutoComTamanhos | null;
  onClose: () => void;
};

export function SeletorTamanhoModal({
  produto,
  onClose,
}: SeletorTamanhoModalProps) {
  const { adicionarAoCarrinho, removerUmaUnidade, obterQuantidade } =
    useCarrinho();

  const visivel = !!produto;
  const tamanhos = produto?.tamanhos || [];
  const controlaEstoque = produto?.controlarEstoque === true;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.folha}>
          <View style={styles.cabecalho}>
            <View style={styles.cabecalhoTexto}>
              <Text style={styles.titulo}>Escolha o tamanho</Text>
              {produto ? <Text style={styles.subtitulo}>{produto.nome}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.fechar}>
              <Ionicons name="close" size={22} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {tamanhos.map((tamanho) => {
            const quantidade = produto
              ? obterQuantidade(produto.id, tamanho)
              : 0;
            const estoqueTamanho = Number(
              produto?.estoquePorTamanho?.[tamanho] || 0,
            );
            const semEstoque = controlaEstoque && estoqueTamanho <= 0;
            const atingiuEstoque =
              controlaEstoque && quantidade >= estoqueTamanho;

            return (
              <View key={tamanho} style={styles.linha}>
                <View>
                  <Text style={styles.tamanhoNome}>{tamanho}</Text>
                  {controlaEstoque ? (
                    <Text style={styles.tamanhoEstoqueTexto}>
                      {semEstoque
                        ? "Sem estoque"
                        : `${estoqueTamanho} em estoque`}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[
                      styles.botaoStepper,
                      quantidade === 0 && styles.botaoStepperDesativado,
                    ]}
                    onPress={() =>
                      produto && removerUmaUnidade(produto.id, tamanho)
                    }
                    disabled={quantidade === 0}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color={quantidade === 0 ? "#8fa393" : "#1b5e20"}
                    />
                  </TouchableOpacity>

                  <Text style={styles.quantidadeTexto}>{quantidade}</Text>

                  <TouchableOpacity
                    style={[
                      styles.botaoStepperMais,
                      atingiuEstoque && styles.botaoStepperDesativado,
                    ]}
                    onPress={() =>
                      produto && adicionarAoCarrinho(produto, tamanho)
                    }
                    disabled={atingiuEstoque}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={atingiuEstoque ? "#8fa393" : "#fff"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.concluirBotao} onPress={onClose}>
            <Text style={styles.concluirBotaoTexto}>Concluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  folha: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cabecalhoTexto: { flex: 1 },
  titulo: { fontSize: 18, fontWeight: "800", color: "#1f2937" },
  subtitulo: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  fechar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#f4f8f5",
    alignItems: "center",
    justifyContent: "center",
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  tamanhoNome: { fontSize: 15, fontWeight: "700", color: "#1f2937" },
  tamanhoEstoqueTexto: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botaoStepper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoStepperMais: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoStepperDesativado: {
    backgroundColor: "#edf2ee",
  },
  quantidadeTexto: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
    minWidth: 18,
    textAlign: "center",
  },
  concluirBotao: {
    marginTop: 16,
    backgroundColor: "#1b5e20",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  concluirBotaoTexto: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
