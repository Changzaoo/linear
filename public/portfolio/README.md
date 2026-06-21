# Fotos do portfólio

Coloque aqui as fotos reais dos projetos. Os arquivos desta pasta são
servidos diretamente pela raiz do site (ex.: `public/portfolio/loja-premium-1.jpg`
fica disponível em `/portfolio/loja-premium-1.jpg`).

## Como funciona

Cada projeto em `src/data/siteData.ts` (bloco `portfolio.projects`) pode ter:

- `image`  → foto principal, usada no **card** e como capa do **modal**.
- `images` → lista de fotos para a **galeria/lightbox** do modal
  (navegação por setas do teclado + ESC para fechar).

Se um projeto **não** tiver `image`/`images` — ou se o arquivo apontado
ainda não existir aqui — o site cai automaticamente no **gradiente**
(`gradient`) como fallback elegante. Nada quebra enquanto você não tiver
as fotos.

## Convenção de nomes

Use o padrão `<slug>-<n>.jpg`, onde `<slug>` é o `id` do projeto:

```
loja-premium-1.jpg
loja-premium-2.jpg
loja-premium-3.jpg
clinica-1.jpg
clinica-2.jpg
restaurante-1.jpg
```

(São os caminhos já apontados nos projetos de exemplo. Para os demais
projetos, basta adicionar os campos `image`/`images` no `siteData.ts`
seguindo o mesmo padrão.)

## Recomendações de imagem

- **Formato:** JPG ou WebP (WebP é mais leve; ajuste a extensão no `siteData.ts`).
- **Card:** proporção retrato ~ 4:5. **Galeria do modal:** ~ 16:10.
  As imagens usam `object-cover`, então o corte é automático e centralizado.
- **Resolução:** ~1600px no maior lado já é mais que suficiente.
- **Peso:** comprima para ~200–400 KB por foto (carregamento `lazy`).
- **Iluminação:** prefira fotos escuras/sóbrias, coerentes com a estética
  dark premium (madeira/champagne/preto) da NEXUS.
