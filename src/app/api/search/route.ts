import { NextResponse } from 'next/server';

// Interface unificada para artigos de pesquisa
interface ResearchPaper {
  id: string;
  source: string;
  title: string;
  authors: string;
  year: string;
  abstract: string;
  url: string;
  isPortuguese?: boolean;
  hasFullText?: boolean;
  citationCount?: number;
  isPreprint?: boolean;
}

// Configuração de datas
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 4; // 2021

// Fake sites para excluir
const FAKE_SITES = [
  'actamedicaportuguesa.com',
  'scielo.pt',
  'revportcardiologia.pt',
  'rpmgf.pt',
  'spmi.pt',
  'ordemdosmedicos.pt',
  'apmc.pt',
];

// Termos de busca otimizados
const SEARCH_QUERIES = [
  '"Patient Blood Management" AND surgery',
  '"Bloodless surgery" techniques',
  '"Anemia management" AND "without transfusion"',
  '"Blood conservation" AND surgery',
  '"Intraoperative cell salvage"',
  '"Preoperative anemia" AND optimization',
];

// Termos em português
const PORTUGUESE_QUERIES = [
  'medicina sem sangue',
  'gestão de sangue do paciente',
  'cirurgia sem transfusão',
];

class MedicalResearchAgent {
  private readonly SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search";
  private readonly EUROPE_PMC_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
  private readonly PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  private readonly PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
  private readonly PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isFakeSite(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      return FAKE_SITES.some(site => hostname === site || hostname.endsWith('.' + site));
    } catch {
      return false;
    }
  }

  private detectPortuguese(title: string, abstract: string): boolean {
    const keywords = ['medicina', 'sangue', 'transfusão', 'paciente', 'tratamento', 
                      'hospital', 'cirurgia', 'anemia', 'portugal', 'saúde'];
    const text = `${title} ${abstract}`.toLowerCase();
    return keywords.some(k => text.includes(k));
  }

  private isValidYear(year: string | null): boolean {
    if (!year) return true;
    const y = parseInt(year);
    return y >= MIN_YEAR && y <= CURRENT_YEAR;
  }

  /**
   * Busca no Europe PMC (Excelente para Open Access)
   * - JSON nativo
   * - Texto completo disponível
   * - Inclui PubMed + mais fontes
   */
  async fetchEuropePMC(query: string): Promise<ResearchPaper[]> {
    try {
      const params = new URLSearchParams({
        query: `${query} AND PUB_YEAR:[${MIN_YEAR} TO ${CURRENT_YEAR}]`,
        format: 'json',
        pageSize: '5',
        resultType: 'core',
        sort: 'P_PDATE_D desc'
      });

      const response = await fetch(`${this.EUROPE_PMC_URL}?${params}`);
      if (!response.ok) return [];

      const data = await response.json();
      const results = data?.resultList?.result || [];

      return results
        .filter((r: Record<string, unknown>) => this.isValidYear(r.pubYear as string))
        .map((r: Record<string, unknown>) => ({
          id: this.generateId(),
          source: 'Europe PMC',
          title: (r.title as string) || 'Untitled',
          authors: (r.authorString as string) || 'Unknown authors',
          year: (r.pubYear as string) || '',
          abstract: (r.abstractText as string) || "Resumo não disponível.",
          url: r.doi ? `https://doi.org/${r.doi}` : `https://europepmc.org/article/med/${r.pmid}`,
          isPortuguese: this.detectPortuguese(r.title as string, r.abstractText as string),
          hasFullText: r.isOpenAccess === 'Y' || !!r.pmcid
        }));
    } catch (error) {
      console.error('Europe PMC error:', error);
      return [];
    }
  }

  /**
   * Busca no Semantic Scholar (IA para relevância)
   * - Ranking por citações
   * - Resumos gerados por IA
   * - Links para PDFs abertos
   */
  async fetchSemanticScholar(query: string): Promise<ResearchPaper[]> {
    try {
      const params = new URLSearchParams({
        query: query,
        limit: '5',
        fields: 'title,authors,year,abstract,url,citationCount,openAccessPdf,publicationDate',
        year: `${MIN_YEAR}-${CURRENT_YEAR}`
      });

      const response = await fetch(`${this.SEMANTIC_SCHOLAR_URL}?${params}`, {
        headers: { 'User-Agent': 'MonitorMedicinaSemSangue/1.0' }
      });
      if (!response.ok) return [];

      const data = await response.json();
      const results = data?.data || [];

      return results
        .filter((r: Record<string, unknown>) => this.isValidYear(r.year?.toString() as string))
        .map((r: Record<string, unknown>) => ({
          id: this.generateId(),
          source: 'Semantic Scholar',
          title: (r.title as string) || 'Untitled',
          authors: (r.authors as Array<{name: string}>)?.map((a) => a.name).join(', ') || 'Unknown authors',
          year: r.year?.toString() || '',
          abstract: (r.abstract as string) || "Resumo não disponível.",
          url: (r.openAccessPdf as {url: string})?.url || (r.url as string) || `https://semanticscholar.org/paper/${r.paperId}`,
          isPortuguese: this.detectPortuguese(r.title as string, r.abstract as string),
          citationCount: (r.citationCount as number) || 0,
          hasFullText: !!(r.openAccessPdf as {url: string})?.url
        }));
    } catch (error) {
      console.error('Semantic Scholar error:', error);
      return [];
    }
  }

  /**
   * Busca no PubMed (Padrão Ouro via E-Utilities)
   * - 35+ milhões de citações
   * - MeSH terms
   * - Dois passos: Search -> Summary/Fetch
   */
  async fetchPubMed(query: string): Promise<ResearchPaper[]> {
    try {
      // Passo 1: Buscar IDs com filtro de data
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: `${query} AND (${MIN_YEAR}:${CURRENT_YEAR}[pdat])`,
        retmode: 'json',
        retmax: '5',
        sort: 'relevance'
      });

      const searchResponse = await fetch(`${this.PUBMED_SEARCH_URL}?${searchParams}`, {
        headers: { 'User-Agent': 'MonitorMedicinaSemSangue/1.0 (mailto:rui.cenoura@gmail.com)' }
      });
      if (!searchResponse.ok) return [];

      const searchData = await searchResponse.json();
      const ids = searchData?.esearchresult?.idlist || [];
      
      if (ids.length === 0) return [];

      // Passo 2: Buscar Detalhes (esummary para dados básicos)
      const summaryParams = new URLSearchParams({
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'json'
      });

      const summaryResponse = await fetch(`${this.PUBMED_SUMMARY_URL}?${summaryParams}`, {
        headers: { 'User-Agent': 'MonitorMedicinaSemSangue/1.0' }
      });
      if (!summaryResponse.ok) return [];

      const summaryData = await summaryResponse.json();
      const results = summaryData?.result || {};
      const uids = results?.uids || [];

      // Passo 3: Buscar abstracts (efetch)
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'xml'
      });

      const fetchResponse = await fetch(`${this.PUBMED_FETCH_URL}?${fetchParams}`, {
        headers: { 'User-Agent': 'MonitorMedicinaSemSangue/1.0' }
      });
      const fetchText = fetchResponse.ok ? await fetchResponse.text() : '';

      // Parse abstracts do XML
      const abstractMap: Record<string, string> = {};
      const articleBlocks = fetchText.split('<PubmedArticle>');
      for (const block of articleBlocks) {
        const pmidMatch = block.match(/<PMID[^>]*>([^<]+)<\/PMID>/);
        const abstractMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
        if (pmidMatch && abstractMatch) {
          abstractMap[pmidMatch[1]] = abstractMatch[1]
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 500);
        }
      }

      return uids.map((uid: string) => {
        const r = results[uid];
        if (!r || typeof r !== 'object') return null;

        const year = (r.pubdate as string)?.split(' ')[0] || '';
        const abstract = abstractMap[uid] || "Resumo disponível no link.";

        return {
          id: this.generateId(),
          source: 'PubMed',
          title: (r.title as string) || 'Untitled',
          authors: (r.authors as Array<{name: string}>)?.map((a) => a.name).join(', ') || 'Unknown authors',
          year: year,
          abstract: abstract,
          url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
          isPortuguese: this.detectPortuguese(r.title as string, abstract)
        };
      }).filter((p: ResearchPaper | null): p is ResearchPaper => p !== null && this.isValidYear(p.year));
    } catch (error) {
      console.error('PubMed error:', error);
      return [];
    }
  }

  /**
   * Orquestrador: Busca em todas as fontes e consolida
   */
  async searchAll(query: string): Promise<ResearchPaper[]> {
    console.log(`🔍 Pesquisando por: "${query}"...`);
    
    // Busca paralela em todas as fontes
    const [epmc, semantic, pubmed] = await Promise.all([
      this.fetchEuropePMC(query),
      this.fetchSemanticScholar(query),
      this.fetchPubMed(query)
    ]);

    const allResults = [...epmc, ...semantic, ...pubmed];

    // Remover duplicados por URL
    const seenUrls = new Set<string>();
    const uniqueResults = allResults.filter(paper => {
      if (seenUrls.has(paper.url) || this.isFakeSite(paper.url)) return false;
      seenUrls.add(paper.url);
      return true;
    });

    // Ordenar: Português primeiro, depois por citações, depois por ano
    uniqueResults.sort((a, b) => {
      if (a.isPortuguese && !b.isPortuguese) return -1;
      if (!a.isPortuguese && b.isPortuguese) return 1;
      if (a.citationCount && b.citationCount) return b.citationCount - a.citationCount;
      return parseInt(b.year) - parseInt(a.year);
    });

    console.log(`✅ ${uniqueResults.length} artigos encontrados`);
    return uniqueResults;
  }
}

