import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { useAuth } from '../hooks/useAuth';

interface RoleEntity {
  id: number;
  name: string;
}

interface EmployeeItem {
  id: number;
  name: string;
  email: string;
  role: RoleEntity;
  status: boolean;
  session_version: number;
  created_at: string;
  updated_at: string;
}

const API_BASE = 'http://localhost:3000';

export const EmployeeMasterPage = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Employee list state
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [roles, setRoles] = useState<RoleEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRoleId, setAddRoleId] = useState<number | ''>('');
  const [addStatus, setAddStatus] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Modal State
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Confirm Modal State
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Authorization check: Only Admin / Superadmin
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/', { replace: true });
      } else {
        const role = (currentUser.role || '').toUpperCase();
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
          navigate('/attendance', { replace: true });
        }
      }
    }
  }, [currentUser, authLoading, navigate]);

  // Fetch employees and roles
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { credentials: 'include' }),
        fetch(`${API_BASE}/roles`, { credentials: 'include' }),
      ]);

      if (!usersRes.ok) {
        if (usersRes.status === 403) throw new Error('Akses ditolak. Memerlukan hak akses Admin.');
        throw new Error('Gagal memuat data karyawan.');
      }

      const usersData = await usersRes.json();
      setEmployees(Array.isArray(usersData) ? usersData : []);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const roleList: RoleEntity[] = Array.isArray(rolesData) ? rolesData : [];
        setRoles(roleList);
        if (roleList.length > 0 && addRoleId === '') {
          // Default to regular USER role if available
          const defaultUserRole = roleList.find((r) => r.name.toUpperCase() === 'USER') || roleList[0];
          setAddRoleId(defaultUserRole.id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const role = (currentUser.role || '').toUpperCase();
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        loadData();
      }
    }
  }, [currentUser]);

  // Open Edit Modal
  const handleOpenEdit = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditRoleId(emp.role?.id ?? (roles[0]?.id || 1));
    setEditStatus(emp.status);
    setEditNewPassword('');
    setEditError(null);
  };

  // Submit Add Employee
  const handleCreateEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword) {
      setAddError('Nama, email, dan password wajib diisi.');
      return;
    }
    if (addPassword.length < 8) {
      setAddError('Password minimal harus 8 karakter.');
      return;
    }
    if (!addRoleId) {
      setAddError('Silakan pilih role karyawan.');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      setAddError(null);

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim().toLowerCase(),
          password: addPassword,
          role_id: Number(addRoleId),
          status: addStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menambahkan karyawan.');
      }

      setIsAddOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setSuccessMessage(`Karyawan '${data.name}' berhasil ditambahkan.`);
      await loadData();
    } catch (err: any) {
      setAddError(err?.message || 'Gagal menambahkan karyawan.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Edit Employee
  const handleUpdateEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Nama dan email wajib diisi.');
      return;
    }

    if (editNewPassword && editNewPassword.length < 8) {
      setEditError('Password baru minimal harus 8 karakter.');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      setEditError(null);

      const payload: Record<string, any> = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role_id: Number(editRoleId),
        status: editStatus,
      };

      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      const res = await fetch(`${API_BASE}/users/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal memperbarui data karyawan.');
      }

      setEditingEmployee(null);
      setSuccessMessage(`Data karyawan '${data.name}' berhasil diperbarui.`);
      await loadData();
    } catch (err: any) {
      setEditError(err?.message || 'Gagal memperbarui data.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (emp: EmployeeItem) => {
    if (currentUser?.id === emp.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }

    const nextStatus = !emp.status;
    const actionLabel = nextStatus ? 'mengaktifkan' : 'menonaktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun '${emp.name}'?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || `Gagal ${actionLabel} karyawan.`);
      }

      setSuccessMessage(`Status karyawan '${emp.name}' berhasil diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || `Gagal mengubah status.`);
    }
  };

  // Delete Employee Confirmation
  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    if (currentUser?.id === deletingEmployee.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      setDeletingEmployee(null);
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE}/users/${deletingEmployee.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menghapus karyawan.');
      }

      setSuccessMessage(data?.message || `Karyawan '${deletingEmployee.name}' berhasil diproses.`);
      setDeletingEmployee(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus karyawan.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered employees calculation
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const empRole = (emp.role?.name || '').toUpperCase();
    const matchesRole = filterRole === 'ALL' || empRole === filterRole;

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && emp.status) ||
      (filterStatus === 'INACTIVE' && !emp.status);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status).length;
  const inactiveEmployees = totalEmployees - activeEmployees;
  const adminCount = employees.filter((e) => {
    const r = (e.role?.name || '').toUpperCase();
    return r === 'ADMIN' || r === 'SUPERADMIN';
  }).length;

  if (authLoading) {
    return <div className="page-loading">Memeriksa otorisasi...</div>;
  }

  return (
    <div className="admin-container">
      {/* Top Admin Sub-Navigation */}
      <div className="admin-subnav">
        <NavLink to="/admin/employees" className="admin-tab active">
          Master Data Karyawan
        </NavLink>
        <NavLink to="/admin/attendance" className="admin-tab">
          Kontrol Absensi
        </NavLink>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Master Data Karyawan</h2>
          <p className="subtitle">
            Direktori akun karyawan, penambahan staf baru, pembaruan profil & hak akses portal.
          </p>
        </div>
        <div className="header-meta">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setIsAddOpen(true);
              setAddError(null);
            }}
          >
            + Tambah Karyawan
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Karyawan</span>
          <span className="kpi-value">{totalEmployees}</span>
          <span className="kpi-sub">Terdaftar di sistem</span>
        </div>
        <div className="kpi-card kpi-success">
          <span className="kpi-label">Karyawan Aktif</span>
          <span className="kpi-value">{activeEmployees}</span>
          <span className="kpi-sub">Dapat melakukan presensi</span>
        </div>
        <div className="kpi-card kpi-warning">
          <span className="kpi-label">Nonaktif / Ditangguhkan</span>
          <span className="kpi-value">{inactiveEmployees}</span>
          <span className="kpi-sub">Akses login ditutup</span>
        </div>
        <div className="kpi-card kpi-info">
          <span className="kpi-label">Administrator / HRD</span>
          <span className="kpi-value">{adminCount}</span>
          <span className="kpi-sub">Akses manajemen portal</span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Employee Directory Card */}
      <div className="card table-card">
        {/* Filters and Search Toolbar */}
        <div className="table-toolbar">
          <div className="toolbar-search">
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
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="toolbar-filters">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Semua Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name.toUpperCase()}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
            >
              {loading ? 'Memuat...' : 'Segarkan'}
            </button>
          </div>
        </div>

        {/* Employee Table */}
        {loading ? (
          <div className="table-loading">Memuat direktori data master karyawan...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada data karyawan yang cocok dengan kriteria pencarian.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Karyawan</th>
                  <th>Role</th>
                  <th>Status Akun</th>
                  <th>Terdaftar Sejak</th>
                  <th style={{ textAlign: 'right' }}>Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const roleUpper = (emp.role?.name || '').toUpperCase();
                  const isAdminRole = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';
                  const isCurrent = currentUser?.id === emp.id;

                  return (
                    <tr key={emp.id} className={!emp.status ? 'row-inactive' : ''}>
                      <td className="mono-text">#{emp.id}</td>
                      <td>
                        <div className="user-info">
                          <strong>
                            {emp.name} {isCurrent && <span className="tag-self">(Anda)</span>}
                          </strong>
                          <span className="user-email">{emp.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isAdminRole ? 'badge-admin' : 'badge-user'}`}>
                          {emp.role?.name || 'USER'}
                        </span>
                      </td>
                      <td>
                        <span className="status-indicator">
                          <span className={`status-dot ${emp.status ? 'dot-active' : 'dot-inactive'}`} />
                          <span className="mono-text" style={{ color: emp.status ? '#34d399' : '#f87171' }}>
                            {emp.status ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="mono-text">
                          {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenEdit(emp)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs ${emp.status ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleStatus(emp)}
                            disabled={isCurrent}
                            title={isCurrent ? 'Tidak dapat menonaktifkan akun sendiri' : ''}
                          >
                            {emp.status ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => setDeletingEmployee(emp)}
                            disabled={isCurrent}
                            title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Karyawan'}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah Karyawan Baru */}
      {isAddOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Tambah Karyawan Baru</h4>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsAddOpen(false)}
              >
                ✕
              </button>
            </div>

            {addError && <div className="alert alert-error">{addError}</div>}

            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Karyawan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="form-input"
                    disabled={isSubmittingAdd}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Email Perusahaan</label>
                  <input
                    type="email"
                    required
                    placeholder="budi.santoso@hris.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="form-input"
                    disabled={isSubmittingAdd}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password Awal (Min. 8 karakter)</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 8 karakter"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="form-input"
                    disabled={isSubmittingAdd}
                  />
                  <span className="form-hint">
                    Karyawan dapat menggunakan password ini untuk login pertama kali.
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Role Akses</label>
                    <select
                      value={addRoleId}
                      onChange={(e) => setAddRoleId(Number(e.target.value))}
                      className="form-input"
                      disabled={isSubmittingAdd}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Status Awal</label>
                    <select
                      value={addStatus ? '1' : '0'}
                      onChange={(e) => setAddStatus(e.target.value === '1')}
                      className="form-input"
                      disabled={isSubmittingAdd}
                    >
                      <option value="1">Aktif (Dapat Login & WFH)</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmittingAdd}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingAdd}
                >
                  {isSubmittingAdd ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Data Karyawan */}
      {editingEmployee && (
        <div className="modal-backdrop" onClick={() => setEditingEmployee(null)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Edit Data Karyawan (#{editingEmployee.id})</h4>
              <button
                type="button"
                className="close-btn"
                onClick={() => setEditingEmployee(null)}
              >
                ✕
              </button>
            </div>

            {editError && <div className="alert alert-error">{editError}</div>}

            <form onSubmit={handleUpdateEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Karyawan</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="form-input"
                    disabled={isSubmittingEdit}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Email Perusahaan</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="form-input"
                    disabled={isSubmittingEdit}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Role Akses</label>
                    <select
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(Number(e.target.value))}
                      className="form-input"
                      disabled={isSubmittingEdit}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Status Akun</label>
                    <select
                      value={editStatus ? '1' : '0'}
                      onChange={(e) => setEditStatus(e.target.value === '1')}
                      className="form-input"
                      disabled={isSubmittingEdit || currentUser?.id === editingEmployee.id}
                    >
                      <option value="1">Aktif (Dapat Login & WFH)</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                  <label className="form-label">
                    Reset Password <span className="text-muted">(Opsional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Biarkan kosong jika tidak ingin mengubah password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    className="form-input"
                    disabled={isSubmittingEdit}
                  />
                  <span className="form-hint">
                    Jika diisi, sesi aktif pengguna ini akan otomatis dicabut untuk keamanan.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingEmployee(null)}
                  disabled={isSubmittingEdit}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Karyawan */}
      {deletingEmployee && (
        <div className="modal-backdrop" onClick={() => setDeletingEmployee(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Konfirmasi Penghapusan Karyawan</h4>
              <button
                type="button"
                className="close-btn"
                onClick={() => setDeletingEmployee(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Apakah Anda yakin ingin menghapus akun karyawan{' '}
                <strong>{deletingEmployee.name}</strong> ({deletingEmployee.email})?
              </p>
              <p className="modal-note">
                Catatan: Jika karyawan ini memiliki riwayat presensi/absensi, akun akan secara otomatis
                dinonaktifkan (soft delete) untuk menjaga integritas data audit log.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
              >
                {isDeleting ? 'Memproses...' : 'Ya, Hapus Karyawan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
