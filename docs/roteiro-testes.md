# Roteiro de testes

Use este roteiro antes de apresentar, publicar ou entregar uma nova versao do
app. A ideia e validar o fluxo completo como cliente, admin, entregador e
operacao da farmacia.

## Preparacao

- Atualizar dependencias com `npm install` quando houver mudanca no
  `package-lock.json`.
- Confirmar que o app abre sem erro em ambiente local:

```powershell
npx expo start
```

- Rodar validacoes tecnicas:

```powershell
npx tsc --noEmit --pretty false
npm run lint -- --max-warnings=0
npm test
npx expo-doctor
```

- Rodar auditoria de dependencias:

```powershell
npm audit --audit-level=moderate
cd functions
npm audit --audit-level=moderate
```

- Confirmar que nao ha arquivos indevidos no projeto, principalmente
  instaladores, APKs antigos, logs grandes ou arquivos de teste em
  `assets/images`.
- Usar pelo menos tres usuarios de teste:
  - cliente ativo;
  - admin geral ativo;
  - entregador ativo vinculado a uma filial.
- Se for testar admin de filial, criar tambem um admin com `filialId`
  preenchido.

## Autenticacao e conta

- Criar nova conta de cliente em `Cadastro`.
- Validar aceite de termos antes de concluir o cadastro, se aplicavel.
- Fazer login com cliente existente.
- Fazer logout e login novamente.
- Testar recuperacao de senha com e-mail valido.
- Testar login com senha incorreta e confirmar mensagem amigavel.
- Entrar com usuario desativado e confirmar bloqueio de acesso.
- Editar dados da conta e confirmar persistencia apos fechar e abrir o app.
- Acessar `Termos de Uso`, `Politica de Privacidade`, `Dados da farmacia` e
  `Sobre o sistema`.

Resultado esperado:

- Usuario cliente consegue acessar apenas areas de cliente.
- Admin e entregador enxergam seus menus conforme perfil.
- Conta desativada nao consegue operar o app.

## Catalogo e navegacao

- Abrir a home e confirmar carregamento de produtos.
- Navegar pelas abas:
  - Inicio;
  - Ofertas;
  - Manipulados;
  - Perfumaria;
  - Higiene;
  - Baby;
  - Carrinho;
  - Conta.
- Testar busca por nome de produto existente.
- Testar busca sem resultado.
- Abrir produto de cada categoria, quando houver.
- Confirmar exibicao correta de preco, imagem, categoria, oferta e destaque.
- Alternar filial pelo seletor e confirmar produtos disponiveis por filial.
- Confirmar que produtos inativos nao aparecem para o cliente.
- Confirmar que produtos sem estoque, quando estoque for controlado, nao podem
  gerar pedido acima da quantidade disponivel.

Resultado esperado:

- Catalogo carrega sem tela quebrada, sem texto cortado e sem produto
  indisponivel aparecendo como compravel.

## Carrinho

- Adicionar um produto ao carrinho pela home.
- Adicionar produtos de categorias diferentes.
- Aumentar e diminuir quantidade.
- Remover item.
- Esvaziar carrinho.
- Fechar e abrir o app e confirmar comportamento esperado do carrinho.
- Tentar finalizar com carrinho vazio.
- Validar soma de subtotal com varias quantidades.
- Validar produtos de filial diferente da filial selecionada.

Resultado esperado:

- Total sempre bate com preco x quantidade.
- Carrinho nao permite finalizar pedido invalido.

## Checkout de entrega

- Finalizar pedido como entrega usando CEP valido.
- Confirmar preenchimento automatico por ViaCEP.
- Testar CEP inexistente.
- Testar CEP valido com bairro sem cobertura.
- Testar bairro coberto por cada filial.
- Confirmar filial sugerida por bairro/CEP.
- Confirmar taxa de entrega aplicada corretamente.
- Salvar endereco.
- Editar endereco salvo.
- Excluir endereco salvo.
- Finalizar pedido com endereco salvo.
- Tentar finalizar sem nome.
- Tentar finalizar sem telefone.
- Tentar finalizar sem numero.
- Tentar finalizar sem bairro.
- Tentar finalizar fora da area de cobertura.

