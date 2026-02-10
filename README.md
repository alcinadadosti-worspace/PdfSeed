# PDFSeed - Separador de Holerites

Aplicação web para dividir PDFs de holerites em arquivos individuais, nomeando cada PDF automaticamente com o nome do funcionário extraído do documento.

## Características

- **100% Local**: Todo o processamento ocorre no navegador. Seus dados nunca são enviados para servidores externos.
- **Extração Automática de Nomes**: Identifica automaticamente o nome do funcionário em cada página do holerite.
- **Edição Manual**: Permite corrigir nomes não identificados ou incorretos antes de baixar.
- **Download Individual ou em Lote**: Baixe PDFs um a um ou todos de uma vez em um arquivo ZIP.
- **Performance**: Processamento otimizado para PDFs com muitas páginas (100+) sem travar a interface.

## Tecnologias

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) - Extração de texto
- [pdf-lib](https://pdf-lib.js.org/) - Manipulação de PDF
- [JSZip](https://stuk.github.io/jszip/) - Criação de arquivos ZIP

## Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/alcinadadosti-worspace/PdfSeed.git
cd PdfSeed

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Build de Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

## Deploy no Render

1. Acesse [render.com](https://render.com) e crie uma conta
2. Clique em **New** > **Static Site**
3. Conecte seu repositório GitHub
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Clique em **Create Static Site**

O site será publicado automaticamente a cada push no repositório.

## Estrutura do Projeto

```
src/
├── components/
│   ├── Dropzone.tsx      # Área de upload com drag & drop
│   ├── ProgressBar.tsx   # Barra de progresso
│   ├── ResultItem.tsx    # Item individual na lista
│   ├── ResultsList.tsx   # Lista de resultados
│   └── TopBar.tsx        # Barra superior
├── lib/
│   ├── dedupe.ts         # Deduplicação de nomes
│   ├── nameExtract.ts    # Extração de nomes (heurísticas)
│   ├── pdfSplit.ts       # Divisão de PDF (pdf-lib)
│   ├── pdfText.ts        # Extração de texto (pdfjs)
│   ├── perf.ts           # Utilitários de performance
│   ├── sanitize.ts       # Sanitização de nomes
│   └── zip.ts            # Criação de ZIP
├── App.tsx               # Componente principal
├── main.tsx              # Entry point
└── styles.css            # Estilos globais
```

## Como Funciona a Extração de Nomes

A aplicação usa múltiplas heurísticas para identificar o nome do funcionário:

1. **Padrão "Código X NOME Nome do Funcionário"**: Busca o nome entre o campo "Código" e "Nome do Funcionário"
2. **Padrão "Código X" + nome em maiúsculas**: Captura sequência de palavras em maiúsculas após o código
3. **Padrão "Funcionário:" ou "Nome:"**: Busca nome após esses rótulos
4. **Fallback**: Primeira ocorrência de 3+ palavras em maiúsculas

Se a extração falhar, o usuário pode editar manualmente o nome clicando sobre ele.

## Licença

MIT
