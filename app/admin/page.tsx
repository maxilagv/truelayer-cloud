'use client';

import { useState } from 'react';

type TenantResponse = {
  tenant_id: string;
  slug: string;
  token: string;
  token_preview: string;
};

export default function AdminPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [result, setResult] = useState<TenantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!name.trim()) {
      setError('Name required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim()
        },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || null })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create tenant');
      }
      const data = (await res.json()) as TenantResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1>Secret Admin Panel</h1>
      <p className="muted">Create tenants and issue a one-time token.</p>
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <label>
          Tenant name
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ferreteria El Tornillo"
          />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          Slug (optional)
          <input
            className="field"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="el-tornillo"
          />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          Admin key
          <input
            className="field"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_API_KEY"
            type="password"
          />
        </label>
        <button className="button" type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Creating...' : 'Create tenant'}
        </button>
      </form>

      {error && (
        <p className="muted" style={{ color: '#b91c1c', marginTop: 12 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div><strong>Tenant ID:</strong> {result.tenant_id}</div>
          <div><strong>Slug:</strong> {result.slug}</div>
          <div><strong>Token:</strong> {result.token}</div>
          <div className="muted">Store token securely. It is shown once.</div>
        </div>
      )}
    </div>
  );
}
