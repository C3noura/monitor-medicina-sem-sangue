import { NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const EMAIL_RECIPIENT = 'rui.cenoura@gmail.com';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
  publicationDate: string | null;
  dateFound: string;
}

async function searchArticles(): Promise<Article[]> {
  try {
    // Call the search API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/cron/search`, {
      method: 'POST'
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

function generateEmailHtml(articles: Article[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 12px; text-align: center; }
    .stats { display: flex; gap: 15px; margin: 20px 0; }
    .stat { flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-number { font-size: 32px; font-weight: bold; color: #dc2626; }
    .article { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .article-title { font-size: 18px; font-weight: 600; color: #1e40af; text-decoration: none; }
    .article-source { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin: 10px 0; }
    .article-snippet { color: #555; font-size: 14px; line-height: 1.6; }
    .footer { text-align: center; padding: 30px; color: #666; border-top: 1px solid #eee; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 Monitor de Medicina Sem Sangue</h1>
    <p>Relatório Automático Semanal</p>
    <p style="opacity: 0.8;">${dateStr}</p>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-number">${articles.length}</div>
      <div>Artigos Encontrados</div>
    </div>
    <div class="stat">
      <div class="stat-number">${new Set(articles.map(a => a.source)).size}</div>
      <div>Fontes Médicas</div>
    </div>
  </div>
  
  <h2>📄 Artigos da Semana</h2>
  
  ${articles.map(article => `
    <div class="article">
      <a href="${article.url}" class="article-title" target="_blank">${article.title}</a>
      <br>
      <span class="article-source">${article.source}</span>
      <p class="article-snippet">${article.snippet || 'Sem descrição disponível.'}</p>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo Monitor de Medicina Sem Sangue.</p>
    <p>🔗 Acesse o dashboard para mais informações.</p>
  </div>
</body>
</html>
  `;
}

function generateEmailText(articles: Article[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  return `
MONITOR DE MEDICINA SEM SANGUE
Relatório Automático Semanal
Data: ${dateStr}

=====================================
ARTIGOS ENCONTRADOS: ${articles.length}
FONTES: ${new Set(articles.map(a => a.source)).size}
=====================================

${articles.map((a, i) => `
${i + 1}. ${a.title}
   Fonte: ${a.source}
   Link: ${a.url}
   ${a.snippet ? `Resumo: ${a.snippet.substring(0, 150)}...` : ''}
`).join('\n')}

=====================================
Relatório gerado automaticamente.
`.trim();
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    console.log('📧 Starting automated email send...');
    
    // Get articles
    const articles = await searchArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No articles found' 
      });
    }
    
    if (!BREVO_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'BREVO_API_KEY not configured' 
      });
    }
    
    // Generate email content
    const html = generateEmailHtml(articles);
    const text = generateEmailText(articles);
    
    // Send email via Brevo
    const apiInstance = new TransactionalEmailsApi();
    apiInstance.setApiKey(0, BREVO_API_KEY);
    
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = `🏥 Relatório Semanal - ${articles.length} Artigos sobre Medicina Sem Sangue`;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text;
    sendSmtpEmail.sender = { 
      name: 'Monitor Medicina Sem Sangue', 
      email: 'rui.cenoura@gmail.com'
    };
    sendSmtpEmail.to = [{ email: EMAIL_RECIPIENT, name: 'Rui Cenoura' }];
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✅ Automated email sent! MessageId: ${response.messageId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      articlesCount: articles.length,
      recipient: EMAIL_RECIPIENT,
      messageId: response.messageId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Automated email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
