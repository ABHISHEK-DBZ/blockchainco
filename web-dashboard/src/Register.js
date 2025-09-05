import React, { useState } from 'react';
import './CoolAuth.css';

export default function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Registration successful! You can now log in.');
        setError('');
        setTimeout(() => {
          onRegister && onRegister();
        }, 1500);
      } else {
        setError(data.msg || 'Registration failed');
        setSuccess('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setSuccess('');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-form glass-card slide-in-up">
      <div className="auth-header">
        <h2 className="gradient-text">🌱 Join Us</h2>
        <p>Create your Blue Carbon Registry account</p>
      </div>
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="cool-input"
          required
        />
      </div>
      
      <div className="form-group">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="cool-input"
          required
        />
      </div>
      
      <div className="form-group">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="cool-input"
          required
        />
      </div>
      
      <div className="form-group">
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          className="cool-input"
        >
          <option value="admin">🔑 Admin</option>
          <option value="agent">👤 Agent</option>
          <option value="stakeholder">🤝 Stakeholder</option>
        </select>
      </div>
      
      <button 
        onClick={handleRegister}
        className="gradient-button hover-lift"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Creating Account...
          </>
        ) : (
          <>
            ✨ Create Account
          </>
        )}
      </button>
      
      {error && (
        <div className="error-message bounce-in">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="success-message bounce-in">
          ✅ {success}
        </div>
      )}
    </div>
  );
}
