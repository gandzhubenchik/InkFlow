import React from 'react';

export default function RulesPage() {
    return (
        <div className="post-card" style={{ fontFamily: 'Georgia, serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', textAlign: 'center', marginBottom: '10px', color: 'var(--text-primary)' }}>
                📜 Кодекс InkFlow
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '40px', fontSize: '15px' }}>
                Правила публикации мыслей и ведения дискуссий на платформе
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: '1.8', fontSize: '17px', color: 'var(--text-primary)' }}>
                <section style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)', fontFamily: 'sans-serif', fontSize: '18px' }}>
                        1. Уважение к авторам и читателям
                    </h3>
                    <p style={{ margin: 0, opacity: 0.92 }}>
                        В InkFlow ценится глубина мысли. Запрещены прямые оскорбления, переход на личности, агрессия и разжигание ненависти в публикациях или ветках обсуждений.
                    </p>
                </section>

                <section style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)', fontFamily: 'sans-serif', fontSize: '18px' }}>
                        2. Качество контента
                    </h3>
                    <p style={{ margin: 0, opacity: 0.92 }}>
                        Платформа создана для историй, блогов и статей. Запрещен откровенный спам, реклама сторонних услуг, мошеннические схемы и публикации, состоящие из бессмысленного набора символов.
                    </p>
                </section>

                <section>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)', fontFamily: 'sans-serif', fontSize: '18px' }}>
                        3. Система наказаний платформы
                    </h3>
                    <p style={{ margin: 0, opacity: 0.92 }}>За нарушение правил модераторы могут выдать:</p>
                    <ul style={{ margin: '10px 0 0 20px', padding: 0, opacity: 0.92 }}>
                        <li><strong>Предупреждение (Мут):</strong> сохраняется возможность читать и писать статьи, но блокируется отправка мнений в обсуждениях.</li>
                        <li><strong>Блокировка (Бан):</strong> полный запрет на авторизацию и любую активность на платформе, кроме пассивного чтения.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
    