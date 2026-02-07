import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Signup = ({ apiUrl }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${apiUrl}/api/auth/signup`, formData);

            const { access_token, user } = response.data;
            login(access_token, user);

            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container" style={styles.container}>
            <div className="glass" style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Create Account</h1>
                    <p style={styles.subtitle}>Join the community to protect our oceans</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number (Optional)</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Create a strong password"
                            required
                            minLength="6"
                        />
                    </div>

                    <div style={styles.checkboxGroup}>
                        <input type="checkbox" required id="terms" />
                        <label htmlFor="terms" style={styles.checkboxLabel}>
                            I agree to the Terms of Service and Privacy Policy
                        </label>
                    </div>

                    <button
                        type="submit"
                        style={styles.button}
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={styles.footer}>
                    <p>Already have an account? <Link to="/login" style={styles.link}>Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
    },
    card: {
        width: '100%',
        maxWidth: '500px',
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
        gap: '1.25rem',
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
    checkboxGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.5rem',
    },
    checkboxLabel: {
        fontSize: '0.85rem',
        color: '#64748b',
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

export default Signup;
