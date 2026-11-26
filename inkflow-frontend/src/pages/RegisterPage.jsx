import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const [showRulesModal, setShowRulesModal] = useState(false);
    const [rulesAccepted, setRulesAccepted] = useState(false);

    const navigate = useNavigate();

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        try {
            await axios.post('http://localhost:5228/api/users/register', { username, email, password });
            setShowRulesModal(true);
        } catch (error) {
            setIsError(true);
            setMessage(error.response?.data || 'Ошибка регистрации. Проверьте сервер.');
        }
    };

    const handleConfirmRules = async () => {
        if (!rulesAccepted) return;

        try {
            const loginResponse = await axios.post('http://localhost:5228/api/users/login', { email, password });

            localStorage.setItem('token', loginResponse.data.token);
            localStorage.setItem('userId', loginResponse.data.userId);
            localStorage.setItem('username', loginResponse.data.username);
            localStorage.setItem('role', loginResponse.data.role);

            setShowRulesModal(false);
            navigate('/');
            window.location.reload();
        } catch (error) {
            setIsError(true);
            setMessage('Ошибка авторизации после принятия правил.');
            setShowRulesModal(false);
        }
    };

    return (
        <div className="post-card" style={{ maxWidth: '420px', margin: '40px auto' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '800', textAlign: 'center', marginBottom: '25px', color: 'var(--text-primary)' }}>
                Создать аккаунт
            </h2>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Никнейм:</label>
                    <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="IvanAuthor" />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Электронная почта:</label>
                    <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Пароль:</label>
                    <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Минимум 6 символов" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}>
                    Зарегистрироваться
                </button>
            </form>

            {message && (
                <div style={{ marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: isError ? 'var(--danger-soft)' : 'var(--accent-soft)', color: isError ? 'var(--danger)' : 'var(--accent)', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                    {message}
                </div>
            )}

            {showRulesModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
                    <div className="post-card" style={{ maxWidth: '500px', width: '90%', margin: 0, fontFamily: 'Georgia, serif' }}>
                        <h3 style={{ fontFamily: 'sans-serif', margin: '0 0 15px 0', fontSize: '22px', textAlign: 'center', color: 'var(--text-primary)' }}>
                            ✨ Добро пожаловать в InkFlow
                        </h3>
                        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            Перед тем как войти на платформу, пожалуйста, подтвердите согласие с базовыми правилами сообщества:
                        </p>
                        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '20px', maxHeight: '150px', overflowY: 'auto' }}>
                            1. Запрещены прямые оскорбления, спам и токсичное поведение в обсуждениях.<br /><br />
                            2. За нарушение правил администрация имеет право временно заблокировать возможность комментировать (Мут) или полностью ограничить доступ к аккаунту (Бан).
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                            <input
                                type="checkbox"
                                checked={rulesAccepted}
                                onChange={(e) => setRulesAccepted(e.target.checked)}
                                style={{ marginTop: '3px', accentColor: 'var(--accent)' }}
                            />
                            <span>Я обязуюсь уважать других авторов и соблюдать кодекс InkFlow.</span>
                        </label>

                        <button
                            onClick={handleConfirmRules}
                            disabled={!rulesAccepted}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px', fontSize: '15px', opacity: rulesAccepted ? 1 : 0.5, cursor: rulesAccepted ? 'pointer' : 'not-allowed' }}
                        >
                            📖 Прочитано. Войти в InkFlow
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
