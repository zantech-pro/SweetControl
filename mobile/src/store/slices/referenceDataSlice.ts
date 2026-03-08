import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Categoria = {
  id: number;
  nome: string;
  descricao?: string | null;
};

export type Produto = {
  id: number;
  nome: string;
  categoria_id?: number | null;
  preco_venda?: number | null;
  quantidade_estoque?: number | null;
  status?: 'ativo' | 'inativo';
};

export type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
};

type ReferenceDataState = {
  categorias: Categoria[];
  produtos: Produto[];
  clientes: Cliente[];
  lastUpdatedAt: string | null;
};

const initialState: ReferenceDataState = {
  categorias: [],
  produtos: [],
  clientes: [],
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
    addCategoriaLocal: (state, action: PayloadAction<Categoria>) => {
      state.categorias.unshift(action.payload);
      state.lastUpdatedAt = new Date().toISOString();
    },
    updateCategoriaLocal: (
      state,
      action: PayloadAction<{ id: number; nome: string; descricao?: string | null }>
    ) => {
      const categoria = state.categorias.find((item) => item.id === action.payload.id);
      if (!categoria) return;

      categoria.nome = action.payload.nome;
      categoria.descricao = action.payload.descricao ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeCategoriaLocal: (state, action: PayloadAction<number>) => {
      state.categorias = state.categorias.filter((item) => item.id !== action.payload);
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
        nome: string;
        categoria_id?: number | null;
        preco_venda?: number | null;
        quantidade_estoque?: number | null;
      }>
    ) => {
      const produto = state.produtos.find((item) => item.id === action.payload.id);
      if (!produto) return;

      produto.nome = action.payload.nome;
      produto.categoria_id = action.payload.categoria_id ?? null;
      produto.preco_venda = action.payload.preco_venda ?? null;
      produto.quantidade_estoque = action.payload.quantidade_estoque ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeProdutoLocal: (state, action: PayloadAction<number>) => {
      state.produtos = state.produtos.filter((item) => item.id !== action.payload);
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
        nome: string;
        telefone?: string | null;
        email?: string | null;
      }>
    ) => {
      const cliente = state.clientes.find((item) => item.id === action.payload.id);
      if (!cliente) return;

      cliente.nome = action.payload.nome;
      cliente.telefone = action.payload.telefone ?? null;
      cliente.email = action.payload.email ?? null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    removeClienteLocal: (state, action: PayloadAction<number>) => {
      state.clientes = state.clientes.filter((item) => item.id !== action.payload);
      state.lastUpdatedAt = new Date().toISOString();
    },
    clearReferenceData: () => initialState,
  },
});

export const {
  setCategorias,
  setProdutos,
  setClientes,
  addCategoriaLocal,
  updateCategoriaLocal,
  removeCategoriaLocal,
  addProdutoLocal,
  updateProdutoLocal,
  removeProdutoLocal,
  addClienteLocal,
  updateClienteLocal,
  removeClienteLocal,
  clearReferenceData,
} = referenceDataSlice.actions;
export default referenceDataSlice.reducer;
