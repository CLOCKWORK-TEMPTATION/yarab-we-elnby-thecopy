import { useState } from 'react';
import { BarChart3, Clock, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Productivity.css';

interface TimeEntry {
  id: string;
  task: string;
  hours: number;
  date: string;
}

interface Delay {
  id: string;
  reason: string;
  impact: string;
  hoursLost: number;
}

function Productivity() {
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [delays, setDelays] = useState<Delay[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [timeForm, setTimeForm] = useState({ task: '', hours: '', category: 'design' });
  const [delayForm, setDelayForm] = useState({ reason: '', impact: 'low', hoursLost: '' });

  const mockChartData = [
    { name: 'تصميم', hours: 45, fill: '#e94560' },
    { name: 'بناء', hours: 32, fill: '#4ade80' },
    { name: 'طلاء', hours: 18, fill: '#fbbf24' },
    { name: 'إضاءة', hours: 12, fill: '#60a5fa' },
    { name: 'اجتماعات', hours: 8, fill: '#a78bfa' },
  ];

  const pieData = [
    { name: 'مكتمل', value: 65, color: '#4ade80' },
    { name: 'قيد التنفيذ', value: 25, color: '#fbbf24' },
    { name: 'متأخر', value: 10, color: '#ef4444' },
  ];

  const handleLogTime = async () => {
    try {
      const response = await fetch('/api/productivity/log-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: timeForm.task,
          hours: parseFloat(timeForm.hours),
          category: timeForm.category,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowTimeForm(false);
        setTimeForm({ task: '', hours: '', category: 'design' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReportDelay = async () => {
    try {
      const response = await fetch('/api/productivity/report-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: delayForm.reason,
          impact: delayForm.impact,
          hoursLost: parseFloat(delayForm.hoursLost),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowDelayForm(false);
        setDelayForm({ reason: '', impact: 'low', hoursLost: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/productivity/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success && data.data?.recommendations) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="productivity-page fade-in">
      <header className="page-header">
        <BarChart3 size={32} className="header-icon" />
        <div>
          <h1>تحليل الإنتاجية</h1>
          <p>تتبع الوقت والأداء وتحليل التأخيرات</p>
        </div>
      </header>

      <div className="productivity-toolbar">
        <button className="btn" onClick={() => setShowTimeForm(true)}>
          <Clock size={18} />
          تسجيل وقت
        </button>
        <button className="btn btn-secondary" onClick={() => setShowDelayForm(true)}>
          <AlertTriangle size={18} />
          الإبلاغ عن تأخير
        </button>
        <button className="btn btn-secondary" onClick={loadRecommendations}>
          <TrendingUp size={18} />
          توصيات التحسين
        </button>
      </div>

      {showTimeForm && (
        <div className="form-modal card fade-in">
          <h3><Clock size={20} /> تسجيل وقت العمل</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>المهمة</label>
              <input
                type="text"
                className="input"
                placeholder="وصف المهمة"
                value={timeForm.task}
                onChange={(e) => setTimeForm({ ...timeForm, task: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>الساعات</label>
              <input
                type="number"
                className="input"
                placeholder="عدد الساعات"
                value={timeForm.hours}
                onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>الفئة</label>
              <select
                className="input"
                value={timeForm.category}
                onChange={(e) => setTimeForm({ ...timeForm, category: e.target.value })}
              >
                <option value="design">تصميم</option>
                <option value="construction">بناء</option>
                <option value="painting">طلاء</option>
                <option value="lighting">إضاءة</option>
                <option value="meetings">اجتماعات</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={handleLogTime}>
              <Plus size={18} /> تسجيل
            </button>
            <button className="btn btn-secondary" onClick={() => setShowTimeForm(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {showDelayForm && (
        <div className="form-modal card fade-in">
          <h3><AlertTriangle size={20} /> الإبلاغ عن تأخير</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>سبب التأخير</label>
              <textarea
                className="input"
                placeholder="وصف سبب التأخير"
                value={delayForm.reason}
                onChange={(e) => setDelayForm({ ...delayForm, reason: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>مستوى التأثير</label>
              <select
                className="input"
                value={delayForm.impact}
                onChange={(e) => setDelayForm({ ...delayForm, impact: e.target.value })}
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">مرتفع</option>
                <option value="critical">حرج</option>
              </select>
            </div>
            <div className="form-group">
              <label>الساعات المفقودة</label>
              <input
                type="number"
                className="input"
                placeholder="عدد الساعات"
                value={delayForm.hoursLost}
                onChange={(e) => setDelayForm({ ...delayForm, hoursLost: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={handleReportDelay}>
              <AlertTriangle size={18} /> إبلاغ
            </button>
            <button className="btn btn-secondary" onClick={() => setShowDelayForm(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="recommendations card fade-in">
          <h3><TrendingUp size={20} /> توصيات التحسين</h3>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card card">
          <h3>توزيع ساعات العمل</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#a0a0a0" />
                <YAxis dataKey="name" type="category" stroke="#a0a0a0" width={80} />
                <Tooltip 
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                  labelStyle={{ color: '#e8e8e8' }}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card card">
          <h3>حالة المهام</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Productivity;
