import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

interface AttendanceRecord {
  id: number;
  type: string;
  notes: string;
  clockIn: string;
  clockInLocation: { latitude: number; longitude: number };
  clockOut: string | null;
  clockOutLocation: { latitude: number; longitude: number } | null;
}

interface AttendanceStatus {
  state: 'none' | 'clocked_in' | 'done';
  current: AttendanceRecord | null;
}

const API_BASE = 'http://localhost:3000';

export const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Form states
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Detecting location...');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal photo preview
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect admin to /admin page
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else {
        const role = (user.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'SUPERADMIN') {
          navigate('/admin', { replace: true });
        }
      }
    }
  }, [user, authLoading, navigate]);

  // Fetch location using browser Geolocation API
  const detectLocation = () => {
    setLocationStatus('Detecting GPS location...');
    if (!navigator.geolocation) {
      // Fallback coordinates for dev/environments without GPS
      setCoords({ lat: -6.2088, lng: 106.8456 }); // Jakarta default
      setLocationStatus('Geolocation not supported. Using office default.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocationStatus('GPS location acquired.');
      },
      (err) => {
        // Fallback gracefully so user is not blocked
        setCoords({ lat: -6.2088, lng: 106.8456 });
        setLocationStatus(`GPS unavailable (${err.message}). Using fallback location.`);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const loadStatusAndHistory = async () => {
    try {
      setLoadingStatus(true);
      const [resStatus, resHistory] = await Promise.all([
        fetch(`${API_BASE}/attendance/status`, { credentials: 'include' }),
        fetch(`${API_BASE}/attendance/mine`, { credentials: 'include' }),
      ]);

      if (resStatus.ok) {
        const data = await resStatus.json();
        setStatus(data);
      }
      if (resHistory.ok) {
        const data = await resHistory.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {
      setErrorMessage('Failed to load attendance status.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (user) {
      detectLocation();
      loadStatusAndHistory();
    }
  }, [user]);

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Photo exceeds 5 MB limit. Please select a smaller image.');
        return;
      }
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage(null);
    }
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClockIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMessage('Please provide a WFH note describing your plan/tasks.');
      return;
    }
    if (!selectedPhoto) {
      setErrorMessage('Please upload a photo for verification.');
      return;
    }
    if (!coords) {
      setErrorMessage('Location coordinates are required. Please retry GPS detection.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image', selectedPhoto);
    formData.append('notes', notes.trim());
    formData.append('latitude', String(coords.lat));
    formData.append('longitude', String(coords.lng));

    try {
      const res = await fetch(`${API_BASE}/attendance/clock-in`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Clock In failed.');
      }

      setSuccessMessage('Successfully clocked in for WFH!');
      clearPhoto();
      setNotes('');
      await loadStatusAndHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Clock In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto) {
      setErrorMessage('Please upload a photo for clock out verification.');
      return;
    }
    if (!coords) {
      setErrorMessage('Location coordinates are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image', selectedPhoto);
    formData.append('latitude', String(coords.lat));
    formData.append('longitude', String(coords.lng));

    try {
      const res = await fetch(`${API_BASE}/attendance/clock-out`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Clock Out failed.');
      }

      setSuccessMessage('Successfully clocked out! Great job today.');
      clearPhoto();
      await loadStatusAndHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Clock Out failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingStatus) {
    return <div className="page-loading">Loading attendance records...</div>;
  }

  return (
    <div className="attendance-container">
      <div className="page-header">
        <div>
          <h2>Work From Home (WFH) Attendance</h2>
          <p className="subtitle">
            Welcome, <strong>{user?.name}</strong>. Record your daily attendance with notes, GPS, and photo proof.
          </p>
        </div>
        <div className="status-pill">
          State:{' '}
          <span className={`badge badge-${status?.state || 'none'}`}>
            {status?.state === 'clocked_in'
              ? 'Clocked In'
              : status?.state === 'done'
              ? 'Completed Today'
              : 'Not Clocked In'}
          </span>
        </div>
      </div>

      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="attendance-grid">
        {/* Main Action Card */}
        <div className="card action-card">
          {status?.state === 'none' && (
            <form onSubmit={handleClockIn} className="attendance-form">
              <h3>Clock In (WFH)</h3>
              <p className="form-description">
                Record your attendance start. Your photo will be saved securely to the backend.
              </p>

              <div className="form-group">
                <label className="form-label">WFH Notes / Work Plan *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Working on front-end components and attendance APIs today..."
                  disabled={isSubmitting}
                  maxLength={500}
                  required
                />
              </div>

              {/* Location section */}
              <div className="form-group">
                <label className="form-label">Location (GPS)</label>
                <div className="location-box">
                  <span className="location-text mono-text">
                    {coords ? `Lat: ${coords.lat}, Lng: ${coords.lng}` : locationStatus}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={detectLocation}
                  >
                    Refresh GPS
                  </button>
                </div>
              </div>

              {/* Photo Upload section */}
              <div className="form-group">
                <label className="form-label">Photo Verification *</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="form-file-input"
                  required
                />
                {photoPreview && (
                  <div className="photo-preview-container">
                    <img src={photoPreview} alt="Preview" className="photo-preview" />
                    <button type="button" className="btn btn-danger btn-xs" onClick={clearPhoto}>
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Clocking In...' : 'Confirm Clock In'}
              </button>
            </form>
          )}

          {status?.state === 'clocked_in' && (
            <form onSubmit={handleClockOut} className="attendance-form">
              <div className="active-session-banner">
                <h3>Currently Clocked In</h3>
                <p>
                  Started at:{' '}
                  <strong className="mono-text">
                    {status.current?.clockIn
                      ? new Date(status.current.clockIn).toLocaleTimeString()
                      : ''}
                  </strong>
                </p>
                <p className="note-text">
                  <em>"{status.current?.notes}"</em>
                </p>
              </div>

              <h3>Clock Out</h3>
              <p className="form-description">Upload your end-of-day photo proof to complete attendance.</p>

              {/* Location section */}
              <div className="form-group">
                <label className="form-label">Location (GPS)</label>
                <div className="location-box">
                  <span className="location-text mono-text">
                    {coords ? `Lat: ${coords.lat}, Lng: ${coords.lng}` : locationStatus}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={detectLocation}
                  >
                    Refresh GPS
                  </button>
                </div>
              </div>

              {/* Photo Upload section */}
              <div className="form-group">
                <label className="form-label">Clock Out Photo Verification *</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="form-file-input"
                  required
                />
                {photoPreview && (
                  <div className="photo-preview-container">
                    <img src={photoPreview} alt="Preview" className="photo-preview" />
                    <button type="button" className="btn btn-danger btn-xs" onClick={clearPhoto}>
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-warning btn-lg w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Clocking Out...' : 'Confirm Clock Out'}
              </button>
            </form>
          )}

          {status?.state === 'done' && (
            <div className="done-card">
              <div className="done-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3>Attendance Complete For Today</h3>
              <p className="subtitle">You have recorded your clock in and clock out for today.</p>
              <div className="done-details">
                <div>
                  <span className="text-muted">Clock In:</span>{' '}
                  <strong>
                    {status.current?.clockIn
                      ? new Date(status.current.clockIn).toLocaleTimeString()
                      : '-'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Clock Out:</span>{' '}
                  <strong>
                    {status.current?.clockOut
                      ? new Date(status.current.clockOut).toLocaleTimeString()
                      : '-'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History Table Card */}
        <div className="card history-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-header-row">
            <h3>Attendance History</h3>
          </div>
          {history.length === 0 ? (
            <p className="empty-state">No attendance records yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Note</th>
                    <th>Photos</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span className="mono-text">
                          {new Date(rec.clockIn).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="time-geo">
                          <strong className="mono-text">
                            {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                          <span className="geo-tag mono-text">
                            {rec.clockInLocation?.latitude?.toFixed(4)}, {rec.clockInLocation?.longitude?.toFixed(4)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {rec.clockOut ? (
                          <div className="time-geo">
                            <strong className="mono-text">
                              {new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </strong>
                            <span className="geo-tag mono-text">
                              {rec.clockOutLocation?.latitude?.toFixed(4)}, {rec.clockOutLocation?.longitude?.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-active">In Progress</span>
                        )}
                      </td>
                      <td className="note-cell">{rec.notes}</td>
                      <td>
                        <div className="photo-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setActivePhotoUrl(`${API_BASE}/attendance/${rec.id}/photo/in`)}
                          >
                            In Photo
                          </button>
                          {rec.clockOut && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => setActivePhotoUrl(`${API_BASE}/attendance/${rec.id}/photo/out`)}
                            >
                              Out Photo
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
        </div>
      </div>

      {/* Photo Modal */}
      {activePhotoUrl && (
        <div className="modal-backdrop" onClick={() => setActivePhotoUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Attendance Verification Photo</h4>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActivePhotoUrl(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <img src={activePhotoUrl} alt="Attendance verification" className="modal-image" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};