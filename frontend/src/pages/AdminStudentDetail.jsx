import React, { useState, useEffect } from "react";
import { ChevronRight, CheckCircle2, AlertTriangle, Clock, Search, Bell, ZoomIn, ZoomOut, Printer, Maximize2, Shield, Edit3, ArrowLeft, UploadCloud, ChevronDown, ChevronUp, FileText } from "lucide-react";

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
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function getFileExtension(name) {
  if (!name) return "";
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase();
}

export default function AdminStudentDetail({ student, initialDocs = [], adminUser, onBack, refreshData }) {
  const [activeTab, setActiveTab] = useState("Hồ sơ tài liệu");
  const [activeDocName, setActiveDocName] = useState("");
  const [documents, setDocuments] = useState(initialDocs);
  const [feedbackText, setFeedbackText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [newStatus, setNewStatus] = useState("processing");
  const [historyNote, setHistoryNote] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [downloadModal, setDownloadModal] = useState({ show: false, password: '', isProcessing: false });

  useEffect(() => {
    if (activeTab === "Trạng thái và Lịch sử" && student?.userId) {
      fetchHistory();
    }
    if (activeTab === "Kết quả đại học" && student?.userId) {
      fetchUniversities();
    }
  }, [activeTab, student]);

  const [universities, setUniversities] = useState([]);
  const [expandedUniId, setExpandedUniId] = useState(null);
  const [isUploadingOffer, setIsUploadingOffer] = useState(false);
  const [offerFile, setOfferFile] = useState(null);

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', confirmText: 'Xác nhận', onConfirm: null });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    if (type === 'success') {
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const fetchUniversities = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/student/universities/${student.userId}`);
      if (res.ok) {
        const data = await res.json();
        setUniversities(data.universities || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadOffer = async (uniId) => {
    if (!offerFile) return;
    setIsUploadingOffer(true);
    try {
      const ext = getFileExtension(offerFile.name);
      const publicId = `offer_${uniId}_${Date.now()}`;
      const safeDoc = `offer_letters`;
      
      const formData = new FormData();
      formData.append("file", offerFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", `student_docs/${student.userId}/${safeDoc}`);
      formData.append("public_id", publicId);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error("Cloudinary error: " + errText);
      }
      const cloudinaryResponse = await res.json().catch(e => { throw new Error("Cloudinary parse error: " + e.message) });
      let fileUrl = cloudinaryResponse.secure_url;
      
      // Ensure the URL has the correct extension so browsers can preview PDFs correctly
      if (ext && !fileUrl.toLowerCase().endsWith(`.${ext}`)) {
        fileUrl += `.${ext}`;
      }

      const offerRes = await fetch(`${API_BASE}/api/admin/universities/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.userId, uniId, fileUrl })
      });
      if (offerRes.ok) {
        showNotification("Đã cập nhật Offer Letter", "success");
        setOfferFile(null);
        setExpandedUniId(null);
        fetchUniversities();
        fetchHistory();
      } else {
        const d = await res.json().catch(() => ({ message: "Lỗi phản hồi từ server" }));
        showNotification(d.message || "Unknown error", "error");
      }
    } catch (err) {
      showNotification("Lỗi khi tải Offer Letter (" + (err.message || "") + ")", "error");
    } finally {
      setIsUploadingOffer(false);
    }
  };

  const handleRemoveOffer = (uniId) => {
    setConfirmModal({
      show: true,
      message: "Bạn có chắc chắn muốn xóa thư mời này không? Trạng thái sẽ trở về Đang chờ.",
      confirmText: "Xác nhận xóa",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setIsUploadingOffer(true);
        try {
          const res = await fetch(`${API_BASE}/api/admin/universities/remove-offer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: student.userId, uniId })
          });
          if (res.ok) {
            showNotification("Đã xóa thư mời nhập học.", "success");
            setExpandedUniId(null);
            fetchUniversities();
            fetchHistory();
          } else {
            const d = await res.json().catch(() => ({ message: "Lỗi phản hồi" }));
            showNotification(d.message || "Không thể xóa thư mời", "error");
          }
        } catch (err) {
          showNotification("Lỗi khi kết nối đến máy chủ.", "error");
        } finally {
          setIsUploadingOffer(false);
        }
      }
    });
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/history/${student.userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === "fix_required" && !historyNote.trim()) {
      showNotification("Vui lòng nhập ghi chú giải thích các chỉnh sửa cần thiết.", "warning");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const payload = {
        userId: student.userId,
        adminId: adminUser?.id || null,
        adminName: adminUser?.fullName || "Admin User",
        adminRole: adminUser?.role === 'admin' ? "QUẢN TRỊ VIÊN (ADMIN)" : (adminUser?.role || "QUẢN TRỊ VIÊN (ADMIN)"),
        status: newStatus,
        note: historyNote.trim()
      };
      const res = await fetch(`${API_BASE}/api/admin/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setHistoryNote("");
        fetchHistory();
        if (refreshData) refreshData();
        showNotification("Cập nhật trạng thái thành công!", "success");
      } else {
        const data = await res.json();
        showNotification(data.message, "error");
      }
    } catch (e) {
      showNotification("Không thể ghi nhận lịch sử thay đổi. Vui lòng thử lại.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusUI = (s) => {
    switch (s) {
      case "received": return { label: "TIẾP NHẬN", bg: "#f1f5f9", col: "#475569" };
      case "processing": return { label: "ĐANG XỬ LÝ", bg: "#fef9c3", col: "#ca8a04" };
      case "fix_required": return { label: "CẦN BỔ SUNG", bg: "#fee2e2", col: "#ef4444" };
      case "completed": return { label: "HOÀN THÀNH", bg: "#dcfce7", col: "#22c55e" };
      case "doc_approved": return { label: "DUYỆT TÀI LIỆU", bg: "#dcfce7", col: "#16a34a" };
      case "doc_rejected": return { label: "TỪ CHỐI TÀI LIỆU", bg: "#fee2e2", col: "#dc2626" };
      case "offer_uploaded": return { label: "TẢI LÊN OFFER", bg: "#dbeafe", col: "#2563eb" };
      case "offer_deleted": return { label: "XÓA THƯ MỜI", bg: "#f1f5f9", col: "#475569" };
      default: return { label: (s || "UNKNOWN").toUpperCase(), bg: "#f1f5f9", col: "#475569" };
    }
  };

  const [newNote, setNewNote] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (activeTab === "Ghi chú" && student?.userId) {
      fetchNotes();
    }
  }, [activeTab, student]);

  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/student/${student.userId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setIsSavingNote(true);
    try {
      const payload = {
        studentId: student.userId,
        adminId: adminUser?.id || null,
        adminName: adminUser?.fullName || "Admin User", 
        adminRole: adminUser?.role === 'admin' ? "QUẢN TRỊ VIÊN (ADMIN)" : (adminUser?.role || "QUẢN TRỊ VIÊN (ADMIN)"),
        content: newNote.trim()
      };
      const res = await fetch(`${API_BASE}/api/admin/student/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewNote("");
        fetchNotes();
        showNotification("Đã lưu ghi chú.", "success");
      } else {
        const data = await res.json();
        showNotification(data.message, "error");
      }
    } catch (e) {
      showNotification("Lỗi khi lưu ghi chú.", "error");
    } finally {
      setIsSavingNote(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()} - ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

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
        fetchHistory();
      } else {
        const error = await res.json().catch(() => ({ message: "Lỗi phản hồi" }));
        showNotification(error.message || "Không thể phê duyệt tài liệu.", "error");
      }
    } catch (err) {
      showNotification("Lỗi khi phê duyệt tải liệu.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDoc = async () => {
    if (!feedbackText.trim()) {
      showNotification("Vui lòng nhập lý do từ chối để sinh viên có thể sửa đổi.", "warning");
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
        fetchHistory();
      } else {
        const error = await res.json().catch(() => ({ message: "Lỗi phản hồi" }));
        showNotification(error.message || "Không thể từ chối tài liệu.", "error");
      }
    } catch (err) {
      showNotification("Lỗi khi từ chối.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    if (!allApproved) {
      showNotification("Không thể phê duyệt toàn bộ vì có tài liệu chưa xác minh hoặc bị từ chối.", "warning");
      return;
    }

    setConfirmModal({
      show: true,
      message: "Bạn có chắc chắn muốn phê duyệt và hoàn tất hồ sơ này không? Hành động này sẽ chuyển trạng thái hồ sơ sang Hoàn Thành.",
      confirmText: "Phê duyệt toàn bộ",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setIsProcessing(true);
        try {
          const res = await fetch(`${API_BASE}/api/admin/profile/approve-all`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: student.userId })
          });
          if (res.ok) {
            showNotification("Hồ sơ đã được phê duyệt toàn bộ.", "success");
            fetchHistory();
            if (refreshData) refreshData();
            onBack();
          } else {
            const json = await res.json().catch(() => ({ message: "Lỗi phản hồi" }));
            showNotification(json.message || "Lỗi phê duyệt hồ sơ", "error");
          }
        } catch (e) {
          showNotification("Lỗi kết nối máy chủ.", "error");
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleDownloadDoc = async () => {
    if (!downloadModal.password) {
      showNotification("Vui lòng nhập mật khẩu tải tài liệu.", "warning");
      return;
    }
    setDownloadModal(prev => ({ ...prev, isProcessing: true }));
    try {
      // 1. Verify password
      const verifyRes = await fetch(`${API_BASE}/api/admin/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          adminEmail: adminUser?.email || '', 
          adminPassword: downloadModal.password 
        })
      });
      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        showNotification(errorData.message || "Mật khẩu không đúng.", "error");
        setDownloadModal(prev => ({ ...prev, isProcessing: false }));
        return;
      }
      
      // 2. Trigger Download
      const link = document.createElement("a");
      link.href = activeDoc.file_name;
      link.target = "_blank";
      link.download = activeDoc.doc_name || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 3. Log History
      const payload = {
        userId: student.userId,
        adminId: adminUser?.id || null,
        adminName: adminUser?.fullName || "Admin User",
        adminRole: adminUser?.role === 'admin' ? "QUẢN TRỊ VIÊN (ADMIN)" : (adminUser?.role || "QUẢN TRỊ VIÊN (ADMIN)"),
        status: "processing",
        note: `Đã tải xuống tài liệu: ${activeDoc.doc_name}`
      };
      await fetch(`${API_BASE}/api/admin/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      fetchHistory();
      
      setDownloadModal({ show: false, password: '', isProcessing: false });
      showNotification("Đã bắt đầu tải xuống tài liệu.", "success");
    } catch (err) {
      showNotification("Lỗi khi tải xuống tài liệu.", "error");
      setDownloadModal(prev => ({ ...prev, isProcessing: false }));
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
        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #0f172a;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          justify-content: center;
        }
        .btn-back:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
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
        .profile-actions { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; width: max-content; }
        .action-top {
          display: flex;
          gap: 12px;
          align-items: center;
        }
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
        .btn-approve-all { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: #f1f5f9; font-size: 14px; font-weight: 600; color: #cbd5e1; pointer-events: none; width: 100%; justify-content: center; }
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
        .stat-missing .doc-stat-text { color: #94a3b8; }
        .stat-missing .doc-icon { background: #e2e8f0; color: #94a3b8; }

        .right-panel {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .scrollable {
          overflow-y: auto;
          scrollbar-width: thin;
          min-height: 0;
        }
        .scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .scrollable::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
        .right-panel.scrollable {
          overflow-y: auto;
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
          flex: 1 1 420px;
          min-height: 420px;
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
        .personal-card {
          padding: 24px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 24px;
        }
        .info-item {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .info-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .info-value {
          font-size: 14px;
          color: #0f172a;
          font-weight: 700;
          word-break: break-word;
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

        /* Notes styles */
        .notes-container { padding: 24px; max-width: 900px; margin: 0 auto; width: 100%; }
        .note-input-card {
          background: #fff; border-radius: 16px; padding: 24px;
          border: 1px solid #e2e8f0; margin-bottom: 32px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .note-input-header {
          display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700;
          color: #0f172a; margin-bottom: 16px;
        }
        .note-textarea {
          width: 100%; height: 120px; border-radius: 12px; border: 1px solid #e2e8f0;
          padding: 16px; font-size: 14px; resize: none; outline: none; background: #f8fafc;
          margin-bottom: 16px; transition: all 0.2s; font-family: inherit;
        }
        .note-textarea:focus { border-color: #2563eb; background: #fff; }
        .note-input-footer { display: flex; justify-content: space-between; align-items: center; }
        .note-security-text { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; }
        .btn-save-note {
          background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px;
          font-weight: 600; font-size: 14px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: background 0.2s;
        }
        .btn-save-note:hover:not(:disabled) { background: #1d4ed8; }
        .btn-save-note:disabled { opacity: 0.7; cursor: not-allowed; }
        .notes-history-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
          font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .note-item {
          background: #fdfde8; border-radius: 16px; padding: 20px;
          border: 1px solid #fef08a; margin-bottom: 16px;
        }
        .note-item.other-role { background: #f8fafc; border-color: #e2e8f0; }
        .note-item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .note-author { display: flex; align-items: center; gap: 12px; }
        .note-avatar {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: #0f172a; color: #fff; font-weight: 700; font-size: 14px;
        }
        .note-avatar.verifier { background: #cbd5e1; color: #475569; }
        .note-author-info .name { font-size: 14px; font-weight: 700; color: #0f172a; }
        .note-author-info .role { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
        .note-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .note-date { font-size: 12px; color: #64748b; }
        .note-tag {
          font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7;
          border: 1px solid #fde68a; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;
        }
        .note-content { font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap; }
        .uni-item { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; }
        .uni-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; }
        .uni-info { display: flex; align-items: center; gap: 16px; }
        .uni-logo { width: 44px; height: 44px; border-radius: 12px; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 16px; }
        .uni-name { font-size: 16px; font-weight: 700; color: #0f172a; }
        .uni-meta { font-size: 13px; color: #64748b; margin-top: 4px; }
        .uni-status-row { display: flex; align-items: center; gap: 12px; }
        .uni-status-badge { padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .uni-status-approved { background: #dbeafe; color: #2563eb; }
        .uni-status-pending { background: #e2e8f0; color: #475569; }
        .uni-status-enrolled { background: #dcfce7; color: #15803d; }
        .btn-view-offer { background: transparent; color: #2563eb; border: none; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .uni-action-btn { background: #f1f5f9; color: #475569; border: none; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .uni-action-btn:hover { background: #e2e8f0; }
        .uni-upload-area { background: #f8fafc; padding: 32px; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; }
        .dropzone { border: 1px dashed #cbd5e1; border-radius: 16px; width: 100%; max-width: 500px; padding: 40px; text-align: center; background: #fff; position: relative; cursor: pointer; }
        .dropzone:hover { border-color: #2563eb; }
        .dropzone-input { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
        .dropzone-icon { width: 48px; height: 48px; background: #dbeafe; color: #2563eb; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px; }
        .dropzone-text { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .dropzone-sub { font-size: 13px; color: #64748b; }
        .upload-actions { display: flex; gap: 16px; margin-top: 24px; align-items: center; }
        .btn-cancel { background: transparent; border: none; color: #475569; font-weight: 600; font-size: 14px; cursor: pointer; }
        .btn-save-offer { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 999px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn-save-offer:disabled { opacity: 0.6; cursor: not-allowed; }
        /* Notification Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: white;
          padding: 32px;
          border-radius: 24px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s ease-out;
        }
        .modal-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .modal-icon.success { background: #dcfce7; color: #16a34a; }
        .modal-icon.error { background: #fee2e2; color: #dc2626; }
        .modal-icon.warning { background: #fef3c7; color: #d97706; }
        .modal-message {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .btn-modal-close {
          background: #0f172a;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }
        .btn-modal-secondary {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }
        .btn-modal-close:hover { background: #1e293b; transform: translateY(-1px); }
        .btn-modal-secondary:hover { background: #e2e8f0; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
            <div className="action-top">
              <button className="btn-contact"><Edit3 size={16} /> Liên hệ</button>
              <button className="btn-back" onClick={() => onBack && onBack()}>
                <ArrowLeft size={20} /> Quay lại
              </button>
            </div>
            <button className={`btn-approve-all ${allApproved ? 'active' : ''}`} onClick={handleApproveAll} disabled={isProcessing}>
              <CheckCircle2 size={16} /> {isProcessing ? "Đang xử lý..." : "Phê duyệt tòan bộ"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        {["Thông tin cá nhân", "Hồ sơ tài liệu", "Kết quả đại học", "Trạng thái và Lịch sử", "Ghi chú"].map(tab => (
          <div key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "Ghi chú" && notes.length > 0 ? `Ghi chú (${notes.length})` : tab}
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
                const hasFile = (item.file_name || '').trim() !== '';

                let icon = <Clock size={14} />;
                let statusText = "CHỜ DUYỆT";
                let statusClass = "stat-pending";

                if (!hasFile) {
                  icon = <Clock size={14} />;
                  statusText = "CHƯA NỘP";
                  statusClass = "stat-missing";
                } else if (isApproved) {
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
                      <div className="doc-icon">{icon}</div>
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

        <div className={`right-panel ${["Hồ sơ tài liệu", "Kết quả đại học"].includes(activeTab) ? "scrollable" : ""}`}>
          {activeTab === "Thông tin cá nhân" ? (
            <div className="personal-card">
              <div className="preview-header" style={{ padding: 0, borderBottom: "none", marginBottom: 16 }}>
                <div className="preview-title">
                  <Search size={16} /> Thông tin cá nhân
                </div>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Họ và tên</div>
                  <div className="info-value">{studentName || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{student.email || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Số điện thoại</div>
                  <div className="info-value">{student.phone || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ngày sinh</div>
                  <div className="info-value">{student.birthday || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Quốc tịch</div>
                  <div className="info-value">{student.nationality || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Bằng cấp hiện tại</div>
                  <div className="info-value">{student.currentLevel || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Trường mục tiêu</div>
                  <div className="info-value">{student.targetLabel || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Nhân viên phụ trách</div>
                  <div className="info-value">{student.assignedStaffName || "-"}</div>
                </div>
                <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                  <div className="info-label">Địa chỉ</div>
                  <div className="info-value">{student.address || "-"}</div>
                </div>
              </div>
            </div>
          ) : activeTab === "Hồ sơ tài liệu" ? (
            activeDocName ? (
              <>
                <div className="preview-header">
                  <div className="preview-title">
                    <ZoomIn size={16} /> Xem trước: {activeDocName}
                  </div>
                  <div className="preview-tools">
                    <ZoomIn size={16} /> <ZoomOut size={16} /> <Printer size={16} onClick={() => setDownloadModal(prev => ({ ...prev, show: true }))} /> <Maximize2 size={16} />
                  </div>
                </div>

                <div className="preview-body">
                  {activeDoc.file_name ? (
                    (() => {
                      const ext = getFileExtension(activeDoc.file_name);
                      const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
                      const srcUrl = isOfficeDoc 
                        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeDoc.file_name)}` 
                        : activeDoc.file_name;
                      return <iframe title="Document Preview" src={srcUrl} className="doc-iframe" />;
                    })()
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
            )
          ) : activeTab === "Ghi chú" ? (
            <div className="notes-container scrollable">
              <div className="note-input-card">
                <div className="note-input-header">
                  <Edit3 size={18} color="#2563eb" /> Thêm ghi chú nội bộ
                </div>
                <textarea 
                  className="note-textarea"
                  placeholder="Nhập nội dung ghi chú nội bộ..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
                <div className="note-input-footer">
                  <div className="note-security-text">
                    <Shield size={14} /> Nội dung này được bảo mật và chỉ hiển thị cho nhân viên hệ thống.
                  </div>
                  <button className="btn-save-note" onClick={handleSaveNote} disabled={isSavingNote || !newNote.trim()}>
                    <CheckCircle2 size={16} /> Lưu ghi chú
                  </button>
                </div>
              </div>

              <div className="notes-history-header">
                <span>LỊCH SỬ GHI CHÚ</span>
                <span>{notes.length} GHI CHÚ</span>
              </div>

              <div className="notes-list">
                {isLoadingNotes ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#64748b", fontSize: 14 }}>Đang tải...</div>
                ) : notes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#64748b", fontSize: 14 }}>Chưa có ghi chú nào.</div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-item-header">
                        <div className="note-author">
                          <div className={`note-avatar ${note.admin_role && note.admin_role.toLowerCase().includes('admin') ? '' : 'verifier'}`}>
                            {note.admin_name ? note.admin_name.slice(0, 2).toUpperCase() : "AD"}
                          </div>
                          <div className="note-author-info">
                            <div className="name">{note.admin_name || "Admin User"}</div>
                            <div className="role">{note.admin_role || "QUẢN TRỊ VIÊN (ADMIN)"}</div>
                          </div>
                        </div>
                        <div className="note-meta">
                          <div className="note-date">{formatDate(note.created_at)}</div>
                          <div className="note-tag">
                            <Shield size={10} /> INTERNAL ONLY - HIDDEN FROM STUDENT
                          </div>
                        </div>
                      </div>
                      <div className="note-content">{note.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "Trạng thái và Lịch sử" ? (
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', height: '100%', padding: '24px', boxSizing: 'border-box' }}>
              {/* Left Panel: Status Update */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={18} color="#2563eb" /> Cập nhật trạng thái
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Chọn trạng thái mới</div>
                  {[
                    { val: 'received', label: 'Tiếp nhận (Received)' },
                    { val: 'processing', label: 'Đang xử lý (Processing)' },
                    { val: 'fix_required', label: 'Cần bổ sung (Fix Required)' },
                    { val: 'completed', label: 'Hoàn thành (Completed)' }
                  ].map(opt => (
                    <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: newStatus === opt.val ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', background: newStatus === opt.val ? '#eff6ff' : '#fff', fontWeight: newStatus === opt.val ? 600 : 400, color: newStatus === opt.val ? '#1e3a8a' : '#334155', transition: 'all 0.2s' }}>
                      <input type="radio" name="statusOptions" value={opt.val} checked={newStatus === opt.val} onChange={(e) => setNewStatus(e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                      {opt.label}
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Ghi chú chỉnh sửa</div>
                  <textarea 
                    style={{ width: '100%', minHeight: '100px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px' }}
                    placeholder="Nhập lý do cần bổ sung hoặc ghi chú công việc..."
                    value={historyNote}
                    onChange={(e) => setHistoryNote(e.target.value)}
                  />
                  {newStatus === 'fix_required' && <div style={{ fontSize: '12px', color: '#b91c1c' }}>* Ghi chú là bắt buộc khi chọn Cần bổ sung</div>}
                </div>

                <button style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: isUpdatingStatus ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isUpdatingStatus ? 0.7 : 1 }} onClick={handleUpdateStatus} disabled={isUpdatingStatus}>
                  <CheckCircle2 size={18} /> {isUpdatingStatus ? "Đang xử lý..." : "Cập nhật trạng thái"}
                </button>
              </div>

              {/* Right Panel: History Table */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#64748b" /> Lịch sử thay đổi
                  </div>
                  <button style={{ background: 'transparent', color: '#2563eb', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: 0 }} onClick={() => showNotification("Báo cáo đã xuất thành công!", "success")}>
                    Tải về báo cáo
                  </button>
                </div>

                <div className="scrollable" style={{ flex: 1, padding: '0 24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '16px 8px', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TRẠNG THÁI</th>
                        <th style={{ padding: '16px 8px', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>NGƯỜI CẬP NHẬT</th>
                        <th style={{ padding: '16px 8px', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>THỜI GIAN</th>
                        <th style={{ padding: '16px 8px', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>GHI CHÚ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingHistory ? (
                        <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải lịch sử...</td></tr>
                      ) : history.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Chưa có lịch sử thay đổi trạng thái nào.</td></tr>
                      ) : (
                        history.map(row => {
                          const uiStatus = getStatusUI(row.status);
                          return (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                <span style={{ background: uiStatus.bg, color: uiStatus.col, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                                  {uiStatus.label}
                                </span>
                              </td>
                              <td style={{ padding: '16px 8px', verticalAlign: 'top', color: '#0f172a', fontWeight: 600, fontSize: '14px' }}>
                                {row.admin_name}
                                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 400, marginTop: '4px' }}>({row.admin_role})</div>
                              </td>
                              <td style={{ padding: '16px 8px', verticalAlign: 'top', color: '#475569', fontSize: '13px' }}>
                                {formatDate(row.created_at)}
                              </td>
                              <td style={{ padding: '16px 8px', verticalAlign: 'top', color: '#334155', fontSize: '13px', maxWidth: '280px', lineHeight: 1.5 }}>
                                {row.note || "-"}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                 <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                  Hiển thị {history.length} trên tổng số {history.length} bản ghi lịch sử
                </div>
              </div>
            </div>
          ) : activeTab === "Kết quả đại học" ? (
            <div className="scrollable" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
              {universities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chưa có danh sách trường</div>
              ) : (
                universities.map(uni => {
                  const isExpanded = expandedUniId === uni.id;
                  const uniTitle = uni.university_name || "Trường chưa xác định";
                  const initial = uniTitle.slice(0, 1).toUpperCase();
                  return (
                    <div className="uni-item" key={uni.id}>
                      <div className="uni-header">
                        <div className="uni-info">
                          <div className="uni-logo">{initial}</div>
                          <div>
                            <div className="uni-name">{uniTitle}</div>
                            <div className="uni-meta">Cập nhật lúc: {formatDate(uni.created_at)}</div>
                          </div>
                        </div>
                        <div className="uni-status-row">
                          {uni.is_enrolled ? (
                            <div className="uni-status-badge uni-status-enrolled">ĐÃ CHỌN NHẬP HỌC</div>
                          ) : uni.status === 'approved' ? (
                            <div className="uni-status-badge uni-status-approved">ĐÃ TRÚNG TUYỂN</div>
                          ) : (
                            <div className="uni-status-badge uni-status-pending">ĐANG CHỜ</div>
                          )}

                          {uni.offer_letter_url ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button className="btn-view-offer" onClick={() => window.open(uni.offer_letter_url, "_blank")}>
                                <FileText size={16} /> Xem Offer Letter
                              </button>
                              <button className="uni-action-btn" onClick={() => {
                                setExpandedUniId(isExpanded ? null : uni.id);
                                setOfferFile(null);
                              }}>
                                {isExpanded ? "Đóng" : "Sửa"} {isExpanded ? <ChevronUp size={16}/> : <Edit3 size={16}/>}
                              </button>
                            </div>
                          ) : (
                            <button className="uni-action-btn" onClick={() => {
                              setExpandedUniId(isExpanded ? null : uni.id);
                              setOfferFile(null);
                            }}>
                              {isExpanded ? "Đóng" : "Cập nhật"} {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="uni-upload-area">
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', alignSelf: 'flex-start', maxWidth: '500px', margin: '0 auto 16px', width: '100%' }}>Cập nhật hồ sơ trúng tuyển</div>
                          <div className="dropzone">
                            <input 
                              type="file" 
                              className="dropzone-input" 
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  if (file.size > 10 * 1024 * 1024) {
                                    showNotification("Tệp của bạn vượt quá dung lượng cho phép. Vui lòng chọn tệp có kích thước nhỏ hơn 10MB để tải lên thành công.", "warning");
                                    e.target.value = '';
                                    return;
                                  }
                                  const ext = getFileExtension(file.name);
                                  if (!['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'].includes(ext)) {
                                    showNotification("Định dạng không được hỗ trợ", "error");
                                    e.target.value = '';
                                    return;
                                  }
                                  setOfferFile(file);
                                }
                              }} 
                            />
                            <div className="dropzone-icon"><UploadCloud size={24} /></div>
                            <div className="dropzone-text">Tải lên Offer Letter</div>
                            <div className="dropzone-sub">{offerFile ? offerFile.name : "Kéo thả hoặc nhấp để chọn tệp (PDF, JPG, PNG, Word..."}</div>
                            <div className="dropzone-sub" style={{ marginTop: 8 }}>Tối đa 10MB</div>
                          </div>
                          <div className="upload-actions">
                            <button className="btn-cancel" onClick={() => { setExpandedUniId(null); setOfferFile(null); }}>Hủy</button>
                            {uni.offer_letter_url && (
                              <button 
                                className="btn-cancel" 
                                style={{ color: '#ef4444', borderColor: '#fee2e2' }} 
                                onClick={() => handleRemoveOffer(uni.id)}
                                disabled={isUploadingOffer}
                              >
                                {isUploadingOffer ? "Đang xử lý..." : "Xóa thư mời"}
                              </button>
                            )}
                            <button className="btn-save-offer" onClick={() => handleUploadOffer(uni.id)} disabled={!offerFile || isUploadingOffer}>
                              <Edit3 size={16} /> {isUploadingOffer ? "Đang xử lý..." : "Lưu & Cập nhật trạng thái"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              Nội dung đang được cập nhật
            </div>
          )}
        </div>
      </div>
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning">
              <AlertTriangle size={32} />
            </div>
            <div className="modal-message">{confirmModal.message}</div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-modal-secondary" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>Hủy</button>
              <button className="btn-modal-close" style={{ background: confirmModal.confirmText.includes('xóa') ? '#ef4444' : '#2563eb' }} onClick={confirmModal.onConfirm}>
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      {notification.show && (
        <div className="modal-overlay" onClick={() => setNotification({ ...notification, show: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${notification.type}`}>
              {notification.type === 'success' ? <CheckCircle2 size={32} /> : (notification.type === 'error' ? <AlertTriangle size={32} /> : <Clock size={32} />)}
            </div>
            <div className="modal-message">{notification.message}</div>
            <button className="btn-modal-close" onClick={() => setNotification({ ...notification, show: false })}>Đóng</button>
          </div>
        </div>
      )}
      {downloadModal.show && (
        <div className="modal-overlay" onClick={() => setDownloadModal(prev => ({ ...prev, show: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Printer size={32} />
            </div>
            <div className="modal-message">Bảo mật Tải Xuống</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              Vui lòng nhập mật khẩu admin <b>{adminUser?.email}</b> để xác nhận quyền tải xuống tài liệu <b>{activeDocName}</b>.
            </div>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu của bạn"
              value={downloadModal.password}
              onChange={(e) => setDownloadModal(prev => ({ ...prev, password: e.target.value }))}
              style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px', fontSize: 14, boxSizing: 'border-box' }}
            />
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-modal-secondary" onClick={() => setDownloadModal(prev => ({ ...prev, show: false }))} disabled={downloadModal.isProcessing}>Hủy</button>
              <button className="btn-modal-close" style={{ background: '#2563eb' }} onClick={handleDownloadDoc} disabled={downloadModal.isProcessing}>
                {downloadModal.isProcessing ? "Đang xử lý..." : "Xác nhận tải"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

