import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  FolderOpen,
  GraduationCap,
  LogOut,
  Bell,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Check,
  ShieldCheck,
  FileBadge,
} from "lucide-react";

const CURRENT_LEVEL_OPTIONS = ["Bac dai hoc", "Bac thac si", "Bac chuyen tiep", "Bac tien si"];
const TARGET_LEVEL_OPTIONS = [
  "Bac dai hoc - Nhom hoc sinh lop 12",
  "Bac dai hoc - Nhom da tot nghiep THPT",
  "Bac thac si - Nhom sinh vien nam cuoi",
  "Bac thac si - Nhom sinh vien da tot nghiep",
  "Bac chuyen tiep",
  "Bac tien si",
];

const TARGET_CHECKLISTS = {
  "Bac dai hoc - Nhom hoc sinh lop 12": [
    "Giay xac nhan hoc sinh ban goc",
    "Ket qua hoc tap lop 10, 11, hoc ky 1 lop 12 (co dau)",
    "10 anh 4x6 nen trang",
    "Can cuoc cong dan photo",
    "Ho chieu photo (neu co)",
    "Chung chi ngoai ngu Anh/Trung (neu co)",
    "Ho chieu",
    "Anh the",
    "Giay xac nhan hoc sinh",
    "Ket qua hoc tap",
    "Ban sao giay khai sinh",
    "CCCD photo cong chung",
    "Video gioi thieu ban than",
    "CV",
  ],
  "Bac dai hoc - Nhom da tot nghiep THPT": [
    "Bang THPT ban goc",
    "Hoc ba THPT ban goc",
    "10 anh 4x6 nen trang",
    "Can cuoc cong dan photo",
    "Ho chieu photo (neu co)",
    "Chung chi ngoai ngu Anh/Trung (neu co)",
    "Ho chieu",
    "Anh the",
    "Bang THPT",
    "Hoc ba",
    "Ban sao giay khai sinh",
    "CCCD photo cong chung",
    "Video gioi thieu ban than",
    "CV",
  ],
  "Bac thac si - Nhom sinh vien nam cuoi": [
    "Giay xac nhan sinh vien nam cuoi ban goc",
    "Bang diem Dai hoc den thoi diem nop ho so ban goc",
    "10 anh 4x6 nen trang",
    "Can cuoc cong dan photo",
    "Ho chieu photo (neu co)",
    "Chung chi ngoai ngu Anh/Trung (neu co)",
    "Ho chieu",
    "Anh the",
    "Bang THPT",
    "Hoc ba",
    "Ban sao giay khai sinh",
    "CCCD photo cong chung",
    "Video gioi thieu ban than",
    "CV",
  ],
  "Bac thac si - Nhom sinh vien da tot nghiep": [
    "Bang Dai hoc ban goc",
    "Bang diem Dai hoc ban goc",
    "10 anh 4x6 nen trang",
    "Can cuoc cong dan photo",
    "Ho chieu photo (neu co)",
    "Chung chi ngoai ngu Anh/Trung (neu co)",
    "Anh the",
    "Ho chieu",
    "Bang Dai hoc",
    "Bang diem",
    "Ban sao giay khai sinh",
    "CCCD photo cong chung",
    "Video gioi thieu ban than",
    "CV",
  ],
  "Bac chuyen tiep": [
    "Giay xac nhan sinh vien ban goc",
    "Bang diem Dai hoc den thoi diem nop ho so ban goc",
    "Bang THPT ban goc",
    "Hoc ba THPT ban goc",
    "10 anh 4x6 nen trang",
    "Can cuoc cong dan photo",
    "Ho chieu photo (neu co)",
    "Chung chi ngoai ngu Anh/Trung (neu co)",
    "Anh the",
    "Ho chieu",
    "Giay xac nhan sinh vien",
    "Bang diem den thoi diem hien tai",
    "Ban sao giay khai sinh",
    "CCCD photo cong chung",
    "Video gioi thieu ban than",
    "CV",
  ],
  "Bac tien si": [
    "Bang Thac si ban goc",
    "Bang diem Thac si ban goc",
    "10 anh 4x6 nen trang",
    "Can cuoc cong dan photo",
    "Ho chieu photo (neu co)",
    "Chung chi ngoai ngu Anh/Trung (neu co)",
    "Anh the",
    "Ho chieu",
    "Bang Thac si",
    "Bang diem Thac si",
    "CCCD photo cong chung",
    "Video gioi thieu ban than",
    "CV",
  ],
};

