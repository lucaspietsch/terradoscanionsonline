// Dados informativos da atração. Os números abaixo vêm de matérias públicas sobre a inauguração
// (jul/2023) e DEVEM ser confirmados com o operador antes de publicar em produção.
export const tirolesaContent = {
  facts: [
    { label: 'Extensão', value: '720 m' },
    { label: 'Altura do chão', value: 'cerca de 750 m' },
    { label: 'Altitude', value: 'cerca de 1.099 m' },
    { label: 'Velocidade média', value: 'até ~30 km/h' },
    { label: 'Duração da descida', value: '5 a 10 min' },
    { label: 'Cabos', value: '6 (até 3 pessoas por vez)' },
  ],
  place: 'Cânion Fortaleza — Parque Nacional da Serra Geral, Cambará do Sul (RS)',
  howItWorks: [
    'Escolha a data, o horário e a quantidade de ingressos.',
    'Informe os dados de cada participante (nome, nascimento e peso).',
    'Pague com Pix (aprovação na hora) ou cartão.',
    'Receba um QR Code por participante e apresente na chegada.',
  ],
  faq: [
    { q: 'Qual é o peso permitido?', a: 'A faixa de peso é definida pelo operador e aparece na página de compra. Informar o peso real é obrigatório por segurança — será conferido na chegada.' },
    { q: 'E se chover ou ventar muito?', a: 'A operação depende das condições climáticas. Se o horário for cancelado pelo operador, você pode remarcar ou pedir o estorno integral.' },
    { q: 'Menores podem ir?', a: 'Sim, desde que atendam à idade e ao peso mínimos e estejam acompanhados de um adulto responsável no mesmo pedido.' },
    { q: 'O ingresso do parque está incluso?', a: 'Confirme na descrição do produto. Se não estiver incluso, o ingresso de entrada do parque é adquirido à parte.' },
    { q: 'Posso cancelar?', a: 'Entre em contato pelo canal do operador. Cancelamentos e estornos seguem a política exibida no checkout e o Código de Defesa do Consumidor.' },
  ],
  // RASCUNHO: o texto final deve ser fornecido e revisado pelo operador/advogado. Sempre que mudar,
  // altere `waiver_version` do produto — o aceite do cliente fica gravado com a versão.
  waiver: {
    version: 'v1-rascunho',
    text: [
      'Declaro que li e compreendi as orientações de segurança da atividade de tirolesa e que as informações de peso e idade que forneci são verdadeiras.',
      'Estou ciente de que a atividade envolve riscos inerentes e que devo seguir as instruções da equipe de operação durante todo o procedimento.',
      'Declaro não possuir condições de saúde que contraindiquem a atividade (como problemas cardíacos graves, gestação ou lesões recentes) e me responsabilizo por informar a equipe em caso de dúvida.',
      'A operação pode ser suspensa por condições climáticas ou de segurança, sem prejuízo do direito de remarcação ou estorno.',
      'Para menores de 18 anos, o adulto responsável no pedido assume a responsabilidade pelo menor e o acompanhará durante a atividade.',
    ],
  },
};
