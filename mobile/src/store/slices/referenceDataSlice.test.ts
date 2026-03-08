import reducer, {
  addProdutoLocal,
  adjustProdutoEstoqueLocal,
  removeProdutoLocal,
} from './referenceDataSlice';

describe('referenceDataSlice', () => {
  it('should adjust stock only for matching user and product id', () => {
    const initial = reducer(
      undefined,
      addProdutoLocal({
        id: 10,
        usuario_id: 1,
        nome: 'Brigadeiro',
        quantidade_estoque: 5,
      })
    );

    const unchanged = reducer(
      initial,
      adjustProdutoEstoqueLocal({ id: 10, usuario_id: 2, delta: -2 })
    );
    expect(unchanged.produtos[0].quantidade_estoque).toBe(5);

    const changed = reducer(
      unchanged,
      adjustProdutoEstoqueLocal({ id: 10, usuario_id: 1, delta: -2 })
    );
    expect(changed.produtos[0].quantidade_estoque).toBe(3);
  });

  it('should remove product by id scoped to user', () => {
    const withFirst = reducer(
      undefined,
      addProdutoLocal({ id: 1, usuario_id: 1, nome: 'A' })
    );
    const withSecond = reducer(
      withFirst,
      addProdutoLocal({ id: 1, usuario_id: 2, nome: 'B' })
    );
    const removedUser1 = reducer(
      withSecond,
      removeProdutoLocal({ id: 1, usuario_id: 1 })
    );
    expect(removedUser1.produtos).toHaveLength(1);
    expect(removedUser1.produtos[0].usuario_id).toBe(2);
  });
});