function normalizeDocName(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "")
    .replace(/\bban goc\b/g, "")
    .replace(/\bphoto\b/g, "")
    .replace(/\bneu co\b/g, "")
    .replace(/\bco dau\b/g, "")
    .trim();
}

function uniqueDocs(list) {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const key = normalizeDocName(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export default function Step1Form({ user, onLogout }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    birthday: "",
    nationality: "",
    currentLevel: "",
    targetLabel: "",
    address: "",
  });
  const [uploadedDocs, setUploadedDocs] = useState({
    
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const goToStep2 = () => {
    if (!formData.lastName || !formData.firstName || !formData.email || !formData.phone) {
      alert("Vui long nhap day du Ho, Ten, Email va So dien thoai.");
      return;
    }
    if (!formData.targetLabel) {
      alert("Vui long chon Trinh do bang cap mong muon.");
      return;
    }
    setCurrentStep(2);
  };

  const handleUpload = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setUploadedDocs((prev) => ({ ...prev, [key]: { name: file.name, size } }));
  };

  const displayName =
    (user?.fullName && user.fullName.trim()) ||
    (user?.email ? user.email.split("@")[0] : "Student");
  const accountLabel = user?.role === "student" ? "Tai khoan sinh vien" : "Tai khoan nhan vien";
  const fullName = `${formData.lastName} ${formData.firstName}`.trim() || displayName;

  const requiredDocs = useMemo(() => {
    const source = TARGET_CHECKLISTS[formData.targetLabel] || [];
    return uniqueDocs(source);
  }, [formData.targetLabel]);

  return (
    <div className="global-study-app">
      <style>{`
        .global-study-app {
          display: flex;
          min-height: 100vh;
          font-family: "Inter", system-ui, sans-serif;
          background: #f5f7fb;
          color: #111827;
        }
        .sidebar {
          width: 250px;
          min-width: 250px;
          background: #fff;
          border-right: 1px solid #e2e8f0;
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #2563eb;
          font-weight: 700;
          font-size: 28px;
          margin-bottom: 22px;
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f3f6fc;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        .user-info .name { font-size: 14px; font-weight: 700; display: block; }
        .user-info .role { font-size: 12px; color: #70809c; }
        .nav-menu {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 2px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: #4f6386;
          margin-bottom: 0;
          font-size: 14px;
          line-height: 1.2;
          white-space: nowrap;
        }
        .nav-item.active {
          background: #eaf0ff;
          color: #2255d7;
          font-weight: 700;
        }
        .logout {
          border: none;
          background: none;
          color: #4f6386;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          cursor: pointer;
          margin-top: auto;
          margin-bottom: 12px;
        }

        .main-content {
          flex: 1;
          min-width: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .top-header {
          height: 72px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 26px;
          width: 100%;
          box-sizing: border-box;
        }
        .top-header h1 {
          margin: 0;
          font-size: 34px;
          font-weight: 800;
        }
        .header-actions { display:flex; align-items:center; gap:12px; color:#4f6386; font-size:14px; }
        .notif-btn { position:relative; display:flex; cursor:pointer; }
        .notif-dot { position:absolute; top:-2px; right:-2px; width:8px; height:8px; border-radius:50%; background:#ef4444; border:2px solid #fff; }
        .header-divider {
          width: 1px;
          height: 20px;
          background: #e2e8f0;
        }
        .header-help {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .content-shell {
          padding: 18px 0 26px;
          width: 90%;
          box-sizing: border-box;
        }

        .stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 16px 14px;
          margin-bottom: 18px;
          width: 100%;
          max-width: none;
          box-sizing: border-box;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .step-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid #cdd6e5;
          color: #8897ae;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          background: #fff;
        }
        .step-item.active .step-circle {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }
        .step-label {
          font-size: 13px;
          color: #8a99b1;
        }
        .step-item.active .step-label {
          color: #2563eb;
          font-weight: 600;
        }
        .step-item.done .step-circle {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }
        .step-item.done .step-label {
          color: #2563eb;
          font-weight: 600;
        }
        .step-divider.active {
          background: #2563eb;
        }
        .step-divider {
          flex: 0.18;
          height: 2px;
          background: #e2e8f0;
          margin: 0 12px 20px;
        }

        .form-container {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          width: 100%;
          max-width: none;
          box-sizing: border-box;
        }
        .form-title {
          padding: 24px;
          border-bottom: 1px solid #e8edf5;
        }
        .form-title h2 {
          margin: 0 0 8px;
          font-size: 38px;
        }
        .form-title p {
          margin: 0;
          color: #4f6386;
          font-size: 20px;
        }

        .grid-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 18px;
          padding: 24px 24px 14px;
        }
        .input-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .input-box label {
          font-size: 16px;
          color: #2f3f5d;
        }
        .input-box input,
        .input-box select {
          height: 52px;
          border: 1px solid #dbe3ef;
          border-radius: 13px;
          background: #f7f9fc;
          padding: 0 14px;
          font-size: 20px;
          color: #1f2a3d;
          outline: none;
        }
        .input-box input:focus,
        .input-box select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background: #fff;
        }
        select { appearance: none; }
        .select-chevron {
          position: absolute;
          right: 14px;
          bottom: 16px;
          pointer-events: none;
          color: #6b7d99;
        }
        .full-width { grid-column: span 2; }

        .form-footer {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e8edf5;
          padding: 14px 24px;
        }
        .btn-prev,
        .btn-next {
          height: 44px;
          border-radius: 12px;
          border: none;
          padding: 0 18px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-prev {
          background: #eef2f8;
          color: #4b6083;
        }
        .btn-next {
          background: #2563eb;
          color: #fff;
        }
        .upload-list {
          padding: 24px;
          display: grid;
          gap: 14px;
        }
        .upload-passport {
          border: 1px solid #e1e8f4;
          border-radius: 14px;
          background: #f9fbff;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }
        .upload-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .upload-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e6eeff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }
        .upload-title {
          font-size: 18px;
          font-weight: 700;
        }
        .upload-sub {
          color: #6c80a2;
          font-size: 13px;
        }
        .file-pill {
          border: 1px solid #dfe6f1;
          border-radius: 12px;
          background: #fff;
          padding: 10px 12px;
          min-width: 180px;
        }
        .file-name {
          font-size: 15px;
        }
        .file-size {
          font-size: 12px;
          color: #6d80a2;
        }
        .upload-box {
          border: 2px dashed #dbe4f2;
          border-radius: 16px;
          background: #fbfcff;
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
        .upload-box-inner {
          display: grid;
          gap: 10px;
          justify-items: center;
        }
        .upload-btn {
          height: 38px;
          border: none;
          border-radius: 19px;
          padding: 0 18px;
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .upload-note {
          font-size: 12px;
          color: #7b8eab;
        }
        .upload-hidden {
          display: none;
        }
        .doc-card {
          border: 2px dashed #dbe4f2;
          border-radius: 16px;
          background: #fbfcff;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .doc-card.done {
          border-style: solid;
          border-color: #e1e8f4;
          background: #f9fbff;
        }
        .doc-left {
          display: grid;
          gap: 6px;
        }
        .doc-name {
          font-size: 12px;
          color: #6d80a2;
        }

        @media (max-width: 1100px) {
          .global-study-app { flex-direction: column; }
          .sidebar { width: auto; border-right: none; border-bottom: 1px solid #e2e8f0; }
          .grid-inputs { grid-template-columns: 1fr; }
          .full-width { grid-column: span 1; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand"><GraduationCap size={24} /> GlobalStudy</div>
        <div className="user-card">
          <img src="https://ui-avatars.com/api/?name=Alex+Smith&background=random" className="avatar" alt="User" />
          <div className="user-info">
            <span className="name">{displayName}</span>
            <span className="role">{accountLabel}</span>
          </div>
        </div>
        <nav className="nav-menu">
          <div className="nav-item"><LayoutDashboard size={18} /> Bang dieu khien</div>
          <div className={`nav-item ${currentStep === 1 ? "active" : ""}`}><UserCircle size={18} /> Ho so cua toi</div>
          <div className="nav-item"><FileText size={18} /> Don ung tuyen</div>
          <div className={`nav-item ${currentStep === 2 ? "active" : ""}`}><FolderOpen size={18} /> Tai lieu</div>
          <div className="nav-item"><GraduationCap size={18} /> Truong dai hoc</div>
        </nav>
        <button className="logout" onClick={onLogout}><LogOut size={18} /> Dang xuat</button>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1>Tao ho so</h1>
          <div className="header-actions"><div className="notif-btn"><Bell size={20} /><span className="notif-dot"></span></div><div className="header-divider"></div><HelpCircle size={19} /> Tro giup</div>
        </header>

        <div className="content-shell">
          <div className="stepper">
            <div className={`step-item ${currentStep === 1 ? "active" : currentStep > 1 ? "done" : ""}`}>
              <div className="step-circle">{currentStep > 1 ? <Check size={16} /> : "1"}</div>
              <span className="step-label">Thong tin ca nhan</span>
            </div>
            <div className={`step-divider ${currentStep > 1 ? "active" : ""}`}></div>
            <div className={`step-item ${currentStep === 2 ? "active" : ""}`}>
              <div className="step-circle">2</div>
              <span className="step-label">Tai lieu</span>
            </div>
            <div className="step-divider"></div>
            <div className="step-item">
              <div className="step-circle">3</div>
              <span className="step-label">Kiem tra lai</span>
            </div>
          </div>

          {currentStep === 1 && (
            <section className="form-container">
              <div className="form-title">
                <h2>Thong tin ca nhan</h2>
                <p>Dien day du thong tin chi tiet cua ban.</p>
              </div>

              <div className="grid-inputs">
                <div className="input-box">
                  <label>Ho</label>
                  <input name="lastName" placeholder="Nguyen" value={formData.lastName} onChange={handleChange} />
                </div>
                <div className="input-box">
                  <label>Ten</label>
                  <input name="firstName" placeholder="Van A" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="input-box">
                  <label>Dia chi Email</label>
                  <input name="email" type="email" placeholder="nguyen.vana@example.com" value={formData.email} onChange={handleChange} />
                </div>
                <div className="input-box">
                  <label>So dien thoai</label>
                  <input name="phone" placeholder="+84 912 345 678" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="input-box">
                  <label>Ngay sinh</label>
                  <input name="birthday" placeholder="mm/dd/yyyy" value={formData.birthday} onChange={handleChange} />
                </div>
                <div className="input-box">
                  <label>Quoc tich</label>
                  <input
                    name="nationality"
                    placeholder="Nhap quoc tich"
                    value={formData.nationality}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Trinh do bang cap hien tai</label>
                  <select name="currentLevel" value={formData.currentLevel} onChange={handleChange}>
                    <option value="">Chon trinh do hien tai</option>
                    {CURRENT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-chevron" size={16} />
                </div>
                <div className="input-box">
                  <label>Trinh do bang cap mong muon</label>
                  <select name="targetLabel" value={formData.targetLabel} onChange={handleChange}>
                    <option value="">Chon trinh do mong muon</option>
                    {TARGET_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-chevron" size={16} />
                </div>
                <div className="input-box full-width">
                  <label>Dia chi</label>
                  <input
                    name="address"
                    placeholder="So nha, Duong, Phuong/Xa, Quan/Huyen, Tinh/Thanh pho"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-footer">
                <button className="btn-prev">Quay lai</button>
                <button className="btn-next" onClick={goToStep2}>Tiep theo <ArrowRight size={18} /></button>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className="form-container">
              <div className="form-title">
                <h2>Tai tai lieu</h2>
                <p>Checklist duoc sinh tu dong theo nhom ban da chon.</p>
              </div>

              <div className="upload-list">
                {requiredDocs.map((docName, index) => {
                  const uploaded = uploadedDocs[docName];
                  return (
                    <div className={`doc-card ${uploaded ? "done" : ""}`} key={docName}>
                      <div className="doc-left">
                        <div className="upload-title">{index + 1}. {docName}</div>
                        <div className="upload-sub">Tai lieu theo nhom da chon.</div>
                        <div className="doc-name">Goi y: {fullName}_{docName}</div>
                      </div>
                      {uploaded ? (
                        <div className="file-pill">
                          <div className="file-name">{uploaded.name}</div>
                          <div className="file-size">{uploaded.size}</div>
                        </div>
                      ) : (
                        <label className="upload-btn">
                          Chon tep tin
                          <input className="upload-hidden" type="file" onChange={(e) => handleUpload(docName, e)} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="form-footer">
                <button className="btn-prev" onClick={() => setCurrentStep(1)}>Quay lai</button>
                <button className="btn-next">Tiep theo <ArrowRight size={18} /></button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
