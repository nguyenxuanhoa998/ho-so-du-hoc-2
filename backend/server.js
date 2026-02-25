const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Abc123@', 
    database: 'du_hoc_db'
});

db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('Đã kết nối thành công tới Database: du_hoc_db');
    }
});


app.post('/api/submit-step1', (req, res) => {
    const { fullName, phone, email, level, status, docLinks, allDocs } = req.body;

    const sqlStudent = "INSERT INTO students (full_name, phone, email, level, status) VALUES (?, ?, ?, ?, ?)";
    db.query(sqlStudent, [fullName, phone, email, level, status], (err, result) => {
        if (err) return res.status(500).send("Lỗi lưu sinh viên: " + err.message);

        const studentId = result.insertId;
        const values = allDocs.map(name => {
            const link = docLinks[name] || "";
            const isSubmitted = link && link.trim() !== "" ? 1 : 0;
            return [studentId, name, link, isSubmitted, 1]; // step = 1
        });

        if (values.length === 0) return res.json({ message: "Lưu thành công (chưa có hồ sơ)." });

        const sqlDocs = "INSERT INTO student_documents (student_id, doc_name, file_path, is_submitted, step) VALUES ?";
        db.query(sqlDocs, [values], (errDocs) => {
            if (errDocs) return res.status(500).send("Lỗi lưu checklist: " + errDocs.message);
            res.json({ message: "Khởi tạo hồ sơ Bước 1 thành công!", studentId });
        });
    });
});


app.post('/api/get-student-step2', (req, res) => {
    const { fullName, phone, email } = req.body;
    const sql = "SELECT * FROM students WHERE TRIM(full_name) = TRIM(?) AND TRIM(phone) = TRIM(?) AND TRIM(email) = TRIM(?)";
    
    db.query(sql, [fullName, phone, email], (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (results.length === 0) return res.status(404).send("Thông tin không khớp hoặc sinh viên chưa tồn tại!");

        const student = results[0];
        const sqlDocs = "SELECT doc_name, file_path FROM student_documents WHERE student_id = ? AND step = 1";
        db.query(sqlDocs, [student.id], (errDocs, docs) => {
            if (errDocs) return res.status(500).send(errDocs.message);
            res.json({ student, step1Docs: docs });
        });
    });
});


app.post('/api/submit-step2', (req, res) => {
    const { studentId, docLinks, allDocs } = req.body;

  
    const sqlDelete = "DELETE FROM student_documents WHERE student_id = ? AND step = 2";
    db.query(sqlDelete, [studentId], (errDel) => {
        if (errDel) return res.status(500).send(errDel.message);

        const values = allDocs.map(name => {
            const link = docLinks[name] || "";
            const isSubmitted = link && link.trim() !== "" ? 1 : 0;
            return [studentId, name, link, isSubmitted, 2]; 
        });

        const sqlInsert = "INSERT INTO student_documents (student_id, doc_name, file_path, is_submitted, step) VALUES ?";
        db.query(sqlInsert, [values], (errIn) => {
            if (errIn) return res.status(500).send(errIn.message);
            res.json({ message: "Lưu hồ sơ Bước 2 thành công!" });
        });
    });
});
app.post('/api/get-all-student-docs', (req, res) => {
    const { fullName, phone, email } = req.body;
    const sql = "SELECT * FROM students WHERE TRIM(full_name) = TRIM(?) AND TRIM(phone) = TRIM(?) AND TRIM(email) = TRIM(?)";
    
    db.query(sql, [fullName, phone, email], (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (results.length === 0) return res.status(404).send("Không tìm thấy sinh viên!");

        const student = results[0];
        // Lấy tất cả hồ sơ không phân biệt step
        const sqlDocs = "SELECT doc_name, file_path, step, is_submitted FROM student_documents WHERE student_id = ? ORDER BY step ASC, id ASC";
        db.query(sqlDocs, [student.id], (errDocs, docs) => {
            if (errDocs) return res.status(500).send(errDocs.message);
            res.json({ student, allDocs: docs });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy ổn định tại cổng ${PORT}`);
});