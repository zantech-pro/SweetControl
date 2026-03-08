# SweetControl - Roadmap por Etapas

Este documento organiza o projeto em fases pequenas, para implementar e testar cada funcionalidade separadamente.

## Etapa 0 - Base Tecnica (concluida)
- Ajustar estrutura do Expo Router.
- Garantir Redux + Redux Persist ativos.
- Validar build com `npx tsc --noEmit` e `npm run lint`.

## Etapa 1 - Fundacao Offline First
- Criar `api/client` com Axios (baseURL configuravel por `.env`).
- Criar camada local (fila de sincronizacao) para operacoes CRUD offline.
- Salvar no Redux Persist:
  - sessao da usuaria (`usuario_id`, token quando existir)
  - dados de referencia (categorias, produtos, clientes)
  - fila `pendingSync` (POST/PUT/DELETE pendentes).
- Implementar servico de sincronizacao:
  - enviar pendencias quando houver internet
  - marcar status `offline/sincronizado` na venda.

Tabelas foco:
- `usuarios`
- `categorias_produtos`
- `produtos`
- `clientes`
- `vendas` (campo `status_sincronizacao`)

## Etapa 2 - Cadastros Basicos
- Tela e fluxo CRUD de:
  - Categorias
  - Produtos
  - Clientes
  - Fornecedores
- Validacoes de formulario (campos obrigatorios, mascara, valores monetarios).
- Busca e filtros locais (sem depender da API).

Tabelas foco:
- `categorias_produtos`
- `produtos`
- `clientes`
- `fornecedores`

## Etapa 3 - Vendas e Baixa de Estoque
- Fluxo de nova venda:
  - selecionar cliente (opcional)
  - incluir itens de produto
  - aplicar desconto
  - calcular `total_bruto` e `total_liquido`
  - definir `metodo_pagamento`.
- Gravar itens da venda e movimentacao de estoque automaticamente.
- Permitir venda offline com sincronizacao posterior.

Tabelas foco:
- `vendas`
- `itens_venda`
- `movimentacoes_estoque`

## Etapa 4 - Compras e Entrada de Estoque
- Fluxo de compras por fornecedor.
- Registro de itens de compra com subtotal.
- Lancamento automatico de entrada no estoque.

Tabelas foco:
- `compras_fornecedor`
- `itens_compra`
- `movimentacoes_estoque`

## Etapa 5 - Gastos Extras e Resultado Mensal
- CRUD de gastos extras por categoria e metodo de pagamento.
- Consolidacao financeira mensal:
  - receita liquida de vendas
  - custo de produtos vendidos
  - gastos extras
  - lucro/prejuizo.

Tabelas foco:
- `gastos_extras`
- `vendas`
- `itens_venda`

## Etapa 6 - Templates de Marketing (WhatsApp)
- Modulo de templates editaveis:
  - tabela de precos
  - promocoes sazonais
  - mensagem pronta para WhatsApp.
- Exportar texto/imagem para compartilhamento rapido.

## Etapa 7 - BI e Relatorios
- Dashboard mensal com:
  - faturamento
  - lucro estimado
  - produtos mais vendidos
  - ticket medio
  - comparativo mes a mes.
- Relatorio em PDF (opcional) para historico.

## Etapa 8 - Publicacao e Operacao
- Build Android e iOS.
- Checklist de seguranca:
  - hash de senha
  - token de autenticacao
  - validacao server-side.
- Backup e rotina de monitoramento da API.

## Ordem recomendada de commits (manual)
1. Estrutura de navegacao + store base.
2. Fundacao Offline First (fila e sync).
3. CRUD de cadastros.
4. Fluxo completo de vendas.
5. Fluxo de compras.
6. Gastos extras.
7. Templates WhatsApp.
8. Dashboard BI.

## Criterios de sucesso do projeto
- Operar sem internet sem perder dados.
- Sincronizar automaticamente quando a conexao voltar.
- Eliminar uso de papel para vendas, estoque e gastos.
- Exibir resultado mensal com clareza para tomada de decisao.
