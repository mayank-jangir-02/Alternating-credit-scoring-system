import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsers, createAdminUser, updateAdminUser, deactivateAdminUser } from '../services/api';

interface AdminUser {
  admin_id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'admin',
    permissions: [] as string[]
  });
  const [updateForm, setUpdateForm] = useState({
    full_name: '',
    role: '',
    permissions: [] as string[]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const currentAdminRole = localStorage.getItem('admin_role');
  const isSuperAdmin = currentAdminRole === 'super_admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to load admin users:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await createAdminUser(createForm);
      setSuccess('Admin user created successfully');
      setCreateForm({
        email: '',
        password: '',
        full_name: '',
        role: 'admin',
        permissions: []
      });
      setShowCreateForm(false);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await updateAdminUser(selectedUser.admin_id, updateForm);
      setSuccess('Admin user updated successfully');
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (adminId: number) => {
    if (!confirm('Are you sure you want to deactivate this admin user?')) return;

    try {
      await deactivateAdminUser(adminId);
      setSuccess('Admin user deactivated successfully');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deactivate admin user');
    }
  };

  const openUpdateForm = (user: AdminUser) => {
    setSelectedUser(user);
    setUpdateForm({
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions
    });
    setError('');
    setSuccess('');
  };

  if (loading) {
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
          <h2>Admin Users Management</h2>
          {isSuperAdmin && (
            <button onClick={() => setShowCreateForm(true)}>
              + Create Admin User
            </button>
          )}
        </div>

        {!isSuperAdmin && (
          <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#856404' }}>
              ℹ️ Only super admins can create and manage admin users.
            </p>
          </div>
        )}

        {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className="success" style={{ marginBottom: '16px' }}>{success}</div>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              {isSuperAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.admin_id}>
                <td>{user.admin_id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td style={{ textTransform: 'capitalize' }}>
                  {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </td>
                <td>
                  <span style={{ 
                    color: user.is_active ? '#4CAF50' : '#f44336',
                    fontWeight: '500'
                  }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                {isSuperAdmin && (
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openUpdateForm(user)}
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        Edit
                      </button>
                      {user.is_active && (
                        <button 
                          onClick={() => handleDeactivate(user.admin_id)}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '14px',
                            backgroundColor: '#f44336'
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
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
            <h3 style={{ marginBottom: '16px' }}>Create Admin User</h3>
            
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password (min 8 characters)</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {error && <div className="error">{error}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                  }}
                  style={{ flex: 1, backgroundColor: '#666' }}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update User Modal */}
      {selectedUser && (
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
            <h3 style={{ marginBottom: '16px' }}>Update Admin User</h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>Email:</strong> {selectedUser.email}</p>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={updateForm.full_name}
                  onChange={(e) => setUpdateForm({ ...updateForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={updateForm.role}
                  onChange={(e) => setUpdateForm({ ...updateForm, role: e.target.value })}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {error && <div className="error">{error}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Updating...' : 'Update User'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedUser(null);
                    setError('');
                  }}
                  style={{ flex: 1, backgroundColor: '#666' }}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
