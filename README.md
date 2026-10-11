# Arauco Protectum — Missão Araucária

Site estático de uma missão de restauração ecológica com a **Araucaria angustifolia** nos Campos de Cima da Serra (RS). Reúne quatro vistas:

| Vista | O que faz |
| --- | --- |
| **Início** | Apresenta a missão, o total de árvores em acompanhamento e por que a araucária importa. |
| **Calculadora** | Simula o impacto potencial (CO₂, O₂ associado e água direcionada ao solo) a partir de premissas editáveis. |
| **Estudo** | Nota técnica com limitações, cautelas e leituras de referência. |
| **Ação local** | Registro e agenda de plantios, salvos apenas no navegador de quem usa. |

> Todos os números da calculadora são **estimativas educativas**. Não substituem inventário florestal, modelagem hidrológica nem crédito de carbono.

## Como rodar

Não há build nem dependências. Qualquer servidor estático serve:

```bash
npm start            # python3 -m http.server 8080 → http://localhost:8080
# ou simplesmente abra index.html no navegador
```

Para publicar, basta ativar o GitHub Pages na raiz da branch principal.

## Testes

```bash
npm test             # node --test: testa o núcleo da calculadora
```

## Estrutura

```
index.html            marcação das quatro vistas
style.css             estilos (tema escuro e claro, responsivo)
calculator-core.js    lógica pura da calculadora (usada no navegador e nos testes)
script.js             navegação por hash, tema, calculadora e registro de plantios
tests/                testes do núcleo da calculadora
```

`calculator-core.js` é carregado antes de `script.js` e expõe `window.AraucoCalc`. Em Node, o mesmo arquivo é importado com `require`.

## Como a calculadora calcula

- **CO₂ acumulado** = árvores × idade × captura anual por árvore (kg CO₂/ano)
- **O₂ associado** = CO₂ × 32/44 (razão estequiométrica da fotossíntese; não é “oxigênio disponível”)
- **Água direcionada ao solo, por ano** = árvores × área de copa × chuva anual × fração adicional que infiltra (1 mm sobre 1 m² = 1 litro)

Premissas e limites aceitos (valores fora do intervalo são ajustados e o usuário é avisado):

| Premissa | Padrão | Intervalo |
| --- | --- | --- |
| Árvores | 247 | 1 – 10.000.000 |
| Idade média | 15 anos | 1 – 80 |
| Captura por árvore/ano | 22 kg CO₂ | 0,1 – 1.000 |
| Área de copa | 20 m² | 1 – 400 |
| Chuva anual | 1.700 mm | 100 – 6.000 |
| Infiltração adicional | 20 % | 0 – 100 |

A captura de 22 kg/ano é um **valor ilustrativo**. Troque por dados de campo ou de literatura.

## Dados e privacidade

- O total de **247 árvores** é um valor fixo em `index.html` (`data-base` em `#treeCount`). Atualize-o quando houver um inventário.
- Os plantios cadastrados em *Ação local* ficam no `localStorage` do navegador e **não são enviados a nenhum servidor**. Eles somam ao total exibido apenas naquele dispositivo.
- O tema escolhido também é guardado no navegador.

## Acessibilidade

Link “pular para o conteúdo”, navegação por teclado, foco movido ao título ao trocar de vista, `aria-live` nos resultados e avisos, `aria-pressed` no botão de tema, contraste verificado nos dois temas e suporte a `prefers-reduced-motion`.

## Pendências

- Conferir se os links da vista **Estudo** continuam abrindo.
- Substituir o 247 por um dado de inventário e, se for o caso, ligar o registro de plantios a um backend.
