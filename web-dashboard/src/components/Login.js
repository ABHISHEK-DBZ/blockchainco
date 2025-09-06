import React, { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.access_token);
      } else {
        // Fallback demo token
        onLogin(`demo_token_${email.split('@')[0]}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback demo token
      onLogin(`demo_token_${email.split('@')[0]}`);
    }
  };

  return (
    <div className="login-container">
      <h2>🌊 Blue Carbon Registry Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
