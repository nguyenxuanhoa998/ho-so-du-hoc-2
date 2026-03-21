import { useMemo, useState } from "react";
import "../styles/StudentPortal.css";

const REQUIRED_DOCS = [
    "Hộ chiếu (Passport)",
    "Bằng tốt nghiệp (Degree Certificate)",
    "Bảng điểm (Academic Transcripts)",
    "Ảnh chân dung",
];

const CURRENT_EDUCATION_OPTIONS = [
    "Bậc đai học",
    "Bậc thạc sĩ",
    "Bâc chuyển tiếp",
    "Bậc tiến sĩ",
];

const TARGET_PROGRAM_OPTIONS = [
    "Bậc đai học - Nhóm học sinh lớp 12",
    "Bậc đai học - Nhóm đã tốt nghiệp THPT",
    "Bậc thạc sĩ - Nhóm sinh viên năm cuối",
    "Bậc thạc sĩ - Nhóm sinh viên đã tốt nghiệp",
    "Bâc chuyển tiếp",
    "Bậc tiến sĩ",
];

export default function StudentPortalPage({ user, onLogout }) {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: user?.email || "",
        phone: "",
        birthday: "",
        nationality: "",
        currentEducation: "",
        targetEducation: "",
        address: "",
    });
    const [files, setFiles] = useState([]);

    const isStep1Done = useMemo(() => {
        return profile.firstName && profile.lastName && profile.email && profile.phone;
    }, [profile]);

    const isStep2Done = files.length >= 2;

    const handleProfileChange = (key, value) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    const handleFileUpload = (event, docName) => {
        const selected = event.target.files?.[0];
        if (!selected) return;

        const sizeMb = `${(selected.size / (1024 * 1024)).toFixed(1)} MB`;
        setFiles((prev) => {
            const filtered = prev.filter((f) => f.docName !== docName);
            return [...filtered, { docName, fileName: selected.name, size: sizeMb }];
        });
    };

    const removeFile = (docName) => {
        setFiles((prev) => prev.filter((f) => f.docName !== docName));
    };

    return (
        <div className="portal-root">
            <aside className="portal-sidebar">
                <div className="brand">GlobalStudy</div>
                <div className="user-box">
                    <div className="avatar">A</div>
                    <div>
                        <div className="user-name">{user?.fullName || "Student"}</div>
                        <div className="user-role">Tài khoản sinh viên</div>
                    </div>
                </div>
                <div className="menu-item">Bảng điều khiển</div>
                <div className="menu-item active">Hồ sơ của tôi</div>
                <div className="menu-item">Đơn ứng tuyển</div>
                <div className="menu-item">Tài liệu</div>
                <div className="menu-item">Trung tâm du học</div>
                <button className="logout-btn" onClick={onLogout}>Đăng xuất</button>
            </aside>

            <main className="portal-main">
                <div className="topbar">Tạo hồ sơ</div>

                <section className="stepper">
                    <div className="step-item">
                        <div className={`step ${step >= 1 ? "on" : ""}`}>1</div>
                        <div className="step-label">Thông tin cá nhân</div>
                    </div>
                    <div className={`line ${step >= 2 ? "on" : ""}`}></div>
                    <div className="step-item">
                        <div className={`step ${step >= 2 ? "on" : ""}`}>2</div>
                        <div className="step-label">Tài liệu</div>
                    </div>
                    <div className={`line ${step >= 3 ? "on" : ""}`}></div>
                    <div className="step-item">
                        <div className={`step ${step >= 3 ? "on" : ""}`}>3</div>
                        <div className="step-label">Kiểm tra lại</div>
                    </div>
                </section>

                {step === 1 && (
                    <section className="card">
                        <h2>Thông tin cá nhân</h2>
                        <p>Điền đầy đủ thông tin chi tiết của bạn.</p>
                        <div className="grid2">
                            <input placeholder="Họ" value={profile.firstName} onChange={(e) => handleProfileChange("firstName", e.target.value)} />
                            <input placeholder="Tên" value={profile.lastName} onChange={(e) => handleProfileChange("lastName", e.target.value)} />
                            <input placeholder="Email" value={profile.email} onChange={(e) => handleProfileChange("email", e.target.value)} />
                            <input placeholder="Số điện thọai" value={profile.phone} onChange={(e) => handleProfileChange("phone", e.target.value)} />
                            <input placeholder="Ngày sinh (dd/mm/yyyy)" value={profile.birthday} onChange={(e) => handleProfileChange("birthday", e.target.value)} />
                            <select value={profile.nationality} onChange={(e) => handleProfileChange("nationality", e.target.value)}>
                                <option value="">Chọn quốc tịch</option>
                                <option value="Viêt Nam">Việt Nam</option>
                                <option value="Đài Loan">Đài Loan</option>
                                <option value="Khác">Khác</option>
                            </select>
                            <select value={profile.currentEducation} onChange={(e) => handleProfileChange("currentEducation", e.target.value)}>
                                <option value="">Chọn trình độ hiện tại</option>
                                {CURRENT_EDUCATION_OPTIONS.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                            <select value={profile.targetEducation} onChange={(e) => handleProfileChange("targetEducation", e.target.value)}>
                                <option value="">Chọn trình độ mong muốn</option>
                                {TARGET_PROGRAM_OPTIONS.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <input className="full" placeholder="Dia chi" value={profile.address} onChange={(e) => handleProfileChange("address", e.target.value)} />
                        <div className="actions">
                            <button className="secondary" onClick={() => setStep(1)}>Quay lại</button>
                            <button className="primary" disabled={!isStep1Done} onClick={() => setStep(2)}>Tiếp theo</button>
                        </div>
                    </section>
                )}

                {step === 2 && (
                    <section className="card">
                        <h2>Tải tài liệu</h2>
                        <p>Vui lòng tải lên các tài liệu cần thiết.</p>
                        <div className="docs">
                            {REQUIRED_DOCS.map((doc) => {
                                const file = files.find((f) => f.docName === doc);
                                return (
                                    <div className="doc-item" key={doc}>
                                        <div className="doc-title">{doc}</div>
                                        {!file ? (
                                            <label className="upload">
                                                Chọn tệp tin
                                                <input type="file" onChange={(e) => handleFileUpload(e, doc)} />
                                            </label>
                                        ) : (
                                            <div className="uploaded">
                                                <span>{file.fileName} ({file.size})</span>
                                                <button onClick={() => removeFile(doc)}>Xóa</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="actions">
                            <button className="secondary" onClick={() => setStep(1)}>Quay lại</button>
                            <button className="primary" disabled={!isStep2Done} onClick={() => setStep(3)}>Tiếp theo</button>
                        </div>
                    </section>
                )}

                {step === 3 && (
                    <section className="card">
                        <h2>Kiểm tra lại</h2>
                        <p>Rà soát toàn bộ thông tin trước khi gửi.</p>
                        <div className="review">
                            <div><strong>Họ và tên:</strong> {profile.firstName} {profile.lastName}</div>
                            <div><strong>Email:</strong> {profile.email}</div>
                            <div><strong>Số điện thoại:</strong> {profile.phone}</div>
                            <div><strong>Ngày sinh:</strong> {profile.birthday}</div>
                            <div><strong>Quốc tịch:</strong> {profile.nationality}</div>
                            <div><strong>Địa chỉ:</strong> {profile.address}</div>
                        </div>
                        <h3>Danh sách tài liệu</h3>
                        <div className="review-files">
                            {files.map((f) => (
                                <div key={f.docName}>{f.docName}: {f.fileName} ({f.size})</div>
                            ))}
                        </div>
                        <div className="actions">
                            <button className="secondary" onClick={() => setStep(2)}>Quay lại</button>
                            <button className="primary">Gửi hồ sơ</button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
