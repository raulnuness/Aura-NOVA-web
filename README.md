# Aura NØVA

Loja de dropshipping profissional — e-commerce multi-nicho com foco em bem-estar, casa/decor e gadgets.

## Stack

- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Backend:** PHP 8+ (API REST), MySQL 5.7+
- **Pagamentos:** Stripe Checkout
- **Hosting:** Hostinger (Apache + PHP + MySQL)

## Estrutura

```
dropshop/
├── index.html              # Página principal
├── 404.html                # Página 404
├── .htaccess               # HTTPS, cache, segurança
├── css/style.css           # Estilos
├── js/
│   ├── config.js           # Configuração da API
│   ├── products.js         # Catálogo (API + fallback)
│   ├── cart.js             # Carrinho + cupões
│   ├── checkout.js         # Checkout com Stripe
│   ├── product-page.js     # Página de produto
│   └── app.js              # Lógica principal
├── img/                    # Favicons e ícones
├── pages/
│   ├── produto.html        # Detalhe do produto
│   ├── rastrear.html       # Rastreamento de encomendas
│   ├── contacto.html       # Formulário de contacto
│   ├── obrigado.html       # Confirmação de encomenda
│   ├── dashboard-x7k9.html # Painel admin
│   ├── termos.html         # Termos e Condições
│   ├── privacidade.html    # Política de Privacidade
│   └── envios-devolucoes.html
├── api/
│   ├── index.php           # Router da API
│   ├── .htaccess           # Segurança e CORS
│   ├── config/             # Configuração (não commitado)
│   ├── database/schema.sql # Schema + seed data
│   ├── middleware/          # CSRF, CORS, auth, rate limit
│   └── controllers/        # Lógica de negócio
└── manifest.json            # PWA manifest
```

## Funcionalidades

- Catálogo com 12 produtos em 3 categorias (carregados da API)
- Filtro por categoria e ordenação
- Carrinho com localStorage (totais por item)
- Checkout em 2 passos com Stripe
- CSRF protection em todos os formulários
- Selector de quantidade na página de produto
- Cupões de desconto (API + fallback local)
- Rastreamento de encomendas
- Painel admin (URL não-óbvia, tokens hashed)
- Dark mode
- Cookie consent com categorias
- Newsletter + popup de email
- SEO (sitemap, robots, JSON-LD, meta tags)
- Design responsivo

## Deploy na Hostinger

### 1. Base de dados
1. Criar base de dados MySQL no cPanel da Hostinger
2. Importar `api/database/schema.sql` via phpMyAdmin

### 2. Configuração
1. Copiar `api/config/config.example.php` para `api/config/config.php`
2. Preencher com as credenciais reais:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` — dados da BD na Hostinger
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — chaves do Stripe
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` — gerar hash com:
     ```bash
     php -r "echo password_hash('a_tua_password', PASSWORD_BCRYPT);"
     ```
   - `CORS_ORIGIN` — `https://auranova.pt`
   - `APP_ENV` — `production`

### 3. Upload
1. Carregar ficheiros via File Manager ou FTP
2. Instalar dependências PHP: `composer install` na pasta `api/`

### 4. Stripe
1. Configurar webhook no Stripe Dashboard: `https://auranova.pt/api/stripe/webhook`
2. Eventos: `checkout.session.completed`, `checkout.session.expired`

### 5. Pós-deploy
- Alterar password admin (a default é apenas para desenvolvimento)
- Testar fluxo completo: browse → carrinho → checkout → Stripe → obrigado
- Testar em mobile

## Desenvolvimento local

```bash
cd dropshop
php -S localhost:8000 -t api/
# Frontend: abrir index.html no browser
# API: http://localhost:8000/api/
```