import React, { useState, useEffect } from 'react';
import { db, auth, provider } from './firebase-config';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Save, LogOut, FileSpreadsheet, CheckCircle, Circle, TrendingDown, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

const App = () => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', category: 'General' });
  const [filter, setFilter] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Real-time Data Listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
      where("month", "==", Number(filter.month)),
      where("year", "==", Number(filter.year))
    );
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user, filter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "transactions"), {
      ...form,
      amount: Number(form.amount),
      uid: user.uid,
      isPaid: form.type === 'income' ? true : false,
      month: Number(filter.month),
      year: Number(filter.year),
      createdAt: Timestamp.now()
    });
    setForm({ title: '', amount: '', type: 'expense', category: 'General' });
  };

  const togglePaid = async (id, status) => {
    await updateDoc(doc(db, "transactions", id), { isPaid: !status });
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Wealth-Report-${filter.month}-${filter.year}.xlsx`);
  };

  const totalIncome = items.filter(i => i.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = items.filter(i => i.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const chartData = [
    { name: 'รายรับ', value: totalIncome },
    { name: 'รายจ่าย', value: totalExpense }
  ];

  if (!user) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <button onClick={() => signInWithPopup(auth, provider)} className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg">
        Login with Google to Start
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header & Wallet Card */}
      <div className="bg-gradient-to-br from-pink-600 to-blue-700 p-6 pb-24 text-white rounded-b-[3rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Wealth Tracker</h1>
          <button onClick={() => signOut(auth)}><LogOut size={20}/></button>
        </div>
        <div className="text-center">
          <p className="opacity-80 text-sm">ยอดคงเหลือเดือนนี้</p>
          <h2 className="text-4xl font-extrabold mt-1">฿{(totalIncome - totalExpense).toLocaleString()}</h2>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="px-4 -mt-16">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex gap-4 mb-6">
            <select className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={filter.month} onChange={e => setFilter({...filter, month: e.target.value})}>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>เดือน {i+1}</option>)}
            </select>
            <button onClick={exportExcel} className="p-2 bg-green-100 text-green-600 rounded-xl"><FileSpreadsheet/></button>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  <Cell fill="#00C2FF" />
                  <Cell fill="#FF007A" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction List */}
        <div className="mt-6 space-y-3">
          <h3 className="font-bold text-slate-700 dark:text-slate-300">รายการล่าสุด</h3>
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button onClick={() => togglePaid(item.id, item.isPaid)}>
                  {item.isPaid ? <CheckCircle className="text-blue-500"/> : <Circle className="text-slate-300"/>}
                </button>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
              </div>
              <p className={`font-bold ${item.type === 'income' ? 'text-blue-500' : 'text-pink-500'}`}>
                {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Button / Form */}
      <form onSubmit={handleAdd} className="fixed bottom-6 left-4 right-4 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl flex gap-2 border border-slate-200">
        <input required placeholder="ชื่อรายการ" className="flex-1 bg-transparent outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <input required type="number" placeholder="จำนวน" className="w-24 bg-transparent outline-none" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-transparent font-bold">
          <option value="expense">-</option>
          <option value="income">+</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl"><Save size={20}/></button>
      </form>
    </div>
  );
};

export default App;