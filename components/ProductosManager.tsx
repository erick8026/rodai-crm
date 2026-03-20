'use client'
import { useState, useEffect } from 'react'
import { Producto } from '@/lib/supabase'

const EMPTY = { sku: '', nombre: '', descripcion: '', costo: '', precio_mensual: '', precio_anual: '' }

function fmt(n: number) {
  return n.toLocaleString('es-CR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

export default function ProductosManager() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/productos')
    if (res.ok) setProductos(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(p: Producto) {
    setEditingId(p.id)
    setForm({ sku: p.sku, nombre: p.nombre, descripcion: p.descripcion, costo: String(p.costo), precio_mensual: String(p.precio_mensual), precio_anual: String(p.precio_anual) })
    setShowForm(true)
    setError('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sku.trim() || !form.nombre.trim()) { setError('SKU y nombre son obligatorios'); return }
    setSaving(true); setError('')
    const body = { ...form, costo: Number(form.costo) || 0, precio_mensual: Number(form.precio_mensual) || 0, precio_anual: Number(form.precio_anual) || 0 }
    const url = editingId ? `/api/productos/${editingId}` : '/api/productos'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { cancelForm(); load() }
    else { const d = await res.json(); setError(d.error ?? 'Error al guardar') }
    setSaving(false)
  }

  async function deleteProducto(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Los leads con este producto no perderán su valor registrado.`)) return
    await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Catálogo de Productos / SKU</h2>
            <p className="text-xs text-gray-400 mt-0.5">Paquetes disponibles con sus precios</p>
          </div>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo producto
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 py-5 bg-blue-50 border-b border-blue-100 space-y-4">
            <p className="text-sm font-semibold text-blue-800">{editingId ? 'Editar producto' : 'Nuevo producto'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                  placeholder="Ej: LIA-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Lia Rodai" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción breve del paquete" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Costo (USD)</label>
              <input type="number" min="0" step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.costo} onChange={e => setForm(p => ({ ...p, costo: e.target.value }))}
                placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio mensual (USD)</label>
                <input type="number" min="0" step="0.01"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.precio_mensual} onChange={e => setForm(p => ({ ...p, precio_mensual: e.target.value }))}
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio anual (USD) <span className="text-gray-400 font-normal">— 0 = mensual × 12</span></label>
                <input type="number" min="0" step="0.01"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.precio_anual} onChange={e => setForm(p => ({ ...p, precio_anual: e.target.value }))}
                  placeholder="0.00" />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 transition">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={cancelForm}
                className="px-5 py-2 bg-white text-gray-600 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-300 text-sm">No hay productos. Crea el primero.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-6 py-3 font-medium">Costo</th>
                <th className="px-6 py-3 font-medium">Mensual</th>
                <th className="px-6 py-3 font-medium">Anual</th>
                <th className="px-6 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">{p.sku}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px] truncate">{p.descripcion || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{fmt(p.costo)}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">{fmt(p.precio_mensual)}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {p.precio_anual > 0 ? fmt(p.precio_anual) : <span className="text-gray-400 text-xs">{fmt(p.precio_mensual * 12)}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition">
                        Editar
                      </button>
                      <button onClick={() => deleteProducto(p.id, p.nombre)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
