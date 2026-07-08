# Guia de producao

Este checklist ajuda a fechar uma versao do app sem depender de editar codigo no dia a dia.

## Propriedade intelectual

- Software: `System Delivery Farmacia`.
- Titular: Vinicius Piana Lanzarin.
- Licenca: proprietaria, todos os direitos reservados.
- Antes de entregar para cliente, formalizar contrato de licenca de uso,
  implantacao ou suporte, sem transferencia automatica do codigo-fonte.

## Antes de gerar build

- Confirmar que as regras do Firestore foram publicadas:

```powershell
npx firebase-tools deploy --only firestore:rules
```

- Atualizar os dados reais da rede em `constants/farmacia.ts`:
  - nome fantasia;
  - telefone/WhatsApp principal;
  - e-mail;
  - horario geral, quando houver.

- Atualizar os dados de cada filial em `constants/filiais.ts`:
  - endereco;
  - telefone/WhatsApp;
  - horario;
  - CNPJ;
  - razao social;
  - responsavel tecnico;
  - CRF;
  - AFE;
  - bairros e prefixos de CEP de atendimento.

- Revisar a cobertura e as taxas de entrega em `constants/entrega.ts`:
  - bairro;
  - filial responsavel;
  - zona de distancia;
  - valor da taxa;
  - aliases e prefixos de CEP.

- Revisar os textos de `constants/legal.ts` com o responsavel da farmacia ou
  assessoria juridica antes de publicar em loja.

- Entrar com um usuario admin ativo e validar:
  - cadastro, edicao e desativacao de produtos;
  - marcacao de ofertas e destaques;
  - pedidos de entrega e retirada;
  - taxa de entrega somada ao pedido conforme bairro;
  - painel de pedidos da farmacia;
  - painel do entregador;
  - notificacoes internas.
  - cadastro com aceite de termos;
  - acesso a Politica de Privacidade e Termos de Uso;
  - dados regulatorios por filial na tela `Dados da farmacia`.
  - tela `Sobre o sistema` no menu de admin.

- Para apresentacao comercial, seguir o roteiro em
  `docs/roteiro-apresentacao.md`.

- Para homologacao completa antes de entregar ou publicar, seguir o roteiro em
  `docs/roteiro-testes.md`.

- Rodar as validacoes locais:

```powershell
npx tsc --noEmit --pretty false
npm run lint -- --max-warnings=0
npx expo-doctor
```

## Produtos

- Usar o painel `Conta > Gerenciar produtos`.
- Preferir imagens hospedadas em links HTTPS diretos.
- Criar copias de produtos como inativas quando precisar cadastrar variacoes.
- Desativar produtos indisponiveis em vez de alterar o codigo do app.
- Se o Firestore estiver vazio, usar o botao `Importar catalogo inicial` no
  painel de produtos para carregar a massa demo.

## Publicacao em loja

- Preencher a secao de privacidade/dados da Play Store/App Store com base nos
  dados coletados pelo app: conta, contato, endereco, historico de pedidos e
  identificadores tecnicos.
- Conferir licencas sanitarias e regras locais para venda, entrega e retirada
  de medicamentos.
- Para produtos com receita ou controle especial, manter validacao manual antes
  da dispensacao.
- Pagamentos online permanecem fora do escopo desta versao. Usar cobranca
  manual, Pix operacional ou cartao na entrega ate a integracao do provedor.

## Pedidos

- Usar filtros por status e busca por cliente, telefone ou bairro.
- Usar a observacao interna para informacoes da equipe.
- Usar o botao WhatsApp para falar com o cliente quando houver telefone.

## Build Android

```powershell
eas build -p android --profile preview
```

## iOS

Para teste externo em iPhone, planejar TestFlight com Apple Developer Program.
