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
    clearReferenceData: () => initialState,
  },
});

export const { setCategorias, setProdutos, setClientes, clearReferenceData } =
  referenceDataSlice.actions;
export default referenceDataSlice.reducer;

