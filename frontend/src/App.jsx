import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GroupView from './components/GroupView';
import Landing from './components/Landing';
import api from './api';

const PrivateRoute = ({ children }) => {
    return localStorage.getItem('isLoggedIn') ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/*" element={
                <div className="min-h-screen bg-paper text-obsidian font-heading selection:bg-signal selection:text-paper">
                    <nav className="bg-paper border-b-2 border-obsidian p-4 md:px-8 flex justify-between items-center sticky top-0 z-50">
                        <Link to="/" className="text-2xl font-bold font-data tracking-tight text-signal hover:text-obsidian transition-colors">Splitter</Link>
                        <div className="flex gap-6 items-center">
                            <Link to="/" className="text-sm font-data font-bold text-obsidian/60 hover:text-signal hover:underline transition-colors uppercase tracking-widest">
                                Home
                            </Link>
                            {localStorage.getItem('isLoggedIn') && (
                                <button 
                                    onClick={async () => {
                                        try { await api.post('/auth/logout'); } catch(e) {}
                                        localStorage.removeItem('isLoggedIn');
                                        localStorage.removeItem('user_id');
                                        window.location.href = '/login';
                                    }}
                                    className="text-sm font-data font-bold text-obsidian/60 hover:text-signal hover:underline transition-colors uppercase tracking-widest"
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    </nav>
                    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-12">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                            <Route path="/groups/:id" element={<PrivateRoute><GroupView /></PrivateRoute>} />
                        </Routes>
                    </main>
                </div>
            } />
        </Routes>
    </Router>
  );
}

export default App;
