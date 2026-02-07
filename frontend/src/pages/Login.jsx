import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = ({ apiUrl }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axios.post(`${apiUrl}/api/auth/login`, formData);

            const { access_token, user } = response.data;
            login(access_token, user);

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container" style={styles.container}>
            <div className="glass" style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Welcome Back</h1>
                    <p style={styles.subtitle}>Sign in to continue reporting pollution</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={styles.button}
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div style={styles.footer}>
                    <p>Don't have an account? <Link to="/signup" style={styles.link}>Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
    },
    card: {
        width: '100%',
        maxWidth: '450px',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.5)',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: '0.5rem',
    },
    subtitle: {
        color: '#64748b',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#334155',
    },
    input: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #cbd5e1',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    button: {
        marginTop: '1rem',
        justifyContent: 'center',
    },
    error: {
        background: '#fee2e2',
        color: '#ef4444',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
    },
    footer: {
        textAlign: 'center',
        marginTop: '2rem',
        fontSize: '0.9rem',
        color: '#64748b',
    },
    link: {
        color: '#0ea5e9',
        textDecoration: 'none',
        fontWeight: '600',
    }
};

export default Login;
