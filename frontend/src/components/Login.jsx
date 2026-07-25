import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const res = await api.post('/auth/login', { email, password });
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user_id', res.data.user_id);
                window.location.href = '/dashboard';
            } else {
                await api.post('/auth/signup', { email, full_name: fullName, password });
                setIsLogin(true);
                setError('Signup successful! Please log in.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-offwhite p-10 rounded-[2rem] shadow-sm border-2 border-obsidian relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-signal text-paper px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                Access
            </div>
            <h2 className="text-4xl font-bold font-drama italic mb-8">{isLogin ? 'Authentication' : 'Registration'}</h2>
            
            {error && <div className="bg-signal text-paper p-4 mb-6 font-data text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                    <div>
                        <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Full Name</label>
                        <input 
                            type="text" 
                            required={!isLogin}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-paper border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Email Identity</label>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-paper border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Security Key</label>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-paper border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors"
                    />
                </div>
                <button type="submit" className="w-full bg-obsidian text-paper font-bold uppercase tracking-widest py-4 hover:bg-signal transition-colors text-sm">
                    {isLogin ? 'Initialize Session' : 'Create Record'}
                </button>
            </form>
            
            <div className="mt-8 text-center">
                <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-data uppercase tracking-widest text-obsidian/60 hover:text-signal transition-colors">
                    {isLogin ? "No record found? Register here" : "Record exists? Authenticate"}
                </button>
            </div>
        </div>
    );
}
