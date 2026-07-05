# Ibovespa: Correlação e Estrutura de Mercado

Uma análise quantitativa e visual da evolução da correlação entre ações do Ibovespa entre 2018 e 2025, utilizando teoria dos grafos, detecção de comunidades e análise de sensibilidade à taxa de juros.

## Visão Geral

Este projeto investiga como eventos globais e decisões de política monetária alteram a estrutura de correlações entre ações brasileiras. Através de análises baseadas em redes complexas, identifica períodos de sincronização de mercado, reorganização setorial pós-crise e sensibilidade diferenciada de setores à Selic.

## Questão Central

Como eventos globais e nacionais alteram a estrutura de correlações entre ações brasileiras?

## Hipóteses Investigadas

**H1 - Crises**: Em períodos de pânico como a COVID-19, as correlações entre ações disparam, fazendo o mercado colapsar em bloco.

**H2 - Recuperação**: Após crises, setores se reorganizam e divergem novamente, restaurando a estrutura de rede. Comunidades detectadas tendem a coincidir mais com a classificação setorial oficial.

**H3 - Selic**: Bancos e imobiliárias apresentam maior sensibilidade à taxa de juros do que commodities e exportadoras, que são protegidas pela receita em dólar.

**H4 - Comunidades**: Algoritmos de detecção de comunidades revelam agrupamentos que refletem—e às vezes transgridem—a classificação setorial oficial.

## Dados e Metodologia

### Fonte de Dados

- Composição: Lista oficial de ativos do Ibovespa via API B3
- Histórico: Série OHLCV (2018-2025) do Yahoo Finance (~80 ações, ~1800 dias)
- Selic: Meta da taxa básica de juros via SGS/Banco Central do Brasil
- Metadados: Setor e indústria de cada ação via Yahoo Finance

### Pipeline de Processamento

1. Validação de tickers contra Yahoo Finance
2. Download de histórico ajustado por splits e dividendos
3. Cálculo de derivados: retorno diário, log-retorno, volatilidade 20d anualizada
4. Matriz de correlação de Pearson por período trimestral
5. Construção de grafos com limiar de correlação |r| = 0.5
6. Detecção de comunidades via algoritmo de Louvain
7. Regressão OLS de retornos contra variações da Selic
8. Cálculo de métricas de rede: densidade, modularidade, NMI vs. setores

### Métricas Principais

- Correlação Média Absoluta: Valor absoluto médio de todas as correlações da rede
- Densidade da Rede: Proporção de arestas existentes sobre o total possível
- Modularidade (Louvain Q): Qualidade da partição em comunidades
- NMI (Normalized Mutual Information): Concordância entre comunidades detectadas e setores B3
- Beta Selic: Sensibilidade do retorno setorial a variações da Selic

## Estrutura do Projeto

`
meu-site/
+-- src/
¦   +-- index.md              # Página de análise principal
¦   +-- metodologia.md        # Documentação técnica e metodológica
¦   +-- components/
¦   ¦   +-- timeline.js       # Componente de visualização
¦   +-- data/
¦       +-- *_network_metrics_quarterly.csv
¦       +-- *_selic_beta*.csv
¦       +-- *_correlation_graph_quarterly.json
¦       +-- [dados brutos]
+-- observablehq.config.js    # Configuração do Observable Framework
+-- package.json              # Dependências
+-- README.md
`

## Tecnologias

- Framework: Observable (análise e visualização interativa)
- Visualização: D3.js (grafos, séries temporais, heatmaps)
- Dados: Python (processamento e cálculo de métricas)
- Controle de Versão: Git/GitHub

## Como Executar Localmente

`ash
# Clonar repositório
git clone https://github.com/KaylanyMeneses/Vizualiza-o-de-Dados.git
cd Vizualiza-o-de-Dados/meu-site

# Instalar dependências
npm install

# Iniciar servidor local
npm run dev
`

Acesse http://localhost:3000 no navegador.

## Páginas

- Análise: Visualizações interativas das quatro hipóteses, com grafos, séries temporais, rankings de sensibilidade e heatmaps.
- Metodologia: Documentação técnica detalhada do pipeline de dados, algoritmos utilizados, métricas calculadas e decisões de design de cada visualização.

## Principais Achados

- A COVID-19 (Q1 2020) causou sincronização extrema do mercado, com correlação média atingindo máximos históricos
- Após a crise, setores se reorganizaram gradualmente, com comunidades detectadas recuperando alinhamento com classificação B3
- Bancos apresentam beta Selic positivo (se beneficiam de alta de juros), enquanto varejistas e imobiliárias sofrem
- Commodities exportadoras mostram menor sensibilidade à Selic devido a receita em dólar
- Detecção de comunidades revela agrupamentos transversais que não coincidem perfeitamente com setores oficiais

## Autor

Desenvolvido por Kaylany Meneses

## Licença

Este projeto está disponível sob licença aberta. Consulte o arquivo LICENSE para mais detalhes.
