import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('http://localhost:5228/api/users/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('role', response.data.role);
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data || 'Ошибка авторизации.');
        }
    };

    return (
        <div className="post-card" style={{ maxWidth: '420px', margin: '40px auto' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '800', textAlign: 'center', marginBottom: '25px', color: 'var(--text-primary)' }}>
                Вход в InkFlow
            </h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Электронная почта:
                    </label>
                    <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Пароль:
                    </label>
                    <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}>
                    Войти в аккаунт
                </button>
            </form>
            {error && <div style={{ marginTop: '15px', color: 'var(--danger)', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
        </div>
    );
}
