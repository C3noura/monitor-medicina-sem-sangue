import { ExternalLink } from 'lucide-react'
import { publicationsData, type Publication } from '@/data/publications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PublicationsList() {
  const groupedPublications = publicationsData.reduce((acc, pub) => {
    if (!acc[pub.category]) {
      acc[pub.category] = []
    }
    acc[pub.category].push(pub)
    return acc
  }, {} as Record<string, Publication[]>)

  return (
    <Card className="mt-8 border-red-100">
      <CardHeader>
        <CardTitle>🩺 Alerta de Monitorização: Medicina Sem Sangue</CardTitle>
        <CardDescription>
          Atualização sobre avanços científicos e Patient Blood Management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedPublications).map(([category, pubs]) => (
          <section key={category} className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-2">{category}</h3>
            <ul className="space-y-3">
              {pubs.map((pub) => (
                <li key={pub.id} className="rounded-lg border bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">{pub.title}</h4>
                  <Badge variant="secondary" className="mt-2">{pub.source}</Badge>
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">{pub.description}</p>
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    Aceder ao Artigo/Notícia
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}
