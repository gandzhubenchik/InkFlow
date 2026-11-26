import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreatePostPage({ isEdit = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUserId = parseInt(localStorage.getItem('userId'));

    const [title, setTitle] = useState(() => isEdit ? '' : (localStorage.getItem('draft_title') || ''));
    const [content, setContent] = useState(() => isEdit ? '' : (localStorage.getItem('draft_content') || ''));
    const [coverImageUrl, setCoverImageUrl] = useState(() => isEdit ? '' : (localStorage.getItem('draft_cover') || ''));
    const [audioUrl, setAudioUrl] = useState(() => isEdit ? '' : (localStorage.getItem('draft_audio') || ''));
    const [fileUrl, setFileUrl] = useState(() => isEdit ? '' : (localStorage.getItem('draft_file') || ''));
    const [tagsString, setTagsString] = useState(() => isEdit ? '' : (localStorage.getItem('draft_tags') || ''));

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (isEdit && id) {
            axios.get('http://localhost:5228/api/posts')
                .then(res => {
                    const postToEdit = res.data.find(p => p.id === parseInt(id));
                    if (postToEdit) {
                        setTitle(postToEdit.title);
                        setContent(postToEdit.content);
                        setCoverImageUrl(postToEdit.coverImageUrl || '');
                        setAudioUrl(postToEdit.audioUrl || '');
                        setFileUrl(postToEdit.fileUrl || '');
                        setTagsString(postToEdit.tags ? postToEdit.tags.join(', ') : '');
                    }
                })
                .catch(err => console.error(err));
        }
    }, [isEdit, id]);

    useEffect(() => {
        if (!isEdit) {
            localStorage.setItem('draft_title', title);
            localStorage.setItem('draft_content', content);
            localStorage.setItem('draft_cover', coverImageUrl);
            localStorage.setItem('draft_audio', audioUrl);
            localStorage.setItem('draft_file', fileUrl);
            localStorage.setItem('draft_tags', tagsString);
        }
    }, [title, content, coverImageUrl, audioUrl, fileUrl, tagsString, isEdit]);

    const clearDraft = () => {
        localStorage.removeItem('draft_title');
        localStorage.removeItem('draft_content');
        localStorage.removeItem('draft_cover');
        localStorage.removeItem('draft_audio');
        localStorage.removeItem('draft_file');
        localStorage.removeItem('draft_tags');
    };

    const uploadMediaFile = async (fileOrList, setUrlCallback, setLoadingCallback, errorMsg) => {
        const file = fileOrList instanceof FileList ? fileOrList[0] : fileOrList;
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setLoadingCallback(true);
        setMessage('');
        setIsError(false);

        try {
            const res = await axios.post('http://localhost:5228/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUrlCallback(res.data.url);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setIsError(true);
            setMessage(errorMsg);
        } finally {
            setLoadingCallback(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        try {
            if (isEdit) {
                await axios.put(`http://localhost:5228/api/posts/${id}`, {
                    UserId: currentUserId,
                    Title: title,
                    Content: content,
                    CoverImageUrl: coverImageUrl || null,
                    AudioUrl: audioUrl || null,
                    FileUrl: fileUrl || null,
                    TagsString: tagsString
                });
                navigate(`/post/${id}`);
            } else {
                await axios.post('http://localhost:5228/api/posts', {
                    Title: title,
                    Content: content,
                    CoverImageUrl: coverImageUrl || null,
                    AudioUrl: audioUrl || null,
                    FileUrl: fileUrl || null,
                    AuthorId: currentUserId || 1,
                    TagsString: tagsString
                });
                clearDraft();
                navigate('/');
            }
        } catch (error) {
            setIsError(true);
            setMessage(error.response?.data || 'Не удалось сохранить публикацию.');
        }
    };
    const isAnyUploading = uploadingImage || uploadingAudio || uploadingDoc;

    return (
        <div className="post-card">
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', margin: '0 0 8px 0', textAlign: 'center' }}>
                {isEdit ? '✏️ Редактирование публикации' : '✍️ Новая публикация'}
            </h2>
            {!isEdit && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 28px 0' }}>
                    ✨ Черновик автоматически сохраняется в браузере
                </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Заголовок статьи</label>
                    <input
                        type="text"
                        className="input-field"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="О чем будет эта история?"
                    />
                </div>

                {/* Три аккуратных слота для медиа и документов */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {/* 1. Обложка */}
                    <div style={{ border: '1px dashed var(--border)', padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>🖼 Обложка</label>
                        <input type="file" accept="image/*" onChange={(e) => uploadMediaFile(e.target.files[0], setCoverImageUrl, setUploadingImage, 'Ошибка загрузки обложки.')} style={{ fontSize: '12px', maxWidth: '100%' }} />
                        {uploadingImage && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>⏳ Загрузка...</div>}
                        {coverImageUrl && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                ✓ Готово <span onClick={() => setCoverImageUrl('')} style={{ color: 'var(--danger)', cursor: 'pointer', marginLeft: '6px' }}>[✖]</span>
                            </div>
                        )}
                    </div>

                    {/* 2. Аудио */}
                    <div style={{ border: '1px dashed var(--border)', padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>🎵 Аудио (MP3)</label>
                        <input type="file" accept="audio/*" onChange={(e) => uploadMediaFile(e.target.files[0], setAudioUrl, setUploadingAudio, 'Ошибка загрузки аудио.')} style={{ fontSize: '12px', maxWidth: '100%' }} />
                        {uploadingAudio && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>⏳ Загрузка...</div>}
                        {audioUrl && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                ✓ Готово <span onClick={() => setAudioUrl('')} style={{ color: 'var(--danger)', cursor: 'pointer', marginLeft: '6px' }}>[✖]</span>
                            </div>
                        )}
                    </div>

                    {/* 3. Документ */}
                    <div style={{ border: '1px dashed var(--border)', padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>📎 Документ / Файл</label>
                        <input type="file" onChange={(e) => uploadMediaFile(e.target.files[0], setFileUrl, setUploadingDoc, 'Ошибка загрузки файла.')} style={{ fontSize: '12px', maxWidth: '100%' }} />
                        {uploadingDoc && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>⏳ Загрузка...</div>}
                        {fileUrl && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                ✓ Прикреплен <span onClick={() => setFileUrl('')} style={{ color: 'var(--danger)', cursor: 'pointer', marginLeft: '6px' }}>[✖]</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Теги (через запятую)</label>
                    <input
                        type="text"
                        className="input-field"
                        value={tagsString}
                        onChange={(e) => setTagsString(e.target.value)}
                        placeholder="мысли, музыка, разработка"
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Текст публикации</label>
                    <textarea
                        className="input-field"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows="10"
                        placeholder="Начните писать здесь..."
                        style={{ resize: 'vertical', lineHeight: '1.6', fontFamily: 'Georgia, serif', fontSize: '16px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" disabled={isAnyUploading} className="btn btn-primary" style={{ flexGrow: 1, padding: '14px', fontSize: '15px' }}>
                        {isEdit ? '💾 Сохранить изменения' : '🚀 Опубликовать в InkFlow'}
                    </button>
                    {!isEdit && (
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => { if (window.confirm('Очистить черновик?')) { clearDraft(); window.location.reload(); } }}
                        >
                            🗑 Очистить
                        </button>
                    )}
                </div>
            </form>

            {message && (
                <div style={{ marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', textAlign: 'center', fontWeight: '600' }}>
                    {message}
                </div>
            )}
        </div>
    );
}
