'use client'
import { useState } from 'react'
import { PLANES } from '@/lib/planes'

function PhoneGate({ token, onVerified }: { token: string; onVerified: (data: any) => void }) {
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!telefono.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/propuestas/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.valid) {
      onVerified(data.propuesta)
    } else {
      const hint = data.hint ? ` El número registrado termina en ${data.hint}.` : ''
      setError(`Número incorrecto.${hint} Verifica e intenta de nuevo.`)
    }
  }

  return (
    <div className="min-h-screen bg-[#07112f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://rodai.io/assets/logo.jpg" alt="RODAI" className="h-14 w-auto rounded-xl mx-auto mb-4" />
          <p className="text-[#b9c6ee] text-sm">Propuesta Comercial</p>
        </div>

        {/* Card */}
        <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-2">Acceder a mi propuesta</h1>
          <p className="text-sm text-[#b9c6ee] mb-6">
            Ingresa tu número de WhatsApp para ver tu propuesta personalizada.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#b9c6ee] mb-2">
                Número de teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Ej: 50688887777"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#b9c6ee]/50 focus:outline-none focus:ring-2 focus:ring-[#33b6ff] text-sm"
                autoFocus
              />
              <p className="text-xs text-[#b9c6ee]/60 mt-1.5">
                Incluye el código de país. Ejemplo: <span className="text-[#33b6ff]">50688887777</span>
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !telefono.trim()}
              className="w-full py-3 bg-[#29d17d] hover:bg-[#22b86a] disabled:opacity-50 text-[#07112f] font-bold rounded-xl transition-colors"
            >
              {loading ? 'Verificando...' : 'Ver mi propuesta →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#b9c6ee]/50 mt-6">
          ¿Problemas para acceder?{' '}
          <a href="https://wa.me/50377420672" className="text-[#33b6ff] hover:underline">
            Escríbenos por WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}

function PropuestaView({ propuesta }: { propuesta: any }) {
  const plan = PLANES[propuesta.plan_sku] ?? PLANES['ROD-PLN-ST-01']
  const color = plan.color

  const fecha = new Date(propuesta.created_at).toLocaleDateString('es-CR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const waMsg = encodeURIComponent(`Hola, vi la propuesta del ${plan.nombre} de RODAI y me interesa activarlo`)

  return (
    <div className="min-h-screen bg-[#07112f] text-[#ecf2ff]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5 max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://rodai.io/assets/logo.jpg" alt="RODAI" className="h-10 w-auto rounded-lg" />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color }}>Propuesta Comercial</span>
        </div>
        <span className="text-xs text-[#b9c6ee]">{fecha}</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Greeting */}
        <section className="space-y-2">
          <p className="text-sm text-[#b9c6ee] uppercase tracking-wider font-medium">Preparado para</p>
          <h1 className="text-4xl font-bold text-white">{propuesta.cliente_nombre}</h1>
          {propuesta.cliente_empresa && (
            <p className="text-lg" style={{ color }}>{propuesta.cliente_empresa}</p>
          )}
          <p className="text-[#b9c6ee] text-base pt-2 max-w-2xl">
            Nos complace presentarle esta propuesta para implementar un asistente de inteligencia artificial
            en su negocio. A continuación encontrará todo lo incluido, los alcances y las condiciones del servicio.
          </p>
        </section>

        {/* Notes */}
        {propuesta.notas_propuesta && (
          <section className="rounded-2xl px-6 py-5 border" style={{ backgroundColor: `${color}18`, borderColor: `${color}50` }}>
            <p className="text-sm font-semibold mb-2" style={{ color }}>Nota personalizada</p>
            <p className="text-[#ecf2ff] text-sm whitespace-pre-wrap">{propuesta.notas_propuesta}</p>
          </section>
        )}

        {/* Pricing */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-sm text-[#b9c6ee] mb-1">Setup único</p>
            <p className="text-5xl font-bold text-white">${plan.setup}</p>
            <p className="text-xs text-[#b9c6ee] mt-2">Pago único de instalación</p>
          </div>
          <div className="rounded-2xl p-6 text-center border" style={{ backgroundColor: `${color}18`, borderColor: `${color}60` }}>
            <p className="text-sm text-[#b9c6ee] mb-1">Mensualidad</p>
            <p className="text-5xl font-bold" style={{ color }}>${plan.mensual}</p>
            <p className="text-xs text-[#b9c6ee] mt-2">por mes · sin contrato largo</p>
          </div>
        </section>

        {/* Plan name */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <h2 className="text-2xl font-bold text-white">{plan.nombre}</h2>
              <p className="text-sm text-[#b9c6ee]">{plan.subtitulo}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6 space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color }}>Qué incluye</h3>
              {plan.incluye.map(bloque => (
                <div key={bloque.seccion}>
                  <p className="text-xs font-medium text-[#b9c6ee] mb-2">{bloque.seccion}</p>
                  {bloque.items.map(item => (
                    <div key={item} className="flex items-start gap-2 py-1">
                      <span className="text-sm mt-0.5" style={{ color: '#29d17d' }}>✓</span>
                      <span className="text-sm text-[#ecf2ff]">{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-3">Límites del plan</h3>
                {plan.limites.map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-[#b9c6ee]">{label}</span>
                    <span className="text-sm font-semibold text-white">{val}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-3">Soporte</h3>
                {plan.soporte.map(([label, val]) => (
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
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-4" style={{ color }}>Extras disponibles</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {plan.extras.map(([item, price]) => (
              <div key={item} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                <span className="text-sm text-[#ecf2ff]">{item}</span>
                <span className="text-sm font-bold ml-4 whitespace-nowrap" style={{ color: '#29d17d' }}>{price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Not included */}
        <section className="bg-[#0c1945] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-[#b9c6ee] text-sm uppercase tracking-wider mb-4">No incluye</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {plan.noIncluye.map(item => (
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
            {plan.condiciones.map(c => (
              <li key={c} className="text-sm text-[#b9c6ee] flex items-start gap-2">
                <span className="mt-0.5" style={{ color }}>•</span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pt-4">
          <p className="text-[#b9c6ee] text-base">¿Listo para automatizar su negocio?</p>
          <a
            href={`https://wa.me/50377420672?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-bold text-lg px-10 py-4 rounded-full transition-colors text-[#07112f]"
            style={{ backgroundColor: '#29d17d' }}
          >
            Quiero este plan → Escríbenos por WhatsApp
          </a>
          <p className="text-xs text-[#b9c6ee]">
            También en <a href="https://rodai.io" className="text-[#33b6ff] hover:underline">rodai.io</a>
          </p>
        </section>

      </main>

      <footer className="border-t border-white/10 mt-16 px-6 py-8 text-center text-xs text-[#b9c6ee] max-w-4xl mx-auto">
        © {new Date().getFullYear()} RODAI · rodai.io · Propuesta generada el {fecha}
      </footer>
    </div>
  )
}

export default function PropuestaClient({ token }: { token: string }) {
  const [propuesta, setPropuesta] = useState<any>(null)

  if (!propuesta) {
    return <PhoneGate token={token} onVerified={setPropuesta} />
  }

  return <PropuestaView propuesta={propuesta} />
}
