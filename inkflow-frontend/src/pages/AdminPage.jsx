import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reasonInput, setReasonInput] = useState({});

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5228/api/admin/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert('Не удалось загрузить список пользователей бэкенда.');
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleBan = async (userId) => {
        const reason = reasonInput[userId] || "Нарушение кодекса InkFlow";
        try {
            await axios.post('http://localhost:5228/api/admin/ban', { userId, reason });
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleUnban = async (userId) => {
        try {
            await axios.post(`http://localhost:5228/api/admin/unban/${userId}`);
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleMute = async (userId) => {
        try {
            await axios.post('http://localhost:5228/api/admin/mute', { userId });
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleUnmute = async (userId) => {
        try {
            await axios.post(`http://localhost:5228/api/admin/unmute/${userId}`);
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleReasonChange = (userId, val) => {
        setReasonInput(prev => ({ ...prev, [userId]: val }));
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>⏳ Изучаем списки пользователей...</div>;

    return (
        <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '30px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                🛠 Панель управления InkFlow
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '15px' }}>
                Модерация учетных записей читателей и авторов
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {users.map(u => (
                    <div
                        key={u.id}
                        className="post-card"
                        style={{
                            marginBottom: 0,
                            padding: '20px 24px',
                            backgroundColor: u.isBanned ? 'var(--danger-soft)' : 'var(--bg-surface)',
                            borderColor: u.isBanned ? 'var(--danger)' : 'var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '20px',
                            flexWrap: 'wrap'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{u.username}</span>
                                <span style={{ fontSize: '12px', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 10px', borderRadius: '100px' }}>
                                    {u.role}
                                </span>
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{u.email}</div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                                {u.isBanned && <span style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold' }}>🛑 ЗАБАНЕН ({u.banReason})</span>}
                                {u.isMuted && <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 'bold' }}>🤫 МУТ (Запрет комментариев)</span>}
                                {!u.isBanned && !u.isMuted && <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>✓ Активен</span>}
                            </div>
                        </div>

                        {u.role !== 'Admin' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '230px' }}>
                                {!u.isBanned && (
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Причина бана..."
                                        value={reasonInput[u.id] || ''}
                                        onChange={(e) => handleReasonChange(u.id, e.target.value)}
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                )}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {u.isBanned ? (
                                        <button onClick={() => handleUnban(u.id)} className="btn btn-primary" style={{ flexGrow: 1, padding: '8px', fontSize: '12px' }}>Разбанить</button>
                                    ) : (
                                        <button onClick={() => handleBan(u.id)} className="btn btn-danger-outline" style={{ flexGrow: 1, padding: '8px', fontSize: '12px' }}>Бан</button>
                                    )}

                                    {u.isMuted ? (
                                        <button onClick={() => handleUnmute(u.id)} className="btn btn-ghost" style={{ flexGrow: 1, padding: '8px', fontSize: '12px' }}>Снять мут</button>
                                    ) : (
                                        <button onClick={() => handleMute(u.id)} className="btn btn-ghost" style={{ flexGrow: 1, padding: '8px', fontSize: '12px' }}>Мут</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
