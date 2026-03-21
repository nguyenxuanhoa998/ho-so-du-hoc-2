import { useState } from "react";
import "../styles/Login.css";

export default function LoginPage({ onLoginSuccess }) {
    const API_BASE = "http://localhost:5000/api/auth";
    const [role, setRole] = useState("student");
    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const resetFeedback = () => {
        setMessage("");
        setError("");
    };

    const switchMode = (nextMode) => {
        setMode(nextMode);
        resetFeedback();
    };

    const handleSubmit = async () => {
        resetFeedback();

        if (!email || !password || (mode === "register" && !fullName)) {
            setError("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        setLoading(true);
        try {
            const endpoint = mode === "register" ? "register" : "login";
            const payload =
                mode === "register"
                    ? { fullName, email, password, role }
                    : { email, password, role };

            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.message || "Thao tác thất bại.");
                return;
            }

            setMessage(data.message || "Thao tác thành công.");
            if (mode === "register") {
                setMode("login");
                setPassword("");
                setEmail("");
            } else if (data.user && onLoginSuccess) {
                onLoginSuccess(data.user);
            }
        } catch (apiErr) {
            setError("Không thể kết nối server. Vui lòng kiểm tra backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <nav>
                <div className="nav-brand">
                    <div className="nav-logo">TS</div>
                    <span className="nav-brand-text">Taiwan Study Abroad</span>
                </div>

                <div className="nav-links">
                    <a href="#">Trung tâm trợ giúp</a>
                    <a href="#">Liên hệ hỗ trợ</a>
                </div>
            </nav>

            <main>
                <div className="card">
                    <div className="card-head">
                        <h1 className="card-title">
                            {mode === "login" ? "Chào mừng bạn quay lại" : "Tạo tài khoản mới"}
                        </h1>
                        <p className="card-subtitle">
                            {mode === "login"
                                ? "Vui lòng nhập thông tin chi tiết để đăng nhập."
                                : role === "student"
                                    ? "Nhập thông tin để tạo tài khoản. Tài khoản sinh viên sẽ cần được phê duyệt trước khi sử dụng."
                                    : "Nhập thông tin để tạo tài khoản. Tài khoản quản trị sẽ cần được phê duyệt trước khi sử dụng."}
                        </p>
                    </div>

                    <div className="tabs">
                        <button
                            className={`tab ${role === "student" ? "tab--active" : ""}`}
                            onClick={() => setRole("student")}
                        >
                            Sinh viên
                        </button>

                        <button
                            className={`tab ${role === "admin" ? "tab--active" : ""}`}
                            onClick={() => setRole("admin")}
                        >
                            Quản trị viên
                        </button>
                    </div>

                    {mode === "register" && (
                        <p className="auth-message" style={{ marginTop: 12 }}>
                            Tài khoản mới sẽ ở trạng thái chờ phê duyệt. Nếu đăng ký vai trò quản trị viên, bạn cần được cấp quyền trước khi đăng nhập.
                        </p>
                    )}

                    <div className="form">
                        {mode === "register" && (
                            <div className="field">
                                <label>Họ va tên</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nguyen Van A"
                                />
                            </div>
                        )}

                        <div className="field">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={
                                    role === "student"
                                        ? "sinhvien@daihoc.edu.vn"
                                        : "admin@truong.edu.vn"
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu của bạn"
                            />
                        </div>

                        {mode === "login" && (
                            <div className="extras">
                                <label className="checkbox-wrap">
                                    <input type="checkbox" />
                                    <span>Ghi nhớ tôi</span>
                                </label>

                                <a href="#" className="link">
                                    Quên mật khẩu?
                                </a>
                            </div>
                        )}

                        {error && <p className="auth-message auth-error">{error}</p>}
                        {message && <p className="auth-message auth-success">{message}</p>}

                        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading
                                ? mode === "login"
                                    ? "Đang đăng nhập..."
                                    : "Đang tạo tài khỏan..."
                                : mode === "login"
                                    ? "Đăng nhập"
                                    : "Tạo tài khoản"}
                        </button>
                    </div>

                    <div className="card-foot">
                        {mode === "login" ? (
                            <p className="register-line">
                                Bạn chưa có tài khoản?
                                <button className="link link-button" onClick={() => switchMode("register")}>
                                    Đăng ký ngay
                                </button>
                            </p>
                        ) : (
                            <p className="register-line">
                                Bạn đã có tài khoản?
                                <button className="link link-button" onClick={() => switchMode("login")}>
                                    Đăng nhập
                                </button>
                            </p>
                        )}

                        <div className="divider"></div>
                        <div className="ssl-badge">Mã hóa bảo mật SSL</div>
                    </div>
                </div>
            </main>

            <footer>(c) 2026 Study Abroad Systems Inc.</footer>
        </div>
    );
}


