import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminApplications, updateApplicationStatus } from '../services/api';
import SHAPModal from '../components/SHAPModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Application {
  application_id: number;
  user_id: number;
  applicant_type: string;
  status: string;
  requested_amount: number;
  credit_score?: number;
  risk_category?: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    reason: ''
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [shapAppId, setShapAppId] = useState<number | null>(null);
  const navigate = useNavigate();

  const limit = 20;

  useEffect(() => {
    loadApplications();
  }, [page, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getAdminApplications(page * limit, limit, statusFilter || undefined);
      setApplications(data);
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app);
    setUpdateForm({
      status: app.status,
      notes: '',
      reason: ''
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await updateApplicationStatus(
        selectedApp.application_id,
        updateForm.status,
        updateForm.notes || undefined,
        updateForm.reason || undefined
      );
      setSuccess('Application status updated successfully');
      loadApplications();
      setTimeout(() => {
        setSelectedApp(null);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'under_review': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '20px' }}>
          ← Back to Dashboard
        </button>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '20px' }}>
        ← Back to Dashboard
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Applications Management</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Filter by status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{ width: 'auto' }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {applications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '32px' }}>
            No applications found.
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Credit Score</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>SHAP</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.application_id}>
                    <td>{app.application_id}</td>
                    <td>{app.user_id}</td>
                    <td style={{ textTransform: 'capitalize' }}>{app.applicant_type}</td>
                    <td>₹{app.requested_amount.toLocaleString()}</td>
                    <td>{app.credit_score ? Math.round(app.credit_score) : '-'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{app.risk_category || '-'}</td>
                    <td>
                      <span style={{ 
                        color: getStatusColor(app.status),
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      {app.credit_score ? (
                        <button
                          onClick={() => setShapAppId(app.application_id)}
                          style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          View SHAP
                        </button>
                      ) : '-'}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewDetails(app)}
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        View/Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span>Page {page + 1}</span>
              <button 
                onClick={() => setPage(page + 1)}
                disabled={applications.length < limit}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>Update Application Status</h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>Application ID:</strong> {selectedApp.application_id}</p>
              <p><strong>User ID:</strong> {selectedApp.user_id}</p>
              <p><strong>Amount:</strong> ₹{selectedApp.requested_amount.toLocaleString()}</p>
              <p><strong>Current Status:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedApp.status.replace('_', ' ')}</span></p>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="form-group">
                <label>New Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason (optional)</label>
                <input
                  type="text"
                  value={updateForm.reason}
                  onChange={(e) => setUpdateForm({ ...updateForm, reason: e.target.value })}
                  placeholder="e.g., Credit score above threshold"
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  placeholder="Additional notes about this status update"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" disabled={updating} style={{ flex: 1 }}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedApp(null)}
                  style={{ flex: 1, backgroundColor: '#666' }}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {shapAppId && <SHAPModal applicationId={shapAppId} onClose={() => setShapAppId(null)} isAdmin={true} />}
    </div>
  );
}

export default AdminApplications;
