# ⚡ Arcaik

[![Status](https://img.shields.io/badge/Status-Concluído-brightgreen?style=flat-square)]()
[![Plataforma](https://img.shields.io/badge/Plataforma-PWA%20Mobile--First-purple?style=flat-square)]()
[![Licença](https://img.shields.io/badge/Licença-MIT-blue?style=flat-square)]()
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=flat-square)](https://arcaik-notes.vercel.app/)

> **Notas, listas de tarefas, rotinas, links e mídias — em um só app, direto na tela inicial do seu celular.**

A **Arcaik** é uma aplicação web progressiva (PWA) de organização pessoal projetada com foco total em experiência *mobile-first*. O projeto nasceu da necessidade real de guardar conteúdos da internet, ideias e tarefas diárias em um único lugar seguro, rápido e acessível offline.

🔗 **Acesse o app ao vivo:** [arcaik-notes.vercel.app](https://arcaik-notes.vercel.app/)

---

## 📑 Sumário

- [Destaques & Funcionalidades](#-destaques--funcionalidades)
- [Arquitetura & Decisões Técnicas](#-arquitetura--decisões-técnicas)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Rodando o Projeto Localmente](#-rodando-o-projeto-localmente)
- [Licença](#-licença)

---

## ✨ Destaques & Funcionalidades

- 📱 **PWA Instalável:** Funciona como app nativo no celular, abrindo em tela cheia na home screen.
- 📲 **Web Share Target (Android):** Receba links diretamente da folha de compartilhamento nativa do sistema (YouTube, TikTok, etc.).
- 🏷️ **Metadados Automáticos (oEmbed):** Captura automática de título, autor e miniaturas de vídeos compartilhados, com fallback gracioso para outros domínios.
- 🖼️ **Anexos com Compressão Client-Side:** Uploads de imagens de até 10 MB compactados via Canvas (~300 KB) antes do envio, otimizando o consumo de banda e armazenamento.
- 📝 **Notas & Listas Inteligentes:** Edição completa com atualização otimista da interface e rollback automático em caso de erro na rede.
- 📅 **Rotina Diária:** Agendamento de tarefas para datas específicas com barra de progresso em tempo real no dashboard.
- 🎨 **Design System Flexível:** Suporte nativo a modo escuro e claro persistido por tokens CSS.
- 🔒 **Privacidade por Design:** Segurança rigorosa com Row Level Security (RLS) no PostgreSQL e URLs assinadas temporárias para imagens.

---

## 🏗️ Arquitetura & Decisões Técnicas

- **Segurança no Banco de Dados (RLS):** Como a chave anônima do Supabase é pública por natureza, a segurança do app fica no Postgres. Ninguém lista, altera ou apaga dados/arquivos de terceiros (`auth.uid() = user_id`).
- **Upload em Duas Etapas:** O arquivo é enviado ao Storage; se o registro no banco falhar, o arquivo é removido imediatamente para impedir arquivos órfãos.
- **Service Worker Manual:** Cache offline utilizando estratégia *network-first* com fallback para o `index.html`, garantindo suporte para rotas offline como `/share`.
- **Compartilhamento Sem Sessão:** Links recebidos pelo Share Target enquanto o usuário está deslogado são salvos em `sessionStorage` e recuperados após a autenticação.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Front-end** | React 18 + TypeScript | SPA Client-side estruturada com tipagem estática. |
| **Build Tool** | Vite | Ambiente de desenvolvimento rápido e bundler otimizado. |
| **Estilização** | Tailwind CSS | Utility-first CSS com suporte a Design System via CSS Tokens. |
| **Animações** | Framer Motion | Entradas, modais e feedback tátil de alta fidelidade. |
| **Roteamento** | React Router 6 | Gestão de rotas protegidas e rota dedicada ao *Share Target*. |
| **Backend / DB** | Supabase | Banco PostgreSQL, autenticação e Storage gratuito. |
| **Deploy** | Vercel | Deploy contínuo integrado ao fluxo Git. |

---

## 📂 Estrutura de Pastas

```text
arcaik/
├── public/
│   ├── manifest.webmanifest   # Configuração PWA e Share Target
│   └── sw.js                  # Service Worker com estratégia offline
├── src/
│   ├── components/            # UI Primitivos (Shell, NoteEditor, MediaSaver, etc.)
│   ├── pages/                 # Páginas (Dashboard, Notes, Media, Settings, etc.)
│   ├── hooks/                 # Hooks globais (AuthContext, useTheme, etc.)
│   ├── store/                 # DataContext com operações de dados e rollback
│   └── lib/                   # Supabase Client, extrator de oEmbed e utils
├── supabase/
│   └── schema.sql             # Definição de tabelas, RLS e políticas do Storage
├── package.json
└── vite.config.ts
``` 
##💻 Rodando o Projeto Localmente
### Pré-requisitos
- Node.js 18+
- Conta gratuita no Supabase

## Passo a Passo
1. Clone o repositório:

````
Bash
git clone [https://github.com/Murilo-Rogerio/Arcaik.git](https://github.com/Murilo-Rogerio/Arcaik.git)
cd Arcaik
````

2. Instale as dependências:

````Bash
npm install
````
3. Configure o ambiente:
- Crie um arquivo .env na raiz do projeto com as credenciais do seu Supabase:

````Snippet de código
VITE_SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
````
4.Prepare o Banco de Dados:
- No SQL Editor do seu painel Supabase, execute o script contido em supabase/schema.sql para criar as tabelas, ativar o RLS e criar os buckets do Storage.

5.Inicie o servidor de desenvolvimento:

````Bash
npm run dev
````
O app estará rodando em http://localhost:5173.

## 📝 Licença
### Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
