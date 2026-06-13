# vizudados

Análise de correlação e estrutura de mercado do Ibovespa (2018–2025).

Construída com Observable Framework. Usa teoria dos grafos e correlações 
de retorno para revelar como ~80 ativos brasileiros se organizam — e como 
essa estrutura colapsa e se reconstrói em crises.

**→ [Ver análise ao vivo](https://kaylanymeneses.github.io/Vizualiza-o-de-Dados/)**

## O que investiga

- Crises (COVID-19) colapsam correlações — diversificação falha quando mais importa
- Após crises, setores se reorganizam: modularidade e NMI voltam a subir
- Selic reconfigurou vencedores e perdedores entre 2020–2022
- Algoritmo de Louvain detecta comunidades que transgridem classificação setorial da B3

## Stack

Observable Framework · JavaScript · Yahoo Finance API · Banco Central (SGS série 432)

## Rodar localmente

```bash
npm install
npm run dev
```