Resultado esperado:

- Pedido de entrega so e criado com endereco completo e cobertura valida.
- Taxa de entrega no app bate com `constants/entrega.ts`.
- Pedido salvo contem `filialId`, dados de entrega e total correto.

## Checkout de retirada

- Selecionar retirada no checkout.
- Escolher cada filial disponivel.
- Confirmar endereco da filial selecionada.
- Finalizar pedido de retirada.
- Confirmar que retirada nao soma taxa de entrega.
- Confirmar que pedido salvo contem dados da filial de retirada.

Resultado esperado:

- Pedido de retirada fica sem taxa de entrega e vinculado a filial correta.

## Pagamentos

- Criar pedido com `Dinheiro`.
- Criar pedido com dinheiro e troco.
- Tentar troco menor ou igual ao total do pedido.
- Criar pedido com `Cartao na entrega`.
- Criar pedido com `Pix`.
- Criar pedido com `Cartao online`.
- Para Pix online:
  - confirmar chamada da funcao `criarPagamentoPix`;
  - confirmar exibicao de QR Code ou mensagem de falha amigavel;
  - confirmar status inicial do pagamento.
- Para cartao online:
  - confirmar chamada da funcao `criarPagamentoCartao`;
  - confirmar abertura do link do Mercado Pago quando existir;
  - confirmar status inicial do pagamento.
- No detalhe do pedido, usar `Gerar pagamento novamente`.
- Testar webhook do provedor em ambiente de teste, quando configurado.
- Confirmar que pagamento aprovado atualiza `pagamentoDetalhes.status`.

Resultado esperado:

- Pagamento manual fica registrado como pendente/a receber.
- Pagamento online nao expoe token secreto no app.
- Falha do provedor nao apaga o pedido criado.

## Pedidos do cliente

- Abrir `Meus pedidos`.
- Confirmar listagem dos pedidos do cliente logado.
- Abrir detalhe do pedido.
- Confirmar codigo do pedido, data, filial, endereco, itens, subtotal, taxa,
  total, forma de pagamento e status.
- Confirmar timeline de status.
- Confirmar atualizacao em tempo real quando admin muda status.
- Confirmar que cliente nao acessa pedido de outro cliente.
- Confirmar exibicao de Pix copia e cola, QR Code ou link de pagamento quando
  existirem.

Resultado esperado:

- Cliente visualiza apenas os proprios pedidos e recebe atualizacao correta.

## Notificacoes

- Criar novo pedido e confirmar notificacao para admin.
- Marcar notificacao como lida.
- Confirmar que notificacao lida nao volta como pendente.
- Confirmar que usuario cliente nao le notificacao destinada apenas a admin.
- Confirmar que notificacoes do pedido aparecem em tempo adequado.

Resultado esperado:

- Notificacoes respeitam perfil e estado de leitura.

## Painel admin: pedidos

- Entrar como admin geral.
- Abrir `Painel da farmacia`.
- Confirmar listagem de pedidos de todas as filiais.
- Filtrar por status.
- Buscar por cliente, telefone ou bairro.
- Abrir pedido.
- Alterar status:
  - recebido;
  - preparo;
  - pronto para retirada;
  - entrega;
  - entregue;
  - finalizado.
- Atribuir entregador.
- Adicionar observacao interna.
- Testar botao de WhatsApp do cliente.
- Confirmar que alteracoes aparecem no detalhe do cliente.
- Entrar como admin de filial.
- Confirmar que admin de filial ve apenas pedidos da propria filial.
- Tentar alterar pedido de outra filial.

Resultado esperado:

- Admin geral opera tudo.
- Admin de filial nao acessa nem edita dados de outra filial.
- Status e observacoes nao alteram total, itens ou cliente.

## Painel admin: produtos