// API Route Handler
export async function POST() {
  try {
    const agent = new MedicalResearchAgent();
    const allPapers: ResearchPaper[] = [];

    // Buscar com termos em inglês (mais resultados)
    for (const query of SEARCH_QUERIES.slice(0, 3)) {
      const papers = await agent.searchAll(query);
      allPapers.push(...papers);
    }

    // Buscar com termos em português
    for (const query of PORTUGUESE_QUERIES.slice(0, 2)) {
      const papers = await agent.searchAll(query);
      allPapers.push(...papers);
    }

    // Remover duplicados finais
    const seenUrls = new Set<string>();
    const uniquePapers = allPapers.filter(paper => {
      if (seenUrls.has(paper.url)) return false;
      seenUrls.add(paper.url);
      return true;
    });

    // Ordenar novamente
    uniquePapers.sort((a, b) => {
      if (a.isPortuguese && !b.isPortuguese) return -1;
      if (!a.isPortuguese && b.isPortuguese) return 1;
      if (a.citationCount && b.citationCount) return b.citationCount - a.citationCount;
      return parseInt(b.year || '0') - parseInt(a.year || '0');
    });

    // Limitar a 30 resultados
    const finalPapers = uniquePapers.slice(0, 30);

    // Estatísticas
    const portugueseCount = finalPapers.filter(p => p.isPortuguese).length;
    const fullTextCount = finalPapers.filter(p => p.hasFullText).length;

    return NextResponse.json({
      success: true,
      data: {
        articlesFound: finalPapers.length,
        portugueseArticles: portugueseCount,
        fullTextArticles: fullTextCount,
        weeklyArticles: finalPapers,
        message: `Pesquisa concluída! ${finalPapers.length} artigos encontrados (${portugueseCount} em português, ${fullTextCount} com texto completo).`,
        sources: {
          'PubMed': 'Padrão ouro - 35+ milhões de citações médicas',
          'Europe PMC': 'Open Access - Texto completo disponível',
          'Semantic Scholar': 'IA para relevância e citações',
        },
        dateRange: `${MIN_YEAR}-${CURRENT_YEAR}`,
        searchTerms: SEARCH_QUERIES.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao realizar pesquisa. Tente novamente.',
      data: {
        articlesFound: 0,
        weeklyArticles: []
      }
    });
  }
}
