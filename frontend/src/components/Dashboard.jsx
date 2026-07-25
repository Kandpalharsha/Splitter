import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
    const [groups, setGroups] = useState([]);
    const [overallBalance, setOverallBalance] = useState(0);
    const [youOwe, setYouOwe] = useState({});
    const [youAreOwed, setYouAreOwed] = useState({});
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const [groupsRes, statsRes] = await Promise.all([
                api.get('/groups'),
                api.get('/dashboard/stats')
            ]);
            setGroups(groupsRes.data);
            setOverallBalance(statsRes.data.overall_balance);
            setYouOwe(statsRes.data.you_owe || {});
            setYouAreOwed(statsRes.data.you_are_owed || {});
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName) return;
        try {
            await api.post('/groups', { name: newGroupName });
            setNewGroupName('');
            fetchDashboard();
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Unknown error occurred");
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-offwhite p-8 md:p-12 rounded-[2rem] border-2 border-obsidian relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-signal text-paper px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                    Telemetry
                </div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-bold font-drama italic mb-2">Dashboard</h2>
                        <p className="font-data text-sm text-obsidian/60 uppercase tracking-widest">System Overview</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-xs font-data text-obsidian/60 uppercase tracking-widest mb-1">Net Balance</p>
                        <p className={`text-5xl font-bold font-data ${overallBalance >= 0 ? 'text-green-600' : 'text-signal'}`}>
                            {overallBalance >= 0 ? '+' : '-'}₹{Math.abs(overallBalance).toFixed(2)}
                        </p>
                        <p className="text-xs font-data text-obsidian/60 uppercase tracking-widest mt-2">
                            {overallBalance >= 0 ? 'Owed to you' : 'You owe'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-signal text-paper p-8 rounded-[2rem] border-2 border-obsidian relative">
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-paper text-signal px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                        Deficits
                    </div>
                    <h3 className="text-2xl font-bold font-drama italic mb-6">You Owe</h3>
                    {Object.keys(youOwe).length === 0 ? (
                        <p className="text-sm font-data opacity-80 uppercase tracking-widest">No outstanding debts.</p>
                    ) : (
                        <ul className="space-y-4">
                            {Object.entries(youOwe).map(([name, amount]) => (
                                <li key={name} className="flex justify-between items-center bg-obsidian p-4 border border-obsidian gap-4">
                                    <span className="font-heading font-medium break-all">{name}</span>
                                    <span className="font-data text-xl font-bold whitespace-nowrap flex-shrink-0">₹{amount.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-offwhite p-8 rounded-[2rem] border-2 border-obsidian relative">
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-obsidian text-paper px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                        Assets
                    </div>
                    <h3 className="text-2xl font-bold font-drama italic mb-6">You Are Owed</h3>
                    {Object.keys(youAreOwed).length === 0 ? (
                        <p className="text-sm font-data text-obsidian/60 uppercase tracking-widest">No outstanding receivables.</p>
                    ) : (
                        <ul className="space-y-4">
                            {Object.entries(youAreOwed).map(([name, amount]) => (
                                <li key={name} className="flex justify-between items-center bg-paper p-4 border-2 border-obsidian/10 gap-4">
                                    <span className="font-heading font-medium break-all">{name}</span>
                                    <span className="font-data text-xl font-bold text-green-600 whitespace-nowrap flex-shrink-0">₹{amount.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="bg-offwhite p-8 md:p-12 rounded-[2rem] border-2 border-obsidian relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-obsidian text-paper px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                    Modules
                </div>
                <h3 className="text-2xl font-bold font-heading mb-8">Active Groups</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map(group => (
                        <Link key={group.id} to={`/groups/${group.id}`} className="block bg-paper p-6 border-2 border-obsidian hover:bg-obsidian hover:text-paper transition-colors group relative overflow-hidden">
                            <h4 className="text-xl font-bold font-heading">{group.name}</h4>
                            <p className="text-xs font-data opacity-60 mt-6 uppercase tracking-widest">Access Protocol &rarr;</p>
                        </Link>
                    ))}
                    {groups.length === 0 && <p className="text-sm font-data text-obsidian/60">No groups registered.</p>}
                </div>

                <form onSubmit={handleCreateGroup} className="mt-12 pt-8 border-t-2 border-obsidian/10 flex flex-col sm:flex-row gap-4 max-w-2xl">
                    <input 
                        type="text" 
                        placeholder="Initialize New Group..." 
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 bg-paper border-2 border-obsidian focus:border-signal focus:outline-none p-4 font-data text-sm"
                    />
                    <button type="submit" className="px-8 py-4 font-data font-bold uppercase tracking-widest text-sm bg-signal text-paper hover:bg-obsidian transition-colors">
                        Execute
                    </button>
                </form>
            </div>
        </div>
    );
}