- Importar catalogo inicial, se o Firestore estiver vazio.
- Criar produto novo.
- Editar nome, preco, categoria e imagem.
- Marcar produto como destaque.
- Marcar produto como oferta.
- Desativar produto.
- Reativar produto.
- Vincular produto a uma filial.
- Vincular produto a varias filiais, quando permitido.
- Ativar controle de estoque.
- Definir estoque e estoque minimo.
- Fazer pedido e confirmar baixa de estoque.
- Tentar comprar acima do estoque disponivel.
- Confirmar produto criado/editado no catalogo do cliente.
- Testar admin de filial editando apenas produto da propria filial.

Resultado esperado:

- Produto editado aparece corretamente para cliente.
- Estoque controlado baixa apenas quando pedido e criado com sucesso.
- Regras impedem edicao cruzada indevida.

## Painel admin: usuarios

- Entrar como admin geral.
- Listar usuarios.
- Alterar perfil de cliente para entregador.
- Alterar perfil para admin.
- Vincular usuario a filial.
- Marcar admin como admin geral.
- Desativar usuario.
- Reativar usuario.
- Entrar com usuario alterado e confirmar menu/permissoes.
- Entrar como admin de filial e confirmar que lista apenas usuarios da filial.

Resultado esperado:

- Perfis e filiais refletem no app sem precisar editar codigo.
- Admin de filial nao consegue transformar usuario em admin geral indevidamente.

## Painel admin: relatorios

- Abrir relatorios como admin geral.
- Confirmar valores totais de pedidos.
- Confirmar contagem por status.
- Confirmar filtros por filial, quando houver.
- Criar novo pedido e confirmar atualizacao dos indicadores.
- Confirmar que pedidos cancelados/finalizados entram na regra esperada.
- Abrir relatorios como admin de filial.

Resultado esperado:

- Numeros dos relatorios batem com os pedidos existentes no Firestore.
- Admin de filial ve apenas dados da propria filial.

## Area do entregador

- Entrar como entregador ativo.
- Confirmar que a tela de entregas abre.
- Confirmar que aparecem apenas entregas atribuidas ao entregador.
- Confirmar que entregador nao ve pedidos de outra filial.
- Abrir entrega.
- Finalizar entrega.
- Confirmar que status muda para `entregue`.
- Confirmar que detalhe do cliente e painel admin atualizam em tempo real.
- Tentar acessar area do entregador com cliente comum.

Resultado esperado:

- Entregador opera apenas pedidos atribuidos a ele.
- Finalizacao registra data e status corretamente.

## Multi-filial

- Validar dados de cada filial em `Dados da farmacia`.
- Confirmar telefone, WhatsApp, endereco, horario, CNPJ, razao social,
  responsavel tecnico, CRF e AFE.
- Fazer pedido de entrega em bairro de cada filial.
- Fazer pedido de retirada em cada filial.
- Confirmar produto global disponivel em todas as filiais.
- Confirmar produto exclusivo de filial aparece apenas onde deve.
- Confirmar admin geral ve todas as filiais.
- Confirmar admin de filial ve apenas sua unidade.
- Confirmar entregador vinculado a filial nao ve entregas de outra unidade.

Resultado esperado:

- Dados, produtos, pedidos e usuarios respeitam separacao por filial.

## Regras do Firestore e seguranca

- Publicar regras antes do teste final:

```powershell
npx firebase-tools deploy --only firestore:rules
```

- Cliente nao deve criar pedido diretamente em `pedidos`.
- Cliente nao deve alterar total, itens ou status do pedido.
- Cliente deve conseguir ler apenas os proprios pedidos.
- Admin deve conseguir alterar apenas campos permitidos do pedido.
- Admin de filial nao deve acessar outra filial.
- Entregador deve conseguir finalizar apenas pedido atribuido a ele.
- Produto deve ser criado/editado apenas por admin permitido.
- Sequencias de cliente e pedido devem ser alteradas apenas pela Cloud Function.
- Tokens, secrets e chaves privadas nao podem estar no app.

