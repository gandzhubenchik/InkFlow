import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function AudioPlayer({ src }) {
    const [playing, setPlaying] = React.useState(false);
    const audioRef = React.useRef(new Audio(src));
    const [progress, setProgress] = React.useState(0);
    const [volume, setVolume] = React.useState(0.7);

    React.useEffect(() => {
        const audio = audioRef.current;
        audio.volume = volume;
        const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', () => setPlaying(false));
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.pause();
        };
    }, []);

    const togglePlay = () => {
        if (playing) audioRef.current.pause();
        else audioRef.current.play();
        setPlaying(!playing);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        audioRef.current.volume = newVolume;
    };

    const trackName = src.split('_').slice(1).join('_') || "Аудиозапись.mp3";

    return (
        <div className="audio-player-box">
            <button type="button" onClick={togglePlay} className="audio-play-btn">
                {playing ? '⏸' : '▶'}
            </button>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🎵 {trackName}
                </span>
                <div
                    className="audio-progress-bg"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        audioRef.current.currentTime = (clickX / rect.width) * audioRef.current.duration;
                    }}
                >
                    <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '10px', borderLeft: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px' }}>{volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊'}</span>
                <input
                    type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange}
                    style={{ width: '55px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
}

export default function FeedPage({ onlySubs = false, onlyBookmarks = false }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    const currentUserId = parseInt(localStorage.getItem('userId'));
    const currentRole = localStorage.getItem('role');
    const navigate = useNavigate();

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const fetchPosts = async (search = '') => {
        setLoading(true);
        try {
            const userIdParam = (currentUserId && !isNaN(currentUserId)) ? currentUserId : '';
            let url = `http://localhost:5228/api/posts?search=${search}&currentUserId=${userIdParam}`;
            if (onlySubs && userIdParam) {
                url = `http://localhost:5228/api/subscriptions/feed/${userIdParam}`;
            } else if (onlyBookmarks && userIdParam) {
                url = `http://localhost:5228/api/posts/bookmarks/${userIdParam}`;
            }

            const response = await axios.get(url);
            setPosts(response.data);
        } catch (err) {
            setError('Не удалось загрузить публикации.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, [onlySubs, onlyBookmarks]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchPosts(searchQuery);
    };

    const handleBookmarkToggle = async (postId) => {
        if (!currentUserId) {
            showToast('🔒 Войдите в систему, чтобы сохранять статьи в закладки.');
            return;
        }
        try {
            await axios.post('http://localhost:5228/api/likes/toggle', {
                userId: currentUserId, targetId: postId, targetType: 'post', isLike: true
            });
            if (onlyBookmarks) {
                setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: !p.likedByMe } : p));
            }
        } catch (err) { console.error(err); }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Вы уверены, что хотите безвозвратно удалить эту публикацию?')) return;
        try {
            await axios.delete(`http://localhost:5228/api/posts/${postId}?userId=${currentUserId}`);
            setPosts(prev => prev.filter(p => p.id !== postId));
            showToast('🗑 Публикация удалена');
        } catch (err) {
            showToast('❌ Не удалось удалить пост');
        }
    };
    if (error) return <div style={{ textAlign: 'center', color: 'var(--danger)', marginTop: '40px' }}>{error}</div>;

    return (
        <div>
            {!onlySubs && !onlyBookmarks && (
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '36px' }}>
                    <input
                        type="text"
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Поиск по заголовку или #тегу..."
                    />
                    <button type="submit" className="btn btn-primary">Найти</button>
                    {searchQuery && (
                        <button type="button" className="btn btn-ghost" onClick={() => { setSearchQuery(''); fetchPosts(''); }}>✖</button>
                    )}
                </form>
            )}

            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '800', marginBottom: '28px', color: 'var(--text-primary)' }}>
                {onlySubs ? '📚 Лента подписок' : onlyBookmarks ? '🔖 Сохраненные закладки' : 'Свежие публикации'}
            </h1>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>⏳ Листаем страницы InkFlow...</div>
            ) : posts.length === 0 ? (
                <div className="post-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    В этой ленте пока нет записей.
                </div>
            ) : (
                posts.map((post) => {
                    const canManage = currentUserId && (post.authorId === currentUserId || currentRole === 'Admin');

                    return (
                        <article key={post.id} className="post-card">
                            <div className="post-meta-top">
                                <Link to={`/post/${post.id}`} className="author-badge">
                                    <span className="author-avatar-placeholder">
                                        {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'A'}
                                    </span>
                                    <span>{post.authorName}</span>
                                </Link>
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>

                            {post.coverImageUrl && (
                                <img src={post.coverImageUrl} alt="Обложка" className="post-cover" />
                            )}

                            <Link to={`/post/${post.id}`} className="post-title-link">
                                <h2 className="post-title">{post.title}</h2>
                            </Link>
                            <p className="post-body">{post.content}</p>

                            {post.audioUrl && <AudioPlayer src={post.audioUrl} />}
                            {/* Карточка прикрепленного документа */}
                            {post.fileUrl && (
                                <a
                                    href={post.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="file-attachment-box"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                        <div className="file-icon-badge">📄</div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {decodeURIComponent(post.fileUrl.split('_').slice(1).join('_')) || 'Прикрепленный документ'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                Нажмите, чтобы открыть или скачать файл
                                            </div>
                                        </div>
                                    </div>
                                    <span className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}>
                                        ⬇ Скачать
                                    </span>
                                </a>
                            )}

                            {post.tags && post.tags.length > 0 && (
                                <div className="tags-row">
                                    {post.tags.map((tag, idx) => (
                                        <span key={idx} className="tag-pill" onClick={() => { setSearchQuery(tag); fetchPosts(tag); }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="post-footer">
                                <button
                                    type="button"
                                    onClick={() => handleBookmarkToggle(post.id)}
                                    className={`bookmark-btn ${post.likedByMe ? 'active' : ''}`}
                                >
                                    {post.likedByMe ? '🔖 В закладках' : '🏳 В закладки'}
                                </button>

                                {canManage && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            style={{ padding: '6px 12px', fontSize: '13px' }}
                                            onClick={() => navigate(`/edit/${post.id}`)}
                                        >
                                            ✏️ Изменить
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger-outline"
                                            style={{ padding: '6px 12px', fontSize: '13px' }}
                                            onClick={() => handleDeletePost(post.id)}
                                        >
                                            🗑 Удалить
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })
            )}

            {toastMessage && <div className="toast-notification">{toastMessage}</div>}
        </div>
    );
}
