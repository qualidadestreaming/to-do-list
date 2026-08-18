// Altura padrão de todos os cards de gráfico do Dashboard — mantém o grid
// visualmente consistente (donut, barras GUT, e os dois rankings horizontais
// usam a mesma altura de card, com scroll interno quando a lista de pessoas
// passa de ~5).
export const DASHBOARD_CARD_HEIGHT = 288;
export const RANKING_ROW_HEIGHT = 44;

// Geometria compartilhada pelos DOIS rankings horizontais ("Visão geral por
// pessoa" e "Atividades por pessoa") — ficam lado a lado no grid, então
// espessura de barra, espaçamento e margem precisam bater exatamente, senão
// as barras de um saem mais grossas que as do outro na mesma linha.
export const RANKING_BAR_SIZE = 26;
export const RANKING_BAR_CATEGORY_GAP = "20%";
export const RANKING_CHART_MARGIN = { top: 8, right: 16, left: 8, bottom: 0 };
