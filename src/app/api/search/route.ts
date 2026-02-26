import { NextResponse } from 'next/server';

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
  publicationDate: string | null;
  dateFound: string;
}

// Google Custom Search API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBNfx07Bp3Jo4Qam9t6LmskO2KS91UC5S0';
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || 'd46a4a2bc670e4827';

// Reputable medical sources
const REPUTABLE_SOURCES = [
  'pmc.ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'aabb.org',
  'who.int',
  'ashpublications.org',
  'sciencedirect.com',
  'link.springer.com',
  'jmir.org',
  'researchgate.net',
  'nejm.org',
  'thelancet.com',
  'bmj.com',
  'jamanetwork.com',
  'nature.com',
  'frontiersin.org',
  'plos.org',
  'mdpi.com',
  'biomedcentral.com'
];

// Search queries for bloodless medicine
const SEARCH_QUERIES = [
  'bloodless medicine surgery treatment 2024 2025',
  'Patient Blood Management PBM guidelines',
  'transfusion alternatives medical research',
  'blood conservation surgery techniques',
  'bloodless cardiac surgery outcomes',
  'anemia management without transfusion',
  'cell salvage autologous transfusion'
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname;
  } catch {
    return 'Unknown';
  }
}

function isReputableSource(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return REPUTABLE_SOURCES.some(source => 
      hostname === source || hostname.endsWith('.' + source)
    );
  } catch {
    return false;
  }
}

async function searchGoogle(query: string): Promise<any[]> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Search API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error searching Google for "${query}":`, error);
    return [];
  }
}

export async function POST() {
  try {
    const allArticles: Article[] = [];
    const seenUrls = new Set<string>();

    // Perform searches with different queries
    for (const query of SEARCH_QUERIES.slice(0, 5)) { // Limit to 5 queries to stay within quota
      try {
        const results = await searchGoogle(query);
        
        for (const item of results) {
          // Filter to only include reputable sources
          if (isReputableSource(item.link) && !seenUrls.has(item.link)) {
            seenUrls.add(item.link);
            
            const article: Article = {
              id: generateId(),
              title: item.title || 'Untitled',
              url: item.link,
              source: extractSourceName(item.link),
              snippet: item.snippet || '',
              publicationDate: item.pagemap?.metatags?.[0]?.article?.published_time || null,
              dateFound: new Date().toISOString()
            };
            
            allArticles.push(article);
          }
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error processing query "${query}":`, error);
      }
    }

    // If no articles found from Google, return sample articles as fallback
    if (allArticles.length === 0) {
      const sampleArticles = getSampleArticles();
      return NextResponse.json({
        success: true,
        data: {
          articlesFound: sampleArticles.length,
          weeklyArticles: sampleArticles,
          message: `Pesquisa concluída! ${sampleArticles.length} artigos encontrados (dados de exemplo).`,
          note: 'Usando dados de exemplo. Verifique a configuração da API do Google.'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        articlesFound: allArticles.length,
        weeklyArticles: allArticles,
        message: `Pesquisa concluída! ${allArticles.length} artigos encontrados de fontes médicas confiáveis.`
      }
    });
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao realizar pesquisa' },
      { status: 500 }
    );
  }
}

// Fallback sample articles
function getSampleArticles(): Article[] {
  return [
    {
      id: generateId(),
      title: 'Patient Blood Management Program Implementation - PMC',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11296688',
      source: 'pmc.ncbi.nlm.nih.gov',
      snippet: 'Current scientific evidence supports the effectiveness of PBM by reducing the need for blood transfusions, decreasing associated complications.',
      publicationDate: '2024',
      dateFound: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'WHO Guidance on implementing patient blood management',
      url: 'https://www.who.int/publications/b/76782',
      source: 'who.int',
      snippet: 'This document guides health authorities in implementing patient blood management (PBM) as a national standard of care.',
      publicationDate: '2024',
      dateFound: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Cardiac Surgery and Blood-Saving Techniques: An Update',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8844256',
      source: 'pmc.ncbi.nlm.nih.gov',
      snippet: 'Blood conservation strategies including PAD, low CPB prime, effective RAP, cell salvage and pharmacological agents.',
      publicationDate: '2024',
      dateFound: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Outcomes of cardiac surgery in Jehovah\'s Witness patients',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8446884',
      source: 'pmc.ncbi.nlm.nih.gov',
      snippet: 'Bloodless protocol does not significantly impact clinical outcomes compared to non-Witness patients.',
      publicationDate: '2024',
      dateFound: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Alternatives to blood transfusion',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9666052',
      source: 'pmc.ncbi.nlm.nih.gov',
      snippet: 'Strategies to minimise or avoid blood transfusions in surgical and medical anaemias.',
      publicationDate: '2024',
      dateFound: new Date().toISOString()
    }
  ];
}
