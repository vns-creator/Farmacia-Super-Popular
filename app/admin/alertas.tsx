import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { alertasIniciais } from "@/constants/alertasIniciais";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import {
  ALERTA_GERAL_ID,
  type AlertaSanitario,
  useAlertasSanitarios,
} from "@/services/alertasSanitarios";
import {
  buscarMedicamentosAnvisaPorNome,
  type MedicamentoAnvisa,
} from "@/services/anvisaBulario";

const ANVISA_BULA_FUNCTION_URL =
  "https://us-central1-farmaciasp-app.cloudfunctions.net/abrirBulaAnvisa";

function getUrlBulaAnvisa(numeroProcesso: string) {
  return `${ANVISA_BULA_FUNCTION_URL}?numeroProcesso=${numeroProcesso}`;
}

const alertaInicialForm = {
  id: "",
  principioAtivo: "",
  mensagem: "",
  ativo: true,
  alertas: [] as string[],
  contraindicacoes: [] as string[],
  revisado: false,
  fonte: "",
};

export default function AdminAlertasScreen() {
  const router = useRouter();
  const { perfil } = useAuth();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral =
    isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const { alertas, loading } = useAlertasSanitarios();
  const [form, setForm] = useState(alertaInicialForm);
  const [novoAlerta, setNovoAlerta] = useState("");
  const [novaContraindicacao, setNovaContraindicacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [buscaAnvisa, setBuscaAnvisa] = useState("");
  const [resultadosAnvisa, setResultadosAnvisa] = useState<MedicamentoAnvisa[]>(
    [],
  );
  const [buscandoAnvisa, setBuscandoAnvisa] = useState(false);
  const [buscaAnvisaFeita, setBuscaAnvisaFeita] = useState(false);
  const [mensagemGeral, setMensagemGeral] = useState("");
  const [ativoGeral, setAtivoGeral] = useState(true);
  const [salvandoGeral, setSalvandoGeral] = useState(false);
  const geralCarregadoRef = useRef(false);

  const regrasEspecificas = alertas.filter(
    (alerta) => alerta.id !== ALERTA_GERAL_ID,
  );

  useEffect(() => {
    if (geralCarregadoRef.current) return;

    const geral = alertas.find((alerta) => alerta.id === ALERTA_GERAL_ID);

    if (geral) {
      setMensagemGeral(geral.mensagem);
      setAtivoGeral(geral.ativo);
      geralCarregadoRef.current = true;
    }
  }, [alertas]);

  const limparForm = () => {
    setForm(alertaInicialForm);
    setNovoAlerta("");
    setNovaContraindicacao("");
  };

  const editarAlerta = (alerta: AlertaSanitario) => {
    setForm({
      id: alerta.id,
      principioAtivo: alerta.principioAtivo,
      mensagem: alerta.mensagem,
      ativo: alerta.ativo,
      alertas: alerta.alertas || [],
      contraindicacoes: alerta.contraindicacoes || [],
      revisado: alerta.revisado === true,
      fonte: alerta.fonte || "",
    });
    setNovoAlerta("");
    setNovaContraindicacao("");
  };

  const adicionarAlerta = () => {
    const valor = novoAlerta.trim();
    if (!valor) return;

    setForm((prev) => {
      if (prev.alertas.length >= 6) return prev;
      if (prev.alertas.some((item) => item.toLowerCase() === valor.toLowerCase())) {
        return prev;
      }
      return { ...prev, alertas: [...prev.alertas, valor] };
    });
    setNovoAlerta("");
  };

  const removerAlerta = (index: number) => {
    setForm((prev) => ({
      ...prev,
      alertas: prev.alertas.filter((_, i) => i !== index),
    }));
  };

  const adicionarContraindicacao = () => {
    const valor = novaContraindicacao.trim();
    if (!valor) return;

    setForm((prev) => {
      if (
        prev.contraindicacoes.some(
          (item) => item.toLowerCase() === valor.toLowerCase(),
        )
      ) {
        return prev;
      }
      return { ...prev, contraindicacoes: [...prev.contraindicacoes, valor] };
    });
    setNovaContraindicacao("");
  };

  const removerContraindicacao = (index: number) => {
    setForm((prev) => ({
      ...prev,
      contraindicacoes: prev.contraindicacoes.filter((_, i) => i !== index),
    }));
  };

  const salvarAlerta = async () => {
    if (!form.principioAtivo.trim()) {
      showAlert("Informe o principio ativo", "Digite o principio ativo da regra.");
      return;
    }

    if (!form.mensagem.trim()) {
      showAlert("Informe a mensagem", "Digite o texto do alerta.");
      return;
    }

    if (form.revisado && form.alertas.length === 0) {
      showAlert(
        "Adicione os alertas principais",
        "Antes de marcar como revisado, cadastre pelo menos 1 alerta que sera exibido ao cliente na pagina de Medicamentos.",
      );
      return;
    }

    const dados = {
      principioAtivo: form.principioAtivo.trim(),
      mensagem: form.mensagem.trim(),
      ativo: form.ativo,
      alertas: form.alertas,
      contraindicacoes: form.contraindicacoes,
      revisado: form.revisado,
      fonte: form.fonte.trim(),
      atualizadoEm: serverTimestamp(),
    };

    try {
      setSalvando(true);

      if (form.id) {
        await updateDoc(doc(db, "alertasSanitarios", form.id), dados);
      } else {
        await addDoc(collection(db, "alertasSanitarios"), {
          ...dados,
          criadoEm: serverTimestamp(),
        });
      }

      limparForm();
    } catch (error) {
      console.error("Erro ao salvar alerta sanitario:", error);
      showAlert("Erro", "Nao foi possivel salvar o alerta.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (alerta: AlertaSanitario) => {
    try {
      await updateDoc(doc(db, "alertasSanitarios", alerta.id), {
        ativo: !alerta.ativo,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar alerta sanitario:", error);
      showAlert("Erro", "Nao foi possivel atualizar o alerta.");
    }
  };

  const excluirAlertaConfirmado = async (alerta: AlertaSanitario) => {
    try {
      await deleteDoc(doc(db, "alertasSanitarios", alerta.id));

      if (form.id === alerta.id) {
        limparForm();
      }
    } catch (error) {
      console.error("Erro ao excluir alerta sanitario:", error);
      showAlert("Erro", "Nao foi possivel excluir o alerta.");
    }
  };

  const excluirAlerta = (alerta: AlertaSanitario) => {
    showAlert(
      "Excluir alerta",
      `A regra para "${alerta.principioAtivo}" sera excluida permanentemente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirAlertaConfirmado(alerta),
        },
      ],
    );
  };

  const salvarAlertaGeral = async () => {
    if (!mensagemGeral.trim()) {
      showAlert("Informe a mensagem", "Digite o texto do alerta geral.");
      return;
    }

    try {
      setSalvandoGeral(true);
      await setDoc(
        doc(db, "alertasSanitarios", ALERTA_GERAL_ID),
        {
          principioAtivo: "",
          mensagem: mensagemGeral.trim(),
          ativo: ativoGeral,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Erro ao salvar alerta geral:", error);
      showAlert("Erro", "Nao foi possivel salvar o alerta geral.");
    } finally {
      setSalvandoGeral(false);
    }
  };

  const buscarNoAnvisa = async () => {
    const termo = buscaAnvisa.trim();

    if (!termo) return;

    try {
      setBuscandoAnvisa(true);
      const resultados = await buscarMedicamentosAnvisaPorNome(termo);
      setResultadosAnvisa(resultados);
      setBuscaAnvisaFeita(true);
    } catch (error) {
      console.error("Erro ao consultar medicamentosAnvisa:", error);
      showAlert(
        "Erro na consulta",
        "Nao foi possivel consultar o Bulario sincronizado agora.",
      );
    } finally {
      setBuscandoAnvisa(false);
    }
  };

  const usarPrincipioAtivoDaAnvisa = (medicamento: MedicamentoAnvisa) => {
    setForm((prev) => ({ ...prev, principioAtivo: medicamento.nomeProduto }));
  };

  const importarExemplo = async () => {
    try {
      setImportando(true);

      await Promise.all(
        alertasIniciais.map((alerta) =>
          addDoc(collection(db, "alertasSanitarios"), {
            principioAtivo: alerta.principioAtivo,
            mensagem: alerta.mensagem,
            ativo: true,
            alertas: alerta.alertas,
            contraindicacoes: alerta.contraindicacoes,
            revisado: alerta.revisado,
            fonte: alerta.fonte,
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp(),
          }),
        ),
      );
    } catch (error) {
      console.error("Erro ao importar alertas de exemplo:", error);
      showAlert("Erro", "Nao foi possivel importar o alerta de exemplo.");
    } finally {
      setImportando(false);
    }
  };

  if (!isAdminGeral) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={48} color="#1b5e20" />
          <Text style={styles.titulo}>Acesso restrito</Text>
          <Text style={styles.subtitulo}>
            Somente o admin geral configura os alertas sanitarios.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <View style={styles.headerTexto}>
          <Text style={styles.titulo}>Alertas sanitarios</Text>
          <Text style={styles.subtitulo}>
            Mensagens exibidas no carrinho por principio ativo
          </Text>
        </View>
      </View>

      <FlatList
        data={regrasEspecificas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.alertaCard}>
            <View style={styles.alertaCardTexto}>
              <Text style={styles.alertaCardPrincipio}>
                {item.principioAtivo}
              </Text>
              <Text style={styles.alertaCardMensagem}>{item.mensagem}</Text>
              <Text style={styles.alertaCardMensagem}>
                {item.alertas.length} alerta(s) - {item.contraindicacoes.length}{" "}
                contraindicacao(oes)
              </Text>
              <View
                style={[
                  styles.badgeRevisado,
                  item.revisado
                    ? styles.badgeRevisadoAtivo
                    : styles.badgeRevisadoInativo,
                ]}
              >
                <Text
                  style={[
                    styles.badgeRevisadoTexto,
                    item.revisado
                      ? styles.badgeRevisadoTextoAtivo
                      : styles.badgeRevisadoTextoInativo,
                  ]}
                >
                  {item.revisado ? "REVISADO" : "RASCUNHO"}
                </Text>
              </View>
            </View>
            <View style={styles.alertaCardAcoes}>
              <Chip
                label={item.ativo ? "Ativo" : "Inativo"}
                active={item.ativo}
                onPress={() => alternarAtivo(item)}
              />
              <TouchableOpacity
                style={styles.iconeBotao}
                onPress={() => editarAlerta(item)}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#1b5e20" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconeBotaoExcluir}
                onPress={() => excluirAlerta(item)}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={18} color="#b91c1c" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.formCard}>
              <Text style={styles.formTitulo}>Alerta geral</Text>
              <Text style={styles.ajudaTexto}>
                Exibido para qualquer medicamento no carrinho cujo principio
                ativo nao bata com nenhuma regra especifica abaixo.
              </Text>

              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={mensagemGeral}
                onChangeText={setMensagemGeral}
                placeholder="Ex.: Consulte a bula ou um farmaceutico antes de usar este medicamento."
                placeholderTextColor="#8a978f"
                multiline
              />

              <View style={styles.chips}>
                <Chip
                  label={ativoGeral ? "Ativo" : "Inativo"}
                  active={ativoGeral}
                  onPress={() => setAtivoGeral((prev) => !prev)}
                />
              </View>

              <TouchableOpacity
                style={[styles.salvarBotao, salvandoGeral && styles.botaoDesativado]}
                onPress={salvarAlertaGeral}
                disabled={salvandoGeral}
                activeOpacity={0.9}
              >
                {salvandoGeral ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="save-outline" size={18} color="#fff" />
                )}
                <Text style={styles.salvarBotaoTexto}>Salvar alerta geral</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitulo}>Consultar Bulario ANVISA</Text>
              <Text style={styles.ajudaTexto}>
                Pesquisa pelo nome comercial na base sincronizada da ANVISA
                (medicamentosAnvisa), pra conferir a empresa e a situacao do
                registro antes de preencher os alertas abaixo.
              </Text>

              <View style={styles.itemInputLinha}>
                <TextInput
                  style={[styles.input, styles.itemInput]}
                  value={buscaAnvisa}
                  onChangeText={setBuscaAnvisa}
                  onSubmitEditing={buscarNoAnvisa}
                  placeholder="Ex.: Dipirona Monoidratada"
                  placeholderTextColor="#8a978f"
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={styles.itemAdicionarBotao}
                  onPress={buscarNoAnvisa}
                  activeOpacity={0.85}
                  disabled={buscandoAnvisa}
                >
                  {buscandoAnvisa ? (
                    <ActivityIndicator size="small" color="#1b5e20" />
                  ) : (
                    <Ionicons name="search" size={20} color="#1b5e20" />
                  )}
                </TouchableOpacity>
              </View>

              {buscaAnvisaFeita && !buscandoAnvisa ? (
                resultadosAnvisa.length === 0 ? (
                  <Text style={styles.ajudaTexto}>
                    Nada encontrado. A sincronizacao com a ANVISA pode ainda
                    estar em andamento (roda aos poucos, em segundo plano).
                  </Text>
                ) : (
                  <View style={styles.itemLista}>
                    {resultadosAnvisa.map((medicamento) => (
                      <View
                        key={medicamento.numeroProcesso}
                        style={styles.anvisaResultadoCard}
                      >
                        <TouchableOpacity
                          style={styles.anvisaResultadoLinha}
                          onPress={() => usarPrincipioAtivoDaAnvisa(medicamento)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.anvisaResultadoTextoArea}>
                            <Text style={styles.anvisaResultadoNome}>
                              {medicamento.nomeProduto}
                            </Text>
                            <Text style={styles.anvisaResultadoDetalhe}>
                              {medicamento.empresa || "Empresa nao informada"} -{" "}
                              {medicamento.situacaoRegistro ||
                                "Situacao nao informada"}
                            </Text>
                            <Text style={styles.anvisaResultadoDetalhe}>
                              Processo: {medicamento.numeroProcesso}
                            </Text>
                          </View>
                          <Ionicons
                            name="arrow-redo-outline"
                            size={18}
                            color="#1b5e20"
                          />
                        </TouchableOpacity>

                        <Text style={styles.anvisaLinkLabel}>
                          Link pronto para colar em &quot;Link da bula&quot; do
                          produto:
                        </Text>
                        <TextInput
                          style={styles.anvisaLinkInput}
                          value={getUrlBulaAnvisa(medicamento.numeroProcesso)}
                          editable={false}
                          selectTextOnFocus
                          multiline
                        />
                      </View>
                    ))}
                  </View>
                )
              ) : null}
            </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitulo}>
              {form.id ? "Editar regra" : "Nova regra"}
            </Text>

            {regrasEspecificas.length === 0 ? (
              <TouchableOpacity
                style={[styles.importarBotao, importando && styles.botaoDesativado]}
                onPress={importarExemplo}
                disabled={importando}
                activeOpacity={0.9}
              >
                {importando ? (
                  <ActivityIndicator size="small" color="#1f2937" />
                ) : (
                  <Ionicons name="cloud-download-outline" size={18} color="#1f2937" />
                )}
                <Text style={styles.importarBotaoTexto}>
                  Importar rascunhos dos principais MIPs ({alertasIniciais.length})
                </Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.label}>Principio ativo</Text>
            <TextInput
              style={styles.input}
              value={form.principioAtivo}
              onChangeText={(principioAtivo) =>
                setForm((prev) => ({ ...prev, principioAtivo }))
              }
              placeholder="Ex.: Ibuprofeno"
              placeholderTextColor="#8a978f"
            />

            <Text style={styles.label}>Mensagem do alerta (exibida no carrinho)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={form.mensagem}
              onChangeText={(mensagem) =>
                setForm((prev) => ({ ...prev, mensagem }))
              }
              placeholder="Ex.: Nao usar em caso de suspeita de dengue."
              placeholderTextColor="#8a978f"
              multiline
            />

            <Text style={styles.label}>
              Alertas principais na pagina de Medicamentos ({form.alertas.length}/6)
            </Text>
            <Text style={styles.ajudaTexto}>
              Cadastre de 3 a 6 alertas curtos. So sao exibidos ao cliente
              quando a regra estiver marcada como revisada.
            </Text>
            <View style={styles.itemInputLinha}>
              <TextInput
                style={[styles.input, styles.itemInput]}
                value={novoAlerta}
                onChangeText={setNovoAlerta}
                onSubmitEditing={adicionarAlerta}
                placeholder="Ex.: Nao usar em caso de suspeita de dengue."
                placeholderTextColor="#8a978f"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.itemAdicionarBotao}
                onPress={adicionarAlerta}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={20} color="#1b5e20" />
              </TouchableOpacity>
            </View>
            {form.alertas.length > 0 ? (
              <View style={styles.itemLista}>
                {form.alertas.map((alerta, index) => (
                  <View key={`alerta-${index}`} style={styles.itemLinha}>
                    <Text style={styles.itemTexto}>{alerta}</Text>
                    <TouchableOpacity onPress={() => removerAlerta(index)}>
                      <Ionicons name="close" size={16} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>Contraindicacoes</Text>
            <View style={styles.itemInputLinha}>
              <TextInput
                style={[styles.input, styles.itemInput]}
                value={novaContraindicacao}
                onChangeText={setNovaContraindicacao}
                onSubmitEditing={adicionarContraindicacao}
                placeholder="Ex.: Ulcera gastrica ativa."
                placeholderTextColor="#8a978f"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.itemAdicionarBotao}
                onPress={adicionarContraindicacao}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={20} color="#1b5e20" />
              </TouchableOpacity>
            </View>
            {form.contraindicacoes.length > 0 ? (
              <View style={styles.itemLista}>
                {form.contraindicacoes.map((item, index) => (
                  <View key={`contra-${index}`} style={styles.itemLinha}>
                    <Text style={styles.itemTexto}>{item}</Text>
                    <TouchableOpacity onPress={() => removerContraindicacao(index)}>
                      <Ionicons name="close" size={16} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>Fonte</Text>
            <TextInput
              style={styles.input}
              value={form.fonte}
              onChangeText={(fonte) => setForm((prev) => ({ ...prev, fonte }))}
              placeholder="Ex.: Bulario Eletronico da ANVISA"
              placeholderTextColor="#8a978f"
            />

            <View style={styles.chips}>
              <Chip
                label={form.ativo ? "Ativo" : "Inativo"}
                active={form.ativo}
                onPress={() =>
                  setForm((prev) => ({ ...prev, ativo: !prev.ativo }))
                }
              />
              <Chip
                label={form.revisado ? "Revisado" : "Rascunho"}
                active={form.revisado}
                onPress={() =>
                  setForm((prev) => ({ ...prev, revisado: !prev.revisado }))
                }
              />
            </View>
            {!form.revisado ? (
              <Text style={styles.avisoTexto}>
                Enquanto estiver como &quot;Rascunho&quot;, os alertas nao aparecem
                para o cliente na pagina de Medicamentos.
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.salvarBotao, salvando && styles.botaoDesativado]}
              onPress={salvarAlerta}
              disabled={salvando}
              activeOpacity={0.9}
            >
              {salvando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#fff" />
              )}
              <Text style={styles.salvarBotaoTexto}>
                {form.id ? "Salvar alteracoes" : "Adicionar regra"}
              </Text>
            </TouchableOpacity>

            {form.id ? (
              <TouchableOpacity style={styles.cancelarBotao} onPress={limparForm}>
                <Text style={styles.cancelarBotaoTexto}>Cancelar edicao</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.resultadoTexto}>
              {regrasEspecificas.length}{" "}
              {regrasEspecificas.length === 1 ? "regra" : "regras"} cadastrada(s)
            </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            {loading ? (
              <ActivityIndicator size="large" color="#1b5e20" />
            ) : (
              <>
                <Ionicons name="alert-circle-outline" size={48} color="#1b5e20" />
                <Text style={styles.emptyTexto}>Nenhum alerta cadastrado.</Text>
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.lista}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipAtivo]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.chipTexto, active && styles.chipTextoAtivo]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f8f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  headerTexto: { flex: 1 },
  titulo: { color: "#1b5e20", fontSize: 22, fontWeight: "800" },
  subtitulo: { color: "#6b7280", fontSize: 13, fontWeight: "700", marginTop: 3 },
  lista: { padding: 16, paddingTop: 0, paddingBottom: 30 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },
  formTitulo: { fontSize: 16, fontWeight: "800", color: "#1f2937", marginBottom: 12 },
  ajudaTexto: { fontSize: 12, color: "#6b7280", marginBottom: 12, lineHeight: 17 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: "#f4f8f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chips: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f4f8f5",
    borderWidth: 1,
    borderColor: "#e0e7e2",
  },
  chipAtivo: { backgroundColor: "#1b5e20", borderColor: "#1b5e20" },
  chipTexto: { fontSize: 12, fontWeight: "700", color: "#374151" },
  chipTextoAtivo: { color: "#fff" },
  importarBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  importarBotaoTexto: { color: "#1f2937", fontWeight: "700", fontSize: 13 },
  botaoDesativado: { opacity: 0.6 },
  salvarBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1b5e20",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  salvarBotaoTexto: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cancelarBotao: { alignItems: "center", paddingVertical: 12 },
  cancelarBotaoTexto: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
  resultadoTexto: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 12,
    textAlign: "center",
  },
  alertaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  alertaCardTexto: { flex: 1 },
  alertaCardPrincipio: { fontSize: 15, fontWeight: "800", color: "#1f2937" },
  alertaCardMensagem: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  alertaCardAcoes: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconeBotao: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconeBotaoExcluir: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTexto: { color: "#6b7280", fontSize: 14, textAlign: "center" },
  itemInputLinha: { flexDirection: "row", gap: 8, alignItems: "center" },
  itemInput: { flex: 1 },
  itemAdicionarBotao: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  itemLista: { gap: 6, marginTop: 8 },
  itemLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#f4f8f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  itemTexto: { flex: 1, fontSize: 12, color: "#374151", fontWeight: "600" },
  avisoTexto: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  badgeRevisado: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  badgeRevisadoAtivo: { backgroundColor: "#e8f5e9" },
  badgeRevisadoInativo: { backgroundColor: "#fef3c7" },
  badgeRevisadoTexto: { fontSize: 10, fontWeight: "800" },
  badgeRevisadoTextoAtivo: { color: "#1b5e20" },
  badgeRevisadoTextoInativo: { color: "#92400e" },
  anvisaResultadoLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#f4f8f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  anvisaResultadoTextoArea: { flex: 1 },
  anvisaResultadoNome: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
  },
  anvisaResultadoDetalhe: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  anvisaResultadoCard: { gap: 6 },
  anvisaLinkLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "700",
  },
  anvisaLinkInput: {
    backgroundColor: "#f8faf8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#edf2ee",
    color: "#1b5e20",
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
