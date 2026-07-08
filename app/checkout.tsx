// app/checkout.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { buscarCoberturaEntrega } from "@/constants/entrega";
import { filiais, sugerirFilialPorCep } from "@/constants/filiais";
import { useAuth } from "@/context/AuthContext";
import { useCarrinho } from "@/context/CarContext";
import { useFilial } from "@/context/FilialContext";
import { db } from "@/firebaseConfig";
import {
  type FormaPagamento,
  formasPagamento,
  formasPagamentoLabels,
  getMetodoPagamentoOnline,
  pagamentoOnlineConfig,
  prepararPagamentoOnline,
} from "@/services/payments";
import { formatarMoeda } from "@/services/formatters";

type TipoAtendimento = "entrega" | "retirada";

type EnderecoSalvo = {
  id: string;
  apelido: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
};

const filiaisRetirada = filiais;

export default function CheckoutScreen() {
  const router = useRouter();
  const { carrinho, totalCarrinho, limparCarrinho } = useCarrinho();
  const { user } = useAuth();
  const { filialId: filialCatalogoId } = useFilial();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoAtendimento, setTipoAtendimento] =
    useState<TipoAtendimento>("entrega");
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoSalvo[]>([]);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState("");
  const [apelidoEndereco, setApelidoEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [complemento, setComplemento] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [pagamento, setPagamento] = useState<FormaPagamento>(
    formasPagamento.dinheiro,
  );
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState("");
  const [filialRetiradaId, setFilialRetiradaId] = useState(
    filialCatalogoId || filiaisRetirada[0].id,
  );
  const [filialSugeridaPorCep, setFilialSugeridaPorCep] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const opcoesPagamento = [
    { valor: formasPagamento.dinheiro, label: formasPagamentoLabels.Dinheiro },
    ...(pagamentoOnlineConfig.pixAtivo
      ? [{ valor: formasPagamento.pix, label: formasPagamentoLabels.Pix }]
      : []),
    ...(pagamentoOnlineConfig.cartaoAtivo
      ? [
          {
            valor: formasPagamento.cartaoOnline,
            label: formasPagamentoLabels["Cartao online"],
          },
        ]
      : []),
    {
      valor: formasPagamento.cartaoEntrega,
      label: formasPagamentoLabels["Cartao na entrega"],
    },
  ] satisfies { valor: FormaPagamento; label: string }[];
  const pagamentoLabel =
    opcoesPagamento.find((forma) => forma.valor === pagamento)?.label ||
    pagamento;

  const filialRetiradaSelecionada =
    filiaisRetirada.find((filial) => filial.id === filialRetiradaId) ||
    filiaisRetirada[0];
  const coberturaSelecionada = useMemo(
    () =>
      tipoAtendimento === "entrega"
        ? buscarCoberturaEntrega({ cep, bairro })
        : null,
    [bairro, cep, tipoAtendimento],
  );
  const taxaEntrega =
    tipoAtendimento === "entrega" ? coberturaSelecionada?.taxaEntrega || 0 : 0;
  const totalPedido = totalCarrinho + taxaEntrega;

  const carregarEnderecos = useCallback(async () => {
    if (!user) return;

    try {
      const ref = collection(db, "clientesPorUid", user.uid, "enderecos");
      const snapshot = await getDocs(ref);
      const enderecos = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as EnderecoSalvo,
      );

      setEnderecosSalvos(enderecos);
    } catch (error) {
      console.error("Erro ao carregar enderecos:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEnderecosSalvos([]);
      setEnderecoSelecionadoId("");
      return;
    }

    carregarEnderecos();
  }, [carregarEnderecos, user]);

  useEffect(() => {
    if (filialCatalogoId) {
      setFilialRetiradaId(filialCatalogoId);
    }
  }, [filialCatalogoId]);

  const preencherEndereco = (dados: EnderecoSalvo) => {
    setEnderecoSelecionadoId(dados.id);
    setApelidoEndereco(dados.apelido);
    setCep(dados.cep);
    setEndereco(dados.endereco);
    setNumero(dados.numero);
    setBairro(dados.bairro);
    setCidade(dados.cidade);
    setUf(dados.uf);
    setComplemento(dados.complemento || "");
    aplicarFilialSugerida(dados.cep, dados.bairro);
  };

  const limparFormularioEndereco = () => {
    setEnderecoSelecionadoId("");
    setApelidoEndereco("");
    setCep("");
    setEndereco("");
    setNumero("");
    setBairro("");
    setCidade("");
    setUf("");
    setComplemento("");
    setFilialSugeridaPorCep(false);
  };

  const aplicarFilialSugerida = (valorCep: string, valorBairro: string) => {
    const cobertura = buscarCoberturaEntrega({
      cep: valorCep,
      bairro: valorBairro,
    });
    const filialSugerida =
      cobertura?.filial || sugerirFilialPorCep(valorCep, valorBairro);

    if (!filialSugerida) {
      setFilialSugeridaPorCep(false);
      return;
    }

    setFilialRetiradaId(filialSugerida.id);
    setFilialSugeridaPorCep(true);
  };

  const buscarEnderecoPorCep = async (valorCep: string) => {
    const cepLimpo = valorCep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      setBuscandoCep(true);
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        showAlert("CEP não encontrado", "Confira o CEP informado.");
        return;
      }

      setEndereco(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
      aplicarFilialSugerida(valorCep, data.bairro || "");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      showAlert("Erro", "Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (valor: string) => {
    setCep(valor);
    aplicarFilialSugerida(valor, bairro);
    buscarEnderecoPorCep(valor);
  };

  const salvarEndereco = async () => {
    if (!user) {
      showAlert("Entre na sua conta", "Faça login para salvar endereços.");
      return;
    }

    if (!cep || !endereco || !numero || !bairro || !cidade || !uf) {
      showAlert(
        "Endereço incompleto",
        "Informe CEP, endereço, número, bairro, cidade e UF.",
      );
      return;
    }

    const id = enderecoSelecionadoId || `endereco-${Date.now()}`;
    const ref = doc(db, "clientesPorUid", user.uid, "enderecos", id);
    const dadosEndereco: EnderecoSalvo = {
      id,
      apelido: apelidoEndereco || "Endereço principal",
      cep,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      complemento,
    };

    try {
      await setDoc(
        ref,
        {
          ...dadosEndereco,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true },
      );
      await carregarEnderecos();
      setEnderecoSelecionadoId(id);
      showAlert("Sucesso", "Endereço salvo.");
    } catch (error) {
      console.error("Erro ao salvar endereco:", error);
      showAlert("Erro", "Não foi possível salvar o endereço.");
    }
  };

  const excluirEndereco = async (id: string) => {
    if (!user) return;

    showAlert("Excluir endereço", "Deseja remover este endereço salvo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(
              doc(db, "clientesPorUid", user.uid, "enderecos", id),
            );
            await carregarEnderecos();

            if (enderecoSelecionadoId === id) {
              limparFormularioEndereco();
            }
          } catch (error) {
            console.error("Erro ao excluir endereco:", error);
            showAlert("Erro", "Não foi possível excluir o endereço.");
          }
        },
      },
    ]);
  };

  const enviarPedido = async (valorTroco: number) => {
    try {
      setFinalizando(true);
      const functions = getFunctions();
      const criarPedido = httpsCallable(functions, "criarPedido");

      const pedidoResultado = await criarPedido({
        tipoAtendimento,
        cliente: {
          nome,
          telefone,
        },
        entrega:
          tipoAtendimento === "entrega"
            ? {
                id: enderecoSelecionadoId || null,
                apelido: apelidoEndereco || "Endereço principal",
                cep,
                endereco,
                numero,
                bairro,
                cidade,
                uf,
                complemento,
              }
            : null,
        retirada:
          tipoAtendimento === "retirada"
            ? {
                filialId: filialRetiradaSelecionada.id,
              }
            : null,
        pagamento,
        pagamentoDetalhes: {
          precisaTroco: pagamento === formasPagamento.dinheiro && precisaTroco,
          trocoPara:
            pagamento === formasPagamento.dinheiro && precisaTroco
              ? valorTroco
              : null,
        },
        observacoes,
        itens: carrinho.map((item) => ({
          id: item.id,
          quantidade: item.quantidade,
          tamanho: item.tamanhoSelecionado || null,
        })),
      });
      const codigoPedido =
        typeof pedidoResultado.data === "object" &&
        pedidoResultado.data !== null &&
        "codigoPedido" in pedidoResultado.data
          ? String((pedidoResultado.data as { codigoPedido?: string }).codigoPedido)
          : "";
      let pagamentoMensagem = "";

      if (pagamento === formasPagamento.pix && codigoPedido) {
        try {
          const criarPagamentoPix = httpsCallable(functions, "criarPagamentoPix");

          await criarPagamentoPix({ pedidoId: codigoPedido });
          pagamentoMensagem =
            " O Pix foi gerado e está disponível nos detalhes do pedido.";
        } catch (pagamentoError: any) {
          console.error("Erro ao gerar Pix:", pagamentoError);
          pagamentoMensagem =
            " O pedido foi criado, mas não foi possível gerar o Pix agora. Abra os detalhes do pedido ou fale com a farmácia.";
        }
      }

      if (pagamento === formasPagamento.cartaoOnline && codigoPedido) {
        try {
          const criarPagamentoCartao = httpsCallable(
            functions,
            "criarPagamentoCartao",
          );
          const pagamentoResultado = await criarPagamentoCartao({
            pedidoId: codigoPedido,
          });
          const linkPagamento =
            typeof pagamentoResultado.data === "object" &&
            pagamentoResultado.data !== null &&
            "linkPagamento" in pagamentoResultado.data
              ? String(
                  (pagamentoResultado.data as { linkPagamento?: string })
                    .linkPagamento || "",
                )
              : "";

          pagamentoMensagem =
            " O link do cartão foi gerado e está disponível nos detalhes do pedido.";

          if (linkPagamento) {
            void Linking.openURL(linkPagamento);
          }
        } catch (pagamentoError: any) {
          console.error("Erro ao gerar pagamento por cartão:", pagamentoError);
          pagamentoMensagem =
            " O pedido foi criado, mas não foi possível gerar o link do cartão agora. Abra os detalhes do pedido ou fale com a farmácia.";
        }
      }

      limparCarrinho();

      showAlert("Sucesso", `Pedido realizado com sucesso!${pagamentoMensagem}`);
      router.replace(
        codigoPedido
          ? {
              pathname: "/pedido-detalhes",
              params: { id: codigoPedido },
            }
          : "/pedidos",
      );
    } catch (error: any) {
      console.error("Erro ao processar pedido:", error);
      const mensagemErro =
        error?.code === "functions/not-found"
          ? "O servidor de pedidos ainda não foi publicado. Fale com a farmácia para concluir o pedido."
          : error?.message || "Falha ao processar pedido. Tente novamente.";

      showAlert("Erro", mensagemErro);
    } finally {
      setFinalizando(false);
    }
  };

  const finalizarPedido = () => {
    if (finalizando) return;

    if (carrinho.length === 0) {
      showAlert("Carrinho vazio", "Adicione produtos antes de finalizar.");
      return;
    }

    if (!user) {
      showAlert(
        "Entre na sua conta",
        "Faça login para finalizar e acompanhar seu pedido.",
        [
          { text: "Agora não", style: "cancel" },
          { text: "Fazer login", onPress: () => router.push("/login") },
        ],
      );
      return;
    }

    if (!nome || !telefone) {
      showAlert("Preencha os campos", "Informe nome e telefone.");
      return;
    }

    if (
      tipoAtendimento === "entrega" &&
      (!cep || !endereco || !numero || !bairro || !cidade || !uf)
    ) {
      showAlert(
        "Preencha os campos",
        "Informe CEP, endereço, número, bairro, cidade e UF para entrega.",
      );
      return;
    }

    if (tipoAtendimento === "entrega" && !coberturaSelecionada) {
      showAlert(
        "Bairro sem taxa cadastrada",
        "Confira o bairro informado ou fale com a farmácia para confirmar a área de entrega.",
      );
      return;
    }

    const valorTroco = Number(trocoPara.replace(",", "."));

    if (pagamento === formasPagamento.dinheiro && precisaTroco) {
      if (!trocoPara || Number.isNaN(valorTroco)) {
        showAlert("Informe o troco", "Digite para quanto precisa de troco.");
        return;
      }

      if (valorTroco <= totalPedido) {
        showAlert(
          "Valor inválido",
          "O valor para troco precisa ser maior que o total do pedido.",
        );
        return;
      }
    }

    const pagamentoOnlineMetodo = getMetodoPagamentoOnline(pagamento);
    const pagamentoOnlinePreview = pagamentoOnlineMetodo
      ? prepararPagamentoOnline({
          metodo: pagamentoOnlineMetodo,
          pedidoId: "preview",
        })
      : null;
    const listaItens = carrinho
      .map(
        (item) =>
          `- ${item.nome} x${item.quantidade} - ${formatarMoeda(
            item.preco * item.quantidade,
          )}`,
      )
      .join("\n");

    const mensagem = `
Pedido realizado

Nome: ${nome}
Telefone: ${telefone}

Endereço:
CEP: ${cep}
${endereco}, ${numero} - ${bairro}

Pagamento: ${pagamentoLabel}
${pagamentoOnlinePreview ? `Status online: ${pagamentoOnlinePreview.mensagem}\n` : ""}

Itens:
${listaItens}

Subtotal: ${formatarMoeda(totalCarrinho)}
Entrega: ${tipoAtendimento === "entrega" ? formatarMoeda(taxaEntrega) : "Retirada"}
Total: ${formatarMoeda(totalPedido)}
`;

    if (Platform.OS === "web") {
      const confirmar = (
        globalThis as typeof globalThis & {
          confirm?: (message?: string) => boolean;
        }
      ).confirm;
      const confirmou = confirmar
        ? confirmar(`Confirmar pedido\n${mensagem}`)
        : true;

      if (confirmou) {
        void enviarPedido(valorTroco);
      }

      return;
    }

    showAlert("Confirmar pedido", mensagem, [
      {
        text: "Confirmar",
        onPress: () => void enviarPedido(valorTroco),
      },
      { text: "Editar", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* TOPO */}
        <View style={styles.topo}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1b5e20" />
          </TouchableOpacity>

          <View style={styles.topoTexto}>
            <Text style={styles.titulo}>Finalizar pedido</Text>
            <Text style={styles.subtitulo}>Confira e complete seus dados</Text>
          </View>
        </View>

        {/* RESUMO */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Resumo</Text>

          {carrinho.map((item) => (
            <View
              key={`${item.id}-${item.tamanhoSelecionado || "unico"}`}
              style={styles.itemResumo}
            >
              <Text style={styles.itemNome}>
                {item.nome}
                {item.tamanhoSelecionado ? ` (${item.tamanhoSelecionado})` : ""} x
                {item.quantidade}
              </Text>
              <Text style={styles.itemPreco}>
                {formatarMoeda(item.preco * item.quantidade)}
              </Text>
            </View>
          ))}

          <View style={styles.divisor} />

          <View style={styles.totalLinha}>
            <Text style={styles.resumoLabel}>Subtotal</Text>
            <Text style={styles.resumoValor}>{formatarMoeda(totalCarrinho)}</Text>
          </View>

          {tipoAtendimento === "entrega" ? (
            <View style={styles.totalLinha}>
              <Text style={styles.resumoLabel}>Entrega</Text>
              <Text style={styles.resumoValor}>
                {coberturaSelecionada
                  ? formatarMoeda(taxaEntrega)
                  : "Informe o bairro"}
              </Text>
            </View>
          ) : (
            <View style={styles.totalLinha}>
              <Text style={styles.resumoLabel}>Retirada</Text>
              <Text style={styles.resumoValor}>Sem taxa</Text>
            </View>
          )}

          <View style={styles.totalLinha}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>
              {formatarMoeda(totalPedido)}
            </Text>
          </View>
        </View>

        {/* DADOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Seus dados</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            placeholder="Digite seu telefone"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Atendimento</Text>
          <View style={styles.tipoContainer}>
            {(["entrega", "retirada"] as TipoAtendimento[]).map((tipo) => {
              const ativo = tipoAtendimento === tipo;

              return (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.tipoBotao, ativo && styles.tipoBotaoAtivo]}
                  onPress={() => setTipoAtendimento(tipo)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      tipo === "entrega"
                        ? "bicycle-outline"
                        : "storefront-outline"
                    }
                    size={18}
                    color={ativo ? "#fff" : "#1b5e20"}
                  />
                  <Text
                    style={[
                      styles.tipoBotaoTexto,
                      ativo && styles.tipoBotaoTextoAtivo,
                    ]}
                  >
                    {tipo === "entrega" ? "Entrega" : "Retirada"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tipoAtendimento === "entrega" ? (
            <>
              <Text style={styles.label}>Filial responsável</Text>
              {filialSugeridaPorCep ? (
                <View style={styles.filialSugestaoBox}>
                  <Ionicons name="navigate-outline" size={18} color="#1b5e20" />
                  <Text style={styles.filialSugestaoTexto}>
                    Filial sugerida automaticamente pelo CEP/bairro. Você pode
                    alterar se precisar.
                  </Text>
                </View>
              ) : null}
              {coberturaSelecionada ? (
                <View style={styles.taxaEntregaBox}>
                  <Ionicons name="bicycle-outline" size={18} color="#1b5e20" />
                  <View style={styles.taxaEntregaTextoArea}>
                    <Text style={styles.taxaEntregaTitulo}>
                      Taxa de entrega: {formatarMoeda(taxaEntrega)}
                    </Text>
                  <Text style={styles.taxaEntregaTexto}>
                      Menor taxa encontrada para {coberturaSelecionada.bairro}:{" "}
                      {coberturaSelecionada.filial.nome}
                    </Text>
                  </View>
                </View>
              ) : bairro ? (
                <View style={styles.taxaEntregaAvisoBox}>
                  <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
                  <Text style={styles.taxaEntregaAvisoTexto}>
                    Bairro sem taxa cadastrada. Confira o nome do bairro ou fale
                    com a farmácia.
                  </Text>
                </View>
              ) : null}
              <View style={styles.filiaisContainer}>
                {filiaisRetirada.map((filial) => {
                  const ativo = filialRetiradaId === filial.id;

                  return (
                    <TouchableOpacity
                      key={`entrega-${filial.id}`}
                      style={[
                        styles.filialCard,
                        ativo && styles.filialCardAtiva,
                      ]}
                      onPress={() => setFilialRetiradaId(filial.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.filialIcone}>
                        <Ionicons
                          name="storefront-outline"
                          size={20}
                          color="#1b5e20"
                        />
                      </View>
                      <View style={styles.filialTextoArea}>
                        <Text style={styles.filialNome}>{filial.nome}</Text>
                        <Text style={styles.filialEndereco}>
                          {filial.endereco}
                        </Text>
                      </View>
                      {ativo && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#1b5e20"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {enderecosSalvos.length > 0 && (
                <View style={styles.enderecosSalvosArea}>
                  <View style={styles.linhaTituloEndereco}>
                    <Text style={styles.labelSemMargem}>Endereços salvos</Text>
                    <TouchableOpacity onPress={limparFormularioEndereco}>
                      <Text style={styles.linkEndereco}>Novo endereço</Text>
                    </TouchableOpacity>
                  </View>

                  {enderecosSalvos.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.enderecoSalvoCard,
                        enderecoSelecionadoId === item.id &&
                          styles.enderecoSalvoCardAtivo,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.enderecoSalvoConteudo}
                        onPress={() => preencherEndereco(item)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.enderecoSalvoTitulo}>
                          {item.apelido}
                        </Text>
                        <Text style={styles.enderecoSalvoTexto}>
                          {item.endereco}, {item.numero} - {item.bairro}
                        </Text>
                        <Text style={styles.enderecoSalvoTexto}>
                          {item.cidade}/{item.uf} - CEP {item.cep}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botaoExcluirEndereco}
                        onPress={() => excluirEndereco(item.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#d32f2f"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Apelido do endereço</Text>
              <TextInput
                style={styles.input}
                value={apelidoEndereco}
                onChangeText={setApelidoEndereco}
                placeholder="Casa, trabalho, mãe..."
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>CEP</Text>
              <TextInput
                style={styles.input}
                value={cep}
                onChangeText={handleCepChange}
                keyboardType="numeric"
                placeholder="Digite seu CEP"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Endereço</Text>
              <TextInput
                style={styles.input}
                value={endereco}
                onChangeText={setEndereco}
                placeholder="Rua, avenida ou travessa"
                placeholderTextColor="#9ca3af"
              />

              <View style={styles.row}>
                <View style={styles.campoMetade}>
                  <Text style={styles.label}>Número</Text>
                  <TextInput
                    style={styles.input}
                    value={numero}
                    onChangeText={setNumero}
                    keyboardType="numeric"
                    placeholder="Nº"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.campoMetade}>
                  <Text style={styles.label}>Bairro</Text>
                  <TextInput
                    style={styles.input}
                    value={bairro}
                    onChangeText={(valor) => {
                      setBairro(valor);
                      aplicarFilialSugerida(cep, valor);
                    }}
                    placeholder="Bairro"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.campoMetade}>
                  <Text style={styles.label}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    value={cidade}
                    onChangeText={setCidade}
                    placeholder="Cidade"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.campoUf}>
                  <Text style={styles.label}>UF</Text>
                  <TextInput
                    style={styles.input}
                    value={uf}
                    onChangeText={setUf}
                    autoCapitalize="characters"
                    maxLength={2}
                    placeholder="UF"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <Text style={styles.label}>Complemento</Text>
              <TextInput
                style={styles.input}
                value={complemento}
                onChangeText={setComplemento}
                placeholder="Apto, bloco, referência..."
                placeholderTextColor="#9ca3af"
              />

              {buscandoCep && (
                <Text style={styles.cepStatus}>Buscando endereço...</Text>
              )}

              <TouchableOpacity
                style={styles.botaoSalvarEndereco}
                onPress={salvarEndereco}
                activeOpacity={0.9}
              >
                <Ionicons name="save-outline" size={18} color="#1f2937" />
                <Text style={styles.botaoSalvarEnderecoTexto}>
                  Salvar endereço
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Filial para retirada</Text>
              <View style={styles.filiaisContainer}>
                {filiaisRetirada.map((filial) => {
                  const ativo = filialRetiradaId === filial.id;

                  return (
                    <TouchableOpacity
                      key={filial.id}
                      style={[
                        styles.filialCard,
                        ativo && styles.filialCardAtiva,
                      ]}
                      onPress={() => setFilialRetiradaId(filial.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.filialIcone}>
                        <Ionicons
                          name="storefront-outline"
                          size={20}
                          color="#1b5e20"
                        />
                      </View>
                      <View style={styles.filialTextoArea}>
                        <Text style={styles.filialNome}>{filial.nome}</Text>
                        <Text style={styles.filialEndereco}>
                          {filial.endereco}
                        </Text>
                      </View>
                      {ativo && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#1b5e20"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.retiradaBox}>
                <Ionicons name="storefront-outline" size={22} color="#1b5e20" />
                <View style={styles.retiradaTextoArea}>
                  <Text style={styles.retiradaTitulo}>
                    Retirada em {filialRetiradaSelecionada.nome}
                  </Text>
                  <Text style={styles.retiradaTexto}>
                    O pedido ficará separado para retirada no balcão.
                  </Text>
                </View>
              </View>
            </>
          )}

          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.obs]}
            multiline
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Ex: troco, referência, preferência de entrega..."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
          />
        </View>

        {/* PAGAMENTO */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Pagamento</Text>

          <View style={styles.pagamentoContainer}>
            {opcoesPagamento.map((forma) => {
              const ativo = pagamento === forma.valor;

              return (
                <TouchableOpacity
                  key={forma.valor}
                  style={[
                    styles.botaoPagamento,
                    ativo && styles.botaoPagamentoAtivo,
                  ]}
                  onPress={() => {
                    setPagamento(forma.valor);
                    if (forma.valor !== formasPagamento.dinheiro) {
                      setPrecisaTroco(false);
                      setTrocoPara("");
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.textoPagamento,
                      ativo && styles.textoPagamentoAtivo,
                    ]}
                  >
                    {forma.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {pagamento === formasPagamento.dinheiro && (
            <View style={styles.pagamentoDetalheBox}>
              <Text style={styles.labelSemMargem}>Precisa de troco?</Text>
              <View style={styles.trocoOpcoes}>
                {[false, true].map((opcao) => {
                  const ativo = precisaTroco === opcao;

                  return (
                    <TouchableOpacity
                      key={opcao ? "sim" : "nao"}
                      style={[
                        styles.trocoOpcao,
                        ativo && styles.trocoOpcaoAtiva,
                      ]}
                      onPress={() => {
                        setPrecisaTroco(opcao);
                        if (!opcao) setTrocoPara("");
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.trocoOpcaoTexto,
                          ativo && styles.trocoOpcaoTextoAtivo,
                        ]}
                      >
                        {opcao ? "Sim" : "Não"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {precisaTroco && (
                <>
                  <Text style={styles.label}>Troco para quanto?</Text>
                  <TextInput
                    style={styles.input}
                    value={trocoPara}
                    onChangeText={setTrocoPara}
                    keyboardType="decimal-pad"
                    placeholder="Ex: 100,00"
                    placeholderTextColor="#9ca3af"
                  />
                </>
              )}
            </View>
          )}

          {pagamento === formasPagamento.pix && (
            <View style={styles.avisoPagamento}>
              <Ionicons name="qr-code-outline" size={20} color="#1b5e20" />
              <Text style={styles.avisoPagamentoTexto}>
                O QR Code Pix com confirmação automática precisa ser conectado a
                um provedor de pagamento.
              </Text>
            </View>
          )}

          {pagamento === formasPagamento.cartaoOnline && (
            <View style={styles.avisoPagamento}>
              <Ionicons name="card-outline" size={20} color="#1b5e20" />
              <Text style={styles.avisoPagamentoTexto}>
                O pagamento abre no checkout seguro do Mercado Pago. O app não
                salva número do cartão nem CVV.
              </Text>
            </View>
          )}

          {pagamento === formasPagamento.cartaoEntrega && (
            <View style={styles.avisoPagamento}>
              <Ionicons name="card-outline" size={20} color="#1b5e20" />
              <Text style={styles.avisoPagamentoTexto}>
                Por enquanto o pagamento no cartão fica registrado como pendente
                para cobrança na entrega.
              </Text>
            </View>
          )}
        </View>

        {/* BOTAO */}
        <TouchableOpacity
          style={[styles.botaoConfirmar, finalizando && styles.botaoDesativado]}
          onPress={finalizarPedido}
          disabled={finalizando}
          activeOpacity={0.9}
        >
          <Text style={styles.textoBotaoConfirmar}>
            {finalizando ? "Enviando pedido..." : "Confirmar pedido"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  topoTexto: {
    flex: 1,
  },

  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b5e20",
  },

  subtitulo: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardTitulo: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1f2937",
  },

  itemResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },

  itemNome: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },

  itemPreco: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },

  divisor: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },

  totalLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  resumoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4b5563",
  },
  resumoValor: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },

  totalValor: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b5e20",
  },

  label: {
    fontSize: 13,
    marginBottom: 5,
    marginTop: 8,
    color: "#374151",
    fontWeight: "700",
  },

  input: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf2ee",
    fontSize: 15,
    color: "#1f2937",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  campoMetade: {
    flex: 1,
  },

  campoUf: {
    width: 82,
  },

  tipoContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  tipoBotao: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  tipoBotaoAtivo: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },

  tipoBotaoTexto: {
    color: "#1b5e20",
    fontSize: 14,
    fontWeight: "800",
  },

  tipoBotaoTextoAtivo: {
    color: "#fff",
  },

  enderecosSalvosArea: {
    marginBottom: 12,
  },

  linhaTituloEndereco: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  labelSemMargem: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "800",
  },

  linkEndereco: {
    color: "#1b5e20",
    fontSize: 13,
    fontWeight: "800",
  },

  enderecoSalvoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    marginBottom: 8,
  },

  enderecoSalvoCardAtivo: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },

  enderecoSalvoConteudo: {
    flex: 1,
  },

  enderecoSalvoTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },

  enderecoSalvoTexto: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },

  botaoExcluirEndereco: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    backgroundColor: "#fff",
  },

  cepStatus: {
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "700",
    marginTop: -4,
    marginBottom: 8,
  },

  botaoSalvarEndereco: {
    backgroundColor: "#f4c542",
    borderRadius: 12,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },

  botaoSalvarEnderecoTexto: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "800",
  },

  filiaisContainer: {
    gap: 10,
    marginBottom: 12,
  },

  filialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },

  filialCardAtiva: {
    backgroundColor: "#e8f5e9",
    borderColor: "#2e7d32",
  },
  filialSugestaoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfe8d2",
    padding: 10,
    marginBottom: 10,
  },
  filialSugestaoTexto: {
    flex: 1,
    color: "#4b5563",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  taxaEntregaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff8db",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f4d36c",
    padding: 10,
    marginBottom: 10,
  },
  taxaEntregaTextoArea: {
    flex: 1,
  },
  taxaEntregaTitulo: {
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "800",
  },
  taxaEntregaTexto: {
    color: "#4b5563",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    fontWeight: "700",
  },
  taxaEntregaAvisoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 10,
    marginBottom: 10,
  },
  taxaEntregaAvisoTexto: {
    flex: 1,
    color: "#92400e",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  filialIcone: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  filialTextoArea: {
    flex: 1,
  },

  filialNome: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 3,
  },

  filialEndereco: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },

  retiradaBox: {
    flexDirection: "row",
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cfe8d2",
    marginBottom: 12,
  },

  retiradaTextoArea: {
    flex: 1,
    marginLeft: 10,
  },

  retiradaTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 4,
  },

  retiradaTexto: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },

  obs: {
    height: 90,
  },

  pagamentoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  botaoPagamento: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  botaoPagamentoAtivo: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },

  textoPagamento: {
    fontWeight: "700",
    color: "#1f2937",
  },

  textoPagamentoAtivo: {
    color: "#fff",
  },

  pagamentoDetalheBox: {
    marginTop: 14,
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
  },

  trocoOpcoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  trocoOpcao: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d7e7d9",
    alignItems: "center",
    justifyContent: "center",
  },

  trocoOpcaoAtiva: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },

  trocoOpcaoTexto: {
    color: "#1b5e20",
    fontSize: 14,
    fontWeight: "800",
  },

  trocoOpcaoTextoAtivo: {
    color: "#fff",
  },

  avisoPagamento: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#cfe8d2",
  },

  avisoPagamentoTexto: {
    flex: 1,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },

  botaoConfirmar: {
    backgroundColor: "#f4c542",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  botaoDesativado: {
    opacity: 0.7,
  },

  textoBotaoConfirmar: {
    fontWeight: "800",
    fontSize: 16,
    color: "#1f2937",
  },
});
