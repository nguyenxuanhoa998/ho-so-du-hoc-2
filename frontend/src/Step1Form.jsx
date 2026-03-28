import React, { useEffect, useMemo, useState } from "react";
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
  Pencil,
} from "lucide-react";

const CURRENT_LEVEL_OPTIONS = ["Bậc đại học", "Bậc thạc sĩ", "Bậc chuyển tiếp", "Bậc tiến sĩ"];
const TARGET_LEVEL_OPTIONS = [
  "Bậc đại học - Nhóm học sinh lớp 12",
  "Bậc đại học - Nhóm đẫ tốt nghiệp THPT",
  "Bậc thạc sĩ - Nhóm sinh viên năm cuối",
  "Bậc thạc sĩ  - Nhóm sinh viên đẫ tốt nghiệp",
  "Bậc chuyển tiếp",
  "Bậc tiến sĩ",
];


const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const TARGET_CHECKLISTS = {
  "Bậc đại học - Nhóm học sinh lớp 12": [
    "Giấy xác nhận học sinh bản gốc",
    "Kết quả học tập lớp 10, 11, học kỳ 1 lớp 12 (có dấu)",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân photo",
    "Họ chiếu photo (nếu có)",
    "Chứng chỉ ngọai ngữ Anh/Trung (nếu có)",
    "Hộ chiếu",
    "Ảnh thẻ",
    "Giấy xác nhận học sinh",
    "Kết quả học tập",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc đại học - Nhóm đẫ tốt nghiệp THPT": [
    "Bằng THPT bản gốc",
    "Học bạ THPT bản gốc",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân photo",
    "Hộ chiếu photo (nếu có)",
    "Chứng chỉ ngọai ngữ Anh/Trung (nếu có)",
    "Hộ chiếu",
    "Ảnh thẻ",
    "Bằng THPT",
    "Học bạ",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc thạc sĩ - Nhóm sinh viên năm cuối": [
    "Giấy xác nhận sinh viên năm cuối bản gốc",
    "Bảng điểm Đại học đến thời điểm nộp hồ sơ bản gốc",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân photo",
    "Hộ chiếu photo (nếu có)",
    "Chứng chỉ ngọai ngữ Anh/Trung (nếu có)",
    "Hộ chiếu",
    "Ảnh thẻ",
    "Bằng THPT",
    "Học bạ",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc thạc sĩ  - Nhóm sinh viên đẫ tốt nghiệp": [
    "Bằng Đại học bản gốc",
    "Bảng điểm Đại học bản gốc",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân photo",
    "Hộ chiếu photo (nếu có)",
    "Chứng chỉ ngọai ngữ Anh/Trung (nếu có)",
    "Hộ chiếu",
    "Ảnh thẻ",
    "Bằng THPT",
    "Học bạ",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc chuyển tiếp": [
    "Giấy xác nhận sinh viên bản gốc",
    "Bảng điểm Đai học đến thời điểm nộp hồ sơ bản gốc",
    "Bằng THPT bản gốc",
    "Học bạ THPT bản gốc",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân photo",
    "Hộ chiếu photo (nếu có)",
    "Chứng chỉ ngọai ngữ Anh/Trung (nếu có)",
    "Hộ chiếu",
    "Ảnh thẻ",
    "Bằng THPT",
    "Học bạ",
    "Bản sao giấy khai sinh",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
    "CV",
  ],
  "Bậc tiến sĩ": [
    "Bằng Thạc sĩ bản gốc",
    "Bảng điểm Thạc sĩ bản gốc",
    "10 ảnh 4x6 nền trắng",
    "Căn cước công dân photo",
    "Hộ chiếu photo (nếu có)",
    "Chứng chỉ ngọai ngữ Anh/Trung (nếu có)",
    "Ảnh thẻ",
    "Hộ chiếu",
    "Bằng Thạc sĩ",
    "Bảng điểm Thạc sĩ",
    "CCCD photo công chứng",
    "Video giới thiệu bản thân",
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

function sanitizePathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function extractFileNameFromUrl(url) {
  if (!url) return "";
  try {
    const decoded = decodeURIComponent(url);
    const cleaned = decoded.split("?")[0];
    const parts = cleaned.split("/");
    return parts[parts.length - 1] || "";
  } catch (e) {
    const cleaned = url.split("?")[0];
    const parts = cleaned.split("/");
    return parts[parts.length - 1] || "";
  }
}

function hasUploadedDoc(docEntry) {
  return !!(docEntry?.url || (docEntry?.name && docEntry.name.trim()));
}

function getFileExtension(name) {
  if (!name) return "";
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase();
}

function parseSizeToBytes(sizeText) {
  if (!sizeText) return 0;
  const match = sizeText.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*(b|kb|mb|gb|tb)$/i);
  if (!match) return 0;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return 0;
  const unit = match[2].toLowerCase();
  const multipliers = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
  return Math.round(value * (multipliers[unit] || 1));
}

function toTimestamp(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN");
}

export default function Step1Form({ user, onLogout }) {
  const API_BASE = "http://localhost:5000/api/student";
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
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isStep1Locked, setIsStep1Locked] = useState(false);
  const [allowStep1Edit, setAllowStep1Edit] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("received");
  const [sortOption, setSortOption] = useState("default");
  const [sampleSrc, setSampleSrc] = useState("");

  const getSampleSrc = (name) => {
    const normalized = (name || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (normalized.includes("can cuoc cong dan photo")) return "/cccd-photo.jpg";
    if (normalized.includes("cccd photo cong chung")) return "/cccd-congchung.jpg";
    if (normalized.includes("anh the")) return "/anh-the.jpg";
    if (normalized.includes("ho chieu")) return "/ho-chieu.jpg";
    if (normalized.includes("bang thpt")) return "/bang-thpt.webp";
    if (normalized.includes("ban sao giay khai sinh")) return "/giay-khai-sinh.jpg";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/profile/${user.id}`);
        const data = await res.json();
        if (data.profile) {
          setFormData((prev) => ({
            ...prev,
            firstName: data.profile.first_name || "",
            lastName: data.profile.last_name || "",
            email: data.profile.email || prev.email,
            phone: data.profile.phone || "",
            birthday: data.profile.birthday || "",
            nationality: data.profile.nationality || "",
            currentLevel: data.profile.current_level || "",
            targetLabel: data.profile.target_label || "",
            address: data.profile.address || "",
          }));
          const hasSavedStep1 =
            !!data.profile.first_name ||
            !!data.profile.last_name ||
            !!data.profile.email ||
            !!data.profile.phone ||
            !!data.profile.target_label;
          setIsStep1Locked(hasSavedStep1);
          setAllowStep1Edit(false);
          const docsMap = {};
          (data.documents || []).forEach((d) => {
            const fileUrl = d.file_name || "";
            const displayName = extractFileNameFromUrl(fileUrl) || fileUrl;
            docsMap[d.doc_name] = {
              name: displayName,
              url: fileUrl,
              size: d.file_size || "",
              sizeBytes: parseSizeToBytes(d.file_size || ""),
              uploadedAt: d.updated_at || d.created_at || "",
              status: d.status || "pending",
              adminFeedback: d.admin_feedback || "",
            };
          });
          setUploadedDocs(docsMap);

          if (data.profile.application_status) {
            setApplicationStatus(data.profile.application_status);
            if (data.profile.application_status === 'fix_required') {
              // Stay in fix required view
              return;
            }
          }

          if (data.profile.is_completed === 1 && data.profile.application_status !== 'fix_required') {
            setIsCompleted(true);
            setCurrentStep(3);
          } else if (data.profile.application_status === 'fix_required') {
            setCurrentStep(0); // We'll render custom view
          } else if ((data.documents || []).length > 0) {
            setCurrentStep(2);
          } else {
            setCurrentStep(1);
          }
        }
      } catch (e) {
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  const goToStep2 = async () => {
    if (isStep1Locked && !allowStep1Edit) {
      setCurrentStep(2);
      return;
    }

    if (!formData.lastName || !formData.firstName || !formData.email || !formData.phone) {
      alert("Vui lòng nhập đầy đủ Họ, Tên, Email và Số điện thoại.");
      return;
    }
    if (!formData.targetLabel) {
      alert("Vui lòng chọn Trình độ bằng cấp mong muốn.");
      return;
    }
    if (!user?.id) {
      alert("Bạn cần đăng nhập lại để lưu thông tin vào hệ thống.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          birthday: formData.birthday,
          nationality: formData.nationality,
          currentLevel: formData.currentLevel,
          targetLabel: formData.targetLabel,
          address: formData.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể lưu thông tin cá nhân.");
      }

      setCurrentStep(2);
      setIsStep1Locked(true);
      setAllowStep1Edit(false);
    } catch (e) {
      alert(e.message || "Lưu thông tin thất bại. Vui lòng thử lại.");
    }
  };

  const handleUpload = async (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
      alert("Bạn cần đăng nhập lại để tải tệp.");
      return;
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert("Chưa cấu hình Cloudinary. Vui lòng kiểm tra file .env.");
      return;
    }
    const sizeBytes = file.size || 0;
    const size = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    const uploadedAt = new Date(file.lastModified || Date.now()).toISOString();
    setUploadingDocs((prev) => ({ ...prev, [key]: true }));
    try {
      const safeDoc = sanitizePathSegment(key);
      const safeName = sanitizePathSegment(file.name) || "tep";
      const publicId = `${Date.now()}_${safeName}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", `student_docs/${user.id}/${safeDoc}`);
      formData.append("public_id", publicId);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || "Không thể tải tệp lên Cloudinary.");
      }
      const url = data.secure_url || "";
      setUploadedDocs((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          url,
          size,
          sizeBytes,
          uploadedAt,
          status: 'pending',
          adminFeedback: '',
        },
      }));
    } catch (err) {
      alert(err.message || "Không thể tải tệp. Vui lòng thử lại.");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteDoc = async (docName) => {
    if (!docName) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tài liệu "${docName}"?`);
    if (!confirmed) return;
    if (!user?.id) {
      alert("Bạn cần đăng nhập lại để xóa tệp.");
      return;
    }
    try {
      const uploaded = uploadedDocs[docName] || {};
      const res = await fetch(`${API_BASE}/documents/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          docName,
          fileUrl: uploaded.url || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Không thể xóa tài liệu.");
      }
      if (data.cloudinaryError) {
        alert(` xóa trong hệ thống nhưng Cloudinary báo lỗi: ${data.cloudinaryError}`);
      }
      setUploadedDocs((prev) => ({
        ...prev,
        [docName]: {
          name: "",
          size: "",
          type: "",
          url: "",
          uploadedAt: "",
        },
      }));
    } catch (err) {
      alert(err.message || "Không thể xóa tài liệu.");
    }
  };


  const displayName =
    (user?.fullName && user.fullName.trim()) ||
    (user?.email ? user.email.split("@")[0] : "Student");
  const accountLabel = user?.role === "student" ? "Tài khỏan sinh viên" : "Tài khoản nhân viên";
  const fullName = `${formData.lastName} ${formData.firstName}`.trim() || displayName;

  const requiredDocs = useMemo(() => {
    const source = TARGET_CHECKLISTS[formData.targetLabel] || [];
    return uniqueDocs(source);
  }, [formData.targetLabel]);
  const displayDocs = useMemo(() => {
    const items = requiredDocs.map((docName, index) => {
      const uploaded = uploadedDocs[docName];
      const isUploaded = hasUploadedDoc(uploaded);
      const sizeBytes = uploaded?.sizeBytes ?? parseSizeToBytes(uploaded?.size || "");
      const fileType = getFileExtension(uploaded?.name || extractFileNameFromUrl(uploaded?.url || ""));
      const uploadedAt = uploaded?.uploadedAt || uploaded?.updatedAt || uploaded?.createdAt || "";
      const uploadedAtTs = toTimestamp(uploadedAt);
      return { docName, index, uploaded, isUploaded, sizeBytes, fileType, uploadedAt, uploadedAtTs };
    });

    items.sort((a, b) => {
      if (sortOption === "default") return a.index - b.index;
      if (sortOption !== "missing" && a.isUploaded !== b.isUploaded) return a.isUploaded ? -1 : 1;

      switch (sortOption) {
        case "missing":
          return (a.isUploaded ? 1 : 0) - (b.isUploaded ? 1 : 0) || a.index - b.index;
        case "size_desc":
          return b.sizeBytes - a.sizeBytes || a.index - b.index;
        case "size_asc":
          return a.sizeBytes - b.sizeBytes || a.index - b.index;
        case "type_asc":
          return a.fileType.localeCompare(b.fileType) || a.index - b.index;
        case "date_desc":
          return b.uploadedAtTs - a.uploadedAtTs || a.index - b.index;
        case "date_asc":
          return a.uploadedAtTs - b.uploadedAtTs || a.index - b.index;
        default:
          return a.index - b.index;
      }
    });

    return items;
  }, [requiredDocs, uploadedDocs, sortOption]);

  const isStep2Complete = requiredDocs.length > 0 && requiredDocs.every((doc) => hasUploadedDoc(uploadedDocs[doc]));
  const missingDocs = requiredDocs.filter((doc) => !hasUploadedDoc(uploadedDocs[doc]));
  const hasStep1Data =
    !!formData.lastName &&
    !!formData.firstName &&
    !!formData.email &&
    !!formData.phone &&
    !!formData.targetLabel;

  const goToStep3 = async () => {
    if (!user?.id) {
      alert("Bạn cần đăng nhập lại để tiếp tục.");
      return;
    }
    try {
      const documents = requiredDocs.map((doc) => ({
        docName: doc,
        fileName: uploadedDocs[doc]?.url || uploadedDocs[doc]?.name || "",
        fileSize: uploadedDocs[doc]?.size || "",
      }));
      const docsRes = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, documents }),
      });
      if (!docsRes.ok) throw new Error("Không thể lưu tài liệu.");
      const completeRes = await fetch(`${API_BASE}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, isCompleted: isStep2Complete ? 1 : 0 }),
      });
      if (!completeRes.ok) throw new Error("Không thể cập nhật trạng thái hồ sơ.");
      setCurrentStep(3);
    } catch (e) {
      alert("Không thể lưu tài liệu. Thử lại.");
    }
  };

  const jumpToStep = (targetStep) => {
    if (targetStep === 1) {
      setCurrentStep(1);
      return;
    }
    if (targetStep === 2) {
      if (!hasStep1Data) {
        alert("Vui lòng hoàn tất thông tin cá nhân trước.");
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (targetStep === 3) {
      if (!hasStep1Data) {
        alert("Vui long hoan tat thong tin ca nhan truoc.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const unlockStep1FromReview = () => {
    setAllowStep1Edit(true);
    setIsStep1Locked(false);
    setCurrentStep(1);
  };

  const handleFinalize = async () => {
    if (!user?.id) {
      alert("Không tìm thấy thông tin người dùng đăng nhập.");
      return;
    }
    if (isFinalizing) return;
    if (!isStep2Complete) {
      alert(`Bạn còn thiếu ${missingDocs.length} tài liệu. Vui lòng tải bổ sung trước khi hoàn tất.`);
      return;
    }
    setIsFinalizing(true);
    try {
      await fetch(`${API_BASE}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isCompleted: 1 }),
      });
      setIsCompleted(true);
      alert("Hồ sơ đã được hoàn tất và lưu vào hệ thống.");
    } catch (e) {
      alert("Không thể hòan tất hồ sơ. Thử lại.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleResubmit = async () => {
    if (!user?.id) return;
    try {
      const documents = requiredDocs.map((doc) => ({
        docName: doc,
        fileName: uploadedDocs[doc]?.url || uploadedDocs[doc]?.name || "",
        fileSize: uploadedDocs[doc]?.size || "",
      }));
      // Save documents first
      await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, documents }),
      });
      // Resubmit profile
      const res = await fetch(`${API_BASE}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Loi gui lại hồ sơ.");
      alert("Đã nộp lại hồ sơ thành công! Hồ sơ hiện đang được xử lý.");
      setApplicationStatus("processing");
    } catch (e) {
      alert("Lỗi khi nộp lại hồ sơ: " + e.message);
    }
  };

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
          cursor: pointer;
          user-select: none;
        }
        .nav-item.active {
          background: #eaf0ff;
          color: #2255d7;
          font-weight: 700;
        }
        .nav-item:hover {
          background: #f3f7ff;
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
          background: #22c55e;
          border-color: #22c55e;
          color: #fff;
        }
        .step-item.done .step-label {
          color: #16a34a;
          font-weight: 600;
        }
        .completion-note {
          margin: 8px 24px 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #16a34a;
          font-weight: 700;
          font-size: 14px;
        }
        .completion-note.warn { color: #b45309; }

        .doc-card.review-success {
          border-style: solid;
          border-color: #86d6a4;
          background: #eafaf1;
        }
        .doc-card.review-warning {
          border-style: solid;
          border-color: #f4b4b4;
          background: #fdecec;
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

        .fix-required-banner {
          background: #fffcf0;
          border: 1px solid #fde047;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .fix-required-banner h4 {
          margin: 0 0 4px;
          color: #a16207;
        }
        .fix-required-banner p {
          margin: 0;
          color: #a16207;
          font-size: 14px;
        }
        .doc-card-rejected {
          border: 1px solid #ef4444 !important;
          background: #fef2f2 !important;
        }
        .doc-card-approved {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .admin-feedback {
          background: #fee2e2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          margin-top: 12px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-approved { color: #15803d; }
        .status-rejected { color: #b91c1c; }
        .status-badge-custom {
          background: #fee2e2;
          color: #b91c1c;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 12px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #fafafa;
        }
        .btn-resubmit {
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 24px;
          float: right;
        }
        .btn-resubmit:disabled {
          background: #93c5fd;
          cursor: not-allowed;
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
        
        .sort-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px 12px;
        }
        .sort-label {
          font-size: 14px;
          color: #4f6386;
          font-weight: 600;
        }
        .sort-select {
          height: 36px;
          border-radius: 10px;
          border: 1px solid #dbe3ef;
          background: #fff;
          padding: 0 10px;
          font-size: 14px;
          color: #1f2a3d;
        }
        .upload-list {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 1100px) {
          .upload-list { grid-template-columns: 1fr; }
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
        .file-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .file-actions-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .btn-delete-doc {
          height: 36px;
          border: 1px solid #f3b4b4;
          border-radius: 10px;
          padding: 0 12px;
          background: #fff5f5;
          color: #b91c1c;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 110px;
          justify-content: center;
        }
        .btn-delete-doc:hover {
          border-color: #ef4444;
          color: #b91c1c;
        }

        .file-name {
          font-size: 15px;
        }
        .file-size {
          font-size: 12px;
          color: #6d80a2;
        }
        .file-meta {
          font-size: 11px;
          color: #6d80a2;
          margin-top: 2px;
        }
        .btn-edit-doc {
          height: 36px;
          border: 1px solid #d7e1f0;
          border-radius: 10px;
          padding: 0 12px;
          background: #fff;
          color: #32517f;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          min-width: 110px;
          justify-content: center;
        }
        .btn-edit-doc:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .btn-download {
          height: 36px;
          border: 1px solid #d7e1f0;
          border-radius: 10px;
          padding: 0 12px;
          background: #f8fbff;
          color: #1d4ed8;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .btn-download:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .btn-edit-doc.disabled,
        .upload-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          height: 42px;
          min-width: 132px;
          border: none;
          border-radius: 21px;
          padding: 0 20px;
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .upload-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn-sample {
          height: 42px;
          min-width: 90px;
          border: 1px dashed #94a3b8;
          border-radius: 21px;
          padding: 0 16px;
          background: #fff;
          color: #1e3a8a;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .btn-sample:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .sample-modal {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .sample-card {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          width: min(520px, 92vw);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
        }
        .sample-card img {
          width: 100%;
          border-radius: 12px;
          display: block;
        }
        .sample-close {
          margin-top: 10px;
          width: 100%;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-weight: 600;
          cursor: pointer;
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
          border-color: #b7e4c7;
          background: #eafaf1;
          flex-direction: column;
          align-items: stretch;
        }
        .doc-card.done .doc-left {
          width: 100%;
        }
        .doc-card.done .file-actions {
          width: 100%;
          flex-wrap: wrap;
        }
        .doc-card.done .file-pill {
          flex: 1;
          min-width: 240px;
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
          <div className="nav-item"><LayoutDashboard size={18} /> Bảng điều khiển</div>
          <div className={`nav-item ${currentStep === 1 ? "active" : ""}`} onClick={() => jumpToStep(1)}><UserCircle size={18} /> Hồ sơ của tôi</div>
          <div className="nav-item"><FileText size={18} /> Đơn ứng tuyển</div>
          <div className={`nav-item ${currentStep === 2 ? "active" : ""}`} onClick={() => jumpToStep(2)}><FolderOpen size={18} /> Tài liệu</div>
          <div className={`nav-item ${currentStep === 3 ? "active" : ""}`} onClick={() => jumpToStep(3)}><ShieldCheck size={18} /> Kiểm tra lại</div>
          <div className="nav-item"><GraduationCap size={18} /> Trường đại học</div>
        </nav>
        <button className="logout" onClick={onLogout}><LogOut size={18} /> Đăng xuất</button>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1>Tạo hồ sơ</h1>
          <div className="header-actions"><div className="notif-btn"><Bell size={20} /><span className="notif-dot"></span></div><div className="header-divider"></div><HelpCircle size={19} /> Tro giup</div>
        </header>

        <div className="content-shell">
          <div className="stepper">
            <div className={`step-item ${currentStep === 1 ? "active" : currentStep > 1 ? "done" : ""}`}>
              <div className="step-circle">{currentStep > 1 ? <Check size={16} /> : "1"}</div>
              <span className="step-label">Thông tin cá nhân</span>
            </div>
            <div className={`step-divider ${currentStep > 1 ? "active" : ""}`}></div>
            <div className={`step-item ${currentStep === 2 ? "active" : (isStep2Complete && currentStep >= 2) ? "done" : ""}`}>
              <div className="step-circle">{(isStep2Complete && currentStep >= 2) ? <Check size={16} /> : "2"}</div>
              <span className="step-label">Tài liệu</span>
            </div>
            <div className={`step-divider ${currentStep > 2 ? "active" : ""}`}></div>
            <div className={`step-item ${currentStep === 3 && !isCompleted ? "active" : isCompleted ? "done" : ""}`}>
              <div className="step-circle">{isCompleted ? <Check size={16} /> : "3"}</div>
              <span className="step-label">{isCompleted ? "Hoàn tất" : "Kiểm tra lại"}</span>
            </div>
          </div>

          {loadingProfile && (
            <section className="form-container">
              <div className="form-title">
                <h2>Đang tải dữ liệu...</h2>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            </section>
          )}

          {!loadingProfile && currentStep === 0 && applicationStatus === 'fix_required' && (
            <section className="form-container">
              <div className="section-header">
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Chỉnh sửa hồ sơ nhập học</h2>
                <span className="status-badge-custom">🕒 Cần sửa đổi</span>
              </div>
              <div style={{ padding: 24 }}>
                <div className="fix-required-banner">
                  <h4>⚠️ Hồ sơ của bạn cần được cập nhật</h4>
                  <p>Vui lòng xem các ghi chú màu đỏ bên dưới từ quản trị viên để hoàn thiện hồ sơ. Các thông tin khác đã được khóa sau khi xác minh.</p>
                </div>

                <div className="form-container" style={{ marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <div className="section-header" style={{ background: '#fff' }}>
                    <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserCircle size={20} color="#2563eb" /> Thông tin cá nhân
                    </h3>
                    <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={14} /> Đã khóa
                    </span>
                  </div>
                  <div className="grid-inputs" style={{ pointerEvents: 'none', opacity: 0.7 }}>
                    <div className="input-box"><label>Họ và tên</label><input value={fullName} readOnly /></div>
                    <div className="input-box"><label>Ngày sinh</label><input value={formData.birthday} readOnly /></div>
                    <div className="input-box"><label>Số điện thoại</label><input value={formData.phone} readOnly /></div>
                    <div className="input-box"><label>Email</label><input value={formData.email} readOnly /></div>
                  </div>
                </div>

                <div className="form-container" style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <div className="section-header" style={{ background: '#fff' }}>
                    <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FolderOpen size={20} color="#2563eb" /> Tài liệu đính kèm
                    </h3>
                  </div>
                  <div className="upload-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {displayDocs.map((item) => {
                      const docName = item.docName;
                      const uploaded = item.uploaded;
                      const isUploaded = item.isUploaded;
                      const status = uploaded?.status || 'pending';
                      const feedback = uploaded?.adminFeedback;
                      const isUploading = uploadingDocs[docName];

                      let cardClass = '';
                      let badge = null;

                      if (status === 'approved') {
                        cardClass = 'doc-card-approved';
                        badge = <span className="status-badge status-approved"><Check size={14} /> Đã xác minh</span>;
                      } else if (status === 'rejected') {
                        cardClass = 'doc-card-rejected';
                        badge = <span className="status-badge status-rejected">• Cần tải lại</span>;
                      } else {
                        badge = <span className="status-badge status-pending">• Đang chờ duyệt</span>;
                      }

                      return (
                        <div className={`doc-card ${cardClass} ${isUploaded ? 'done' : ''}`} key={docName} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="doc-left" style={{ flexDirection: 'row', alignItems: 'center', display: 'flex', gap: 12 }}>
                              <div className="upload-icon" style={{ background: status === 'rejected' ? '#fee2e2' : status === 'approved' ? '#dcfce7' : '#e6eeff', color: status === 'rejected' ? '#ef4444' : status === 'approved' ? '#16a34a' : '#2563eb' }}>
                                <FileText size={20} />
                              </div>
                              <div>
                                <div className="upload-title" style={{ fontSize: 16 }}>{docName}</div>
                                {isUploaded && <div className="upload-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{uploaded.name} {badge}</div>}
                                {!isUploaded && <div className="upload-sub" style={{ color: '#ef4444' }}>Chưa tải lên</div>}
                              </div>
                            </div>

                            {status === 'rejected' || !isUploaded ? (
                              <label className="btn-resubmit" style={{ marginTop: 0, padding: '8px 16px', borderRadius: 20 }}>
                                {isUploading ? 'Đang tải...' : '☁ Tải lên lại'}
                                <input className="upload-hidden" type="file" onChange={(e) => handleUpload(docName, e)} disabled={isUploading} />
                              </label>
                            ) : (
                              <div style={{ color: status === 'approved' ? '#16a34a' : '#94a3b8' }}><Check size={20} /></div>
                            )}
                          </div>

                          {status === 'rejected' && feedback && (
                            <div className="admin-feedback">
                              <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>Phản hồi của Admin:</span> {feedback}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  className="btn-resubmit"
                  onClick={handleResubmit}
                  disabled={displayDocs.some(d => !d.isUploaded || d.uploaded?.status === 'rejected')}
                >
                  Nộp lại hồ sơ
                </button>
                <div style={{ clear: 'both' }}></div>
              </div>
            </section>
          )}

          {!loadingProfile && currentStep === 1 && (
            <section className="form-container">
              <div className="form-title">
                <h2>Thông tin cá nhân</h2>
                <p>Hoàn thiện thông tin cá nhân trước khi tải tài liệu.</p>
              </div>
              <div className="grid-inputs">
                <div className="input-box">
                  <label>Họ</label>
                  <input
                    name="lastName"
                    placeholder="Nguyen"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
                <div className="input-box">
                  <label>Tên</label>
                  <input
                    name="firstName"
                    placeholder="Van A"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
                <div className="input-box">
                  <label>Địa chỉ Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="nguyen.vana@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
                <div className="input-box">
                  <label>Số điện thoại</label>
                  <input
                    name="phone"
                    placeholder="+84 912 345 678"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
                <div className="input-box">
                  <label>Ngày sinh</label>
                  <input
                    name="birthday"
                    placeholder="mm/dd/yyyy"
                    value={formData.birthday}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
                <div className="input-box">
                  <label>Quốc tịch</label>
                  <input
                    name="nationality"
                    placeholder="Nhap quoc tich"
                    value={formData.nationality}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
                <div className="input-box">
                  <label>Trình độ bằng cấp hiện tại</label>
                  <select name="currentLevel" value={formData.currentLevel} onChange={handleChange} disabled={isStep1Locked}>
                    <option value="">Chọn trình độ hiện tại</option>
                    {CURRENT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-chevron" size={16} />
                </div>
                <div className="input-box">
                  <label>Trình độ bằng cấp mong muốn</label>
                  <select name="targetLabel" value={formData.targetLabel} onChange={handleChange} disabled={isStep1Locked}>
                    <option value="">Chọn trình độ mong muốn</option>
                    {TARGET_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-chevron" size={16} />
                </div>
                <div className="input-box full-width">
                  <label>Địa chỉ</label>
                  <input
                    name="address"
                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isStep1Locked}
                  />
                </div>
              </div>

              <div className="form-footer">
                <button className="btn-prev">Quay lại</button>
                <button className="btn-next" onClick={goToStep2}>
                  Tiếp theo <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}


          {!loadingProfile && currentStep === 2 && (
            <section className="form-container">
              <div className="form-title">
                <h2>Tải tài liệu </h2>
                <p></p>
              </div>
              <div className="sort-row">
                <div className="sort-label">Sắp xếp theo</div>
                <select className="sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="default">Mặc định</option>
                  <option value="missing">Hồ sơ chưa nộp </option>
                  <option value="size_desc">Dung lượng : lớn đến bé</option>
                  <option value="size_asc">Dung lượng : bé đến lớn</option>
                  <option value="type_asc">Thứ tự tệp (A-Z)</option>
                  <option value="date_desc">Ngày tải lên : mới nhất</option>
                  <option value="date_asc">Ngày tải lên : cũ nhất</option>
                </select>
              </div>

              <div className="upload-list">
                {displayDocs.map((item, index) => {
                  const docName = item.docName;
                  const uploaded = item.uploaded;
                  const isUploaded = item.isUploaded;
                  const fileType = item.fileType;
                  const uploadedAt = item.uploadedAt;
                  const isUploading = uploadingDocs[docName];
                  const status = uploaded?.status || 'pending';

                  let statusBadge = null;
                  if (isUploaded) {
                    if (status === 'approved') statusBadge = <span className="status-badge status-approved" style={{ fontSize: 11, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Đã duyệt</span>;
                    else if (status === 'rejected') statusBadge = <span className="status-badge" style={{ fontSize: 11, padding: '2px 6px', background: '#fee2e2', color: '#ef4444', borderRadius: 12 }}>Cần bổ sung</span>;
                    else statusBadge = <span className="status-badge status-pending" style={{ fontSize: 11, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Chờ duyệt</span>;
                  }

                  return (
                    <div className={`doc-card ${isUploaded ? "done" : ""}`} key={docName}>
                      <div className="doc-left">
                        <div className="upload-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {index + 1}. {docName} {statusBadge}
                        </div>
                        <div className="upload-sub">Tài liệu theo nhóm đã chọn. {!isUploaded ? "Trạng thái: Thiếu" : "Trạng thái: Đã nộp"}</div>
                      </div>
                      {isUploaded ? (
                        <div className="file-actions">
                          <div className="file-pill">
                            <div className="file-name">{uploaded.name}</div>
                            <div className="file-size">{uploaded.size}</div>
                            <div className="file-meta">Loại: {fileType || "-"} | Ngày: {uploadedAt ? formatDate(uploadedAt) : "-"}</div>
                          </div>
                          {uploaded?.url && (
                            <a className="btn-download" href={uploaded.url} target="_blank" rel="noreferrer">Xem</a>
                          )}
                          <div className="file-actions-col">
                            {status !== 'approved' && (
                              <label className="btn-edit-doc">
                                <Pencil size={14} />
                                Chỉnh sửa
                                <input className="upload-hidden" type="file" onChange={(e) => handleUpload(docName, e)} />
                              </label>
                            )}
                            {status !== 'approved' && (
                              <button type="button" className="btn-delete-doc" onClick={() => handleDeleteDoc(docName)}>Xóa</button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="upload-actions">
                          <label className="upload-btn">
                            Chọn tệp tin
                            <input className="upload-hidden" type="file" onChange={(e) => handleUpload(docName, e)} />
                          </label>
                          {getSampleSrc(docName) && (
                            <button type="button" className="btn-sample" onClick={() => setSampleSrc(getSampleSrc(docName))}>
                              Mẫu
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="form-footer">
                <button className="btn-prev" onClick={() => setCurrentStep(1)}>Quay lại</button>
                <button className="btn-next" onClick={goToStep3}>Tiếp theo <ArrowRight size={18} /></button>
              </div>
            </section>
          )}
          {!loadingProfile && currentStep === 3 && (
            <section className="form-container">
              <div className="form-title">
                <h2>Kiểm tra lại </h2>
                <p>Vui lòng ra sóat toàn bộ thông tin trước khi gửi hồ sơ. </p>
              </div>
              {!isStep2Complete && (
                <div className="completion-note warn">
                  Bạn đang thiếu {missingDocs.length} tài liệu. Vẫn đã lưu tạm vào hệ thống, bạn có thể đăng nhập lại để nộp tiếp.
                </div>
              )}
              {isCompleted && (
                <div className="completion-note">
                  <Check size={16} />
                  Hoàn tất
                </div>
              )}

              <div className="upload-list">
                <div className="doc-card review-success">
                  <div className="doc-left">
                    <div className="upload-title">Thông tin cá nhân</div>
                    <div className="upload-sub">Họ và tên: {fullName}</div>
                    <div className="upload-sub">Email: {formData.email}</div>
                    <div className="upload-sub">Số điện thoại: {formData.phone}</div>
                    <div className="upload-sub">Ngày sinh: {formData.birthday}</div>
                    <div className="upload-sub">Quốc tịch: {formData.nationality}</div>
                    <div className="upload-sub">Địa chỉ: {formData.address}</div>
                    <div className="upload-sub">Bằng cập hiện tại: {formData.currentLevel}</div>
                    <div className="upload-sub">Bằng cấp mong muốn: {formData.targetLabel}</div>
                  </div>
                  <button className="btn-prev" onClick={unlockStep1FromReview}><Pencil size={14} /> Chỉnh sửa</button>
                </div>

                <div className={`doc-card ${isStep2Complete ? "review-success" : "review-warning"}`} >
                  <div className="doc-left">
                    <div className="upload-title">Danh sách tài liệu</div>
                    {requiredDocs.map((doc) => (
                      <div className="upload-sub" key={doc} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {doc}: {hasUploadedDoc(uploadedDocs[doc]) ? (
                          <>
                            {uploadedDocs[doc]?.name}
                            {uploadedDocs[doc]?.status === 'approved' && <span style={{ color: '#16a34a', fontSize: 12, display: 'flex', alignItems: 'center' }}><Check size={12} /> Đã duyệt</span>}
                            {uploadedDocs[doc]?.status === 'rejected' && <span style={{ color: '#ef4444', fontSize: 12 }}>❌ Cần bổ sung</span>}
                            {uploadedDocs[doc]?.status === 'pending' && <span style={{ color: '#d97706', fontSize: 12 }}>⏳ Chờ duyệt</span>}
                          </>
                        ) : "THIẾU"}
                      </div>
                    ))}
                  </div>
                  <button className="btn-prev" onClick={() => setCurrentStep(2)}><Pencil size={14} /> Chỉnh sửa</button>
                </div>
              </div>

              <div className="form-footer">
                <button className="btn-prev" onClick={() => setCurrentStep(2)}>Quay lại</button>
                <button className="btn-next" onClick={handleFinalize} disabled={isFinalizing}>
                  {isFinalizing ? "Đang xử lý..." : "Hồ sơ đã hoàn tất"}
                </button>
              </div>
            </section>
          )}
        </div>
        {sampleSrc && (
          <div className="sample-modal" onClick={() => setSampleSrc("")}>
            <div className="sample-card" onClick={(e) => e.stopPropagation()}>
              <img src={sampleSrc} alt="CCCD sample" />
              <button type="button" className="sample-close" onClick={() => setSampleSrc("")}>Đóng</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}




































