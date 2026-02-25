import React, { useState } from 'react';
import axios from 'axios';
import { CHECKLIST_SANG_TRUONG } from './constants';

const Step2Form = () => {
  const [searchData, setSearchData] = useState({ fullName: '', phone: '', email: '' });
  const [student, setStudent] = useState(null);
  const [step1Docs, setStep1Docs] = useState([]);
  const [docLinks, setDocLinks] = useState({});

  
  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  };

  const handleSearch = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/get-student-step2', searchData);
      setStudent(res.data.student);
      setStep1Docs(res.data.step1Docs);
    } catch (err) {
      alert("Thông tin không chính xác hoặc sinh viên chưa có hồ sơ Bước 1!");
    }
  };

  const handleSaveStep2 = async () => {
    const currentChecklist = CHECKLIST_SANG_TRUONG[student.status] || [];
    try {
      await axios.post('http://localhost:5000/api/submit-step2', {
        studentId: student.id,
        docLinks,
        allDocs: currentChecklist
      });
      alert("Đã lưu hồ sơ sang trường thành công!");
    } catch (err) { alert("Lỗi khi lưu dữ liệu!"); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto bg-slate-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-blue-400 mb-8 border-b border-slate-700 pb-4 uppercase">
          Bước 2: Hoàn thiện hồ sơ sang trường
        </h2>

        {!student ? (
          <div className="bg-slate-700 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase">Nhập thông tin để tra cứu:</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Họ tên" className="bg-slate-800 p-3 rounded" onChange={e => setSearchData({...searchData, fullName: e.target.value})} />
              <input placeholder="Số điện thoại" className="bg-slate-800 p-3 rounded" onChange={e => setSearchData({...searchData, phone: e.target.value})} />
              <input placeholder="Email" className="bg-slate-800 p-3 rounded" onChange={e => setSearchData({...searchData, email: e.target.value})} />
              <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-500 font-bold rounded">TÌM KIẾM</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fadeIn">
            
           
            <div className="space-y-4">
  <h3 className="text-blue-400 font-bold flex items-center gap-2 italic uppercase text-sm">
    <span className="w-1 h-5 bg-blue-400 block"></span>
    Hồ sơ ban đầu (Giấy tờ bản tiếng Việt)
  </h3>
  
  <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700 space-y-2">
    {step1Docs.length > 0 ? (
      step1Docs.map((doc, i) => (
        <div key={i} className="text-sm font-medium border-b border-slate-800 pb-2 last:border-0">
          <span className="text-slate-400">{i + 1}.</span> 
          <span className="ml-1">{student.full_name}_{doc.doc_name}</span> : 
          <span className="ml-2 text-blue-400 italic font-normal">
            {doc.file_path && doc.file_path.trim() !== "" ? doc.file_path : "Chưa có link"}
          </span>
        </div>
      ))
    ) : (
      <p className="text-xs text-slate-500 italic">Không tìm thấy dữ liệu hồ sơ Bước 1.</p>
    )}
  </div>
</div>

           
            <div className="space-y-4">
              <h3 className="text-red-400 font-bold flex items-center gap-2">
                <span className="w-2 h-6 bg-red-400 block"></span>
                HỒ SƠ SANG TRƯỜNG (BẢN TIẾNG ANH)
              </h3>
              <div className="space-y-4">
                {CHECKLIST_SANG_TRUONG[student.status]?.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-slate-700/30 rounded-lg border border-slate-700">
                    <span className="text-xs font-medium text-slate-300">
                      {i + 1}. {removeAccents(student.full_name)}_{item}
                    </span>
                    <input 
                      placeholder="Dán link bản dịch tiếng Anh..." 
                      className="bg-slate-800 p-2 rounded border border-slate-600 text-xs outline-none focus:border-red-500"
                      onChange={e => setDocLinks({...docLinks, [item]: e.target.value})}
                    />
                  </div>
                ))}
                <button onClick={handleSaveStep2} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-black text-lg transition-all shadow-lg mt-4">
                  XÁC NHẬN LƯU HỒ SƠ SANG TRƯỜNG
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Step2Form;