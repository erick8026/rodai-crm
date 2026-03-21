'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lead, ESTADOS, PROBABILIDAD_POR_ESTADO, Producto, PaqueteAsignado, parsePaquetes, calcularValor } from '@/lib/supabase'

function fmt(n: number) {
  return n.toLocaleString('es-CR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

export default function LeadsTable({
  leads,
  initialEstado = '',
  initialIdioma = '',
  initialFuente = '',
}: {
  leads: Lead[]
  initialEstado?: string
  initialIdioma?: string
  initialFuente?: string
}) {
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState(initialEstado)
  const [filterIdioma, setFilterIdioma] = useState(initialIdioma)
  const [filterFuente, setFilterFuente] = useState(initialFuente)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Lead> & { paquetes?: PaqueteAsignado[] }>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [generatingPropuesta, setGeneratingPropuesta] = useState<string | null>(null)
  const [copiedPropuesta, setCopiedPropuesta] = useState<string | null>(null)
  const [propuestaError, setPropuestaError] = useState<string | null>(null)
  const [propuestaModal, setPropuestaModal] = useState<{ lead: Lead; telefono: string } | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/productos').then(r => r.ok ? r.json() : []).then(setProductos).catch(() => {})
  }, [])

  const idiomas = Array.from(new Set(leads.map(l => l.idioma).filter(Boolean)))

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || [l.nombre, l.empresa, l.telefono, l.correo]
      .some(f => f?.toLowerCase().includes(q))
    const matchEstado = !filterEstado || l.estado === filterEstado
    const matchIdioma = !filterIdioma || l.idioma === filterIdioma
    const matchFuente = !filterFuente || l.fuente === filterFuente
    return matchSearch && matchEstado && matchIdioma && matchFuente
  })

  function startEdit(lead: Lead) {
    setEditId(lead.id)
    setEditData({
      estado: lead.estado,
      notas: lead.notas,
      nombre: lead.nombre,
      empresa: lead.empresa,
      correo: lead.correo,
      frecuencia_pago: lead.frecuencia_pago ?? 'mensual',
      paquetes: parsePaquetes(lead.paquetes_contratados),
      fecha_cierre_esperada: lead.fecha_cierre_esperada ?? '',
      probabilidad: lead.probabilidad ?? PROBABILIDAD_POR_ESTADO[lead.estado] ?? 10,
    })
  }

  function togglePaquete(p: Producto) {
    setEditData(prev => {
      const pqs = prev.paquetes ?? []
      const exists = pqs.find(x => x.id === p.id)
      const next = exists
        ? pqs.filter(x => x.id !== p.id)
        : [...pqs, { id: p.id, sku: p.sku, nombre: p.nombre, precio_mensual: p.precio_mensual, precio_anual: p.precio_anual }]
      const frecuencia = (prev.frecuencia_pago ?? 'mensual') as 'mensual' | 'anual'
      return { ...prev, paquetes: next, valor_oportunidad: calcularValor(next, frecuencia) }
    })
  }

  function setFrecuencia(f: 'mensual' | 'anual') {
    setEditData(prev => {
      const pqs = prev.paquetes ?? []
      return { ...prev, frecuencia_pago: f, valor_oportunidad: calcularValor(pqs, f) }
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setSaveError('')
    const { paquetes, ...rest } = editData
    const payload = {
      ...rest,
      paquetes_contratados: JSON.stringify(paquetes ?? []),
      valor_oportunidad: editData.valor_oportunidad ?? 0,
      // convert empty string to null so Supabase date column doesn't reject it
      fecha_cierre_esperada: editData.fecha_cierre_esperada || null,
      probabilidad: editData.probabilidad ?? 10,
    }
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setSaveError(d.error ?? 'Error al guardar')
      setSaving(false)
      return
    }
    setSaving(false)
    setEditId(null)
    setSaveError('')
    router.refresh()
  }

  async function generarPropuesta(lead: Lead, telefono: string) {
    setGeneratingPropuesta(lead.id)
    setPropuestaError(null)
    setPropuestaModal(null)
    try {
      const res = await fetch('/api/propuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          cliente_nombre: lead.nombre || 'Cliente',
          cliente_empresa: lead.empresa || '',
          plan_sku: parsePaquetes(lead.paquetes_contratados)[0]?.sku ?? 'ROD-PLN-ST-01',
          cliente_telefono: telefono,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPropuestaError(data.error ?? 'Error al generar propuesta')
        return
      }
      const url = `https://app.rodai.io/propuesta/${data.token}`
      let copied = false
      try {
        await navigator.clipboard.writeText(url)
        copied = true
      } catch {
        try {
          const ta = document.createElement('textarea')
          ta.value = url
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          copied = document.execCommand('copy')
          document.body.removeChild(ta)
        } catch { copied = false }
      }
      if (copied) {
        setCopiedPropuesta(lead.id)
        setTimeout(() => setCopiedPropuesta(null), 4000)
      } else {
        setPropuestaError(url)
      }
    } catch {
      setPropuestaError('Error de red')
    } finally {
      setGeneratingPropuesta(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setFilterEstado('')
    setFilterIdioma('')
    setFilterFuente('')
  }

  const hasFilters = search || filterEstado || filterIdioma || filterFuente

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre, empresa, teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {idiomas.length > 1 && (
          <select
            value={filterIdioma}
            onChange={e => setFilterIdioma(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los idiomas</option>
            {idiomas.map(i => <option key={i} value={i!}>{i}</option>)}
          </select>
        )}
        <select
          value={filterFuente}
          onChange={e => setFilterFuente(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las fuentes</option>
          <option value="whatsapp">📱 WhatsApp</option>
          <option value="web">🌐 Web</option>
          <option value="crm">🖥️ CRM</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          Mostrando {filtered.length} de {leads.length} leads
          {filterEstado && <span> · Estado: <strong>{ESTADOS[filterEstado as Lead['estado']]?.label ?? filterEstado}</strong></span>}
          {filterIdioma && <span> · Idioma: <strong>{filterIdioma}</strong></span>}
          {filterFuente && <span> · Fuente: <strong>{filterFuente}</strong></span>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Contacto</th>
              <th className="px-6 py-3 font-medium">Empresa</th>
              <th className="px-6 py-3 font-medium">Teléfono</th>
              <th className="px-6 py-3 font-medium">Fuente</th>
              <th className="px-6 py-3 font-medium">Idioma</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium">Paquetes / Valor</th>
              <th className="px-6 py-3 font-medium">Notas / Conversación</th>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-gray-400">No se encontraron resultados</td>
              </tr>
            )}
            {filtered.map(lead => {
              const paquetes = parsePaquetes(lead.paquetes_contratados)
              const frecuencia = (lead.frecuencia_pago ?? 'mensual') as 'mensual' | 'anual'
              const valor = lead.valor_oportunidad ?? calcularValor(paquetes, frecuencia)
              const editPaquetes = editData.paquetes ?? []
              const editFrecuencia = (editData.frecuencia_pago ?? 'mensual') as 'mensual' | 'anual'

              return (
                <tr key={lead.id} className="hover:bg-gray-50 transition align-top">
                  {/* Contacto */}
                  <td className="px-6 py-4">
                    {editId === lead.id ? (
                      <div className="space-y-1">
                        <input
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                          placeholder="Nombre"
                          value={editData.nombre ?? ''}
                          onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))}
                        />
                        <input
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                          placeholder="Correo"
                          value={editData.correo ?? ''}
                          onChange={e => setEditData(p => ({ ...p, correo: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-800">{lead.nombre || '—'}</p>
                        <p className="text-xs text-gray-400">{lead.correo || ''}</p>
                      </div>
                    )}
                  </td>

                  {/* Empresa */}
                  <td className="px-6 py-4 text-gray-600">
                    {editId === lead.id ? (
                      <input
                        className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                        placeholder="Empresa"
                        value={editData.empresa ?? ''}
                        onChange={e => setEditData(p => ({ ...p, empresa: e.target.value }))}
                      />
                    ) : lead.empresa || '—'}
                  </td>

                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{lead.telefono || '—'}</td>

                  {/* Fuente */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.fuente === 'whatsapp' ? 'bg-green-100 text-green-700' :
                      lead.fuente === 'crm' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.fuente === 'whatsapp' ? '📱 WhatsApp' : lead.fuente === 'crm' ? '🖥️ CRM' : '🌐 Web'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-500 capitalize">{lead.idioma || '—'}</td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    {editId === lead.id ? (
                      <div className="space-y-1.5 min-w-[160px]">
                        <select
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                          value={editData.estado ?? lead.estado}
                          onChange={e => {
                            const est = e.target.value as Lead['estado']
                            setEditData(p => ({ ...p, estado: est, probabilidad: PROBABILIDAD_POR_ESTADO[est] ?? p.probabilidad }))
                          }}
                        >
                          {Object.entries(ESTADOS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 w-12">Prob.</span>
                          <input type="number" min="0" max="100"
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                            value={editData.probabilidad ?? ''}
                            onChange={e => setEditData(p => ({ ...p, probabilidad: Number(e.target.value) }))}
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-0.5">Cierre esperado</span>
                          <input type="date"
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                            value={editData.fecha_cierre_esperada ?? ''}
                            onChange={e => setEditData(p => ({ ...p, fecha_cierre_esperada: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block"
                          style={{ backgroundColor: ESTADOS[lead.estado]?.color ?? '#6b7280' }}
                        >
                          {ESTADOS[lead.estado]?.label ?? lead.estado}
                        </span>
                        {lead.probabilidad != null && (
                          <p className="text-xs text-gray-400">{lead.probabilidad}% prob.</p>
                        )}
                        {lead.fecha_cierre_esperada && (
                          <p className="text-xs text-gray-500">
                            {new Date(lead.fecha_cierre_esperada).toLocaleDateString('es-CR')}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Paquetes / Valor */}
                  <td className="px-6 py-4 min-w-[200px]">
                    {editId === lead.id ? (
                      <div className="space-y-2">
                        {/* Frecuencia toggle */}
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
                          {(['mensual', 'anual'] as const).map(f => (
                            <button key={f} type="button" onClick={() => setFrecuencia(f)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                                editFrecuencia === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                              }`}
                            >
                              {f === 'mensual' ? 'Mensual' : 'Anual'}
                            </button>
                          ))}
                        </div>
                        {/* Product selector */}
                        <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-1.5 bg-white">
                          {productos.length === 0 && <p className="text-xs text-gray-400 px-1">Sin productos</p>}
                          {productos.map(p => {
                            const sel = editPaquetes.some(x => x.id === p.id)
                            return (
                              <label key={p.id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={sel} onChange={() => togglePaquete(p)}
                                  className="rounded accent-blue-600" />
                                <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{p.sku}</span>
                                <span className="text-xs text-gray-700 flex-1">{p.nombre}</span>
                                <span className="text-xs text-gray-400">
                                  {editFrecuencia === 'anual'
                                    ? fmt(p.precio_anual > 0 ? p.precio_anual : p.precio_mensual * 12)
                                    : fmt(p.precio_mensual)}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                        {editPaquetes.length > 0 && (
                          <p className="text-xs font-semibold text-blue-700">
                            Total: {fmt(editData.valor_oportunidad ?? 0)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {paquetes.length > 0 ? (
                          <>
                            {paquetes.map(p => (
                              <div key={p.id} className="flex items-center gap-1.5">
                                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{p.sku}</span>
                                <span className="text-xs text-gray-600">{p.nombre}</span>
                              </div>
                            ))}
                            <p className="text-xs text-gray-400">{frecuencia}</p>
                            {valor > 0 && <p className="text-sm font-semibold text-green-700">{fmt(valor)}</p>}
                          </>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Notas + FAQ */}
                  <td className="px-6 py-4 max-w-xs">
                    {editId === lead.id ? (
                      <textarea
                        className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm resize-y min-h-[120px]"
                        rows={8}
                        value={editData.notas ?? ''}
                        onChange={e => setEditData(p => ({ ...p, notas: e.target.value }))}
                        placeholder="Agrega comentarios, preguntas frecuentes del cliente, observaciones..."
                      />
                    ) : (
                      <div className="space-y-1.5 max-w-sm">
                        {lead.notas && (
                          <div>
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === lead.id + '_notas' ? null : lead.id + '_notas')}
                              className="text-xs text-yellow-700 font-medium hover:underline"
                            >
                              {expandedFaq === lead.id + '_notas' ? '▲ Ocultar notas' : '▼ Notas'}
                            </button>
                            {expandedFaq === lead.id + '_notas' && (
                              <p className="text-xs text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg px-2 py-1.5 mt-1 whitespace-pre-wrap">
                                {lead.notas}
                              </p>
                            )}
                          </div>
                        )}
                        {lead.faq_respuestas && (
                          <div>
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === lead.id ? null : lead.id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {expandedFaq === lead.id ? '▲ Ocultar conversación' : '▼ Ver conversación'}
                            </button>
                            {expandedFaq === lead.id && (
                              <p className="text-xs text-gray-500 mt-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 whitespace-pre-wrap">
                                {lead.faq_respuestas}
                              </p>
                            )}
                          </div>
                        )}
                        {!lead.notas && !lead.faq_respuestas && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{lead.fecha || '—'}</td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    {editId === lead.id ? (
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(lead.id)}
                            disabled={saving}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-60"
                          >
                            {saving ? '...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => { setEditId(null); setSaveError('') }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                        </div>
                        {saveError && <p className="text-xs text-red-500 max-w-[140px]">{saveError}</p>}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => startEdit(lead)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setPropuestaModal({ lead, telefono: lead.telefono ?? '' })}
                          disabled={generatingPropuesta === lead.id}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-60 transition whitespace-nowrap"
                        >
                          {generatingPropuesta === lead.id
                            ? '...'
                            : copiedPropuesta === lead.id
                            ? '✓ Link copiado'
                            : '📄 Propuesta'}
                        </button>
                        {propuestaError && (
                          <a
                            href={propuestaError}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline max-w-[150px] break-all block"
                          >
                            Abrir propuesta →
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal — Confirmar teléfono para propuesta */}
    {propuestaModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Generar propuesta</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {propuestaModal.lead.nombre || 'Cliente'}
              {propuestaModal.lead.empresa ? ` · ${propuestaModal.lead.empresa}` : ''}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Teléfono de verificación del cliente
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 50688887777"
              value={propuestaModal.telefono}
              onChange={e => setPropuestaModal(m => m ? { ...m, telefono: e.target.value } : null)}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">
              El cliente usará este número para acceder a su propuesta. No modifica el contacto en el CRM.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => generarPropuesta(propuestaModal.lead, propuestaModal.telefono)}
              disabled={!propuestaModal.telefono.trim() || generatingPropuesta === propuestaModal.lead.id}
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {generatingPropuesta === propuestaModal.lead.id ? 'Generando...' : 'Generar y copiar link'}
            </button>
            <button
              onClick={() => setPropuestaModal(null)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
