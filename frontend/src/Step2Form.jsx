import React, { useMemo, useState } from "react";
import { LayoutDashboard, UserCircle, FileText, FolderOpen, GraduationCap, LogOut, Bell, HelpCircle, Check, ArrowRight } from "lucide-react";

const TARGET_CHECKLISTS = {
  "Bậc đại học - Nhóm học sinh lớp 12": [
    "Giấy xác nhận học sinh bản gốc",
    "Kết quả học tập lớp 10, 11, học kỳ 1 lớp 12",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân",
    "Hộ chiếu",
    "Chứng chỉ ngoại ngữ Anh/Trung",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc đại học - Nhóm đã tốt nghiệp THPT": [
    "Bằng THPT",
    "Học bạ THPT",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân",
    "Hộ chiếu",
    "Chứng chỉ ngoại ngữ Anh/Trung",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc thạc sĩ - Nhóm sinh viên năm cuối": [
    "Giấy xác nhận sinh viên năm cuối",
    "Bảng điểm Đại học đến thời điểm nộp hồ sơ",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân",
    "Hộ chiếu",
    "Chứng chỉ ngoại ngữ Anh/Trung",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc thạc sĩ - Nhóm sinh viên đã tốt nghiệp": [
    "Bằng Đại học",
    "Bảng điểm Đại học",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân",
    "Hộ chiếu",
    "Chứng chỉ ngoại ngữ Anh/Trung",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc chuyển tiếp": [
    "Giấy xác nhận sinh viên",
    "Bảng điểm Đại học đến thời điểm nộp hồ sơ",
    "Bằng THPT",
    "Học bạ THPT",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân",
    "Hộ chiếu",
    "Chứng chỉ ngoại ngữ Anh/Trung",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc tiến sĩ": [
    "Bằng Thạc sĩ",
    "Bảng điểm Thạc sĩ",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân",
    "Hộ chiếu",
    "Chứng chỉ ngoại ngữ Anh/Trung",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
};

export default function Step2Form({ user, profile, onBack, onLogout }) {
  const [uploadedDocs, setUploadedDocs] = useState({});
  const displayName = user?.fullName || (user?.email ? user.email.split("@")[0] : "Student");
  const fullName = `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim() || displayName;
  const docs = useMemo(() => TARGET_CHECKLISTS[profile?.targetLabel] || [], [profile?.targetLabel]);

  const handleUpload = (docName, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setUploadedDocs((prev) => ({ ...prev, [docName]: { name: file.name, size } }));
  };

  return (
    <div className="global-study-app">
      <style>{`
        .global-study-app { display:flex; min-height:100vh; font-family:Inter,system-ui,sans-serif; background:#f5f7fb; color:#111827; }
        .sidebar { width:250px; min-width:250px; background:#fff; border-right:1px solid #e2e8f0; padding:20px 14px; display:flex; flex-direction:column; box-sizing:border-box; }
        .brand { display:flex; align-items:center; gap:10px; color:#2563eb; font-weight:700; font-size:28px; margin-bottom:22px; }
        .user-card { display:flex; align-items:center; gap:10px; background:#f3f6fc; border-radius:12px; padding:12px; margin-bottom:12px; }
        .avatar { width:36px; height:36px; border-radius:50%; object-fit:cover; }
        .user-info .name { font-size:14px; font-weight:700; display:block; } .user-info .role { font-size:12px; color:#70809c; }
        .nav-menu { display:flex; flex-direction:column; gap:2px; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; color:#4f6386; font-size:14px; white-space:nowrap; }
        .nav-item.active { background:#eaf0ff; color:#2255d7; font-weight:700; }
        .logout { border:none; background:none; color:#4f6386; display:flex; align-items:center; gap:8px; padding:10px 12px; cursor:pointer; margin-top:auto; margin-bottom:12px; }
        .main-content { flex:1; min-width:0; width:100%; display:flex; flex-direction:column; min-height:100vh; }
        .top-header { height:72px; background:#fff; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; padding:0 26px; }
        .top-header h1 { margin:0; font-size:34px; font-weight:800; } .header-actions { display:flex; align-items:center; gap:12px; color:#4f6386; font-size:14px; } .notif-btn { position:relative; display:flex; cursor:pointer; } .notif-dot { position:absolute; top:-2px; right:-2px; width:8px; height:8px; border-radius:50%; background:#ef4444; border:2px solid #fff; }
        .header-divider { width:1px; height:20px; background:#e2e8f0; }
        .content-shell { padding:18px 0 26px; width:100%; }
        .stepper { display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:18px 16px 14px; margin-bottom:18px; }
        .step-item { display:flex; flex-direction:column; align-items:center; gap:8px; }
        .step-circle { width:34px; height:34px; border-radius:50%; border:2px solid #cdd6e5; color:#8897ae; display:flex; align-items:center; justify-content:center; font-weight:700; background:#fff; }
        .step-item.active .step-circle, .step-item.done .step-circle { background:#2563eb; border-color:#2563eb; color:#fff; }
        .step-label { font-size:13px; color:#8a99b1; } .step-item.active .step-label, .step-item.done .step-label { color:#2563eb; font-weight:600; }
        .step-divider { flex:0.18; height:2px; background:#e2e8f0; margin:0 12px 20px; } .step-divider.active { background:#2563eb; }
        .form-container { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; }
        .form-title { padding:24px; border-bottom:1px solid #e8edf5; } .form-title h2 { margin:0 0 8px; font-size:38px; } .form-title p { margin:0; color:#4f6386; font-size:20px; }
        .upload-list { padding:24px; display:grid; gap:14px; }
        .doc-card { border:2px dashed #dbe4f2; border-radius:16px; background:#fbfcff; padding:16px; display:flex; justify-content:space-between; align-items:center; gap:16px; }
        .doc-card.done { border-style:solid; border-color:#e1e8f4; background:#f9fbff; }
        .doc-left { display:grid; gap:6px; }
        .doc-title { font-size:18px; font-weight:700; } .doc-sub { color:#6c80a2; font-size:13px; } .doc-name { font-size:12px; color:#6d80a2; }
        .upload-btn { height:42px; min-width:132px; border:none; border-radius:21px; padding:0 20px; background:#2563eb; color:#fff; cursor:pointer; font-size:15px; font-weight:600; line-height:1; display:inline-flex; align-items:center; justify-content:center; }
        .upload-hidden { display:none; }
        .file-pill { border:1px solid #dfe6f1; border-radius:12px; background:#fff; padding:10px 12px; min-width:190px; }
        .file-name { font-size:15px; } .file-size { font-size:12px; color:#6d80a2; }
        .form-footer { display:flex; justify-content:space-between; border-top:1px solid #e8edf5; padding:14px 24px; }
        .btn-prev,.btn-next { height:44px; border-radius:12px; border:none; padding:0 18px; font-size:16px; cursor:pointer; display:flex; align-items:center; gap:8px; }
        .btn-prev { background:#eef2f8; color:#4b6083; } .btn-next { background:#2563eb; color:#fff; }
      `}</style>

      <aside className="sidebar">
        <div className="brand"><GraduationCap size={24} /> GlobalStudy</div>
        <div className="user-card">
          <img src="https://ui-avatars.com/api/?name=Alex+Smith&background=random" className="avatar" alt="User" />
          <div className="user-info"><span className="name">{displayName}</span><span className="role">Tài khoản sinh viên</span></div>
        </div>
        <nav className="nav-menu">
          <div className="nav-item"><LayoutDashboard size={18} /> Bảng điều khiển</div>
          <div className="nav-item"><UserCircle size={18} /> Hồ sơ của tôi</div>
          <div className="nav-item"><FileText size={18} /> Đơn ứng tuyển</div>
          <div className="nav-item active"><FolderOpen size={18} /> Tài liệu</div>
          <div className="nav-item"><GraduationCap size={18} /> Trường đại học</div>
        </nav>
        <button className="logout" onClick={onLogout}><LogOut size={18} /> Đăng xuất</button>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1>Tao ho so</h1>
          <div className="header-actions"><div className="notif-btn"><Bell size={20} /><span className="notif-dot"></span></div><div className="header-divider"></div><HelpCircle size={19} /> Tro giup</div>
        </header>
        <div className="content-shell">
          <div className="stepper">
            <div className="step-item done"><div className="step-circle"><Check size={16} /></div><span className="step-label">Thông tin cá nhân</span></div>
            <div className="step-divider active"></div>
            <div className="step-item active"><div className="step-circle">2</div><span className="step-label">Tài liệu</span></div>
            <div className="step-divider"></div>
            <div className="step-item"><div className="step-circle">3</div><span className="step-label">Kiểm tra lại</span></div>
          </div>
          <section className="form-container">
            <div className="form-title"><h2>Tải tài liệu</h2><p>Checklist được sinh tự động theo nhóm bạn đã chọn.</p></div>
            <div className="upload-list">
              {docs.map((docName, index) => {
                const uploaded = uploadedDocs[docName];
                return (
                  <div className={`doc-card ${uploaded ? "done" : ""}`} key={docName}>
                    <div className="doc-left">
                      <div className="doc-title">{index + 1}. {docName}</div>
                      <div className="doc-sub">Tài liệu cần nộp cho nhóm hiện tại.</div>
                      <div className="doc-name">Gợi ý tên file: {fullName}_{docName}</div>
                    </div>
                    {uploaded ? (
                      <div className="file-pill"><div className="file-name">{uploaded.name}</div><div className="file-size">{uploaded.size}</div></div>
                    ) : (
                      <label className="upload-btn">Chon tep tin<input className="upload-hidden" type="file" onChange={(e) => handleUpload(docName, e)} /></label>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="form-footer">
              <button className="btn-prev" type="button" onClick={onBack}>Quay lại</button>
              <button className="btn-next" type="button">Tiếp theo <ArrowRight size={18} /></button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