Resultado esperado:

- Toda tentativa indevida retorna erro de permissao.
- Fluxos validos continuam funcionando normalmente.

## Cloud Functions

- Deployar funcoes em ambiente de teste:

```powershell
firebase deploy --only functions
```

- Confirmar que `criarPedido` cria pedidos com codigo sequencial.
- Confirmar que `criarPedido` recalcula subtotal, taxa e total no backend.
- Confirmar que pedido com produto inexistente e rejeitado.
- Confirmar que pedido com produto inativo e rejeitado.
- Confirmar que estoque insuficiente e rejeitado.
- Confirmar que pedido fora da filial do produto e rejeitado.
- Confirmar que `criarPagamentoPix` exige usuario autenticado.
- Confirmar que `criarPagamentoCartao` exige usuario autenticado.
- Confirmar que usuario nao consegue gerar pagamento de pedido de outro usuario.
- Confirmar que webhook atualiza pedido correto pelo `external_reference`.

Resultado esperado:

- Backend e a fonte da verdade para pedido, preco, estoque, filial e pagamento.

## Legal, dados e loja

- Revisar textos de `Politica de Privacidade`.
- Revisar textos de `Termos de Uso`.
- Confirmar canal de privacidade e e-mail de contato.
- Confirmar dados regulatorios das filiais.
- Confirmar que informacoes de saude/pedidos ficam acessiveis apenas a quem
  precisa operar o atendimento.
- Validar formulario de dados coletados para Play Store/App Store.
- Confirmar icone, splash, nome do app e package/bundle.
- Conferir screenshots e descricao da loja.

Resultado esperado:

- App esta coerente com LGPD, operacao farmaceutica e exigencias de loja.

## Build e instalacao

- Gerar build de preview:

```powershell
eas build -p android --profile preview
```

- Instalar APK/AAB em aparelho real Android.
- Testar primeiro acesso em rede movel.
- Testar primeiro acesso em Wi-Fi.
- Testar em aparelho pequeno e aparelho grande.
- Testar permissao de abrir links externos, WhatsApp e Mercado Pago.
- Confirmar que nao ha tela branca apos fechar e abrir o app.
- Confirmar que splash, icone e nome aparecem corretamente.
- Para iOS, testar via TestFlight antes de publicar.

Resultado esperado:

- Build instalada funciona igual ao ambiente local e nao depende do computador
  de desenvolvimento.

## Regressao rapida antes de entrega

Execute este fluxo no final:

1. Login como cliente.
2. Selecionar filial.
3. Adicionar produto ao carrinho.
4. Criar pedido de entrega.
5. Abrir detalhe do pedido.
6. Login como admin.
7. Alterar status do pedido.
8. Atribuir entregador.
9. Login como entregador.
10. Finalizar entrega.
11. Voltar como cliente e confirmar status final.
12. Editar produto no admin.
13. Confirmar alteracao no catalogo.
14. Criar pedido de retirada.
15. Validar relatorios.

## Criterio de aprovacao

- Todos os comandos tecnicos passam sem erro.
- Nao ha vulnerabilidade critica ou alta sem justificativa documentada.
- Nao ha arquivo grande ou indevido no repositorio/assets.
- Cliente consegue comprar por entrega e retirada.
- Admin consegue operar pedidos, produtos, usuarios e relatorios.
- Entregador consegue finalizar entrega.
- Firestore Rules bloqueiam acessos indevidos.
- Dados reais da farmacia foram revisados.
- Textos legais foram revisados.
- Build final foi testada em aparelho real.

## Registro de problemas

Para cada erro encontrado, registrar:

- data;
- usuario usado;
- aparelho/navegador;
- tela;
- passo executado;
- resultado esperado;
- resultado obtido;
- print ou video, quando possivel;
- prioridade: critica, alta, media ou baixa;
- responsavel pela correcao;
- status: aberto, corrigido ou retestado.
