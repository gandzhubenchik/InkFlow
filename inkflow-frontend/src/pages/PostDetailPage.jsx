import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
            <button type="button" onClick={togglePlay} className="audio-play-btn">{playing ? '⏸' : '▶'}</button>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🎵 {trackName}
                </span>
                <div
                    className="audio-progress-bg"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
                    }}
                >
                    <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '10px', borderLeft: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px' }}>{volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊'}</span>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange} style={{ width: '55px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
            </div>
        </div>
    );
}

export default function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [replyToId, setReplyToId] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const currentUserId = parseInt(localStorage.getItem('userId'));
    const currentRole = localStorage.getItem('role');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const loadData = async () => {
        try {
            const userIdParam = (currentUserId && !isNaN(currentUserId)) ? currentUserId : '';
            const postResponse = await axios.get(`http://localhost:5228/api/posts?currentUserId=${userIdParam}`);
            const currentPost = postResponse.data.find(p => p.id === parseInt(id));

            if (currentPost) {
                currentPost.bookmarked = currentPost.likedByMe;
                setPost(currentPost);

                const commentsResponse = await axios.get(`http://localhost:5228/api/comments/post/${id}?currentUserId=${userIdParam}`);
                const enrichedComments = commentsResponse.data.map(c => ({
                    ...c,
                    liked: localStorage.getItem(`like_c_${c.id}_u_${currentUserId}`) === 'true',
                    disliked: localStorage.getItem(`dislike_c_${c.id}_u_${currentUserId}`) === 'true'
                }));
                setComments(enrichedComments);

                if (userIdParam) {
                    const subRes = await axios.get(`http://localhost:5228/api/subscriptions/status?subscriberId=${userIdParam}&authorId=${currentPost.authorId}`);
                    setIsSubscribed(subRes.data.isSubscribed);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim() || !currentUserId) return;
        try {
            await axios.post('http://localhost:5228/api/comments', {
                postId: parseInt(id), authorId: currentUserId, parentCommentId: replyToId, text: newCommentText
            });
            setNewCommentText('');
            setReplyToId(null);
            loadData();
        } catch (err) {
            showToast(err.response?.data || 'Ошибка отправки комментария.');
        }
    };

    const handleSubscribeToggle = async () => {
        if (!currentUserId) return;
        try {
            await axios.post('http://localhost:5228/api/subscriptions/toggle', { subscriberId: currentUserId, authorId: post.authorId });
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleBookmarkToggle = async () => {
        if (!currentUserId) {
            showToast('🔒 Авторизуйтесь для сохранения в закладки.');
            return;
        }
        try {
            setPost(prev => prev ? { ...prev, bookmarked: !prev.bookmarked } : null);
            await axios.post('http://localhost:5228/api/likes/toggle', {
                userId: currentUserId, targetId: post.id, targetType: 'post', isLike: true
            });
        } catch (err) { console.error(err); }
    };

    const handleDeletePost = async () => {
        if (!window.confirm('Удалить эту публикацию навсегда?')) return;
        try {
            await axios.delete(`http://localhost:5228/api/posts/${post.id}?userId=${currentUserId}`);
            navigate('/');
        } catch (err) {
            showToast('❌ Не удалось удалить запись.');
        }
    };

    const handleCommentReaction = (commentId, isLike) => {
        if (!currentUserId) {
            showToast('🔒 Войдите, чтобы оценивать мнения.');
            return;
        }
        const lKey = `like_c_${commentId}_u_${currentUserId}`;
        const dKey = `dislike_c_${commentId}_u_${currentUserId}`;

        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                let cl = c.liked, cd = c.disliked;
                if (isLike) {
                    cl = !cl;
                    if (cl) { localStorage.setItem(lKey, 'true'); cd = false; localStorage.removeItem(dKey); }
                    else localStorage.removeItem(lKey);
                } else {
                    cd = !cd;
                    if (cd) { localStorage.setItem(dKey, 'true'); cl = false; localStorage.removeItem(lKey); }
                    else localStorage.removeItem(dKey);
                }
                return { ...c, liked: cl, disliked: cd };
            }
            return c;
        }));

        axios.post('http://localhost:5228/api/likes/toggle', {
            userId: currentUserId, targetId: commentId, targetType: 'comment', isLike: isLike
        }).catch(err => console.error(err));
    };
    const renderCommentsTree = (parentId = null, depth = 0) => {
        return comments
            .filter(c => c.parentCommentId === parentId)
            .map(comment => (
                <div key={comment.id} className="comment-card" style={{ marginLeft: `${depth * 24}px` }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>👤 <strong style={{ color: 'var(--text-primary)' }}>{comment.authorName}</strong> • {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--text-primary)' }}>{comment.text}</div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                        <button type="button" onClick={() => handleCommentReaction(comment.id, true)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', borderColor: (currentUserId && comment.liked) ? 'var(--accent)' : 'var(--border)' }}>👍</button>
                        <button type="button" onClick={() => handleCommentReaction(comment.id, false)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', borderColor: (currentUserId && comment.disliked) ? 'var(--danger)' : 'var(--border)' }}>👎</button>
                        {currentUserId && (
                            <button type="button" onClick={() => setReplyToId(comment.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                ↩ Ответить
                            </button>
                        )}
                        {currentRole === 'Admin' && comment.text !== "🚨 Этот комментарий был удален модератором за нарушение правил InkFlow." && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (window.confirm('Удалить комментарий за нарушение правил?')) {
                                        await axios.delete(`http://localhost:5228/api/admin/comments/${comment.id}`);
                                        loadData();
                                    }
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: '600', fontSize: '12px', marginLeft: 'auto' }}
                            >
                                🗑 Удалить
                            </button>
                        )}
                    </div>
                    {renderCommentsTree(comment.id, depth + 1)}
                </div>
            ));
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>⏳ Открываем свиток InkFlow...</div>;
    if (!post) return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--danger)' }}>❌ Публикация не найдена.</div>;

    const canManage = currentUserId && (post.authorId === currentUserId || currentRole === 'Admin');

    return (
        <div>
            <Link to="/" className="nav-item" style={{ display: 'inline-block', marginBottom: '20px', paddingLeft: 0 }}>
                ← Назад в ленту
            </Link>

            <article className="post-card">
                <div className="post-meta-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="author-badge">
                            <span className="author-avatar-placeholder">{post.authorName.charAt(0).toUpperCase()}</span>
                            <span>{post.authorName}</span>
                        </span>
                        {currentUserId && (
                            post.authorId === currentUserId ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>(Вы автор)</span>
                            ) : (
                                <button type="button" onClick={handleSubscribeToggle} className={isSubscribed ? 'btn btn-ghost' : 'btn btn-primary'} style={{ padding: '5px 14px', fontSize: '12px', borderRadius: '100px' }}>
                                    {isSubscribed ? '✓ Вы подписаны' : '🔔 Подписаться'}
                                </button>
                            )
                        )}
                    </div>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                <h1 className="post-title" style={{ fontSize: '34px', marginBottom: '22px' }}>{post.title}</h1>
                {post.coverImageUrl && <img src={post.coverImageUrl} alt="Обложка" className="post-cover" />}

                <div className="post-body">{post.content}</div>
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

                <div className="post-footer">
                    <button type="button" onClick={handleBookmarkToggle} className={`bookmark-btn ${(currentUserId && post.bookmarked) ? 'active' : ''}`}>
                        {post.bookmarked ? '🔖 В закладках' : '🏳 Сохранить в закладки'}
                    </button>

                    {canManage && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => navigate(`/edit/${post.id}`)}>✏️ Редактировать</button>
                            <button type="button" className="btn btn-danger-outline" onClick={handleDeletePost}>🗑 Удалить</button>
                        </div>
                    )}
                </div>
            </article>

            <section className="post-card">
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0' }}>💬 Обсуждение ({comments.length})</h3>

                {currentUserId ? (
                    <form onSubmit={handleCommentSubmit} style={{ marginBottom: '28px' }}>
                        {replyToId && (
                            <div style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '8px', fontWeight: '600' }}>
                                ↪️ Ответ на комментарий #{replyToId}{' '}
                                <span onClick={() => setReplyToId(null)} style={{ color: 'var(--danger)', cursor: 'pointer', marginLeft: '10px' }}>[Отмена]</span>
                            </div>
                        )}
                        <textarea
                            className="input-field"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Поделитесь своим мнением..."
                            rows="3"
                            required
                        />
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                            {replyToId ? "↪ Отправить ответ" : "Опубликовать мнение"}
                        </button>
                    </form>
                ) : (
                    <div style={{ padding: '20px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '24px', color: 'var(--text-secondary)' }}>
                        🔒 Чтобы участвовать в дискуссии, пожалуйста, <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>Войдите</Link> или <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>Зарегистрируйтесь</Link>.
                    </div>
                )}

                <div>
                    {comments.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Мнений пока нет. Начните беседу первым!</p>
                    ) : (
                        renderCommentsTree(null, 0)
                    )}
                </div>
            </section>

            {toastMessage && <div className="toast-notification">{toastMessage}</div>}
        </div>
    );
}
