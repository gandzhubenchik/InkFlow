import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FeedPage from './pages/FeedPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import RulesPage from './pages/RulesPage';
import AdminPage from './pages/AdminPage';

function App() {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    // Состояние темы (по умолчанию светлая, сохраняется в localStorage)
    const [theme, setTheme] = useState(() => localStorage.getItem('inkflow_theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('inkflow_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = '/';
    };

    return (
        <Router>
            <div className="app-wrapper">
                <header className="navbar">
                    <div className="navbar-inner">
                        <div className="nav-links">
                            <Link to="/" className="brand-logo">✒️ InkFlow</Link>
                            <Link to="/rules" className="nav-item">📜 Правила</Link>
                            {username && <Link to="/subs" className="nav-item">📚 Моя лента</Link>}
                            {username && <Link to="/bookmarks" className="nav-item">🔖 Закладки</Link>}
                            {username && <Link to="/create" className="nav-item">✍️ Написать</Link>}
                            {username && role === 'Admin' && (
                                <Link to="/admin" className="nav-item nav-item-admin">🛠 Админка</Link>
                            )}
                        </div>

                        <div className="nav-actions">
                            {/* Кнопка переключения ДЕНЬ / НОЧЬ */}
                            <button
                                onClick={toggleTheme}
                                className="theme-toggle-btn"
                                title={theme === 'light' ? 'Включить ночной режим' : 'Включить дневной режим'}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>

                            {username ? (
                                <>
                                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>
                                    </span>
                                    <button onClick={handleLogout} className="btn btn-danger-outline">Выйти</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="nav-item">Войти</Link>
                                    <Link to="/register" className="btn btn-primary">Регистрация</Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<FeedPage onlySubs={false} onlyBookmarks={false} />} />
                        <Route path="/rules" element={<RulesPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/subs" element={<FeedPage onlySubs={true} onlyBookmarks={false} />} />
                        <Route path="/bookmarks" element={<FeedPage onlySubs={false} onlyBookmarks={true} />} />
                        <Route path="/create" element={<CreatePostPage />} />
                        {/* Маршрут для редактирования существующего поста */}
                        <Route path="/edit/:id" element={<CreatePostPage isEdit={true} />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/post/:id" element={<PostDetailPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
