import React, { useState, useEffect } from "react";
import { ChevronRight, CheckCircle2, AlertTriangle, Clock, Search, Bell, ZoomIn, ZoomOut, Printer, Maximize2, Shield, Edit3 } from "lucide-react";

// Categorization logic
const CATEGORIES = {
  "Tài chính": ["Giấy tờ chứng minh tài chính", "Sổ tiết kiệm", "Sao kê tài khoản ngân hàng"],
  "Học vấn": ["Học bạ THPT (Academic Transcripts)", "Bằng Tốt nghiệp (Degree/Certificate)", "Chứng chỉ Tiếng Anh (IELTS/TOEFL PTE, vv)", "Bài luận cá nhân (Personal Statement)"],
  "Thông tin định danh": ["Hộ chiếu (Passport) / CMND", "CV/Sơ yếu lý lịch (Resume)", "Thư giới thiệu (Letters of Recommendation)", "Giấy khám sức khỏe (Medical Report)"]
};

function getCategory(docName) {
  for (const [cat, docs] of Object.entries(CATEGORIES)) {
    if (docs.some(d => docName.includes(d) || d.includes(docName))) return cat;
  }
  return "Tài liệu khác";
}

const API_BASE = "http://localhost:5000";

export default function AdminStudentDetail({ student, initialDocs = [], onBack, refreshData }) {
  const [activeTab, setActiveTab] = useState("Hồ sơ tài liệu");
  const [activeDocName, setActiveDocName] = useState("");
  const [documents, setDocuments] = useState(initialDocs);
  const [feedbackText, setFeedbackText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setDocuments(initialDocs);
    if (initialDocs.length > 0 && !activeDocName) {
      setActiveDocName(initialDocs[0].doc_name);
    }
  }, [initialDocs]);

  // Derived state
  const activeDoc = documents.find(d => d.doc_name === activeDocName) || {};
  const studentName = `${student.lastName || ""} ${student.firstName || ""}`.trim() || student.fullName;
  const isProfileRefused = documents.some(d => d.status === 'rejected');
  const allApproved = documents.length > 0 && documents.every(d => d.status === 'approved');

  // Group docs by category
  const groupedDocs = documents.reduce((acc, doc) => {
    const cat = getCategory(doc.doc_name);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const handleApproveDoc = async () => {
    if (!activeDocName || !activeDoc.file_name) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/document/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.userId, docName: activeDocName })
      });
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.doc_name === activeDocName ? { ...d, status: 'approved', admin_feedback: '' } : d));
        setFeedbackText("");
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) {
      alert("Lỗi khi phê duyệt.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDoc = async () => {
    if (!feedbackText.trim()) {
      alert("Vui lòng nhập lý do từ chối để sinh viên có thể sửa đổi.");
      return;
    }
    if (!activeDocName || !activeDoc.file_name) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/document/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.userId, docName: activeDocName, feedback: feedbackText })
      });
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.doc_name === activeDocName ? { ...d, status: 'rejected', admin_feedback: feedbackText } : d));
        // Push profile status to fix_required directly
        await fetch(`${API_BASE}/api/admin/profile/request-fix`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: student.userId })
        });
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) {
      alert("Lỗi khi từ chối.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    if (!allApproved) {
      alert("Không thể phê duyệt toàn bộ vì có tài liệu chưa xác minh hoặc bị từ chối.");
      return;
    }

    // Call approve all API
    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/approve-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.userId })
      });
      if (res.ok) {
        alert("Hồ sơ đã được phê duyệt toàn bộ và chuyển qua Hoàn Thành.");
        if (refreshData) refreshData();
        onBack();
      } else {
        const json = await res.json();
        alert(json.message);
      }
    } catch (e) {
      alert("Lỗi khi phê duyệt toàn bộ.");
    }
  };

  return (
    <div className="admin-detail-layout">
      <style>{`
        .admin-detail-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f8fafc;
          font-family: inherit;
        }
        .top-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
        }
        .breadcrumb .current { color: #0f172a; font-weight: 600; }
        .nav-actions { display: flex; align-items: center; gap: 16px; }
        .nav-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          border-radius: 999px;
          padding: 6px 12px;
          width: 200px;
        }
        .nav-search input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          width: 100%;
        }
        .header-card {
          padding: 24px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .profile-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .profile-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #fde68a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: #92400e;
        }
        .profile-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .profile-name { font-size: 20px; font-weight: 700; color: #0f172a; }
        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          background: #dbeafe;
          color: #1d4ed8;
        }
        .profile-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 6px;
          font-size: 13px;
          color: #64748b;
        }
        .profile-actions { display: flex; gap: 12px; }
        .btn-contact {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }
        .btn-approve-all {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: #f1f5f9;
          font-size: 14px;
          font-weight: 600;
          color: #cbd5e1;
          pointer-events: none;
        }
        .btn-approve-all.active {
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          pointer-events: auto;
        }
        .tabs-row {
          display: flex;
          gap: 32px;
          padding: 0 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #fff;
        }
        .tab {
          padding: 16px 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        
        .content-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          flex: 1;
          gap: 24px;
          padding: 24px;
          overflow: hidden;
        }
        .left-panel {
          overflow-y: auto;
          padding-right: 8px;
        }
        .doc-category { margin-bottom: 24px; }
        .cat-title { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 12px; text-transform: uppercase; }
        .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #e2e8f0;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .doc-item:hover { border-color: #cbd5e1; }
        .doc-item.active {
          background: #2563eb;
          border-color: #2563eb;
        }
        .doc-item.active .doc-name { color: #fff; }
        .doc-item.active .doc-stat-text { color: #bfdbfe; }
        .doc-item.active .doc-icon { background: rgba(255,255,255,0.2) !important; color: #fff !important; }
        
        .doc-left-side { display: flex; align-items: center; gap: 12px; }
        .doc-icon {
          width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center;
          background: #f1f5f9; color: #475569;
        }
        .doc-name { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .doc-stat { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; }
        
        .stat-approved .doc-stat-text { color: #16a34a; }
        .stat-approved .doc-icon { background: #dcfce7; color: #16a34a; }
        
        .stat-rejected .doc-stat-text { color: #dc2626; }
        .stat-rejected .doc-icon { background: #fee2e2; color: #dc2626; }
        
        .stat-pending .doc-stat-text { color: #d97706; }
        .stat-pending .doc-icon { background: #fef3c7; color: #d97706; }

        .right-panel {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .preview-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #0f172a; }
        .preview-tools { display: flex; gap: 12px; color: #64748b; }
        .preview-tools svg { cursor: pointer; }
        
        .preview-body {
          flex: 1;
          background: #f1f5f9;
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .doc-iframe { width: 100%; height: 100%; border: none; }
        
        .secure-overlay {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.95);
          padding: 20px 32px;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .review-footer {
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #fff;
        }
        .review-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .btn-approve, .btn-reject {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          height: 44px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          border: none;
        }
        .btn-approve { background: #10b981; color: white; }
        .btn-reject { background: #ef4444; color: white; }
        .btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .feedback-box { display: flex; flex-direction: column; gap: 8px; }
        .feedback-label { font-size: 13px; font-weight: 700; color: #1e293b; }
        .feedback-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          resize: none;
          height: 80px;
          outline: none;
          background: #f8fafc;
        }
        .feedback-input:focus { border-color: #2563eb; background: #fff; }
      `}</style>

      {/* Top Navbar */}
      <div className="top-navbar">
        <div className="breadcrumb" onClick={onBack}>
          <span>Sinh viên</span> <ChevronRight size={14} /> <span className="current">Chi tiết hồ sơ</span>
        </div>
        <div className="nav-actions">
          <div className="nav-search">
            <Search size={14} color="#94a3b8" />
            <input placeholder="Tìm kiếm hồ sơ..." />
          </div>
          <Bell size={18} color="#64748b" />
        </div>
      </div>

      {/* Profile Header */}
      <div className="header-card">
        <div className="profile-row">
          <div className="profile-info">
            <div className="profile-avatar">{studentName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="profile-title-row">
                <span className="profile-name">{studentName}</span>
                <span className="status-badge" style={{ background: isProfileRefused ? '#fee2e2' : '#dbeafe', color: isProfileRefused ? '#dc2626' : '#1d4ed8' }}>
                  {isProfileRefused ? "CẦN SỬA ĐỔI" : "ĐANG XỬ LÝ"}
                </span>
              </div>
              <div className="profile-meta">
                <span>Mã hồ sơ: <b>#{student.userId}</b></span>
                <span>Trường mục tiêu: <b>{student.targetLabel || "Chưa chọn"}</b></span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn-contact"><Edit3 size={16} /> Liên hệ</button>
            <button className={`btn-approve-all ${allApproved ? 'active' : ''}`} onClick={handleApproveAll}>
              <CheckCircle2 size={16} /> Phê duyệt toàn bộ
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        {["Thông tin cá nhân", "Hồ sơ tài liệu", "Lịch sử trao đổi", "Ghi chú"].map(tab => (
          <div key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
      </div>

      {/* Body Grid */}
      <div className="content-grid">
        <div className="left-panel">
          {Object.entries(groupedDocs).map(([category, items]) => (
            <div className="doc-category" key={category}>
              <div className="cat-title">{category}</div>
              {items.map(item => {
                const isActive = activeDocName === item.doc_name;
                const statusStr = item.status || 'pending';
                const isApproved = statusStr === 'approved';
                const isRejected = statusStr === 'rejected';

                let icon = <Clock size={14} />;
                let statusText = "CHỜ DUYỆT";
                let statusClass = "stat-pending";

                if (isApproved) {
                  icon = <CheckCircle2 size={14} />;
                  statusText = "ĐÃ XÁC MINH";
                  statusClass = "stat-approved";
                } else if (isRejected) {
                  icon = <AlertTriangle size={14} />;
                  statusText = "CẦN BỔ SUNG";
                  statusClass = "stat-rejected";
                }

                return (
                  <div
                    key={item.doc_name}
                    className={`doc-item ${statusClass} ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveDocName(item.doc_name);
                      setFeedbackText(item.admin_feedback || "");
                    }}
                  >
                    <div className="doc-left-side">
                      <div className="doc-icon">
                        {isApproved ? <Shield size={18} /> : isRejected ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                        <div className="doc-name">{item.doc_name}</div>
                        <div className="doc-stat">
                          {icon} <span className="doc-stat-text">{statusText}</span>
                        </div>
                      </div>
                    </div>
                    {isActive && <ChevronRight size={16} color="#fff" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="right-panel">
          {activeDocName ? (
            <>
              <div className="preview-header">
                <div className="preview-title">
                  <ZoomIn size={16} /> Xem trước: {activeDocName}
                </div>
                <div className="preview-tools">
                  <ZoomIn size={16} /> <ZoomOut size={16} /> <Printer size={16} /> <Maximize2 size={16} />
                </div>
              </div>

              <div className="preview-body">
                {activeDoc.file_name ? (
                  <iframe title="Document Preview" src={activeDoc.file_name} className="doc-iframe" />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 14 }}>Sinh viên chưa nộp tài liệu này</div>
                )}
                <div className="secure-overlay">
                  <Shield size={32} color="#2563eb" style={{ marginBottom: 12 }} />
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Chế độ xem an toàn</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Tài liệu được bảo mật và không thể tải xuống theo quy định hệ thống.</div>
                </div>
              </div>

              <div className="review-footer">
                <div className="review-actions">
                  <button className="btn-approve" onClick={handleApproveDoc} disabled={isProcessing || activeDoc.status === 'approved'}>
                    <CheckCircle2 size={16} /> Phê duyệt tài liệu
                  </button>
                  <button className="btn-reject" onClick={handleRejectDoc} disabled={isProcessing}>
                    <AlertTriangle size={16} /> Từ chối tài liệu
                  </button>
                </div>
                <div className="feedback-box">
                  <div className="feedback-label">Phản hồi lý do từ chối (nếu có):</div>
                  <textarea
                    className="feedback-input"
                    placeholder="Nhập lý do từ chối hoặc yêu cầu bổ sung thông tin cho sinh viên..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              Vui lòng chọn tài liệu bên trái
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
