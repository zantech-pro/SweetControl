import reducer, {
  addGastoExtraLocal,
  addPedidoOnlineLocal,
  addVendaLocal,
  removeMarketingTemplateLocal,
  updateMarketingTemplateLocal,
  updatePedidoOnlineStatusLocal,
} from './businessSlice';

describe('businessSlice', () => {
  it('should add sale and expense entries', () => {
    const withSale = reducer(
      undefined,
      addVendaLocal({
        id: 1,
        usuario_id: 1,
        cliente_id: null,
        cliente_nome: null,
        itens: [],
        total_bruto: 100,
        desconto: 0,
        total_liquido: 100,
        metodo_pagamento: 'pix',
        status_venda: 'pago',
        data_venda: new Date().toISOString(),
        status_sincronizacao: 'offline',
      })
    );
    expect(withSale.vendas).toHaveLength(1);

    const withExpense = reducer(
      withSale,
      addGastoExtraLocal({
        id: 1,
        usuario_id: 1,
        categoria: 'Operacional',
        descricao: 'Gas',
        valor: 20,
        metodo_pagamento: 'dinheiro',
        data_gasto: new Date().toISOString(),
      })
    );
    expect(withExpense.gastosExtras).toHaveLength(1);
  });

  it('should update/remove marketing template by user scope', () => {
    const updated = reducer(
      undefined,
      updateMarketingTemplateLocal({
        id: 1,
        usuario_id: 1,
        titulo: 'Novo Titulo',
        conteudo: 'Novo Conteudo',
        tipo: 'oferta',
      })
    );
    expect(updated.marketingTemplates.find((x) => x.id === 1)?.titulo).toBe('Novo Titulo');

    const notRemovedWrongUser = reducer(
      updated,
      removeMarketingTemplateLocal({ id: 1, usuario_id: 2 })
    );
    expect(notRemovedWrongUser.marketingTemplates.find((x) => x.id === 1)).toBeTruthy();

    const removedRightUser = reducer(
      updated,
      removeMarketingTemplateLocal({ id: 1, usuario_id: 1 })
    );
    expect(removedRightUser.marketingTemplates.find((x) => x.id === 1)).toBeFalsy();
  });

  it('should update online order status by user scope', () => {
    const withOrder = reducer(
      undefined,
      addPedidoOnlineLocal({
        id: 10,
        usuario_id: 1,
        cliente_nome: 'Cliente',
        itens_resumo: 'Item',
        valor_total: 10,
        status: 'novo',
        criado_em: new Date().toISOString(),
      })
    );

    const wrongUserUpdate = reducer(
      withOrder,
      updatePedidoOnlineStatusLocal({ id: 10, usuario_id: 2, status: 'aceito' })
    );
    expect(wrongUserUpdate.pedidosOnline[0].status).toBe('novo');

    const rightUserUpdate = reducer(
      withOrder,
      updatePedidoOnlineStatusLocal({ id: 10, usuario_id: 1, status: 'aceito' })
    );
    expect(rightUserUpdate.pedidosOnline[0].status).toBe('aceito');
  });
});

