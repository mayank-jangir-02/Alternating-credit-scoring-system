import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../services/api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(email, password);
      localStorage.setItem('admin_token', response.access_token);
      localStorage.setItem('admin_id', response.admin_id.toString());
      localStorage.setItem('admin_email', response.email);
      localStorage.setItem('admin_role', response.role);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
        <p style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/login">Back to User Login</Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
