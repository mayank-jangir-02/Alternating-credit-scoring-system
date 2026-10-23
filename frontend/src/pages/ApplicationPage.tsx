import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitApplication } from '../services/api';
import type { CreditApplication } from '../types';

const ALTERNATIVE_PARAMS = [
  { key: 'gig_platform_rating', label: 'Gig Platform Rating (0–5)', type: 'number', step: '0.1', min: 0, max: 5 },
  { key: 'upi_transaction_frequency', label: 'UPI Transactions per Month', type: 'number', min: 0 },
  { key: 'savings_account_balance', label: 'Savings Account Balance (₹)', type: 'number', min: 0 },
  { key: 'remittance_frequency', label: 'Remittance Frequency (per year)', type: 'number', min: 0 },
  { key: 'community_verification_score', label: 'Community Verification Score (0–10)', type: 'number', step: '0.1', min: 0, max: 10 },
  { key: 'microfinance_repayment_count', label: 'Microfinance Repayment Count', type: 'number', min: 0 },
  { key: 'utility_payment_history', label: 'Utility Payment History', type: 'select', options: ['good', 'average', 'poor'] },
  { key: 'employment_type', label: 'Employment Type', type: 'select', options: ['salaried', 'self_employed', 'gig_worker', 'daily_wage', 'unemployed'] },
];

function ApplicationPage() {
  const navigate = useNavigate();
  const [applicantType, setApplicantType] = useState<'unbanked' | 'underbanked'>('underbanked');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState(25);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [requestedAmount, setRequestedAmount] = useState(50000);
  const [loanPurpose, setLoanPurpose] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(25000);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [altValues, setAltValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const toggleParam = (key: string) => {
    setSelectedParams(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    if (selectedParams.includes(key)) {
      setAltValues(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedParams.length < 4) {
      setError('Please select at least 4 alternative data parameters');
      return;
    }

    // Check all selected params have values
    for (const key of selectedParams) {
      if (altValues[key] === undefined || altValues[key] === '') {
        setError(`Please fill in the value for: ${ALTERNATIVE_PARAMS.find(p => p.key === key)?.label}`);
        return;
      }
    }

    setLoading(true);
    const application: CreditApplication = {
      applicant_type: applicantType,
      full_name: fullName,
      age,
      phone_number: phoneNumber,
      address,
      requested_amount: requestedAmount,
      loan_purpose: loanPurpose,
      monthly_income: monthlyIncome,
      alternative_data: altValues,
    };

    try {
      const response = await submitApplication(application);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Application submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="navbar">
          <h1>AI Credit Scoring Platform</h1>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="card">
            <div className="score-display">
              <h2>Application Submitted</h2>
              <div className="score-value">{Math.round(result.credit_score || 0)}</div>
              <div className={`risk-badge risk-${result.risk_category}`}>
                AI RISK ASSESSMENT: {result.risk_category?.toUpperCase()}
              </div>
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082' }}>
                <p style={{ fontWeight: '600', color: '#f57f17', marginBottom: '8px' }}>⏳ Pending Bank Review</p>
                <p style={{ color: '#666', fontSize: '14px' }}>Your application has been scored by our AI system. A bank employee will review it and make the final decision. You will be notified once a decision is made.</p>
              </div>
              <div style={{ marginTop: '16px' }}>
                <p><strong>Application ID:</strong> {result.application_id}</p>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
              View All Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="navbar">
        <h1>AI Credit Scoring Platform</h1>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Credit Application</h2>
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Applicant Type</label>
              <select value={applicantType} onChange={(e) => setApplicantType(e.target.value as any)}>
                <option value="underbanked">Underbanked</option>
                <option value="unbanked">Unbanked</option>
              </select>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Age</label>
              <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} min={18} max={100} required />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} />
            </div>

            <div className="form-group">
              <label>Requested Amount (₹)</label>
              <input type="number" value={requestedAmount} onChange={(e) => setRequestedAmount(Number(e.target.value))} min={1000} required />
            </div>

            <div className="form-group">
              <label>Loan Purpose</label>
              <input type="text" value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Monthly Income (₹) *</label>
              <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} min={1} required />
            </div>

            <h3 style={{ marginTop: '24px', marginBottom: '8px' }}>Alternative Data</h3>
            <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              Select at least 4 parameters that apply to you ({selectedParams.length} selected)
            </p>

            {/* Parameter selection checkboxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {ALTERNATIVE_PARAMS.map(param => (
                <label key={param.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', background: selectedParams.includes(param.key) ? '#e8f4fd' : 'white' }}>
                  <input
                    type="checkbox"
                    checked={selectedParams.includes(param.key)}
                    onChange={() => toggleParam(param.key)}
                  />
                  <span style={{ fontSize: '13px' }}>{param.label}</span>
                </label>
              ))}
            </div>

            {/* Input fields for selected parameters */}
            {selectedParams.length > 0 && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                <h4 style={{ marginBottom: '16px' }}>Fill in your selected parameters:</h4>
                {ALTERNATIVE_PARAMS.filter(p => selectedParams.includes(p.key)).map(param => (
                  <div className="form-group" key={param.key}>
                    <label>{param.label}</label>
                    {param.type === 'select' ? (
                      <select
                        value={altValues[param.key] || ''}
                        onChange={(e) => setAltValues({ ...altValues, [param.key]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {param.options?.map(opt => (
                          <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step={param.step || '1'}
                        min={param.min}
                        max={param.max}
                        value={altValues[param.key] ?? ''}
                        onChange={(e) => setAltValues({ ...altValues, [param.key]: Number(e.target.value) })}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '24px' }}>
              {loading ? 'Processing...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ApplicationPage;
