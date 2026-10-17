import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { useAuth } from '../hooks/useAuth';

interface AdminAttendanceItem {
  id: number;
  type: string;
  notes: string;
  clockIn: string;
  clockInLocation: { latitude: number; longitude: number };
  clockOut: string | null;
  clockOutLocation: { latitude: number; longitude: number } | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const API_BASE = 'http://localhost:3000';

export const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<AdminAttendanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal photo preview
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Role protection: Only admins may access this page
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else {
        const role = (user.role || '').toUpperCase();
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
          navigate('/attendance', { replace: true });
        }
      }
    }
  }, [user, authLoading, navigate]);

  const fetchLogs = async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (dateFilter.trim()) {
        params.append('date', dateFilter.trim());
      }

      const res = await fetch(`${API_BASE}/attendance/all?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Akses ditolak. Memerlukan hak akses Administrator.');
        }
        throw new Error('Gagal memuat log absensi.');
      }

      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat memuat log absensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const role = (user.role || '').toUpperCase();
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        fetchLogs(page);
      }
    }
  }, [user, page, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  if (authLoading) {
    return <div className="page-loading">Memeriksa otorisasi...</div>;
  }

  return (
    <div className="admin-container">
      {/* Top Admin Sub-Navigation */}
      <div className="admin-subnav">
        <NavLink to="/admin/employees" className="admin-tab">
          Master Data Karyawan
        </NavLink>
        <NavLink to="/admin/attendance" className="admin-tab active">
          Kontrol Absensi
        </NavLink>
      </div>

      <div className="page-header">
        <div>
          <h2>Kontrol Absensi Karyawan</h2>
          <p className="subtitle">
            Pemantauan kehadiran pegawai, presensi WFH, verifikasi koordinat GPS, dan bukti foto secara real-time.
          </p>
        </div>
        <div className="header-meta">
          <span className="badge badge-admin">Admin HRD</span>
          <span className="badge badge-readonly">Audit Log (Read-only)</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        {/* Search & Date Filters Toolbar */}
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} className="toolbar-search">
            <svg className="search-icon-svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau email karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  fetchLogs(1);
                }}
              >
                ✕
              </button>
            )}
          </form>

          <div className="toolbar-filters">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
              title="Filter Berdasarkan Tanggal"
            />

            {(searchQuery || dateFilter) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
              >
                Reset Filter
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchLogs(page)}
              disabled={loading}
            >
              {loading ? 'Memuat...' : 'Segarkan'}
            </button>
          </div>
        </div>

        <div className="table-header-row">
          <h3>
            Daftar Kehadiran Masuk <span className="text-muted">({total} total riwayat)</span>
          </h3>
          <span className="text-muted text-sm mono-text">
            Log presensi WFH karyawan
          </span>
        </div>

        {loading ? (
          <div className="table-loading">Memuat data absensi...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ditemukan data presensi karyawan yang sesuai.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Jam Masuk (Clock In)</th>
                  <th>Jam Keluar (Clock Out)</th>
                  <th>Catatan WFH</th>
                  <th>Bukti Foto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="user-info">
                        <strong>{item.user?.name || 'Tidak Diketahui'}</strong>
                        <span className="user-email">{item.user?.email || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="mono-text">
                        {new Date(item.clockIn).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-wfh">{item.type || 'WFH'}</span>
                    </td>
                    <td>
                      <div className="time-geo">
                        <strong>
                          {new Date(item.clockIn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                        <a
                          href={`https://www.google.com/maps?q=${item.clockInLocation?.latitude},${item.clockInLocation?.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="geo-link"
                          title="Buka lokasi di Google Maps"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {item.clockInLocation?.latitude?.toFixed(4)},{' '}
                          {item.clockInLocation?.longitude?.toFixed(4)}
                        </a>
                      </div>
                    </td>
                    <td>
                      {item.clockOut ? (
                        <div className="time-geo">
                          <strong>
                            {new Date(item.clockOut).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                          <a
                            href={`https://www.google.com/maps?q=${item.clockOutLocation?.latitude},${item.clockOutLocation?.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="geo-link"
                            title="Buka lokasi di Google Maps"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {item.clockOutLocation?.latitude?.toFixed(4)},{' '}
                            {item.clockOutLocation?.longitude?.toFixed(4)}
                          </a>
                        </div>
                      ) : (
                        <span className="badge badge-active">Sedang Bekerja</span>
                      )}
                    </td>
                    <td className="note-cell">{item.notes}</td>
                    <td>
                      <div className="photo-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setActivePhotoUrl(`${API_BASE}/attendance/${item.id}/photo/in`)}
                        >
                          Foto Masuk
                        </button>
                        {item.clockOut && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setActivePhotoUrl(`${API_BASE}/attendance/${item.id}/photo/out`)}
                          >
                            Foto Keluar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <span className="page-indicator">
              Halaman {page} dari {Math.ceil(total / pageSize)}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= Math.ceil(total / pageSize) || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {activePhotoUrl && (
        <div className="modal-backdrop" onClick={() => setActivePhotoUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Verifikasi Bukti Foto Absensi Karyawan</h4>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActivePhotoUrl(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <img src={activePhotoUrl} alt="Bukti foto kehadiran karyawan" className="modal-image" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};