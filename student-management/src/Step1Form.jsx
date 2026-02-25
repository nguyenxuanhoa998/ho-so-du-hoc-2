import React, { useState } from 'react';
import axios from 'axios';
import { ENROLLMENT_LOGIC, CHECKLIST_BUOC_1 } from './constants';

const Step1Form = () => {
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', level: '', status: '' });
  const [docLinks, setDocLinks] = useState({});   

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'level') {
      const isDirect = value === "Bậc Tiến sĩ" || value === "Bậc chuyển tiếp";
      setFormData(prev => ({ ...prev, level: value, status: isDirect ? value : '' }));
      setDocLinks({});   
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

    
  const handleLinkChange = (docName, value) => {
    setDocLinks(prev => ({ ...prev, [docName]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName) return alert("Vui lòng nhập tên sinh viên!");
    
    try {
        
      const payload = { 
        ...formData, 
        docLinks, 
        allDocs: currentChecklist   
      };
      const res = await axios.post('http://localhost:5000/api/submit-step1', payload);
      alert(res.data.message);
    } catch (err) {
      alert("Lỗi khi kết nối server!");
    }
  };

  const currentChecklist = CHECKLIST_BUOC_1[formData.status] || [];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-slate-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-blue-400 mb-8 border-b border-slate-700 pb-4 uppercase">
          Nhập hồ sơ & Link đính kèm
        </h2>

       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input name="fullName" placeholder="Họ tên sinh viên" className="bg-slate-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
          <input name="phone" placeholder="Số điện thoại" className="bg-slate-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
          <input name="email" placeholder="Email" className="bg-slate-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <select name="level" className="bg-slate-700 p-3 rounded-lg border border-slate-600 outline-none" onChange={handleChange}>
            <option value="">-- Chọn bậc học --</option>
            {Object.keys(ENROLLMENT_LOGIC).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {formData.level && ENROLLMENT_LOGIC[formData.level].length > 0 && (
            <select name="status" className="bg-slate-700 p-3 rounded-lg border border-slate-600 outline-none" onChange={handleChange} value={formData.status}>
              <option value="">-- Trạng thái hiện tại --</option>
              {ENROLLMENT_LOGIC[formData.level].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

       
        {currentChecklist.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-red-400 font-bold uppercase text-sm italic">Danh mục hồ sơ (Dán link tài liệu):</h3>
            {currentChecklist.map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-700/50 p-4 rounded-xl border border-slate-700">
                <div className="md:w-1/3">
                  <span className="text-sm font-medium">{i + 1}. {formData.fullName || "Sinh viên"}_{item}</span>
                </div>
                <div className="md:w-2/3">
                  <input 
                    type="text" 
                    placeholder="Dán link Google Drive hoặc ghi chú tại đây..." 
                    className="w-full bg-slate-800 p-2 rounded border border-slate-600 text-sm outline-none focus:border-blue-500"
                    value={docLinks[item] || ''}
                    onChange={(e) => handleLinkChange(item, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-lg transition-all shadow-lg">
          LƯU THÔNG TIN VÀ LINK HỒ SƠ
        </button>
      </div>
    </div>
  );
};

export default Step1Form;