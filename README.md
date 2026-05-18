# 🧾 ReciboFácil — SaaS de Gerador de Recibos

Aplicação completa para geração de recibos profissionais com autenticação multi-usuário, cada cliente acessa somente seus próprios dados.

## 🚀 Stack Tecnológica (100% Gratuita)

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Vercel
- **PDF**: html2canvas + jsPDF

---

## 📋 PASSO A PASSO PARA DEPLOY

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **"New Project"**
3. Escolha um nome e senha forte para o banco
4. Aguarde a criação (~2 minutos)

### 2. Configurar o Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`
3. Cole no SQL Editor e clique **Run**
4. Verifique se todas as tabelas foram criadas (Table Editor)

### 3. Pegar as Credenciais do Supabase

1. Vá em **Settings > API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Subir para o GitHub

```bash
# Na raiz do projeto
git init
git add .
git commit -m "Initial commit - ReciboFácil SaaS"
git branch -M main

# Crie um repositório no github.com e siga as instruções
git remote add origin https://github.com/SEU_USUARIO/recibos-saas.git
git push -u origin main
```

### 5. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **"New Project"**
3. Selecione o repositório `recibos-saas`
4. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL = sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sua_chave_anon
   NEXT_PUBLIC_APP_URL = https://seu-projeto.vercel.app
   ```
5. Clique em **Deploy**

### 6. Configurar URL de Redirect no Supabase

1. No Supabase, vá em **Authentication > URL Configuration**
2. Em **Site URL**, coloque: `https://seu-projeto.vercel.app`
3. Em **Redirect URLs**, adicione: `https://seu-projeto.vercel.app/**`

---

## 🧪 Testando Localmente

```bash
# Clone e instale
npm install

# Copie o arquivo de env
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Inicie o servidor
npm run dev
```

Acesse: http://localhost:3000

---

## ✨ Funcionalidades

- ✅ Autenticação completa (cadastro/login)
- ✅ Multi-usuário com isolamento de dados (RLS)
- ✅ Dashboard com estatísticas
- ✅ Criação de recibos profissionais
- ✅ Gestão de clientes
- ✅ Download em PDF de alta qualidade
- ✅ Impressão de recibos
- ✅ Status: Pago / Pendente / Cancelado
- ✅ Múltiplos itens por recibo
- ✅ Descontos
- ✅ Landing page moderna
- ✅ Interface responsiva (mobile-first)
- ✅ Perfil da empresa configurável

---

## 🗂️ Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/
│   │   ├── login/            # Login
│   │   └── register/         # Cadastro
│   ├── dashboard/            # Dashboard principal
│   ├── receipts/             # Lista e criação de recibos
│   │   ├── new/              # Novo recibo
│   │   └── [id]/             # Visualização + download PDF
│   ├── clients/              # Gestão de clientes
│   └── settings/             # Configurações do perfil
├── components/
│   └── receipt/
│       └── ReceiptViewer.tsx  # Componente do recibo (PDF)
└── lib/
    ├── supabase/             # Cliente Supabase
    ├── types.ts              # TypeScript types
    └── utils.ts              # Utilitários
```

---

## 🔐 Segurança

- Row Level Security (RLS) ativado em todas as tabelas
- Cada usuário só acessa seus próprios dados
- Autenticação gerenciada pelo Supabase Auth
- Middleware de proteção de rotas

---

## 📞 Suporte

Em caso de dúvidas, consulte:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
