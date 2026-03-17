import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Categoria = {
  id: number;
  usuario_id: number;
  nome: string;
  descricao?: string | null;
};

export type Produto = {
  id: number;
  usuario_id: number;
  nome: string;
  categoria_id?: number | null;
  preco_venda?: number | null;
  preco_custo?: number | null;
  quantidade_estoque?: number | null;
  estoque_minimo?: number | null;
  data_validade?: string | null;
  status?: 'ativo' | 'inativo';
};

export type Cliente = {
  id: number;
  usuario_id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
};

export type Fornecedor = {
  id: number;
  usuario_id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  contato?: string | null;
  prazo_entrega_dias?: number | null;
  observacoes?: string | null;
};

type ReferenceDataState = {
  categorias: Categoria[];
  produtos: Produto[];
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  lastUpdatedAt: string | null;
};

const initialState: ReferenceDataState = {
  categorias: [],
  produtos: [],
  clientes: [],
  fornecedores: [],
  lastUpdatedAt: null,
};

export const referenceDataSlice = createSlice({
  name: 'referenceData',
  initialState,
  reducers: {
    setCategorias: (state, action: PayloadAction<Categoria[]>) => {
      state.categorias = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setProdutos: (state, action: PayloadAction<Produto[]>) => {
      state.produtos = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setClientes: (state, action: PayloadAction<Cliente[]>) => {
      state.clientes = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setFornecedores: (state, action: PayloadAction<Fornecedor[]>) => {
      state.fornecedores = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    addCategoriaLocal: (state, action: PayloadAction<Categoria>) => {
      state.categorias.unshift(action.payload);
      state.lastUpdatedAt = new Date().toISOString();
    },
    updateCategoriaLocal: (
      state,
      action: PayloadAction<{
        id: number;
        usuario_id: number;
        nome: string;
        descricao?: string | null;
      }>
    ) => {
      const categoria = state.categorias.find(
        (item) =>
          item.id === action.payload.id &&
          item.usuario_id === action.payload.usuario_id
      );
      if (!categoria) return;

      categoria.nome = action.payload.nome;
      categoria.descricao = action.payload.descricao ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeCategoriaLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number }>
    ) => {
      state.categorias = state.categorias.filter(
        (item) =>
          !(
            item.id === action.payload.id &&
            item.usuario_id === action.payload.usuario_id
          )
      );
      state.lastUpdatedAt = new Date().toISOString();
    },
    addProdutoLocal: (state, action: PayloadAction<Produto>) => {
      state.produtos.unshift(action.payload);
      state.lastUpdatedAt = new Date().toISOString();
    },
    updateProdutoLocal: (
      state,
      action: PayloadAction<{
        id: number;
        usuario_id: number;
        nome: string;
        categoria_id?: number | null;
        preco_venda?: number | null;
        preco_custo?: number | null;
        quantidade_estoque?: number | null;
        estoque_minimo?: number | null;
        data_validade?: string | null;
      }>
    ) => {
      const produto = state.produtos.find(
        (item) =>
          item.id === action.payload.id &&
          item.usuario_id === action.payload.usuario_id
      );
      if (!produto) return;

      produto.nome = action.payload.nome;
      produto.categoria_id = action.payload.categoria_id ?? null;
      produto.preco_venda = action.payload.preco_venda ?? null;
      produto.preco_custo = action.payload.preco_custo ?? null;
      produto.quantidade_estoque = action.payload.quantidade_estoque ?? null;
      produto.estoque_minimo = action.payload.estoque_minimo ?? null;
      produto.data_validade = action.payload.data_validade ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeProdutoLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number }>
    ) => {
      state.produtos = state.produtos.filter(
        (item) =>
          !(
            item.id === action.payload.id &&
            item.usuario_id === action.payload.usuario_id
          )
      );
      state.lastUpdatedAt = new Date().toISOString();
    },
    adjustProdutoEstoqueLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number; delta: number }>
    ) => {
      const produto = state.produtos.find(
        (item) =>
          item.id === action.payload.id &&
          item.usuario_id === action.payload.usuario_id
      );
      if (!produto) return;

      const atual = produto.quantidade_estoque ?? 0;
      produto.quantidade_estoque = atual + action.payload.delta;
      state.lastUpdatedAt = new Date().toISOString();
    },
    addClienteLocal: (state, action: PayloadAction<Cliente>) => {
      state.clientes.unshift(action.payload);
      state.lastUpdatedAt = new Date().toISOString();
    },
    updateClienteLocal: (
      state,
      action: PayloadAction<{
        id: number;
        usuario_id: number;
        nome: string;
        telefone?: string | null;
        email?: string | null;
      }>
    ) => {
      const cliente = state.clientes.find(
        (item) =>
          item.id === action.payload.id &&
          item.usuario_id === action.payload.usuario_id
      );
      if (!cliente) return;

      cliente.nome = action.payload.nome;
      cliente.telefone = action.payload.telefone ?? null;
      cliente.email = action.payload.email ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeClienteLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number }>
    ) => {
      state.clientes = state.clientes.filter(
        (item) =>
          !(
            item.id === action.payload.id &&
            item.usuario_id === action.payload.usuario_id
          )
      );
      state.lastUpdatedAt = new Date().toISOString();
    },
    addFornecedorLocal: (state, action: PayloadAction<Fornecedor>) => {
      state.fornecedores.unshift(action.payload);
      state.lastUpdatedAt = new Date().toISOString();
    },
    updateFornecedorLocal: (
      state,
      action: PayloadAction<{
        id: number;
        usuario_id: number;
        nome: string;
        telefone?: string | null;
        email?: string | null;
        contato?: string | null;
        prazo_entrega_dias?: number | null;
        observacoes?: string | null;
      }>
    ) => {
      const fornecedor = state.fornecedores.find(
        (item) =>
          item.id === action.payload.id &&
          item.usuario_id === action.payload.usuario_id
      );
      if (!fornecedor) return;

      fornecedor.nome = action.payload.nome;
      fornecedor.telefone = action.payload.telefone ?? null;
      fornecedor.email = action.payload.email ?? null;
      fornecedor.contato = action.payload.contato ?? null;
      fornecedor.prazo_entrega_dias = action.payload.prazo_entrega_dias ?? null;
      fornecedor.observacoes = action.payload.observacoes ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeFornecedorLocal: (
      state,
      action: PayloadAction<{ id: number; usuario_id: number }>
    ) => {
      state.fornecedores = state.fornecedores.filter(
        (item) =>
          !(
            item.id === action.payload.id &&
            item.usuario_id === action.payload.usuario_id
          )
      );
      state.lastUpdatedAt = new Date().toISOString();
    },
    clearReferenceData: () => initialState,
  },
});

export const {
  setCategorias,
  setProdutos,
  setClientes,
  setFornecedores,
  addCategoriaLocal,
  updateCategoriaLocal,
  removeCategoriaLocal,
  addProdutoLocal,
  updateProdutoLocal,
  removeProdutoLocal,
  adjustProdutoEstoqueLocal,
  addClienteLocal,
  updateClienteLocal,
  removeClienteLocal,
  addFornecedorLocal,
  updateFornecedorLocal,
  removeFornecedorLocal,
  clearReferenceData,
} = referenceDataSlice.actions;
export default referenceDataSlice.reducer;
