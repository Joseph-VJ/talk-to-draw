import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

export default function Gallery() {
    const [drawings, setDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            const response = await fetch(`${API_URL}/api/gallery`);

            if (response.ok) {
                const data = await response.json();
                setDrawings(data.drawings);
            } else {
                setError('Failed to load gallery');
            }
        } catch (err) {
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    const deleteDrawing = async (id, e) => {
        e.stopPropagation();

        if (!confirm('Delete this drawing?')) return;

        try {
            const response = await fetch(`${API_URL}/api/gallery/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setDrawings(drawings.filter(d => d.id !== id));
                if (selectedImage?.id === id) {
                    setSelectedImage(null);
                }
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="status-display">
                    <div className="spinner"></div>
                    <span>Loading gallery...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ height: '100%', overflow: 'auto' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>📁 Gallery</h2>

            {error && <div className="message message-error">{error}</div>}

            {drawings.length === 0 ? (
                <div className="empty-gallery" style={{ padding: '40px 20px' }}>
                    <div className="empty-gallery-icon">🎨</div>
                    <h3>No drawings yet</h3>
                    <p>Create your first drawing!</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                        style={{ marginTop: '16px' }}
                    >
                        Start Drawing
                    </button>
                </div>
            ) : (
                <div className="gallery-grid" style={{ padding: '10px 0', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {drawings.map((drawing) => (
                        <div
                            key={drawing.id}
                            className="gallery-item glass-card"
                            onClick={() => setSelectedImage(drawing)}
                            style={{ aspectRatio: '1' }}
                        >
                            <img
                                src={`${API_URL}${drawing.image_url}`}
                                alt={drawing.prompt}
                                className="gallery-image"
                                loading="lazy"
                            />
                            <div className="gallery-overlay">
                                <p style={{ fontSize: '0.75rem' }}>{drawing.prompt}</p>
                                <button
                                    className="btn btn-secondary"
                                    onClick={(e) => deleteDrawing(drawing.id, e)}
                                    style={{ marginTop: '4px', padding: '4px 8px', fontSize: '0.7rem' }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="glass-card fade-in"
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            padding: '20px',
                            textAlign: 'center'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={`${API_URL}${selectedImage.image_url}`}
                            alt={selectedImage.prompt}
                            style={{
                                maxWidth: '100%',
                                maxHeight: 'calc(90vh - 100px)',
                                borderRadius: '12px'
                            }}
                        />
                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                            "{selectedImage.prompt}"
                        </p>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedImage(null)}
                            style={{ marginTop: '12px' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
