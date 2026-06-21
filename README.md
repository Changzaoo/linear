# NEXUS — Marcenaria

Landing page institucional premium para marcenaria de alto padrão focada em grandes projetos comerciais (lojas, franquias, escritórios, clínicas, hotéis, construtoras).

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173

Para usar colaboração/CRM em tempo real entre dispositivos, rode também o relay:

```bash
npm run server
```

Por padrão o front tenta `ws://<host-do-site>:8787`. Para apontar para outro host/IP,
copie `.env.example` para `.env` e ajuste `VITE_COLLAB_WS_URL`.

Para sincronizar os leads do Estudio 3D com o CRM em `/suporte-3d`, configure tambem:

```bash
VITE_CRM_API_BASE_URL=https://crm-marcenaria.vercel.app/api
```

Em teste com celular na mesma rede, suba o Vite escutando na rede local:

```bash
npm run dev:host
```

CRM dos atendimentos 3D: `#/crm`.

## Deploy online

O front está preparado para Vercel. O relay WebSocket precisa rodar em um serviço
Node persistente separado (Render, Railway, Fly.io, VPS etc.), porque a Vercel não
hospeda conexões WebSocket permanentes em Functions.

No host do relay, use:

```bash
npm install
npm run server
```

Depois configure no projeto da Vercel:

```bash
VITE_COLLAB_WS_URL=wss://seu-relay-online
VITE_CRM_API_BASE_URL=https://crm-marcenaria.vercel.app/api
```

E faça um novo deploy do front.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Stack

| Dependência | Uso |
|---|---|
| React + Vite + TypeScript | Base do projeto |
| Tailwind CSS | Estilo / design system |
| Framer Motion | Animações de UI e scroll progress |
| Three.js + React Three Fiber + Drei | Cenas 3D |
| Lenis | Scroll suavizado (inércia cinematográfica) |

## Estrutura

```
src/
  components/
    Header.tsx                  → menu fixo com blur
    Hero.tsx                    → hero cinematográfico (420vh, canvas fixo)
    ScrollFurnitureAssembly.tsx → cena 3D de montagem do ambiente por scroll
    AuthoritySection.tsx        → capacidades técnicas
    AudienceSection.tsx         → para quem atendemos
    ProcessSection.tsx          → timeline do processo (10 etapas)
    DifferentialsSection.tsx    → diferenciais
    ExplodedCounter3D.tsx       → balcão 3D que explode em camadas e remonta
    ApplicationsSection.tsx     → aplicações
    TrustNumbers.tsx            → números com contagem animada
    PortfolioSection.tsx        → grid + modal de projetos
    PartnersSection.tsx         → arquitetos e construtoras
    FinalCTA.tsx                → chamada final
    Footer.tsx / WhatsAppButton.tsx
    Reveal.tsx / Icons.tsx      → utilitários de UI
  data/
    siteData.ts                 → TODO O CONTEÚDO EDITÁVEL
  lib/
    webgl.ts                    → detecção de WebGL / mobile
  styles/globals.css            → Tailwind + classes do design system
```

## Onde editar

Tudo está em **`src/data/siteData.ts`**:

- **Nome da marca** → `brand.name` e `brand.tagline`
- **WhatsApp** → `contact.whatsappNumber` (DDI+DDD, só dígitos) e `contact.whatsappMessage`
- **E-mail / Instagram / localização / CNPJ** → `contact`
- **Números institucionais** → `numbers` (valor, prefixo, sufixo, legenda)
- **Portfólio** → `portfolio.projects` (categoria, escopo, materiais, prazo, desafio, solução)
- **Todos os textos das seções** → demais chaves do mesmo arquivo

Cores e fontes: `tailwind.config.js`. Meta tags de SEO: `index.html`.

## Animações 3D

- **Hero**: o progresso do scroll (0→1) controla a entrada de cada peça (piso 20%, painéis 35%, balcão 50%, prateleiras 65%, LED 80%, giro de câmera ao final). Janelas de animação configuráveis na prop `window` de cada `<Piece>` em `ScrollFurnitureAssembly.tsx`.
- **Balcão explodido**: `ExplodedCounter3D.tsx` separa as camadas no meio do scroll e remonta ao final (função `explodeFactor`).
- **Fallback**: sem WebGL, ambas as cenas exibem uma ilustração estática elegante.
- **Performance**: DPR limitado a 1.5, geometrias simples, menos ripas no mobile, sem sombras.

## Próximos upgrades sugeridos

1. Substituir os placeholders do portfólio por fotos reais (campo `gradient` → imagem).
2. Modelos GLB reais dos móveis (exportados do SketchUp/Blender) no lugar das geometrias.
3. Formulário de briefing com upload de planta (ex.: integração com e-mail ou CRM).
4. Página de cases individuais com galeria e depoimentos de clientes.
5. Logos de clientes reais na seção de confiança.
6. Analytics (GA4/Meta Pixel) para medir conversão dos CTAs.
7. Versão em inglês para clientes internacionais.

Já implementado: scroll suavizado com Lenis (`src/lib/useLenis.ts`, ativado no `App.tsx`; respeita `prefers-reduced-motion` e mantém scroll nativo no touch).
