# Avatares dos depoimentos (prova social)

Coloque aqui as fotos (avatares) das pessoas que assinam os depoimentos.
Os arquivos desta pasta são servidos pela raiz do site (ex.:
`public/depoimentos/mariana-teixeira.jpg` → `/depoimentos/mariana-teixeira.jpg`).

## Como funciona

Cada depoimento em `src/data/siteData.ts` (bloco `testimonials.items`) pode ter
um campo `avatar` opcional. Se o avatar **não** existir — ou o arquivo ainda
não estiver aqui — a seção mostra automaticamente a **inicial do nome** como
fallback elegante (círculo champanhe). Nada quebra sem a foto.

## Convenção de nomes

Use o `id` do depoimento como nome do arquivo, por exemplo:

```
mariana-teixeira.jpg
claudia-bianchi.jpg
```

(São os caminhos já apontados nos depoimentos de exemplo.)

## Recomendações

- **Formato:** JPG ou WebP, quadrado (1:1). Usa `object-cover`, então
  enquadramento centralizado é o ideal.
- **Resolução:** ~256–512px de lado já basta (o avatar é pequeno).
- **Peso:** comprima para ~30–80 KB.

> Importante: os depoimentos de exemplo são **placeholders** marcados com
> `// TODO: depoimento real` no `siteData.ts`. Substitua por nomes, cargos,
> empresas e citações reais (com autorização) antes de publicar.
