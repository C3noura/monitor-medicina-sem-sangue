export interface Publication {
  id: string
  category: string
  title: string
  source: string
  description: string
  url: string
}

export const publicationsData: Publication[] = [
  {
    id: '1',
    category: 'Biotecnologia e Sangue Artificial',
    title: 'Ensaios de Fase I com Vesículas de Hemoglobina',
    source: 'Japão, 2026',
    description:
      'A Universidade Médica de Nara avançou com testes em humanos de um substituto de sangue universal. O produto é estável por 2 anos à temperatura ambiente e não requer compatibilidade de grupo sanguíneo.',
    url: 'https://trial.medpath.com/news/6f9dac528c3e9037/japan-launches-world-s-first-clinical-trials-for-artificial-blood-in-2025'
  },
  {
    id: '2',
    category: 'Biotecnologia e Sangue Artificial',
    title: 'ErythroMer - Sangue Liofilizado',
    source: 'EUA',
    description:
      'Desenvolvimento de nanopartículas de hemoglobina em pó para ressuscitação de emergência em cenários de trauma onde o sangue doado não está disponível.',
    url: 'https://www.medschool.umaryland.edu/news/2023/artificial-blood-product-one-step-closer-to-reality-with-46-million-in-federal-funding.html'
  },
  {
    id: '3',
    category: 'Cirurgias de Alta Complexidade e PBM',
    title: 'Transplante Coração-Fígado Sem Sangue',
    source: 'Tampa General Hospital',
    description:
      'Documentação do sucesso do primeiro transplante simultâneo destes órgãos realizado inteiramente sem transfusão, utilizando técnicas agressivas de hemostasia de precisão e recuperação celular (Cell Saver).',
    url: 'https://www.tgh.org/news/tgh-press-releases/2025/july/tgh-usf-health-successfully-perform-world-first-recorded-bloodless-heart-liver-transplant-surgery'
  },
  {
    id: '4',
    category: 'Cirurgias de Alta Complexidade e PBM',
    title: 'Transplante Cardíaco: Estudo Longitudinal',
    source: 'PubMed',
    description:
      'Revisão confirmando que pacientes que recusam sangue têm desfechos idênticos aos convencionais quando seguidos protocolos rigorosos de gestão de sangue.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40935286/'
  },
  {
    id: '5',
    category: 'Novas Diretrizes e Consensos',
    title: 'Guia Global da OMS sobre Patient Blood Management',
    source: 'OMS (2025/2026)',
    description:
      'A OMS estabeleceu o PBM como padrão global de segurança, focando na otimização da hemoglobina própria e minimização de perdas iatrogénicas.',
    url: 'https://www.who.int/publications/i/item/9789240104662'
  },
  {
    id: '6',
    category: 'Novas Diretrizes e Consensos',
    title: 'Escala VIBe na Gestão de Sangramento',
    source: 'HTCT Journal',
    description:
      'Publicação validando uma escala visual que ajuda cirurgiões a quantificar o sangramento em tempo real, otimizando o uso de selantes farmacológicos.',
    url: 'https://www.htct.com.br/pt-when-innovation-meets-patient-blood-articulo-S2531137924003080'
  }
]
