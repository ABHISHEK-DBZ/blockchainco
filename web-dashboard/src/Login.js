import React, { useState } from 'react';
import './CoolAuth.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        onLogin(data.access_token);
      } else {
        setError(data.msg || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-form glass-card slide-in-up">
      <div className="auth-header">
        <h2 className="gradient-text">🌊 Welcome Back</h2>
        <p>Sign in to access your Blue Carbon Registry</p>
      </div>
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Username or Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
      
      <button 
        onClick={handleLogin}
        className="gradient-button hover-lift"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Signing In...
          </>
        ) : (
          <>
            🚀 Sign In
          </>
        )}
      </button>
      
      {error && (
        <div className="error-message bounce-in">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
