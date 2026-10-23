import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAdminInfo } from '../services/api';

function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const loadAdminInfo = async () => {
    try {
      const adminData = await getAdminInfo();
      setAdmin(adminData);
    } catch (error) {
      console.error('Failed to load admin info:', error);
      // Clear stale token to break the redirect loop
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('admin_email');
      localStorage.removeItem('admin_role');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_role');
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ marginBottom: '32px', fontSize: '20px' }}>Admin Panel</h2>
        
        <nav style={{ flex: 1 }}>
          <Link 
            to="/admin/analytics" 
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginBottom: '8px',
              backgroundColor: isActive('/admin/analytics') ? '#34495e' : 'transparent'
            }}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/admin/applications" 
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginBottom: '8px',
              backgroundColor: isActive('/admin/applications') ? '#34495e' : 'transparent'
            }}
          >
            📋 Applications
          </Link>
          <Link 
            to="/admin/users" 
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginBottom: '8px',
              backgroundColor: isActive('/admin/users') ? '#34495e' : 'transparent'
            }}
          >
            👥 Admin Users
          </Link>
        </nav>

        <div style={{ borderTop: '1px solid #34495e', paddingTop: '16px', marginTop: '16px' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>Logged in as:</p>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{admin?.full_name}</p>
          <p style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '16px' }}>
            {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </p>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '10px',
              backgroundColor: '#e74c3c',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', backgroundColor: '#f5f5f5' }}>
        <div className="card">
          <h1 style={{ marginBottom: '16px' }}>Welcome to Admin Dashboard</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Select an option from the sidebar to get started.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <Link to="/admin/analytics" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '24px',
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <h3 style={{ marginBottom: '8px' }}>📊 Analytics</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>View system metrics and reports</p>
              </div>
            </Link>
            
            <Link to="/admin/applications" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '24px',
                backgroundColor: '#2ecc71',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <h3 style={{ marginBottom: '8px' }}>📋 Applications</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Manage credit applications</p>
              </div>
            </Link>
            
            <Link to="/admin/users" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '24px',
                backgroundColor: '#9b59b6',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <h3 style={{ marginBottom: '8px' }}>👥 Admin Users</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Manage admin accounts</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
