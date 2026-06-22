# Portal do Cliente — envio de arquivos técnicos

Área reservada onde o cliente, depois de solicitar uma proposta ou montar um
projeto no Estúdio 3D, envia as **plantas, projetos e modelos 3D** do ambiente.
Tudo cai no **CRM** (`D:\crmMarcenaria`), vinculado ao lead, e aparece para a
equipe de projetistas/marcenaria na tela **Suporte 3D / Arquiteto**.

O acesso é por **código de acompanhamento** (token), sem senha. O código é
gerado automaticamente ao criar o lead e fica salvo no navegador do cliente.

---

## Categorias de documento aceitas

Baseadas no que engenheiros/arquitetos/projetistas enviam para a marcenaria
executar:

| Categoria | O que é |
|---|---|
| Planta baixa | Paredes, ambientes, cotas, mobiliário fixo |
| Layout / leiaute | Disposição de todos os móveis e circulação |
| Cortes e seções | Alturas, pé-direito e níveis (cortes AA, BB) |
| Vistas / elevações | Paredes vistas de frente (bancadas, nichos, painéis) — a "planta alta" |
| Forro / cobertura | Forro, sancas, iluminação, teto |
| Elétrica / hidráulica | Tomadas e pontos de água/gás (furos e recortes) |
| Detalhamento / executivo | Desenho das peças, chapas, ferragens, acabamentos |
| Modelo 3D | SKP, GLB/GLTF, OBJ, FBX, STL, 3DS, DAE, Revit (RVT), IFC, Rhino (3DM) |
| Renders / fotos | Imagens de referência e fotos do local |
| Memorial / outros | Memorial descritivo, mapa de acabamentos, planilhas |

**Formatos:** `pdf, dwg, dxf, skp, rvt, ifc, 3dm, glb, gltf, obj, fbx, stl, 3ds,
dae, png, jpg, jpeg, webp, gif, xlsx, xls, docx, doc, csv, txt, zip`.
Limite de **60 MB por arquivo** (configurável em `src/shared/contract.ts` →
`ARQUIVO_MAX_BYTES`).

---

## Como rodar TUDO localmente

### 1) CRM (`D:\crmMarcenaria`) — backend + painel
```bash
cd D:\crmMarcenaria
npm install            # primeira vez (instala server + client)
npm run dev            # server (Express :3001) + client (Vite :5173)
```
- Banco **SQLite local** em `D:\crmMarcenaria\data\linear.db` (criado sozinho).
- Arquivos enviados ficam em **`D:\crmMarcenaria\data\uploads\leads\<leadId>\`**.
- Sem `SUPABASE_SERVICE_KEY` definido, o CRM roda **100% offline** (SQLite +
  disco local). Não defina essa variável para manter tudo local.

### 2) Site (`d:\marcenaria-corporativa`)
```bash
cd d:\marcenaria-corporativa
npm install            # primeira vez
npm run dev            # site (Vite :5174)
npm run server         # (opcional) relay de tempo real do Estúdio 3D :8787
```
O arquivo **`.env.local`** já aponta o site para o CRM local:
```
VITE_CRM_API_BASE_URL=http://localhost:3001/api
VITE_COLLAB_WS_URL=ws://localhost:8787
```

### 3) Acessar
- Site: <http://localhost:5174>
- Painel do CRM: <http://localhost:5173>
- Área do Cliente: <http://localhost:5174/#/area-cliente>

---

## Fluxo ponta a ponta

1. Cliente clica em **Solicitar proposta** (ou monta um projeto no Estúdio 3D).
2. O CRM cria o lead e devolve um **código de acompanhamento** (`token`).
3. A tela de sucesso mostra o código + botão **“Enviar plantas e arquivos”**,
   que abre a **Área do Cliente** (`#/area-cliente`).
4. O cliente escolhe a categoria e arrasta os arquivos → vão para o CRM.
5. Na aba **Suporte 3D / Arquiteto** do CRM, cada lead mostra a seção
   **“Arquivos do cliente”** com download de cada planta/modelo.

O cliente reentra a qualquer momento pelo menu **Área do cliente** do site,
informando o código (também fica salvo no navegador).

---

## Endpoints (API pública do CRM, prefixo `/api/public`)

| Método | Rota | Função |
|---|---|---|
| `GET` | `/portal/:token` | Valida o código e retorna o lead + arquivos |
| `POST` | `/portal/:token/arquivos` | Upload multipart (`categoria` + `arquivos[]`) |
| `GET` | `/portal/:token/arquivos/:id` | Baixa/visualiza um arquivo |
| `DELETE` | `/portal/:token/arquivos/:id` | Remove um arquivo |

O `token` também acompanha `POST /public/leads-3d` e
`POST /public/solicitar-proposta` na resposta.

**Contrato compartilhado (fonte única):** `src/shared/contract.ts` (site) e
`server/src/shared/contract.js` (CRM) — mantenha os dois em sincronia.
