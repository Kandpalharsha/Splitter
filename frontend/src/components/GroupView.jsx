import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function GroupView() {
    const { id } = useParams();
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState('');
    
    const [splitType, setSplitType] = useState('EQUAL');
    const [customSplits, setCustomSplits] = useState({});
    const [involvedMembers, setInvolvedMembers] = useState({});

    const loggedInUserId = parseInt(localStorage.getItem('user_id'));

    useEffect(() => {
        fetchGroupData();
    }, [id]);

    const fetchGroupData = async () => {
        try {
            const [memRes, expRes, balRes, setRes] = await Promise.all([
                api.get(`/groups/${id}/members`),
                api.get(`/groups/${id}/expenses`),
                api.get(`/groups/${id}/balances`),
                api.get(`/groups/${id}/settlements`)
            ]);
            setMembers(memRes.data);
            setExpenses(expRes.data);
            setBalances(balRes.data);
            setSettlements(setRes.data);
            if (memRes.data.length > 0 && !payerId) {
                setPayerId(loggedInUserId || memRes.data[0].id);
            }
            if (memRes.data.length > 0) {
                const initialSplits = {};
                const initialInvolved = {};
                memRes.data.forEach(m => {
                    initialSplits[m.id] = '';
                    initialInvolved[m.id] = true;
                });
                setCustomSplits(initialSplits);
                setInvolvedMembers(initialInvolved);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${id}/members`, { email: newMemberEmail });
            setNewMemberEmail('');
            fetchGroupData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding member');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!desc || !amount || !payerId) return;
        
        const numMembers = members.length;
        if (numMembers === 0) return alert('Add members first');
        
        let splits = [];
        if (splitType === 'EQUAL') {
            const involved = members.filter(m => involvedMembers[m.id]);
            if (involved.length === 0) return alert('At least one member must be involved in the split.');
            
            const splitAmount = (parseFloat(amount) / involved.length).toFixed(2);
            let currentSum = 0;
            
            splits = members.map(m => {
                if (!involvedMembers[m.id]) return { user_id: m.id, amount_owed: 0 };
                
                let s_amt = parseFloat(splitAmount);
                if (m.id === involved[involved.length - 1].id) {
                    s_amt = parseFloat(amount) - currentSum;
                }
                currentSum += s_amt;
                return { user_id: m.id, amount_owed: s_amt };
            });
        } else {
            let sum = 0;
            splits = members.map(m => {
                const s_amt = parseFloat(customSplits[m.id]) || 0;
                sum += s_amt;
                return { user_id: m.id, amount_owed: s_amt };
            });
            if (Math.abs(sum - parseFloat(amount)) > 0.01) {
                return alert('Custom split amounts must equal the total amount.');
            }
        }

        try {
            await api.post(`/groups/${id}/expenses`, {
                description: desc,
                amount: parseFloat(amount),
                payer_id: parseInt(payerId),
                date: new Date().toISOString().split('T')[0],
                splits
            });
            setShowAddExpense(false);
            setDesc('');
            setAmount('');
            setSplitType('EQUAL');
            fetchGroupData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSettleUp = async (settlement) => {
        try {
            await api.post(`/groups/${id}/expenses`, {
                description: `Settlement: ${settlement.from_email} paid ${settlement.to_email}`,
                amount: settlement.amount,
                payer_id: settlement.from_user_id,
                date: new Date().toISOString().split('T')[0],
                splits: [{ user_id: settlement.to_user_id, amount_owed: settlement.amount }]
            });
            fetchGroupData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="mb-4">
                <Link to="/dashboard" className="font-data text-xs uppercase tracking-widest text-obsidian/60 hover:text-signal transition-colors">&larr; Return to Dashboard</Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Expenses */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-offwhite p-8 rounded-[2rem] border-2 border-obsidian relative">
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-obsidian text-paper px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                            Ledger
                        </div>
                        <div className="flex justify-between items-end mb-8">
                            <h2 className="text-3xl font-bold font-drama italic">Expenses</h2>
                            <button 
                                onClick={() => setShowAddExpense(!showAddExpense)}
                                className="px-6 py-2 bg-signal text-paper font-data font-bold text-xs uppercase tracking-widest hover:bg-obsidian transition-colors"
                            >
                                {showAddExpense ? 'Cancel' : 'New Entry'}
                            </button>
                        </div>

                        {showAddExpense && (
                            <div className="bg-paper p-6 border-2 border-obsidian mb-8 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-signal"></div>
                                <h3 className="font-heading font-bold text-lg mb-6">Record Transaction</h3>
                                <form onSubmit={handleAddExpense} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Description</label>
                                        <input type="text" required value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-offwhite border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Total Amount (₹)</label>
                                            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-offwhite border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Source (Who Paid)</label>
                                            <select value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-offwhite border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors">
                                                {members.map(m => <option key={m.id} value={m.id}>{m.email}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-xs font-data uppercase tracking-widest font-bold text-obsidian mb-2">Split Type</label>
                                        <div className="flex gap-4 mb-4">
                                            <button type="button" onClick={() => setSplitType('EQUAL')} className={`flex-1 py-2 font-data text-xs uppercase font-bold border-2 border-obsidian ${splitType === 'EQUAL' ? 'bg-obsidian text-paper' : 'bg-transparent text-obsidian hover:bg-obsidian/10'}`}>Equal Split</button>
                                            <button type="button" onClick={() => setSplitType('CUSTOM')} className={`flex-1 py-2 font-data text-xs uppercase font-bold border-2 border-obsidian ${splitType === 'CUSTOM' ? 'bg-obsidian text-paper' : 'bg-transparent text-obsidian hover:bg-obsidian/10'}`}>Custom Split</button>
                                        </div>

                                        {splitType === 'EQUAL' ? (
                                            <div className="space-y-4">
                                                <p className="text-xs font-data text-obsidian/60 uppercase">Select members involved in the split. Division is automatic.</p>
                                                {members.map(m => (
                                                    <label key={m.id} className="flex justify-between items-center bg-offwhite p-3 border-2 border-obsidian/10 cursor-pointer hover:bg-paper transition-colors">
                                                        <span className="font-heading text-sm font-bold">{m.email}</span>
                                                        <div className="flex items-center">
                                                            <input type="checkbox" checked={involvedMembers[m.id] || false} onChange={(e) => setInvolvedMembers({...involvedMembers, [m.id]: e.target.checked})} className="w-5 h-5 accent-signal cursor-pointer" />
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs font-data text-obsidian/60 uppercase">Enter custom amounts for each member (Must total ₹{amount || '0'})</p>
                                                {members.map(m => (
                                                    <div key={m.id} className="flex justify-between items-center bg-offwhite p-3 border-2 border-obsidian/10">
                                                        <span className="font-heading text-sm font-bold">{m.email}</span>
                                                        <div className="flex items-center">
                                                            <span className="mr-2 font-data font-bold">₹</span>
                                                            <input type="number" step="0.01" value={customSplits[m.id] || ''} onChange={(e) => setCustomSplits({...customSplits, [m.id]: e.target.value})} className="w-24 bg-paper border-b-2 border-obsidian p-1 font-data focus:border-signal focus:outline-none text-right" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="w-full bg-obsidian text-paper font-data font-bold uppercase tracking-widest py-4 hover:bg-signal transition-colors text-sm mt-4">Commit Transaction</button>
                                </form>
                            </div>
                        )}

                        <div className="divide-y-2 divide-obsidian/10 overflow-y-auto max-h-[600px] pr-4">
                            {expenses.length === 0 ? <p className="py-6 font-data text-obsidian/50 text-sm text-center uppercase">No transactions recorded.</p> : null}
                            {expenses.map(e => {
                                const isSettlement = e.description.startsWith('Settlement:');
                                const youPaid = e.payer_id === loggedInUserId;
                                const userShare = e.user_share || 0;
                                let subText = "";
                                let subTextColor = "text-obsidian/60";
                                
                                if (!isSettlement) {
                                    if (youPaid) {
                                        const lent = e.amount - userShare;
                                        if (lent > 0) {
                                            subText = `You lent ₹${lent.toFixed(2)}`;
                                            subTextColor = "text-green-600 font-bold";
                                        } else {
                                            subText = `You paid for yourself`;
                                        }
                                    } else {
                                        if (userShare > 0) {
                                            subText = `You borrowed ₹${userShare.toFixed(2)}`;
                                            subTextColor = "text-signal font-bold";
                                        } else {
                                            subText = `Not involved`;
                                        }
                                    }
                                }

                                return (
                                <div key={e.id} className="py-6 flex justify-between items-center group">
                                    <div>
                                        <p className="font-bold font-heading text-xl group-hover:text-signal transition-colors">{e.description}</p>
                                        <p className="text-xs font-data text-obsidian/60 mt-1 uppercase tracking-widest">
                                            {youPaid ? 'You' : e.payer_name} paid ₹{e.amount.toFixed(2)} // {e.date}
                                        </p>
                                        {!isSettlement && (
                                            <p className={`text-sm font-data mt-2 ${subTextColor}`}>
                                                {subText}
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-bold font-data text-2xl opacity-20 group-hover:opacity-100 transition-opacity">₹{e.amount.toFixed(2)}</span>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Settlements & Members */}
                <div className="space-y-8">
                    <div className="bg-signal text-paper p-8 rounded-[2rem] border-2 border-obsidian relative">
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-paper text-signal px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                            Resolution
                        </div>
                        <h3 className="font-drama italic text-3xl mb-6">Settlement Plan</h3>
                        {settlements.length === 0 ? (
                            <p className="text-sm font-data opacity-80 uppercase tracking-widest">Equilibrium achieved.</p>
                        ) : (
                            <ul className="space-y-4">
                                {settlements.map((s, i) => (
                                    <li key={i} className="bg-obsidian p-4 border border-obsidian">
                                        <div className="font-data text-xs opacity-70 uppercase tracking-widest mb-2">Transfer Required</div>
                                        <div className="font-heading font-medium mb-1 break-all"><span className="opacity-70">From:</span> {s.from_name}</div>
                                        <div className="font-heading font-medium mb-3 break-all"><span className="opacity-70">To:</span> {s.to_name}</div>
                                        <div className="flex justify-between items-center mt-2 gap-4">
                                            <div className="font-data text-2xl font-bold">₹{s.amount.toFixed(2)}</div>
                                            <button 
                                                onClick={() => handleSettleUp(s)}
                                                className="bg-paper text-signal px-4 py-2 font-data text-xs uppercase font-bold hover:bg-signal hover:text-paper transition-colors border border-paper hover:border-paper whitespace-nowrap flex-shrink-0"
                                            >
                                                Settle Up
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-offwhite p-8 rounded-[2rem] border-2 border-obsidian relative">
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-obsidian text-paper px-4 py-1 font-data text-xs uppercase tracking-widest font-bold">
                            Nodes
                        </div>
                        <h3 className="font-heading font-bold text-xl mb-6">Group Members</h3>
                        <ul className="space-y-4 mb-8">
                            {balances.map(b => (
                                <li key={b.user_id} className="flex flex-col border-b-2 border-obsidian/10 pb-4 last:border-0">
                                    <span className="font-heading font-medium break-all">{b.full_name}</span>
                                    <span className="font-data text-xs text-obsidian/60 mb-1">{b.email}</span>
                                    <span className={`font-data font-bold text-lg ${b.net_balance >= 0 ? 'text-green-600' : 'text-signal'}`}>
                                        {b.net_balance >= 0 ? '+' : '-'}₹{Math.abs(b.net_balance).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                required
                                value={newMemberEmail}
                                onChange={e => setNewMemberEmail(e.target.value)}
                                className="w-full bg-paper border-2 border-obsidian p-3 font-data focus:border-signal focus:outline-none transition-colors text-sm"
                            />
                            <button type="submit" className="bg-obsidian text-paper font-data font-bold text-xs uppercase tracking-widest py-3 hover:bg-signal transition-colors">Add Node</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
