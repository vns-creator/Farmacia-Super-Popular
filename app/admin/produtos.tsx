import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/services/alert";
import { useAuth } from "../../context/AuthContext";
import { filiais, getFilialById } from "../../constants/filiais";
import { ProductFilialAvailability } from "../../components/ProductFilialAvailability";
import { db, storage } from "../../firebaseConfig";
import { produtosIniciais } from "../../constants/produtosIniciais";
import {
  getFilialIdsParaSalvar,
  getResumoFiliaisProduto,
  normalizarFilialIdsProduto,
} from "../../services/productAvailability";
import { formatarMoeda, parseNumeroDecimal } from "../../services/formatters";
import {
  type CategoriaProduto,
  getCategoriaLabel,
  mapProdutoFirestore,
  type ProdutoFirestore,
} from "../../services/products";

const categorias: CategoriaProduto[] = [
  "ofertas",
  "manipulados",
  "perfumaria",
  "higiene",
  "baby",
];

const filtrosStatus = [
  { label: "Todos", value: "todos" },
  { label: "Ativos", value: "ativos" },
  { label: "Inativos", value: "inativos" },
  { label: "Ofertas", value: "ofertas" },
  { label: "Destaques", value: "destaques" },
  { label: "Estoque baixo", value: "estoque_baixo" },
  { label: "Sem estoque", value: "sem_estoque" },
] as const;

type FiltroStatus = (typeof filtrosStatus)[number]["value"];

type AbaProdutos = "produtos" | "medicamentos";

const produtoInicial = {
  id: "",
  nome: "",
  categoria: "ofertas" as CategoriaProduto,
  preco: "",
  descricao: "",
  imagemUrl: "",
  ativo: true,
  emOferta: false,
  destaque: false,
  filialId: null as string | null,
  filialIds: [] as string[],
  controlarEstoque: false,
  estoque: "",
  estoqueMinimo: "3",
  isMedicamento: false,
  principioAtivo: "",
  codigoBarras: "",
  temTamanhos: false,
  tamanhos: [] as string[],
  estoquePorTamanho: {} as Record<string, string>,
};

