import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardMetrics, getCreditScoreDistribution } from '../services/api';

interface DashboardMetrics {
  timestamp: string;
  total_applications: number;
  approval_rate: number;
  average_credit_score: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

interface ScoreDistribution {
  range: string;
  count: number;
}

function AdminAnalytics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsData, distributionData] = await Promise.all([
        getDashboardMetrics(period),
        getCreditScoreDistribution(period)
      ]);
      setMetrics(metricsData);
      setScoreDistribution(distributionData);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMaxCount = () => {
    if (scoreDistribution.length === 0) return 1;
    return Math.max(...scoreDistribution.map(d => d.count));
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
          <h2>Analytics Dashboard</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Period:</label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(Number(e.target.value))}
              style={{ width: 'auto' }}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>
        </div>

        {metrics && (
          <>
            {/* Key Metrics */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#3498db', 
                color: 'white', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Applications</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0 }}>
                  {metrics.total_applications}
                </p>
              </div>

              <div style={{ 
                padding: '20px', 
                backgroundColor: '#2ecc71', 
                color: 'white', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Approval Rate</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0 }}>
                  {metrics.approval_rate.toFixed(1)}%
                </p>
              </div>

              <div style={{ 
                padding: '20px', 
                backgroundColor: '#9b59b6', 
                color: 'white', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Avg Credit Score</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0 }}>
                  {Math.round(metrics.average_credit_score)}
                </p>
              </div>
            </div>

            {/* Risk Distribution */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px' }}>Risk Distribution</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '16px' 
              }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#d4edda', 
                  borderRadius: '8px',
                  border: '1px solid #c3e6cb'
                }}>
                  <p style={{ fontSize: '14px', color: '#155724', marginBottom: '8px' }}>Low Risk</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#155724', margin: 0 }}>
                    {metrics.risk_distribution.low}
                  </p>
                </div>

                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fff3cd', 
                  borderRadius: '8px',
                  border: '1px solid #ffeaa7'
                }}>
                  <p style={{ fontSize: '14px', color: '#856404', marginBottom: '8px' }}>Medium Risk</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#856404', margin: 0 }}>
                    {metrics.risk_distribution.medium}
                  </p>
                </div>

                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8d7da', 
                  borderRadius: '8px',
                  border: '1px solid #f5c6cb'
                }}>
                  <p style={{ fontSize: '14px', color: '#721c24', marginBottom: '8px' }}>High Risk</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#721c24', margin: 0 }}>
                    {metrics.risk_distribution.high}
                  </p>
                </div>
              </div>
            </div>

            {/* Credit Score Distribution Chart */}
            <div>
              <h3 style={{ marginBottom: '16px' }}>Credit Score Distribution</h3>
              {scoreDistribution.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '32px' }}>
                  No data available for the selected period.
                </p>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px'
                }}>
                  {scoreDistribution.map((item) => {
                    const maxCount = getMaxCount();
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '100px', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          textAlign: 'right'
                        }}>
                          {item.range}
                        </div>
                        <div style={{ 
                          flex: 1, 
                          height: '32px', 
                          backgroundColor: '#e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: '#4CAF50',
                            transition: 'width 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '8px'
                          }}>
                            {item.count > 0 && (
                              <span style={{ 
                                color: 'white', 
                                fontSize: '14px', 
                                fontWeight: '500' 
                              }}>
                                {item.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ 
              marginTop: '24px', 
              padding: '12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666'
            }}>
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
