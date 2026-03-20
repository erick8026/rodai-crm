'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lead, ESTADOS } from '@/lib/supabase'

export default function LeadsTable({
  leads,
  initialEstado = '',
  initialIdioma = '',
}: {
  leads: Lead[]
  initialEstado?: string
  initialIdioma?: string
}) {
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState(initialEstado)
  const [filterIdioma, setFilterIdioma] = useState(initialIdioma)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Lead>>({})
  const [saving, setSaving] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const router = useRouter()

  const idiomas = Array.from(new Set(leads.map(l => l.idioma).filter(Boolean)))

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || [l.nombre, l.empresa, l.telefono, l.correo]
      .some(f => f?.toLowerCase().includes(q))
    const matchEstado = !filterEstado || l.estado === filterEstado
    const matchIdioma = !filterIdioma || l.idioma === filterIdioma
    return matchSearch && matchEstado && matchIdioma
  })

  function startEdit(lead: Lead) {
    setEditId(lead.id)
    setEditData({ estado: lead.estado, notas: lead.notas, nombre: lead.nombre, empresa: lead.empresa, correo: lead.correo })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setSaving(false)
    setEditId(null)
    router.refresh()
  }

  function clearFilters() {
    setSearch('')
    setFilterEstado('')
    setFilterIdioma('')
  }

  const hasFilters = search || filterEstado || filterIdioma

  return (
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
          {filterEstado && <span> · Estado: <strong>{ESTADOS[filterEstado]?.label ?? filterEstado}</strong></span>}
          {filterIdioma && <span> · Idioma: <strong>{filterIdioma}</strong></span>}
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
              <th className="px-6 py-3 font-medium">Notas / Conversación</th>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-gray-400">No se encontraron resultados</td>
              </tr>
            )}
            {filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition">
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
                    lead.fuente === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.fuente === 'whatsapp' ? '📱 WhatsApp' : '🌐 Web'}
                  </span>
                </td>

                <td className="px-6 py-4 text-gray-500 capitalize">{lead.idioma || '—'}</td>

                {/* Estado */}
                <td className="px-6 py-4">
                  {editId === lead.id ? (
                    <select
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                      value={editData.estado ?? lead.estado}
                      onChange={e => setEditData(p => ({ ...p, estado: e.target.value as Lead['estado'] }))}
                    >
                      {Object.entries(ESTADOS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
                      style={{ backgroundColor: ESTADOS[lead.estado]?.color ?? '#6b7280' }}
                    >
                      {ESTADOS[lead.estado]?.label ?? lead.estado}
                    </span>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(lead.id)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? '...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(lead)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition"
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
