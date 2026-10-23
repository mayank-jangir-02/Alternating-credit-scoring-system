import { useEffect, useState } from 'react';
import { getCreditScore } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SHAPModalProps {
  applicationId: number;
  onClose: () => void;
  isAdmin?: boolean;
}

function SHAPModal({ applicationId, onClose, isAdmin = false }: SHAPModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCreditScore(applicationId)
      .then(setData)
      .catch(() => setError('Failed to load SHAP data'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleDownload = () => {
    const tokenKey = isAdmin ? 'admin_token' : 'jwt_token';
    const token = localStorage.getItem(tokenKey);
    fetch(`${API_BASE_URL}/api/v1/applications/${applicationId}/shap-report`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `shap_report_${applicationId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        background: 'white', borderRadius: '10px', padding: '28px',
        width: '620px', maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>SHAP Explainability Report — App #{applicationId}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {data && (
          <>
            {/* Score Summary */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1, padding: '14px', background: '#f0f4ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a73e8' }}>{Math.round(data.credit_score)}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Credit Score</div>
              </div>
              <div style={{ flex: 1, padding: '14px', background: '#f0f4ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f57f17' }}>{(data.default_probability * 100).toFixed(1)}%</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Default Probability</div>
              </div>
              <div style={{ flex: 1, padding: '14px', background: '#f0f4ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{
                  fontSize: '18px', fontWeight: 'bold',
                  color: data.risk_category === 'low' ? '#4CAF50' : data.risk_category === 'medium' ? '#FF9800' : '#f44336'
                }}>
                  {data.risk_category?.toUpperCase()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Risk Category</div>
              </div>
            </div>

            {/* SHAP Table */}
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              Each feature's contribution to the final score. Positive = helped score, Negative = hurt score.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1a73e8', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Feature</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Value</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>SHAP Value</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Impact</th>
                </tr>
              </thead>
              <tbody>
                {data.shap_explanations.map((exp: any, i: number) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid #eee' }}>{exp.feature_name}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{exp.feature_value.toFixed(2)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: '600', color: exp.shap_value > 0 ? '#4CAF50' : '#f44336' }}>
                      {exp.shap_value > 0 ? '+' : ''}{exp.shap_value.toFixed(4)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #eee', background: exp.impact === 'positive' ? '#e8f5e9' : '#ffebee' }}>
                      {exp.impact === 'positive' ? '↑ Positive' : '↓ Negative'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={handleDownload} style={{ flex: 1, background: '#1a73e8', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Download PDF
              </button>
              <button onClick={onClose} style={{ flex: 1, background: '#666', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SHAPModal;
