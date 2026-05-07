# DropShop

Loja de dropshipping em HTML/CSS/JavaScript puro.

## Estrutura

```
dropshop/
├── index.html        # Página principal
├── css/style.css     # Estilos
├── js/
│   ├── products.js   # Catálogo de produtos
│   ├── cart.js       # Lógica do carrinho
│   └── app.js        # Lógica principal
├── img/              # Imagens (a adicionar)
└── pages/            # Páginas adicionais (a desenvolver)
```

## Funcionalidades

- Catálogo com 12 produtos em 3 categorias
- Filtro por categoria
- Carrinho com localStorage
- Design dark theme responsivo
- Notificações ao adicionar ao carrinho

## Como executar

Abrir `index.html` no browser ou servir com qualquer servidor estático:

```bash
cd dropshop && npx serve .
```

## Próximos passos

- [ ] Substituir imagens placeholder por imagens reais
- [ ] Adicionar página de detalhe do produto
- [ ] Implementar checkout
- [ ] Adicionar mais categorias e produtos
- [ ] Configurar domínio e hosting