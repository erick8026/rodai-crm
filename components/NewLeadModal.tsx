'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS } from '@/lib/supabase'

const IDIOMAS = [
  { value: 'espanol',   label: 'Español' },
  { value: 'ingles',    label: 'Inglés' },
  { value: 'portugues', label: 'Portugués' },
  { value: 'aleman',    label: 'Alemán' },
]

export default function NewLeadModal() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [form, setForm] = useState({
    nombre: '', empresa: '', telefono: '', correo: '',
    estado: 'nuevo', notas: '',
  })
  const [idiomasSeleccionados, setIdiomasSeleccionados] = useState<string[]>(['espanol'])

  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function toggleIdioma(val: string) {
    setIdiomasSeleccionados(prev => {
      if (prev.includes(val)) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev
        return prev.filter(i => i !== val)
      }
      // Max 2 languages
      if (prev.length >= 2) return prev
      return [...prev, val]
    })
  }

  function resetForm() {
    setForm({ nombre: '', empresa: '', telefono: '', correo: '', estado: 'nuevo', notas: '' })
    setIdiomasSeleccionados(['espanol'])
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        idioma: idiomasSeleccionados.join(','),
        fuente: 'crm',
      }),
    })
    if (res.ok) {
      setOpen(false)
      resetForm()
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al crear oportunidad')
    }
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nueva Oportunidad
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">Nueva Oportunidad</h2>
              <button onClick={() => { setOpen(false); resetForm() }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre contacto</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.nombre} onChange={e => set('nombre', e.target.value)}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.empresa} onChange={e => set('empresa', e.target.value)}
                    placeholder="Ej: Mi Empresa S.A."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.telefono} onChange={e => set('telefono', e.target.value)}
                    placeholder="Ej: 88887777"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Correo</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.correo} onChange={e => set('correo', e.target.value)}
                    placeholder="correo@empresa.com"
                  />
                </div>
              </div>

              {/* Idiomas — checkboxes, max 2 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Idiomas del asistente
                  <span className="ml-1 text-gray-400 font-normal">(selecciona hasta 2)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {IDIOMAS.map(({ value, label }) => {
                    const selected = idiomasSeleccionados.includes(value)
                    const disabled = !selected && idiomasSeleccionados.length >= 2
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleIdioma(value)}
                        disabled={disabled}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : disabled
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-white border-white' : 'border-current'
                        }`}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          )}
                        </span>
                        {label}
                      </button>
                    )
                  })}
                </div>
                {idiomasSeleccionados.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Seleccionado: <strong className="text-gray-600">{idiomasSeleccionados.map(i => IDIOMAS.find(l => l.value === i)?.label).join(' + ')}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.estado} onChange={e => set('estado', e.target.value)}
                >
                  {Object.entries(ESTADOS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  value={form.notas} onChange={e => set('notas', e.target.value)}
                  placeholder="Comentarios iniciales sobre esta oportunidad..."
                />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Guardando...' : 'Crear Oportunidad'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); resetForm() }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
