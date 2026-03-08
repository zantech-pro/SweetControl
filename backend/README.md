# SweetControl Backend (PHP + MySQL)

## 1) Configuracao
1. Copie `backend/config.sample.php` para `backend/config.php`.
2. Preencha credenciais reais do banco HostGator.
3. Garanta que o root da API publique a pasta `backend/api`.

## 2) Banco de dados
1. Execute `docs/modelagem.sql`.
2. Execute `database/migracao_backend_v2.sql` (campos e tabelas extras do app atual).

## 3) Endpoints implementados

### Categorias
- `POST /categorias/create.php`
- `PUT /categorias/update.php`
- `DELETE /categorias/delete.php`
- `GET /categorias/list.php`

### Produtos
- `POST /produtos/create.php`
- `PUT /produtos/update.php`
- `DELETE /produtos/delete.php`
- `GET /produtos/list.php`

### Clientes
- `POST /clientes/create.php`
- `PUT /clientes/update.php`
- `DELETE /clientes/delete.php`
- `GET /clientes/list.php`

### Vendas / Caixa
- `POST /vendas/create.php`
- `GET /vendas/list.php`
- `POST /vendas/itens/create.php`
- `POST /vendas/recibos/create.php`

### Estoque
- `POST /estoque/movimentacoes/create.php`

### Gastos
- `POST /gastos/create.php`
- `GET /gastos/list.php`

### Marketing / CRM / Pedidos
- `POST /marketing/templates/create.php`
- `PUT /marketing/templates/update.php`
- `DELETE /marketing/templates/delete.php`
- `POST /crm/registros/create.php`
- `POST /pedidos/create.php`
- `PUT /pedidos/update_status.php`

## 4) Observacoes
- Todos os endpoints aceitam JSON (`Content-Type: application/json`).
- Enquanto autenticacao nao estiver ativa, o backend usa `usuario_id` do payload; se nao vier, usa `default_user_id` do `config.php`.
- A estrutura foi preparada para o fluxo Offline First do app mobile (fila de sincronizacao).