export default function AdminProdutosScreen() {
  const router = useRouter();
  const { perfil } = useAuth();
  const isAdminAtivo = perfil?.perfil === "admin" && perfil.ativo;
  const isAdminGeral = isAdminAtivo && (perfil?.adminGeral === true || !perfil?.filialId);
  const filialUsuarioId = perfil?.filialId || null;
  const [produtos, setProdutos] = useState<ProdutoFirestore[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [novoTamanho, setNovoTamanho] = useState("");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<"todas" | CategoriaProduto>(
    "todas",
  );
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("todos");
  const [abaSelecionada, setAbaSelecionada] = useState<AbaProdutos>("produtos");
  const [form, setForm] = useState(produtoInicial);

  useEffect(() => {
    if (!isAdminAtivo) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, "produtos")),
      (snapshot) => {
        const dados = snapshot.docs
          .map((docSnap) => mapProdutoFirestore(docSnap.id, docSnap.data()))
          .sort((a, b) => a.nome.localeCompare(b.nome));

        setProdutos(
          isAdminGeral
            ? dados
            : dados.filter((produto) =>
                normalizarFilialIdsProduto(produto).includes(
                  String(filialUsuarioId),
                ),
              ),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar produtos:", error);
        showAlert("Erro", "Nao foi possivel carregar os produtos.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [filialUsuarioId, isAdminAtivo, isAdminGeral]);

  const produtosPorAba = useMemo(() => {
    const medicamento = abaSelecionada === "medicamentos";
    return produtos.filter((produto) => (produto.isMedicamento === true) === medicamento);
  }, [abaSelecionada, produtos]);

  const totalMedicamentos = useMemo(
    () => produtos.filter((produto) => produto.isMedicamento === true).length,
    [produtos],
  );
  const totalProdutos = produtos.length - totalMedicamentos;

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtosPorAba.filter((produto) => {
      const bateBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.categoria.toLowerCase().includes(termo) ||
        getCategoriaLabel(produto.categoria).toLowerCase().includes(termo) ||
        (produto.principioAtivo || "").toLowerCase().includes(termo) ||
        (produto.codigoBarras || "").toLowerCase().includes(termo);
      const bateCategoria =
        categoriaFiltro === "todas" || produto.categoria === categoriaFiltro;
      const bateStatus =
        statusFiltro === "todos" ||
        (statusFiltro === "ativos" && produto.ativo) ||
        (statusFiltro === "inativos" && !produto.ativo) ||
        (statusFiltro === "ofertas" && produto.emOferta) ||
        (statusFiltro === "destaques" && produto.destaque) ||
        (statusFiltro === "estoque_baixo" &&
          produto.controlarEstoque &&
          Number(produto.estoque || 0) > 0 &&
          Number(produto.estoque || 0) <= Number(produto.estoqueMinimo || 0)) ||
        (statusFiltro === "sem_estoque" &&
          produto.controlarEstoque &&
          Number(produto.estoque || 0) <= 0);

      return bateBusca && bateCategoria && bateStatus;
    });
  }, [busca, categoriaFiltro, produtosPorAba, statusFiltro]);

  const produtosComEstoqueBaixo = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          produto.controlarEstoque &&
          Number(produto.estoque || 0) > 0 &&
          Number(produto.estoque || 0) <= Number(produto.estoqueMinimo || 0),
      ),
    [produtos],
  );
  const produtosSemEstoque = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          produto.controlarEstoque && Number(produto.estoque || 0) <= 0,
      ),
    [produtos],
  );
  const produtosComAlerta = useMemo(
    () => [...produtosSemEstoque, ...produtosComEstoqueBaixo],
    [produtosComEstoqueBaixo, produtosSemEstoque],
  );

  const imagemUrlValida = useMemo(() => {
    const url = form.imagemUrl.trim();
    if (!url) return true;
    return /^https?:\/\/.+/i.test(url);
  }, [form.imagemUrl]);

  const selecionarImagemDoDispositivo = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        showAlert(
          "Permissao necessaria",
          "Permita acesso as fotos para escolher a imagem do produto.",
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (resultado.canceled || !resultado.assets?.[0]?.uri) {
        return;
      }

      setEnviandoImagem(true);

      const uri = resultado.assets[0].uri;
      const resposta = await fetch(uri);
      const blob = await resposta.blob();
      const extensao = blob.type?.split("/")[1] || "jpg";
      const nomeArquivo = `produtos/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extensao}`;
      const arquivoRef = ref(storage, nomeArquivo);

      await uploadBytes(arquivoRef, blob, { contentType: blob.type });
      const url = await getDownloadURL(arquivoRef);

      setForm((prev) => ({ ...prev, imagemUrl: url }));
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      showAlert("Erro", "Nao foi possivel enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  };

  const limparForm = () => {
    setForm({
      ...produtoInicial,
      isMedicamento: abaSelecionada === "medicamentos",
    });
    setNovoTamanho("");
  };

  const selecionarAba = (aba: AbaProdutos) => {
    setAbaSelecionada(aba);
    setForm({ ...produtoInicial, isMedicamento: aba === "medicamentos" });
    setNovoTamanho("");
  };

  const adicionarTamanho = () => {
    const valor = novoTamanho.trim();

    if (!valor) return;

    setForm((prev) => {
      const jaExiste = prev.tamanhos.some(
        (tamanho) => tamanho.toLowerCase() === valor.toLowerCase(),
      );

      if (jaExiste) return prev;

      return {
        ...prev,
        tamanhos: [...prev.tamanhos, valor],
        estoquePorTamanho: { ...prev.estoquePorTamanho, [valor]: "0" },
      };
    });
    setNovoTamanho("");
  };

  const removerTamanho = (index: number) => {
    setForm((prev) => {
      const tamanho = prev.tamanhos[index];
      const estoquePorTamanho = { ...prev.estoquePorTamanho };
      delete estoquePorTamanho[tamanho];

      return {
        ...prev,
        tamanhos: prev.tamanhos.filter((_, i) => i !== index),
        estoquePorTamanho,
      };
    });
  };

  const editarProduto = (produto: ProdutoFirestore) => {
    setAbaSelecionada(produto.isMedicamento ? "medicamentos" : "produtos");
    setForm({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      preco: String(produto.preco).replace(".", ","),
      descricao: produto.descricao || "",
      imagemUrl: produto.imagemUrl || "",
      ativo: produto.ativo,
      emOferta: produto.emOferta || produto.categoria === "ofertas",
      destaque: produto.destaque || false,
      filialId: produto.filialId || null,
      filialIds: normalizarFilialIdsProduto(produto),
      controlarEstoque: produto.controlarEstoque === true,
      estoque: String(produto.estoque ?? 0),
      estoqueMinimo: String(produto.estoqueMinimo ?? 3),
      isMedicamento: produto.isMedicamento === true,
      principioAtivo: produto.principioAtivo || "",
      codigoBarras: produto.codigoBarras || "",
      temTamanhos: produto.temTamanhos === true,
      tamanhos: produto.tamanhos || [],
      estoquePorTamanho: Object.fromEntries(
        (produto.tamanhos || []).map((tamanho) => [
          tamanho,
          String(produto.estoquePorTamanho?.[tamanho] ?? 0),
        ]),
      ),
    });
    setNovoTamanho("");
  };

  const salvarProduto = async () => {
    const preco = parseNumeroDecimal(form.preco);
    const estoque = parseNumeroDecimal(form.estoque);
    const estoqueMinimo = parseNumeroDecimal(form.estoqueMinimo);

    if (!form.nome.trim()) {
      showAlert("Informe o nome", "Digite o nome do produto.");
      return;
    }

    if (Number.isNaN(preco) || preco <= 0) {
      showAlert("Preco invalido", "Digite um valor maior que zero.");
      return;
    }

    if (!imagemUrlValida) {
      showAlert(
        "URL invalida",
        "Use um link completo da imagem, comecando com http:// ou https://.",
      );
      return;
    }

    if (form.isMedicamento && !form.principioAtivo.trim()) {
      showAlert(
        "Informe o principio ativo",
        "Medicamentos precisam do principio ativo cadastrado.",
      );
      return;
    }

    if (
      form.controlarEstoque &&
      !form.temTamanhos &&
      (!Number.isFinite(estoque) || estoque < 0 || !Number.isInteger(estoque))
    ) {
      showAlert("Estoque invalido", "Informe uma quantidade inteira maior ou igual a zero.");
      return;
    }

    if (
      form.controlarEstoque &&
      (!Number.isFinite(estoqueMinimo) ||
        estoqueMinimo < 0 ||
        !Number.isInteger(estoqueMinimo))
    ) {
      showAlert(
        "Estoque minimo invalido",
        "Informe uma quantidade minima inteira maior ou igual a zero.",
      );
      return;
    }

    const estoquePorTamanhoNumerico: Record<string, number> = {};

    if (form.controlarEstoque && form.temTamanhos) {
      for (const tamanho of form.tamanhos) {
        const valorTamanho = parseNumeroDecimal(
          form.estoquePorTamanho[tamanho] || "0",
        );

        if (
          !Number.isFinite(valorTamanho) ||
          valorTamanho < 0 ||
          !Number.isInteger(valorTamanho)
        ) {
          showAlert(
            "Estoque invalido",
            `Informe uma quantidade inteira valida para o tamanho ${tamanho}.`,
          );
          return;
        }

        estoquePorTamanhoNumerico[tamanho] = valorTamanho;
      }
    }

    const filialIdsSelecionadas = getFilialIdsParaSalvar({
      isAdminGeral,
      filialUsuarioId,
      filialIdsForm: form.filialIds,
    });
    const filialIdCompat =
      filialIdsSelecionadas.length === 1 ? filialIdsSelecionadas[0] : null;
    const filialNomeResumo = getResumoFiliaisProduto({
      filialIds: filialIdsSelecionadas,
    });

    const dados = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      categoriaLabel: getCategoriaLabel(form.categoria),
      preco,
      descricao: form.descricao.trim(),
      imagemUrl: form.imagemUrl.trim(),
      ativo: form.ativo,
      emOferta: form.emOferta || form.categoria === "ofertas",
      destaque: form.destaque,
      filialId: filialIdCompat,
      filialIds: filialIdsSelecionadas,
      filialNome: filialNomeResumo,
      controlarEstoque: form.controlarEstoque,
      estoque: form.controlarEstoque && !form.temTamanhos ? estoque : 0,
      estoqueMinimo: form.controlarEstoque ? estoqueMinimo : 0,
      isMedicamento: form.isMedicamento,
      principioAtivo: form.isMedicamento ? form.principioAtivo.trim() : "",
      codigoBarras: form.codigoBarras.trim(),
      temTamanhos: form.temTamanhos,
      tamanhos: form.temTamanhos ? form.tamanhos : [],
      estoquePorTamanho:
        form.controlarEstoque && form.temTamanhos
          ? estoquePorTamanhoNumerico
          : {},
      atualizadoEm: serverTimestamp(),
    };

    try {
      setSalvando(true);

      if (form.id) {
        await updateDoc(doc(db, "produtos", form.id), dados);
      } else {
        await addDoc(collection(db, "produtos"), {
          ...dados,
          criadoEm: serverTimestamp(),
        });
      }

      limparForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      showAlert("Erro", "Nao foi possivel salvar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarFilialProduto = (filialId: string) => {
    setForm((prev) => {
      const filialIdsAtuais = prev.filialIds || [];
      const jaSelecionada = filialIdsAtuais.includes(filialId);
      const filialIds = jaSelecionada
        ? filialIdsAtuais.filter((id) => id !== filialId)
        : [...filialIdsAtuais, filialId];

      return {
        ...prev,
        filialId: filialIds.length === 1 ? filialIds[0] : null,
        filialIds,
      };
    });
  };

  const alternarCampo = async (
    produto: ProdutoFirestore,
    campo: "ativo" | "emOferta" | "destaque",
  ) => {
    if (campo === "ativo" && produto.ativo) {
      showAlert(
        "Desativar produto",
        `${produto.nome} deixara de aparecer para os clientes. Deseja continuar?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desativar",
            style: "destructive",
            onPress: () => alternarCampoConfirmado(produto, campo),
          },
        ],
      );
      return;
    }

    alternarCampoConfirmado(produto, campo);
  };

  const alternarCampoConfirmado = async (
    produto: ProdutoFirestore,
    campo: "ativo" | "emOferta" | "destaque",
  ) => {
    try {
      await updateDoc(doc(db, "produtos", produto.id), {
        [campo]: !produto[campo],
        atualizadoEm: serverTimestamp(),
        controlarEstoque: produto.controlarEstoque === true,
        estoque: Number(produto.estoque || 0),
        estoqueMinimo: Number(produto.estoqueMinimo || 0),
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      showAlert("Erro", "Nao foi possivel atualizar o produto.");
    }
  };

  const duplicarProduto = async (produto: ProdutoFirestore) => {
    try {
      await addDoc(collection(db, "produtos"), {
        nome: `${produto.nome} - copia`,
        categoria: produto.categoria,
        categoriaLabel: getCategoriaLabel(produto.categoria),
        preco: produto.preco,
        descricao: produto.descricao || "",
        imagemUrl: produto.imagemUrl || "",
        ativo: false,
        emOferta: produto.emOferta === true,
        destaque: false,
        controlarEstoque: produto.controlarEstoque === true,
        estoque: Number(produto.estoque || 0),
        estoqueMinimo: Number(produto.estoqueMinimo || 0),
        isMedicamento: produto.isMedicamento === true,
        principioAtivo: produto.principioAtivo || "",
        temTamanhos: produto.temTamanhos === true,
        tamanhos: produto.tamanhos || [],
        estoquePorTamanho: produto.estoquePorTamanho || {},
        filialId: produto.filialId || filialUsuarioId || null,
        filialIds: normalizarFilialIdsProduto(produto),
        filialNome: produto.filialNome || getResumoFiliaisProduto(produto),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
      showAlert("Produto duplicado", "A copia foi criada como inativa.");
    } catch (error) {
      console.error("Erro ao duplicar produto:", error);
      showAlert("Erro", "Nao foi possivel duplicar o produto.");
    }
  };

  const excluirProdutoConfirmado = async (produto: ProdutoFirestore) => {
    try {
      await deleteDoc(doc(db, "produtos", produto.id));

      if (form.id === produto.id) {
        limparForm();
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      showAlert("Erro", "Nao foi possivel excluir o produto.");
    }
  };

  const excluirProduto = (produto: ProdutoFirestore) => {
    showAlert(
      "Excluir produto",
      `${produto.nome} sera excluido permanentemente. Esta acao nao pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirProdutoConfirmado(produto),
        },
      ],
    );
  };

  const importarCatalogoInicial = async () => {
    if (produtos.length > 0) {
      showAlert(
        "Catalogo ja possui produtos",
        "A importacao inicial so fica disponivel quando nao ha produtos cadastrados.",
      );
      return;
    }

    try {
      setImportando(true);

      await Promise.all(
        produtosIniciais.map((produto) =>
          addDoc(collection(db, "produtos"), {
            ...produto,
            categoriaLabel: getCategoriaLabel(produto.categoria),
            imagemUrl: "",
            ativo: true,
            emOferta: produto.emOferta || produto.categoria === "ofertas",
            destaque: produto.destaque || false,
            controlarEstoque: false,
            estoque: 0,
            estoqueMinimo: 3,
            filialId: isAdminGeral ? null : filialUsuarioId,
            filialIds: isAdminGeral
              ? []
              : filialUsuarioId
                ? [filialUsuarioId]
                : [],
            filialNome: isAdminGeral
              ? "Todas as filiais"
              : getFilialById(filialUsuarioId)?.nome || "",
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp(),
          }),
        ),
      );
    } catch (error) {
      console.error("Erro ao importar catalogo:", error);
      showAlert("Erro", "Nao foi possivel importar o catalogo inicial.");
    } finally {
      setImportando(false);
    }
  };

  const ajustarEstoque = async (produto: ProdutoFirestore, delta: number) => {
    const estoqueAtual = Number(produto.estoque || 0);
    const proximoEstoque = Math.max(0, estoqueAtual + delta);

    try {
      await updateDoc(doc(db, "produtos", produto.id), {
        controlarEstoque: true,
        estoque: proximoEstoque,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
      showAlert("Erro", "Nao foi possivel ajustar o estoque.");
    }
  };

  const ajustarEstoqueTamanho = async (
    produto: ProdutoFirestore,
    tamanho: string,
    delta: number,
  ) => {
    const estoqueAtual = Number(produto.estoquePorTamanho?.[tamanho] || 0);
    const proximoEstoque = Math.max(0, estoqueAtual + delta);

    try {
      await updateDoc(doc(db, "produtos", produto.id), {
        controlarEstoque: true,
        [`estoquePorTamanho.${tamanho}`]: proximoEstoque,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao ajustar estoque do tamanho:", error);
      showAlert("Erro", "Nao foi possivel ajustar o estoque deste tamanho.");
    }
  };

  const renderProduto = ({ item }: { item: ProdutoFirestore }) => {
    const estoque = Number(item.estoque || 0);
    const estoqueMinimo = Number(item.estoqueMinimo || 0);
    const controlaEstoque = item.controlarEstoque === true;
    const temTamanhos = item.temTamanhos === true && (item.tamanhos?.length || 0) > 0;
    const semEstoque = controlaEstoque && !temTamanhos && estoque <= 0;
    const estoqueBaixo =
      controlaEstoque && !temTamanhos && estoque > 0 && estoque <= estoqueMinimo;

    return (
      <View style={styles.produtoCard}>
        <View style={styles.produtoTopo}>
          <View style={styles.produtoTexto}>
            <Text style={styles.produtoNome}>{item.nome}</Text>
            <Text style={styles.produtoCategoria}>
              {getCategoriaLabel(item.categoria)} - {formatarMoeda(item.preco)}
            </Text>
            {item.isMedicamento ? (
              <Text style={styles.produtoPrincipioAtivo}>
                Principio ativo: {item.principioAtivo || "Nao informado"}
              </Text>
            ) : null}
            {item.codigoBarras ? (
              <Text style={styles.produtoCodigoBarras}>
                Cod. barras: {item.codigoBarras}
              </Text>
            ) : null}
            {item.temTamanhos && item.tamanhos && item.tamanhos.length > 0 ? (
              <Text style={styles.produtoCodigoBarras}>
                Tamanhos: {item.tamanhos.join(", ")}
              </Text>
            ) : null}
            <Text style={styles.produtoFilial}>
              {item.filialNome || getResumoFiliaisProduto(item)}
            </Text>
            <ProductFilialAvailability
              filialId={item.filialId}
              filialIds={item.filialIds}
            />
          </View>
          <View style={styles.acoesProduto}>
            <TouchableOpacity
              style={styles.iconeBotao}
              onPress={() => duplicarProduto(item)}
              activeOpacity={0.85}
            >
              <Ionicons name="copy-outline" size={18} color="#1b5e20" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconeBotao}
              onPress={() => editarProduto(item)}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={19} color="#1b5e20" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconeBotaoExcluir}
              onPress={() => excluirProduto(item)}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#b91c1c" />
            </TouchableOpacity>
          </View>
        </View>

        {temTamanhos ? (
          <View style={styles.estoquePorTamanhoContainer}>
            {(item.tamanhos || []).map((tamanho) => {
              const estoqueTamanho = Number(
                item.estoquePorTamanho?.[tamanho] || 0,
              );
              const tamanhoSemEstoque = controlaEstoque && estoqueTamanho <= 0;
              const tamanhoEstoqueBaixo =
                controlaEstoque &&
                estoqueTamanho > 0 &&
                estoqueTamanho <= estoqueMinimo;

              return (
                <View
                  key={tamanho}
                  style={[
                    styles.estoqueTamanhoLinha,
                    tamanhoSemEstoque && styles.estoqueBoxZerado,
                    tamanhoEstoqueBaixo && styles.estoqueBoxBaixo,
                  ]}
                >
                  <Text style={styles.estoqueTamanhoNome}>{tamanho}</Text>
                  <Text style={styles.estoqueTamanhoTexto}>
                    {controlaEstoque ? `${estoqueTamanho} em estoque` : "Livre"}
                  </Text>
                  {controlaEstoque ? (
                    <View style={styles.estoqueAcoes}>
                      <TouchableOpacity
                        style={styles.estoqueBotao}
                        onPress={() => ajustarEstoqueTamanho(item, tamanho, -1)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="remove" size={14} color="#1b5e20" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.estoqueBotao}
                        onPress={() => ajustarEstoqueTamanho(item, tamanho, 1)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={14} color="#1b5e20" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={[
              styles.estoqueBox,
              semEstoque && styles.estoqueBoxZerado,
              estoqueBaixo && styles.estoqueBoxBaixo,
            ]}
          >
            <View style={styles.estoqueTextoArea}>
              <Text style={styles.estoqueTitulo}>
                {controlaEstoque ? `${estoque} em estoque` : "Estoque livre"}
              </Text>
              <Text style={styles.estoqueSubtitulo}>
                {controlaEstoque
                  ? `Minimo recomendado: ${estoqueMinimo}`
                  : "Venda sem controle de quantidade"}
              </Text>
            </View>
            {controlaEstoque ? (
              <View style={styles.estoqueAcoes}>
                <TouchableOpacity
                  style={styles.estoqueBotao}
                  onPress={() => ajustarEstoque(item, -1)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="remove" size={16} color="#1b5e20" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.estoqueBotao}
                  onPress={() => ajustarEstoque(item, 1)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color="#1b5e20" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.chips}>
          <Chip
            label={item.ativo ? "Ativo" : "Inativo"}
            active={item.ativo}
            onPress={() => alternarCampo(item, "ativo")}
          />
          <Chip
            label="Oferta"
            active={item.emOferta}
            onPress={() => alternarCampo(item, "emOferta")}
          />
          <Chip
            label="Destaque"
            active={item.destaque}
            onPress={() => alternarCampo(item, "destaque")}
          />
        </View>
      </View>
    );
  };

  if (!isAdminAtivo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={48} color="#1b5e20" />
          <Text style={styles.titulo}>Acesso restrito</Text>
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
          <Text style={styles.titulo}>Produtos</Text>
          <Text style={styles.subtitulo}>Edite valores, ofertas e destaques</Text>
        </View>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "produtos" && styles.abaBotaoAtiva,
          ]}
          onPress={() => selecionarAba("produtos")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "produtos" && styles.abaTextoAtivo,
            ]}
          >
            Produtos ({totalProdutos})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.abaBotao,
            abaSelecionada === "medicamentos" && styles.abaBotaoAtiva,
          ]}
          onPress={() => selecionarAba("medicamentos")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.abaTexto,
              abaSelecionada === "medicamentos" && styles.abaTextoAtivo,
            ]}
          >
            Medicamentos ({totalMedicamentos})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtosFiltrados}
        renderItem={renderProduto}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ScrollView style={styles.formCard} nestedScrollEnabled>
            <Text style={styles.formTitulo}>
              {form.id
                ? form.isMedicamento
                  ? "Editar medicamento"
                  : "Editar produto"
                : form.isMedicamento
                  ? "Adicionar medicamento"
                  : "Adicionar produto"}
            </Text>

            {produtosComAlerta.length > 0 ? (
              <View style={styles.alertaEstoqueBox}>
                <View style={styles.alertaTopo}>
                  <Ionicons name="alert-circle-outline" size={20} color="#92400e" />
                  <View style={styles.alertaTextoArea}>
                    <Text style={styles.alertaTitulo}>Alertas de estoque</Text>
                    <Text style={styles.alertaTexto}>
                      {produtosSemEstoque.length} sem estoque e{" "}
                      {produtosComEstoqueBaixo.length} com estoque baixo
                    </Text>
                  </View>
                </View>
                <View style={styles.alertaAcoes}>
                  <TouchableOpacity
                    style={styles.alertaBotao}
                    onPress={() => setStatusFiltro("sem_estoque")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.alertaBotaoTexto}>Ver sem estoque</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.alertaBotao}
                    onPress={() => setStatusFiltro("estoque_baixo")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.alertaBotaoTexto}>Ver baixo estoque</Text>
                  </TouchableOpacity>
                </View>
                {produtosComAlerta.slice(0, 4).map((produto) => (
                  <View key={`alerta-${produto.id}`} style={styles.alertaItem}>
                    <Text style={styles.alertaItemNome}>{produto.nome}</Text>
                    <Text style={styles.alertaItemQtd}>
                      {Number(produto.estoque || 0)} un.
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {produtos.length === 0 ? (
              <TouchableOpacity
                style={[styles.importarBotao, importando && styles.botaoDesativado]}
                onPress={importarCatalogoInicial}
                disabled={importando}
                activeOpacity={0.9}
              >
                {importando ? (
                  <ActivityIndicator size="small" color="#1f2937" />
                ) : (
                  <Ionicons name="cloud-download-outline" size={18} color="#1f2937" />
                )}
                <Text style={styles.importarBotaoTexto}>
                  Importar catalogo inicial
                </Text>
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={styles.input}
              value={form.nome}
              onChangeText={(nome) => setForm((prev) => ({ ...prev, nome }))}
              placeholder="Nome do produto"
              placeholderTextColor="#8a978f"
            />

            <TextInput
              style={styles.input}
              value={form.codigoBarras}
              onChangeText={(codigoBarras) =>
                setForm((prev) => ({ ...prev, codigoBarras }))
              }
              keyboardType="number-pad"
              placeholder="Codigo de barras"
              placeholderTextColor="#8a978f"
            />

            <TextInput
              style={styles.input}
              value={form.preco}
              onChangeText={(preco) => setForm((prev) => ({ ...prev, preco }))}
              keyboardType="decimal-pad"
              placeholder="Preco"
              placeholderTextColor="#8a978f"
            />

            <TextInput
              style={styles.input}
              value={form.descricao}
              onChangeText={(descricao) =>
                setForm((prev) => ({ ...prev, descricao }))
              }
              placeholder="Descricao curta"
              placeholderTextColor="#8a978f"
            />

            {form.isMedicamento ? (
              <TextInput
                style={styles.input}
                value={form.principioAtivo}
                onChangeText={(principioAtivo) =>
                  setForm((prev) => ({ ...prev, principioAtivo }))
                }
                placeholder="Principio ativo"
                placeholderTextColor="#8a978f"
              />
            ) : null}

            <TextInput
              style={styles.input}
              value={form.imagemUrl}
              onChangeText={(imagemUrl) =>
                setForm((prev) => ({ ...prev, imagemUrl }))
              }
              placeholder="URL da imagem"
              placeholderTextColor="#8a978f"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.selecionarImagemBotao,
                enviandoImagem && styles.botaoDesativado,
              ]}
              onPress={selecionarImagemDoDispositivo}
              disabled={enviandoImagem}
              activeOpacity={0.9}
            >
              {enviandoImagem ? (
                <ActivityIndicator size="small" color="#1b5e20" />
              ) : (
                <Ionicons name="image-outline" size={18} color="#1b5e20" />
              )}
              <Text style={styles.selecionarImagemBotaoTexto}>
                {enviandoImagem
                  ? "Enviando imagem..."
                  : "Selecionar imagem do dispositivo"}
              </Text>
            </TouchableOpacity>

            {!imagemUrlValida ? (
              <Text style={styles.avisoTexto}>
                Use uma URL completa, comecando com http:// ou https://.
              </Text>
            ) : null}
            {form.imagemUrl.trim() && imagemUrlValida ? (
              <View style={styles.previewImagemBox}>
                <Image
                  source={{ uri: form.imagemUrl.trim() }}
                  style={styles.previewImagem}
                  resizeMode="contain"
                />
                <Text style={styles.previewTexto}>Previa da imagem</Text>
              </View>
            ) : null}

            <View style={styles.estoqueFormBox}>
              <View style={styles.estoqueFormTopo}>
                <View style={styles.estoqueFormTextoArea}>
                  <Text style={styles.label}>Estoque do app</Text>
                  <Text style={styles.estoqueFormAjuda}>
                    Use para controlar vendas sem depender do sistema interno.
                  </Text>
                </View>
                <Chip
                  label={form.controlarEstoque ? "Controlando" : "Livre"}
                  active={form.controlarEstoque}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      controlarEstoque: !prev.controlarEstoque,
                    }))
                  }
                />
              </View>

              {form.controlarEstoque ? (
                <>
                  {form.temTamanhos ? (
                    <Text style={styles.avisoTexto}>
                      Este produto tem tamanhos - a quantidade e definida por
                      tamanho, logo abaixo.
                    </Text>
                  ) : null}
                  <View style={styles.estoqueInputs}>
                    {form.temTamanhos ? null : (
                      <View style={styles.estoqueInputGrupo}>
                        <Text style={styles.inputLabel}>Quantidade atual</Text>
                        <TextInput
                          style={styles.input}
                          value={form.estoque}
                          onChangeText={(estoque) =>
                            setForm((prev) => ({ ...prev, estoque }))
                          }
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor="#8a978f"
                        />
                      </View>
                    )}
                    <View style={styles.estoqueInputGrupo}>
                      <Text style={styles.inputLabel}>Alerta minimo</Text>
                      <TextInput
                        style={styles.input}
                        value={form.estoqueMinimo}
                        onChangeText={(estoqueMinimo) =>
                          setForm((prev) => ({ ...prev, estoqueMinimo }))
                        }
                        keyboardType="number-pad"
                        placeholder="3"
                        placeholderTextColor="#8a978f"
                      />
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.estoqueFormBox}>
              <View style={styles.estoqueFormTopo}>
                <View style={styles.estoqueFormTextoArea}>
                  <Text style={styles.label}>Tamanhos</Text>
                  <Text style={styles.estoqueFormAjuda}>
                    Use para produtos com mais de um tamanho (ex.: fraldas).
                  </Text>
                </View>
                <Chip
                  label={form.temTamanhos ? "Ativado" : "Desativado"}
                  active={form.temTamanhos}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      temTamanhos: !prev.temTamanhos,
                    }))
                  }
                />
              </View>

              {form.temTamanhos ? (
                <>
                  <View style={styles.tamanhoInputLinha}>
                    <TextInput
                      style={[styles.input, styles.tamanhoInput]}
                      value={novoTamanho}
                      onChangeText={setNovoTamanho}
                      onSubmitEditing={adicionarTamanho}
                      placeholder="Ex.: P, M, G, RN"
                      placeholderTextColor="#8a978f"
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.tamanhoAdicionarBotao}
                      onPress={adicionarTamanho}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={20} color="#1b5e20" />
                    </TouchableOpacity>
                  </View>

                  {form.tamanhos.length > 0 ? (
                    form.controlarEstoque ? (
                      <View style={styles.tamanhosComEstoqueLista}>
                        {form.tamanhos.map((tamanho, index) => (
                          <View
                            key={`${tamanho}-${index}`}
                            style={styles.tamanhoComEstoqueLinha}
                          >
                            <Text style={styles.tamanhoComEstoqueNome}>
                              {tamanho}
                            </Text>
                            <TextInput
                              style={[styles.input, styles.tamanhoEstoqueInput]}
                              value={form.estoquePorTamanho[tamanho] ?? "0"}
                              onChangeText={(valor) =>
                                setForm((prev) => ({
                                  ...prev,
                                  estoquePorTamanho: {
                                    ...prev.estoquePorTamanho,
                                    [tamanho]: valor,
                                  },
                                }))
                              }
                              keyboardType="number-pad"
                              placeholder="0"
                              placeholderTextColor="#8a978f"
                            />
                            <TouchableOpacity
                              style={styles.tamanhoComEstoqueRemover}
                              onPress={() => removerTamanho(index)}
                            >
                              <Ionicons name="close" size={16} color="#b91c1c" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.tamanhosLista}>
                        {form.tamanhos.map((tamanho, index) => (
                          <View key={`${tamanho}-${index}`} style={styles.tamanhoTag}>
                            <Text style={styles.tamanhoTagTexto}>{tamanho}</Text>
                            <TouchableOpacity onPress={() => removerTamanho(index)}>
                              <Ionicons name="close" size={14} color="#1b5e20" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )
                  ) : null}
                </>
              ) : null}
            </View>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categorias}>
              {categorias.map((categoria) => {
                const active = form.categoria === categoria;

                return (
                  <TouchableOpacity
                    key={categoria}
                    style={[styles.categoriaBotao, active && styles.categoriaBotaoAtivo]}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        categoria,
                        emOferta: categoria === "ofertas" ? true : prev.emOferta,
                      }))
                    }
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.categoriaBotaoTexto,
                        active && styles.categoriaBotaoTextoAtivo,
                      ]}
                    >
                      {getCategoriaLabel(categoria)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Filiais que possuem o produto</Text>
            {isAdminGeral ? (
              <View style={styles.categorias}>
                <TouchableOpacity
                  style={[
                    styles.categoriaBotao,
                    form.filialIds.length === 0 && styles.categoriaBotaoAtivo,
                  ]}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      filialId: null,
                      filialIds: [],
                    }))
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.categoriaBotaoTexto,
                      form.filialIds.length === 0 &&
                        styles.categoriaBotaoTextoAtivo,
                    ]}
                  >
                    Todas
                  </Text>
                </TouchableOpacity>
                {filiais.map((filial) => {
                  const active = form.filialIds.includes(filial.id);

                  return (
                    <TouchableOpacity
                      key={filial.id}
                      style={[
                        styles.categoriaBotao,
                        active && styles.categoriaBotaoAtivo,
                      ]}
                      onPress={() => alternarFilialProduto(filial.id)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.categoriaBotaoTexto,
                          active && styles.categoriaBotaoTextoAtivo,
                        ]}
                      >
                        {filial.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.filialTravada}>
                <Ionicons name="storefront-outline" size={18} color="#1b5e20" />
                <Text style={styles.filialTravadaTexto}>
                  {getFilialById(filialUsuarioId)?.nome ||
                    "Vincule uma filial ao seu usuario"}
                </Text>
              </View>
            )}

            <View style={styles.chips}>
              <Chip
                label="Ativo"
                active={form.ativo}
                onPress={() => setForm((prev) => ({ ...prev, ativo: !prev.ativo }))}
              />
              <Chip
                label="Oferta"
                active={form.emOferta}
                onPress={() =>
                  setForm((prev) => ({ ...prev, emOferta: !prev.emOferta }))
                }
              />
              <Chip
                label="Destaque"
                active={form.destaque}
                onPress={() =>
                  setForm((prev) => ({ ...prev, destaque: !prev.destaque }))
                }
              />
            </View>

            <TouchableOpacity
              style={[styles.salvarBotao, salvando && styles.botaoDesativado]}
              onPress={salvarProduto}
              disabled={salvando}
              activeOpacity={0.9}
            >
              {salvando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#fff" />
              )}
              <Text style={styles.salvarBotaoTexto}>
                {form.id ? "Salvar alteracoes" : "Adicionar produto"}
              </Text>
            </TouchableOpacity>

            {form.id ? (
              <TouchableOpacity style={styles.cancelarBotao} onPress={limparForm}>
                <Text style={styles.cancelarBotaoTexto}>Cancelar edicao</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.buscaContainer}>
              <Ionicons name="search" size={19} color="#6b7280" />
              <TextInput
                style={styles.buscaInput}
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar produto cadastrado"
                placeholderTextColor="#8a978f"
              />
            </View>

            <Text style={styles.label}>Filtrar produtos</Text>
            <View style={styles.categorias}>
              <TouchableOpacity
                style={[
                  styles.categoriaBotao,
                  categoriaFiltro === "todas" && styles.categoriaBotaoAtivo,
                ]}
                onPress={() => setCategoriaFiltro("todas")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.categoriaBotaoTexto,
                    categoriaFiltro === "todas" &&
                      styles.categoriaBotaoTextoAtivo,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {categorias.map((categoria) => {
                const active = categoriaFiltro === categoria;

                return (
                  <TouchableOpacity
                    key={`filtro-${categoria}`}
                    style={[
                      styles.categoriaBotao,
                      active && styles.categoriaBotaoAtivo,
                    ]}
                    onPress={() => setCategoriaFiltro(categoria)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.categoriaBotaoTexto,
                        active && styles.categoriaBotaoTextoAtivo,
                      ]}
                    >
                      {getCategoriaLabel(categoria)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.chips}>
              {filtrosStatus.map((filtro) => (
                <Chip
                  key={filtro.value}
                  label={filtro.label}
                  active={statusFiltro === filtro.value}
                  onPress={() => setStatusFiltro(filtro.value)}
                />
              ))}
            </View>

            <Text style={styles.resultadoTexto}>
              {produtosFiltrados.length} de {produtosPorAba.length}{" "}
              {abaSelecionada === "medicamentos" ? "medicamentos" : "produtos"}
            </Text>
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            {loading ? (
              <ActivityIndicator size="large" color="#1b5e20" />
            ) : (
              <>
                <Ionicons name="cube-outline" size={48} color="#1b5e20" />
                <Text style={styles.emptyTexto}>Nenhum produto cadastrado.</Text>
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
  onPress: () => void;
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
    padding: 16,
    gap: 12,
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
  abas: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  abaBotao: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  abaBotaoAtiva: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },
  abaTexto: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  abaTextoAtivo: {
    color: "#fff",
  },
  lista: { padding: 16, paddingTop: 0, paddingBottom: 30 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 16,
    marginBottom: 14,
  },
  formTitulo: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  alertaEstoqueBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 12,
    marginBottom: 12,
  },
  alertaTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  alertaTextoArea: { flex: 1 },
  alertaTitulo: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "900",
  },
  alertaTexto: {
    color: "#92400e",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  alertaAcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  alertaBotao: {
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fed7aa",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  alertaBotaoTexto: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "800",
  },
  alertaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#fed7aa",
    paddingTop: 8,
    marginTop: 8,
  },
  alertaItemNome: {
    flex: 1,
    color: "#1f2937",
    fontSize: 12,
    fontWeight: "800",
  },
  alertaItemQtd: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    color: "#1f2937",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  label: { color: "#374151", fontSize: 13, fontWeight: "800", marginBottom: 8 },
  categorias: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  categoriaBotao: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  categoriaBotaoAtivo: { backgroundColor: "#1b5e20", borderColor: "#1b5e20" },
  categoriaBotaoTexto: { color: "#1b5e20", fontSize: 12, fontWeight: "800" },
  categoriaBotaoTextoAtivo: { color: "#fff" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7e7d9",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipAtivo: { backgroundColor: "#e8f5e9", borderColor: "#1b5e20" },
  chipTexto: { color: "#6b7280", fontSize: 12, fontWeight: "800" },
  chipTextoAtivo: { color: "#1b5e20" },
  salvarBotao: {
    backgroundColor: "#1b5e20",
    borderRadius: 14,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  importarBotao: {
    backgroundColor: "#f4c542",
    borderRadius: 14,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  importarBotaoTexto: { color: "#1f2937", fontSize: 14, fontWeight: "800" },
  botaoDesativado: { opacity: 0.7 },
  salvarBotaoTexto: { color: "#fff", fontSize: 14, fontWeight: "800" },
  cancelarBotao: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  cancelarBotaoTexto: { color: "#1b5e20", fontSize: 14, fontWeight: "800" },
  buscaContainer: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 12,
  },
  buscaInput: { flex: 1, color: "#1f2937", fontSize: 14, paddingVertical: 10 },
  avisoTexto: {
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
    marginTop: -4,
    marginBottom: 10,
  },
  estoqueFormBox: {
    backgroundColor: "#f8faf8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 12,
    marginBottom: 12,
  },
  estoqueFormTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  estoqueFormTextoArea: {
    flex: 1,
  },
  estoqueFormAjuda: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: -4,
  },
  estoqueInputs: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  estoqueInputGrupo: {
    flex: 1,
  },
  tamanhoInputLinha: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tamanhoInput: {
    flex: 1,
  },
  tamanhoAdicionarBotao: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  tamanhosLista: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tamanhoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tamanhoTagTexto: {
    color: "#1b5e20",
    fontWeight: "700",
    fontSize: 13,
  },
  tamanhosComEstoqueLista: {
    gap: 8,
  },
  tamanhoComEstoqueLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4f8f5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tamanhoComEstoqueNome: {
    color: "#1b5e20",
    fontWeight: "800",
    fontSize: 14,
    width: 40,
  },
  tamanhoEstoqueInput: {
    flex: 1,
    paddingVertical: 8,
  },
  tamanhoComEstoqueRemover: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  selecionarImagemBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  selecionarImagemBotaoTexto: {
    color: "#1b5e20",
    fontWeight: "700",
    fontSize: 13,
  },
  previewImagemBox: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  previewImagem: { width: "100%", height: 120 },
  previewTexto: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  resultadoTexto: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  produtoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2ee",
    padding: 14,
    marginBottom: 12,
  },
  produtoTopo: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  produtoTexto: { flex: 1 },
  produtoNome: { color: "#1f2937", fontSize: 15, fontWeight: "800" },
  produtoCategoria: { color: "#6b7280", fontSize: 13, marginTop: 4 },
  produtoPrincipioAtivo: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  produtoCodigoBarras: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  produtoFilial: { color: "#1b5e20", fontSize: 12, fontWeight: "800", marginTop: 4 },
  estoqueBox: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  estoqueBoxBaixo: {
    backgroundColor: "#fff8db",
    borderColor: "#f4d36c",
  },
  estoqueBoxZerado: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  estoquePorTamanhoContainer: {
    gap: 6,
    marginTop: 12,
    marginBottom: 10,
  },
  estoqueTamanhoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  estoqueTamanhoNome: {
    color: "#1b5e20",
    fontWeight: "800",
    fontSize: 13,
    width: 32,
  },
  estoqueTamanhoTexto: {
    flex: 1,
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
  },
  estoqueTextoArea: {
    flex: 1,
  },
  estoqueTitulo: {
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "900",
  },
  estoqueSubtitulo: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  estoqueAcoes: {
    flexDirection: "row",
    gap: 8,
  },
  estoqueBotao: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d7e7d9",
  },
  filialTravada: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#edf2ee",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    marginBottom: 12,
  },
  filialTravadaTexto: { color: "#374151", fontSize: 13, fontWeight: "800", flex: 1 },
  acoesProduto: { flexDirection: "row", gap: 8 },
  iconeBotao: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconeBotaoExcluir: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTexto: { color: "#6b7280", fontSize: 14, marginTop: 10 },
});
