import React, { useState } from 'react';
import axios from 'axios';

const Step3View = () => {
  const [searchData, setSearchData] = useState({ fullName: '', phone: '' });
  const [data, setData] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '' });

  const showNotification = (message) => {
    setNotification({ show: true, message });
  };

  const handleSearch = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/get-all-student-docs', searchData);
      setData(res.data);
    } catch (err) {
      showNotification(err.response?.data || "Không tìm thấy sinh viên hoặc lỗi kết nối!");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-black text-yellow-500 mb-8 uppercase text-center tracking-widest italic">
          --- Bảng Tổng Hợp Hồ Sơ Toàn Diện ---
        </h2>

        {/* Khu vực tìm kiếm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800 p-6 rounded-2xl mb-10 border border-slate-700 shadow-xl">
          <input placeholder="Họ tên sinh viên" className="bg-slate-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" onChange={e => setSearchData({...searchData, fullName: e.target.value})} />
          <input placeholder="Số điện thoại" className="bg-slate-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" onChange={e => setSearchData({...searchData, phone: e.target.value})} />
          <button onClick={handleSearch} className="bg-yellow-600 hover:bg-yellow-500 font-bold rounded-lg text-slate-900 transition-all uppercase">Xem dữ liệu</button>
        </div>

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Cột 1: Hồ sơ Tiếng Việt */}
            <div className="bg-slate-800 p-6 rounded-2xl border-t-4 border-blue-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-blue-400 font-bold uppercase italic">1. Hồ sơ ban đầu (VN)</h3>
                <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded-full border border-blue-700">Chế độ xem</span>
              </div>
              <div className="space-y-3">
                {data.allDocs.filter(d => d.step === 1).map((doc, i) => (
                  <div key={i} className="text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                    <span className="text-slate-500 mr-2 font-mono">{i + 1}.</span>
                    <span className="font-semibold">{data.student.full_name}_{doc.doc_name}</span>
                    <div className="mt-2 text-blue-300 italic break-all bg-slate-800 p-2 rounded text-xs border border-slate-700">
                      Link: {doc.file_path || "Chưa nộp"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2: Hồ sơ Tiếng Anh */}
            <div className="bg-slate-800 p-6 rounded-2xl border-t-4 border-red-500 shadow-2xl">
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-red-400 font-bold uppercase italic text-sm flex items-center gap-2">
      <span className="w-1 h-5 bg-red-400 block"></span>
      2. Hồ sơ sang trường (EN)
    </h3>
    <span className="text-[10px] bg-red-900/50 text-red-200 px-2 py-1 rounded-full border border-red-700 font-bold">Chế độ xem</span>
  </div>

  <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700 space-y-2">
    {data.allDocs.filter(d => d.step === 2).length > 0 ? (
      data.allDocs.filter(d => d.step === 2).map((doc, i) => {
        // Hàm bỏ dấu để hiển thị tên tiếng Anh chuyên nghiệp
        const nameNoAccent = data.student.full_name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D");

        return (
          <div key={i} className="text-sm font-medium border-b border-slate-800 pb-2 last:border-0">
            <span className="text-slate-500 font-mono">{i + 1}.</span>
            <span className="ml-1 uppercase">{nameNoAccent}_{doc.doc_name}</span> : 
            <span className="ml-2 text-red-400 italic font-normal">
              {doc.file_path && doc.file_path.trim() !== "" ? doc.file_path : "Chưa nộp"}
            </span>
          </div>
        );
      })
    ) : (
      <p className="text-xs text-slate-500 italic">Chưa có dữ liệu hồ sơ sang trường.</p>
    )}
  </div>
</div>
          </div>
        )}
      </div>
    </div>
    {notification.show && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]" onClick={() => setNotification({ show: false, message: '' })}>
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p className="text-white font-semibold mb-6 leading-relaxed">{notification.message}</p>
          <button 
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
            onClick={() => setNotification({ show: false, message: '' })}
          >
            Đóng
          </button>
        </div>
      </div>
    )}
  </>
);
};

export default Step3View;
