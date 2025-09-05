import React, { useEffect, useState } from 'react';

export default function AdminPanel({ projects, token }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUsers(data.users || []))
        .catch(() => setError('Failed to fetch users'));
    }
  }, [token]);

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Location', 'Area', 'Lat', 'Lon', 'IPFS Hash'],
      ...projects.map(p => [p.id, p.name, p.location, p.area_hectares, p.latitude, p.longitude, p.ipfs_hash])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRoleChange = (id, newRole) => {
    fetch(`http://localhost:5000/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role: newRole })
    })
      .then(res => res.json())
      .then(() => {
        setUsers(users => users.map(u => u.id === id ? { ...u, role: newRole } : u));
      });
  };

  const handleDelete = id => {
    fetch(`http://localhost:5000/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        setUsers(users => users.filter(u => u.id !== id));
      });
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={handleExport}>Export Data as CSV</button>
      <h3>User Management</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Change Role</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>
                <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                  <option value="admin">admin</option>
                  <option value="agent">agent</option>
                  <option value="stakeholder">stakeholder</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleDelete(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
