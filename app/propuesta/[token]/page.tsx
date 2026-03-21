import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getPropuesta(token: string) {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.from('propuestas').select('*').eq('token', token).single()
  if (data && !data.visto_at) {
    await sb.from('propuestas').update({ visto_at: new Date().toISOString() }).eq('token', token)
  }
  return data
}

export default async function PropuestaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const propuesta = await getPropuesta(token)
  if (!propuesta) notFound()

  const fecha = new Date(propuesta.created_at).toLocaleDateString('es-CR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#07112f] text-[#ecf2ff]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://rodai.io/assets/logo.jpg" alt="RODAI" className="h-10 w-auto rounded-lg" />
          <span className="text-xs text-[#33b6ff] font-medium uppercase tracking-widest">Propuesta Comercial</span>
        </div>
        <span className="text-xs text-[#b9c6ee]">{fecha}</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Greeting */}
        <section className="space-y-2">
          <p className="text-sm text-[#b9c6ee] uppercase tracking-wider font-medium">Preparado para</p>
          <h1 className="text-4xl font-bold text-white">{propuesta.cliente_nombre}</h1>
          {propuesta.cliente_empresa && (
            <p className="text-lg text-[#33b6ff]">{propuesta.cliente_empresa}</p>
          )}
          <p className="text-[#b9c6ee] text-base pt-2 max-w-2xl">
            Nos complace presentarle esta propuesta para implementar un asistente de inteligencia artificial
            en su negocio. A continuación encontrará todo lo incluido, los alcances y las condiciones del servicio.
          </p>
        </section>

        {/* Notes if any */}
        {propuesta.notas_propuesta && (
          <section className="bg-[#33b6ff]/10 border border-[#33b6ff]/30 rounded-2xl px-6 py-5">
            <p className="text-sm font-semibold text-[#33b6ff] mb-2">Nota personalizada</p>
            <p className="text-[#ecf2ff] text-sm whitespace-pre-wrap">{propuesta.notas_propuesta}</p>
          </section>
        )}

        {/* Pricing */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-sm text-[#b9c6ee] mb-1">Setup único</p>
            <p className="text-5xl font-bold text-white">$50</p>
            <p className="text-xs text-[#b9c6ee] mt-2">Pago único de instalación</p>
          </div>
          <div className="bg-[#29d17d]/10 border border-[#29d17d]/40 rounded-2xl p-6 text-center">
            <p className="text-sm text-[#b9c6ee] mb-1">Mensualidad</p>
            <p className="text-5xl font-bold text-[#29d17d]">$65</p>
            <p className="text-xs text-[#b9c6ee] mt-2">por mes · sin contrato largo</p>
          </div>
        </section>

        {/* Plan name */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-[#33b6ff] rounded-full" />
            <h2 className="text-2xl font-bold text-white">Plan Lía — Asistente Inteligente</h2>
          </div>

          {/* What's included */}
          <div className="grid sm:grid-cols-2 gap-6">

            <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-[#33b6ff] text-sm uppercase tracking-wider">Qué incluye</h3>

              <div>
                <p className="text-xs font-medium text-[#b9c6ee] mb-2">Funcionalidad principal</p>
                {[
                  'Respuestas automáticas con inteligencia artificial',
                  'Atención a clientes 24/7',
                  'Hasta 10 preguntas frecuentes configuradas',
                  'Respuestas personalizadas según su negocio',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 py-1">
                    <span className="text-[#29d17d] mt-0.5 text-sm">✓</span>
                    <span className="text-sm text-[#ecf2ff]">{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-[#b9c6ee] mb-2">Canal</p>
                <div className="flex items-start gap-2 py-1">
                  <span className="text-[#29d17d] mt-0.5 text-sm">✓</span>
                  <span className="text-sm text-[#ecf2ff]">Integración con WhatsApp</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#b9c6ee] mb-2">Gestión de citas</p>
                {[
                  'Registro de hasta 99 citas mensuales',
                  'Resumen diario por email con las citas',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 py-1">
                    <span className="text-[#29d17d] mt-0.5 text-sm">✓</span>
                    <span className="text-sm text-[#ecf2ff]">{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-[#b9c6ee] mb-2">Implementación</p>
                {[
                  'Configuración completa del chatbot',
                  'Ajuste del prompt para su negocio',
                  'Conexión con WhatsApp',
                  'Tiempo de entrega: 24 a 72 horas',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 py-1">
                    <span className="text-[#29d17d] mt-0.5 text-sm">✓</span>
                    <span className="text-sm text-[#ecf2ff]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Limits */}
              <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-3">Límites del plan</h3>
                {[
                  ['Conversaciones mensuales', '200'],
                  ['Flujos conversacionales', '1'],
                  ['Preguntas configuradas', 'Hasta 10'],
                  ['Cambios incluidos/mes', '2'],
                  ['Cambio adicional', '$15'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-[#b9c6ee]">{label}</span>
                    <span className="text-sm font-semibold text-white">{val}</span>
                  </div>
                ))}
              </div>

              {/* Support */}
              <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-3">Soporte</h3>
                {[
                  ['Tiempo de respuesta', 'Hasta 6 horas'],
                  ['Horario', 'Lun–Vie 8am–5pm'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-[#b9c6ee]">{label}</span>
                    <span className="text-sm font-semibold text-white">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Extras */}
        <section className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-[#33b6ff] text-sm uppercase tracking-wider mb-4">Extras disponibles</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['+50 conversaciones adicionales', '$14.99'],
              ['+15 preguntas adicionales', '$9.99'],
              ['+10 citas adicionales', '$9.99'],
              ['Idioma adicional (inglés)', '$9.99/mes'],
              ['Canal adicional (Instagram, Facebook, TikTok)', '$14.99/mes'],
            ].map(([item, price]) => (
              <div key={item} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                <span className="text-sm text-[#ecf2ff]">{item}</span>
                <span className="text-sm font-bold text-[#29d17d] ml-4 whitespace-nowrap">{price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Not included */}
        <section className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-4">No incluye</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              'Captura avanzada de leads',
              'Confirmación o cancelación de citas',
              'Automatizaciones',
              'Integraciones con CRM',
              'Atención humana o desvío a agente',
              'Respuestas a mensajes de voz o imágenes',
              'Desarrollo personalizado',
              'Soporte fuera de horario',
              'Cambios urgentes (menos de 24h)',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 py-1">
                <span className="text-[#ef4444] text-sm">✗</span>
                <span className="text-sm text-[#b9c6ee]">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Conditions */}
        <section className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-3">Condiciones</h3>
          <ul className="space-y-2">
            {[
              'Uso sujeto a política de uso justo.',
              'Los cambios deben solicitarse con 24 horas de anticipación.',
              'No incluye acceso al sistema interno de RODAI.',
              '1 conversación = interacción por cliente en un período de 24 horas.',
            ].map(c => (
              <li key={c} className="text-sm text-[#b9c6ee] flex items-start gap-2">
                <span className="text-[#33b6ff] mt-0.5">•</span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pt-4">
          <p className="text-[#b9c6ee] text-base">¿Listo para automatizar su negocio?</p>
          <a
            href="https://wa.me/50363143273?text=Hola%2C%20quiero%20activar%20el%20Plan%20L%C3%ADa%20de%20RODAI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#29d17d] hover:bg-[#22b86a] text-[#07112f] font-bold text-lg px-10 py-4 rounded-full transition-colors"
          >
            Quiero este plan → Escríbenos por WhatsApp
          </a>
          <p className="text-xs text-[#b9c6ee]">También en <a href="https://rodai.io" className="text-[#33b6ff] hover:underline">rodai.io</a></p>
        </section>

      </main>

      <footer className="border-t border-white/10 mt-16 px-6 py-8 text-center text-xs text-[#b9c6ee] max-w-4xl mx-auto">
        © {new Date().getFullYear()} RODAI · rodai.io · Propuesta generada el {fecha}
      </footer>
    </div>
  )
}
