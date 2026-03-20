'use client'
import { useState, useEffect } from 'react'

type User = { id: string; email: string; created_at: string; last_sign_in_at: string | null }

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadUsers() {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      setSuccess(`Usuario ${email} creado correctamente.`)
      setEmail('')
      setPassword('')
      setShowForm(false)
      loadUsers()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al crear usuario')
    }
    setSaving(false)
  }

  async function deleteUser(id: string, userEmail: string) {
    if (!confirm(`¿Eliminar usuario ${userEmail}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) loadUsers()
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* User list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Usuarios del CRM</h2>
            <p className="text-xs text-gray-400 mt-0.5">Personas con acceso al panel</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar usuario
          </button>
        </div>

        {showForm && (
          <form onSubmit={createUser} className="px-6 py-4 bg-blue-50 border-b border-blue-100 space-y-3">
            <p className="text-xs font-medium text-blue-800">Nuevo usuario</p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {saving ? 'Creando...' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
                className="px-4 py-2 bg-white text-gray-600 rounded-xl text-sm hover:bg-gray-50 border border-gray-200 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {success && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-100 text-green-700 text-sm">{success}</div>
        )}

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Creado: {new Date(u.created_at).toLocaleDateString('es-CR')}
                    {u.last_sign_in_at && ` · Último acceso: ${new Date(u.last_sign_in_at).toLocaleDateString('es-CR')}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteUser(u.id, u.email!)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar usuario"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
