# 🧁 SweetControl - Sistema de Gestão para Confeitaria

O **SweetControl** é uma plataforma integrada para microempreendedores do ramo de confeitaria artesanal. O sistema é composto por uma API robusta e um aplicativo móvel focado em usabilidade e funcionamento offline-first.

Atenção!!! A grade expertise do **offline-first** neste projeto e que o usuario depois que logou pela primeira vez, **mesmo que fique sem internet podera desfrutar de todas as funcionalidades do App** indepednete da cloud (Backend na hospedagem).

## 📱 Interface do Usuário (UI)

O design do SweetControl foi pensado para ser limpo e intuitivo, utilizando a paleta de cores institucional (multiplos temas) para transmitir confiança e organização.

### 📸 Demonstração das Telas

| Login | Criar Conta | Tela Pos Login Caixa |
| :---: | :---: | :---: |
| ![Login](./docs/login.jpeg) | ![CriarConta](./docs/criar_conta.jpeg) | ![Caixa](./docs/caixa.jpeg) |
| *Visão das contas registrada no device.* | *Criar Conta do zero.* | *tela inicial Frente de Caixa.* |

| Cadastro de Categoria | Cadastrar Produtos | Cadastrar Clientes (opcional) |
| :---: | :---: | :---: |
| ![Categoria](./docs/categorias.jpeg) | ![Castrar Produtos](./docs/produtos.jpeg) | ![Clientes](./docs/clientes.jpeg) |
| *Area de Cadastro das categorias.* | *Casdastro dos produtos.* | *Registros dos clientes para colocoar nos recebos.* |

| Tela de Recebibo na frente de caixa | Markenting | Financeiro (BI) |
| :---: | :---: | :---: |
| ![Recibo](./docs/recibo.jpeg) | ![marketing](./docs/marketing.jpeg) | ![Clientes](./docs/bi.jpeg) |
| *Apos registrar venda, acione borão compartilhar recibo.* | *Tempalte para ser compartilhado no whatsapp.* | *Controle Financeiro (BI).* |

| Menu de Configurações |
| :---: | 
| ![Config](./docs/menu_config.jpeg) |
| *Ajustar Tema, sicronizar manualmente e acompanhar sicronizações em andamento | 

> **Nota:** As imagens acima são ilustrativas do ambiente de homologação. O layout adapta-se automaticamente a diferentes tamanhos de tela de dispositivos Android.


## 🏗️ Estrutura do Projeto

Abaixo está a organização dos principais diretórios do ecossistema, mapeados para facilitar a manutenção e o deploy:

```text
.
├── 🌐 backend/               # Servidor PHP 8.2 (Hospedado na HostGator)
│   ├── api/                  # Endpoints REST da aplicação
│   │   ├── auth/             # Gestão de login, registro e recuperação
│   │   ├── estoque/          # Movimentações e controle de insumos
│   │   ├── produtos/         # CRUD de dos produtos
│   │   ├── vendas/           # Registro de pedidos e faturamento
│   │   └── crm/              # Gestão de clientes e histórico
│   └── config.php            # Configurações de conexão MySQL
│
├── 📱 mobile/                # Aplicativo React Native (Expo)
│   ├── app/                  # Estrutura de rotas (Expo Router)
│   │   ├── (tabs)/           # Telas principais (Vendas, Estoque, Clientes, BI)
│   │   ├── login.tsx         # Tela de autenticação
│   │   └── _layout.tsx       # Provider do Redux e Temas Dinâmicos
│   ├── assets/               # Imagens (opcional)
│   └── src/                  # Lógica de negócio e estado global
│       ├── api/              # Services e instâncias do Axios
│       └── store/            # Redux Toolkit, Slices e SyncService
│
├── 🗄️ database/              # Scripts SQL (database.sql) para ser importado na sua hospedagem
│
└── 📑 docs/                  # Documentação técnica e evidências
    ├── Arquitetura.png       # Diagrama de blocos do sistema
    └── modelagem_db.png      # Diagrama Entidade-Relacionamento
```

## 🛠️ Tecnologias & Bibliotecas

### Stack Base
- Mobile: React Native (Expo), TypeScript.
- Backend: PHP 8.2 (Arquitetura REST).
- Banco de Dados: MySQL (Conforme sua Hospedagem).
- Levantamento de Requisitos: Google Forms.

### Principais Dependências (Mobile)
- Expo Router: Navegação nativa baseada em arquivos e abas.
- Redux Toolkit: Gerenciamento de estado global e lógica de negócio.
- Redux Persist: Persistência local de dados (Funcionamento Offline).
- Axios: Comunicação com a API PHP remota.
- Jest: Testes unitários de serviços e sincronização.

## 💡 Por que esta estrutura?

* Backend Centralizado: Garante que os dados da usuária estejam seguros e acessíveis de qualquer dispositivo via Cloud(Hospedagem).
* Interface Intuitiva: O uso de (tabs) organiza as funções críticas (Estoque, Caixa, BI) para acesso rápido durante a produção.
* Resiliência (SyncService): A lógica em src/store/syncService.ts garante que o app funcione em locais com internet instável (cozinha/feiras) e sincronize os dados automaticamente ao detectar conexão.

## 🚀 Como Executar o Projeto

### 1. Configuração do Backend
1. Banco de Dados: No phpMyAdmin, importe o arquivo /database/database.sql.
2. Configuração: Na pasta /backend, renomeie config.sample.php para config.php e insira as credenciais do seu banco.
3. Deploy: Suba a pasta /backend para o seu servidor via FTP ou Gerenciador de Arquivos.

### 2. Configuração do Mobile
1. Instalação: Na pasta /mobile, execute:
   ```bash
   npm install
   ```
2. API URL: Em src/api/env.ts, ajuste a constante da URL para o seu domínio (ex: https://seusite.com.br/api).
3. Execução: Inicie o servidor de desenvolvimento:
   ```bash
   npx expo start
   ```
4. Abra o Expo Go no seu Android e escaneie o QR Code.

### 🧪 Testes Unitários
Para validar os serviços de sincronização e autenticação, utilize: 
```bash
npm test
```

## ✨ Funcionalidades do Sistema

### 📦 Gestão de Inventário
* Controle de Insumos: Registro de ingredientes com alerta de estoque baixo.
* Histórico: Rastreio de entradas e saídas para evitar desperdícios.

### 💰 Vendas e Financeiro
* Registro de Pedidos: Lançamento rápido de vendas com integração ao estoque.
* Fluxo de Caixa: Dashboard com faturamento diário em tempo real.

### 🤝 CRM e Clientes
* Base de Dados: Histórico de compras e preferências (sabores, restrições).

### 🛡️ Segurança e UX
* Offline-First: Funcionamento pleno sem internet.
* Identidade Visual: Interface adaptada ao verde institucional da marca.

## 📈 Roadmap de Evolução
* Módulo de Marketing: Promoções automáticas via WhatsApp.
* Dashboard de BI: Gráficos de sazonalidade e produtos mais vendidos.
* Relatórios PDF: Geração de documentos para contabilidade.

## 🎓 Conclusão e Impacto Social

O SweetControl transformou a gestão manual da microempreendedora em um processo digital profissional. Através da aplicação de Engenharia de Software, foi possível reduzir desperdícios e oferecer previsibilidade financeira, provando que a academia pode fornecer soluções reais para o empreendedorismo local.

Impacto Principal: Inclusão digital, profissionalização da marca e otimização da produção artesanal através de tecnologia resiliente e personalizada.

---
Projeto desenvolvido como parte das Atividades de Extensão Universitária.
