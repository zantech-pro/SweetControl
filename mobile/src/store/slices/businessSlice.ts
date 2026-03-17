import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MetodoPagamento = 'pix' | 'dinheiro' | 'cartao' | 'transferencia';

export type ItemVenda = {
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

export type Venda = {
  id: number;
  usuario_id: number;
  cliente_id: number | null;
  cliente_nome: string | null;
  itens: ItemVenda[];
  total_bruto: number;
  desconto: number;
  total_liquido: number;
  metodo_pagamento: MetodoPagamento;
  status_venda: 'pendente' | 'pago' | 'cancelado';
  data_venda: string;
  status_sincronizacao: 'offline' | 'sincronizado';
};

export type MovimentacaoEstoque = {
  id: number;
  usuario_id: number;
  produto_id: number;
  produto_nome: string;
  tipo_movimento: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  referencia_tipo: 'venda' | 'compra' | 'ajuste';
  referencia_id: number | null;
  data_movimento: string;
};

export type GastoExtra = {
  id: number;
  usuario_id: number;
  categoria: string;
  descricao: string;
  valor: number;
  metodo_pagamento: MetodoPagamento;
  data_gasto: string;
};

export type MarketingTemplate = {
  id: number;
  usuario_id: number;
  titulo: string;
  conteudo: string;
  tipo: 'promocao' | 'whatsapp' | 'oferta';
};

export type CrmRegistro = {
  id: number;
  usuario_id: number;
  cliente_id: number;
  cliente_nome: string;
  observacao: string;
  criado_em: string;
};

export type PedidoOnline = {
  id: number;
  usuario_id: number;
  cliente_nome: string;
  itens_resumo: string;
  valor_total: number;
  status: 'novo' | 'aceito' | 'cancelado';
  criado_em: string;
};

export type Compra = {
  id: number;
  usuario_id: number;
  fornecedor_id: number;
  fornecedor_nome: string;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  custo_unitario: number;
  subtotal: number;
  status: 'pendente' | 'recebido';
  data_compra: string;
  numero_nota: string | null;
};

type BusinessState = {
  vendas: Venda[];
  movimentacoesEstoque: MovimentacaoEstoque[];
  gastosExtras: GastoExtra[];
  marketingTemplates: MarketingTemplate[];
  crmRegistros: CrmRegistro[];
  pedidosOnline: PedidoOnline[];
  compras: Compra[];
};

const initialState: BusinessState = {
  vendas: [],
  movimentacoesEstoque: [],
  gastosExtras: [],
  marketingTemplates: [
    {
      id: 1,
      usuario_id: 1,
      titulo: 'Promocao da Semana',
      conteudo: 'Temos bolos fresquinhos com desconto especial. Faca seu pedido agora!',
      tipo: 'promocao',
    },
    {
      id: 2,
      usuario_id: 1,
      titulo: 'Tabela de Precos',
      conteudo: 'Bolo de pote: R$ 15 | Brigadeiro cento: R$ 80 | Bolo caseiro: R$ 45',
      tipo: 'whatsapp',
    },
  ],
  crmRegistros: [],
  pedidosOnline: [],
  compras: [],
};

export const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    addVendaLocal: (state, action: PayloadAction<Venda>) => {
      state.vendas.unshift(action.payload);
    },
    addMovimentacaoEstoqueLocal: (state, action: PayloadAction<MovimentacaoEstoque>) => {
      state.movimentacoesEstoque.unshift(action.payload);
    },
    addGastoExtraLocal: (state, action: PayloadAction<GastoExtra>) => {
      state.gastosExtras.unshift(action.payload);
    },
    addMarketingTemplateLocal: (state, action: PayloadAction<MarketingTemplate>) => {
      state.marketingTemplates.unshift(action.payload);
    },
    updateMarketingTemplateLocal: (
      state,
      action: PayloadAction<{
        id: number;
        usuario_id: number;
        titulo: string;
        conteudo: string;
        tipo: MarketingTemplate['tipo'];
      }>
    ) => {
      const template = state.marketingTemplates.find(
        (item) =>
          item.id === action.payload.id &&
          item.usuario_id === action.payload.usuario_id
      );
      if (!template) return;

      template.titulo = action.payload.titulo;
      template.conteudo = action.payload.conteudo;
      template.tipo = action.payload.tipo;
    },
    removeMarketingTemplateLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number }>
    ) => {
      state.marketingTemplates = state.marketingTemplates.filter(
        (item) =>
          !(item.id === action.payload.id && item.usuario_id === action.payload.usuario_id)
      );
    },
    addCrmRegistroLocal: (state, action: PayloadAction<CrmRegistro>) => {
      state.crmRegistros.unshift(action.payload);
    },
    addPedidoOnlineLocal: (state, action: PayloadAction<PedidoOnline>) => {
      state.pedidosOnline.unshift(action.payload);
    },
    updatePedidoOnlineStatusLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number; status: PedidoOnline['status'] }>
    ) => {
      const pedido = state.pedidosOnline.find(
        (item) =>
          item.id === action.payload.id && item.usuario_id === action.payload.usuario_id
      );
      if (!pedido) return;
      pedido.status = action.payload.status;
    },
    addCompraLocal: (state, action: PayloadAction<Compra>) => {
      state.compras.unshift(action.payload);
    },
    updateCompraStatusLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number; status: Compra['status'] }>
    ) => {
      const compra = state.compras.find(
        (item) =>
          item.id === action.payload.id && item.usuario_id === action.payload.usuario_id
      );
      if (!compra) return;
      compra.status = action.payload.status;
    },
  },
});

export const {
  addVendaLocal,
  addMovimentacaoEstoqueLocal,
  addGastoExtraLocal,
  addMarketingTemplateLocal,
  updateMarketingTemplateLocal,
  removeMarketingTemplateLocal,
  addCrmRegistroLocal,
  addPedidoOnlineLocal,
  updatePedidoOnlineStatusLocal,
  addCompraLocal,
  updateCompraStatusLocal,
} = businessSlice.actions;

export default businessSlice.reducer;
