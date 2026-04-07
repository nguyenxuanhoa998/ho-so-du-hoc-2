
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const app = express();
app.use(cors());
app.use(express.json());

const SUPER_ADMIN = {
    fullName: 'System Super Admin',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'admin',
    roleId: 4,
    accountStatus: 'active'
};

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1',
    database: 'du_hoc_db'
});

function dbQuery(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(results);
        });
    });
}


function parseCloudinaryUrl(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length < 4) return null;
        const resourceType = parts[1] || 'image';
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        const after = parts.slice(uploadIndex + 1);
        if (after[0] && after[0].startsWith('v') && after[0].length > 1 && /^v\d+$/.test(after[0])) {
            after.shift();
        }
        const publicIdWithExt = after.join('/');
        if (!publicIdWithExt) return null;
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
        return { resourceType, publicId };
    } catch (e) {
        return null;
    }
}

function scryptHash(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(derivedKey.toString('hex'));
        });
    });
}

async function ensureSecuritySchema() {
    await dbQuery(`
        CREATE TABLE IF NOT EXISTS security_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL UNIQUE,
            description VARCHAR(255) DEFAULT '',
            color VARCHAR(40) DEFAULT 'blue',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await dbQuery(`
        CREATE TABLE IF NOT EXISTS security_access_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            requested_role_id INT NOT NULL,
            request_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP NULL DEFAULT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (requested_role_id) REFERENCES security_roles(id) ON DELETE RESTRICT
        )
    `);

    await dbQuery(`
        CREATE TABLE IF NOT EXISTS security_user_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            resource VARCHAR(80) NOT NULL,
            can_view TINYINT(1) NOT NULL DEFAULT 0,
            can_edit TINYINT(1) NOT NULL DEFAULT 0,
            can_delete TINYINT(1) NOT NULL DEFAULT 0,
            can_approve TINYINT(1) NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_user_resource (user_id, resource),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await dbQuery(
        `
            INSERT INTO security_roles (id, name, description, color) VALUES
                (1, 'Tu van vien', 'Tu van lo trinh va cham soc ho so du hoc.', 'blue'),
                (2, 'Ke toan', 'Theo doi hoc phi, le phi va doi soat thanh toan.', 'purple'),
                (3, 'Xu ly ho so', 'Quan ly giay to, visa va tien do ho so.', 'amber'),
                (4, 'Quan tri he thong', 'Toan quyen cau hinh va phe duyet nghiep vu bao mat.', 'slate'),
                (5, 'Sinh vien', 'Tai khoan hoc sinh can duoc kich hoat truoc khi su dung.', 'blue')
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                color = VALUES(color)
        `
    );
}

async function ensureSuperAdminAccount() {
    const existing = await dbQuery('SELECT id, account_status, role_id FROM users WHERE email = ? LIMIT 1', [SUPER_ADMIN.email]);
    if (existing.length) {
        const adminId = existing[0].id;
        if (existing[0].account_status !== 'active' || existing[0].role_id !== SUPER_ADMIN.roleId) {
            await dbQuery('UPDATE users SET account_status = ?, role_id = ? WHERE id = ?', [
                SUPER_ADMIN.accountStatus,
                SUPER_ADMIN.roleId,
                adminId
            ]);
        }
        return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await scryptHash(SUPER_ADMIN.password, salt);
    await dbQuery(
        `
            INSERT INTO users (full_name, email, role, role_id, account_status, password_salt, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            SUPER_ADMIN.fullName,
            SUPER_ADMIN.email,
            SUPER_ADMIN.role,
            SUPER_ADMIN.roleId,
            SUPER_ADMIN.accountStatus,
            salt,
            passwordHash
        ]
    );
}

db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err.message);
        return;
    }

    console.log('Connected to database: du_hoc_db');

    const ensureUsersTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
            role_id INT NULL,
            account_status ENUM('pending', 'active', 'rejected') NOT NULL DEFAULT 'active',
            password_salt VARCHAR(64) NOT NULL,
            password_hash VARCHAR(128) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(ensureUsersTableSql, (tableErr) => {
        if (tableErr) {
            console.error('Ensure users table error:', tableErr.message);
            return;
        }
        console.log('Users table is ready.');

        const ensureAccountStatusColumnSql = `
            ALTER TABLE users
            ADD COLUMN account_status ENUM('pending', 'active', 'rejected') NOT NULL DEFAULT 'active'
        `;
        db.query(ensureAccountStatusColumnSql, (alterStatusErr) => {
            if (alterStatusErr && alterStatusErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Ensure account_status column error:', alterStatusErr.message);
            }
        });

        const ensureRoleIdColumnSql = `
            ALTER TABLE users
            ADD COLUMN role_id INT NULL
        `;
        db.query(ensureRoleIdColumnSql, (alterRoleErr) => {
            if (alterRoleErr && alterRoleErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Ensure role_id column error:', alterRoleErr.message);
            }
        });
    });

    const ensureProfilesTableSql = `
        CREATE TABLE IF NOT EXISTS student_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            first_name VARCHAR(100) DEFAULT '',
            last_name VARCHAR(100) DEFAULT '',
            email VARCHAR(255) DEFAULT '',
            phone VARCHAR(30) DEFAULT '',
            birthday VARCHAR(50) DEFAULT '',
            nationality VARCHAR(100) DEFAULT '',
            current_level VARCHAR(150) DEFAULT '',
            target_label VARCHAR(255) DEFAULT '',
            assigned_staff_name VARCHAR(255) DEFAULT '',
            address VARCHAR(255) DEFAULT '',
            is_completed TINYINT(1) NOT NULL DEFAULT 0,
            application_status VARCHAR(50) DEFAULT 'received',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    db.query(ensureProfilesTableSql, (profileErr) => {
        if (profileErr) {
            console.error('Ensure student_profiles table error:', profileErr.message);
            return;
        }
        console.log('Student profiles table is ready.');

        const ensureAssignedStaffColumnSql = `
            ALTER TABLE student_profiles
            ADD COLUMN assigned_staff_name VARCHAR(255) DEFAULT ''
        `;
        db.query(ensureAssignedStaffColumnSql, (alterErr) => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Ensure assigned_staff_name column error:', alterErr.message);
            }
        });

        const ensureApplicationStatusColumnSql = `
            ALTER TABLE student_profiles
            ADD COLUMN application_status VARCHAR(50) DEFAULT 'received'
        `;
        db.query(ensureApplicationStatusColumnSql, (alterErr) => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Ensure application_status column error:', alterErr.message);
            }
        });
    });

    const ensureProfileDocsTableSql = `
        CREATE TABLE IF NOT EXISTS student_profile_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            doc_name VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) DEFAULT '',
            file_size VARCHAR(50) DEFAULT '',
            status VARCHAR(50) DEFAULT 'pending',
            admin_feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_profile_docs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    db.query(ensureProfileDocsTableSql, (docsErr) => {
        if (docsErr) {
            console.error('Ensure student_profile_documents table error:', docsErr.message);
            return;
        }
        console.log('Student profile documents table is ready.');

        const ensureDocsStatusColumnSql = `
            ALTER TABLE student_profile_documents
            ADD COLUMN status VARCHAR(50) DEFAULT 'pending',
            ADD COLUMN admin_feedback TEXT
        `;
        db.query(ensureDocsStatusColumnSql, (alterErr) => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Ensure docs status columns error:', alterErr.message);
            }
        });
    });

    const ensureStudentNotesTableSql = `
        CREATE TABLE IF NOT EXISTS student_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            admin_id INT NULL,
            admin_name VARCHAR(255) DEFAULT '',
            admin_role VARCHAR(255) DEFAULT '',
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_student_note_user FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    db.query(ensureStudentNotesTableSql, (notesErr) => {
        if (notesErr) {
            console.error('Ensure student_notes table error:', notesErr.message);
            return;
        }
        console.log('Student notes table is ready.');
    });

    const ensureStatusHistoryTableSql = `
        CREATE TABLE IF NOT EXISTS student_status_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            admin_id INT NULL,
            admin_name VARCHAR(255) DEFAULT '',
            admin_role VARCHAR(255) DEFAULT '',
            status VARCHAR(100) NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_history_user FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    db.query(ensureStatusHistoryTableSql, (err) => {
        if (err) console.error('Ensure student_status_history table error:', err.message);
        else console.log('Student status history table is ready.');
    });

    (async () => {
        try {
            await ensureSecuritySchema();
            await ensureSuperAdminAccount();
            console.log(`Super admin seed is ready: ${SUPER_ADMIN.email}`);
        } catch (bootstrapErr) {
            console.error('Security bootstrap error:', bootstrapErr.message);
        }
    })();
});
app.get('/api/student/profile/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId khong hop le.' });

    const sqlProfile = 'SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1';
    db.query(sqlProfile, [userId], (err, profileRows) => {
        if (err) return res.status(500).json({ message: 'Loi lay profile.', error: err.message });

        const profile = profileRows[0] || null;
        const sqlDocs = `
            SELECT doc_name, file_name, file_size, status, admin_feedback, created_at, updated_at
            FROM student_profile_documents
            WHERE user_id = ?
            ORDER BY id ASC
        `;
        db.query(sqlDocs, [userId], (docsErr, docRows) => {
            if (docsErr) return res.status(500).json({ message: 'Loi lay tai lieu.', error: docsErr.message });
            return res.json({ profile, documents: docRows || [] });
        });
    });
});

app.post('/api/student/profile', (req, res) => {
    const {
        userId,
        firstName = '',
        lastName = '',
        email = '',
        phone = '',
        birthday = '',
        nationality = '',
        currentLevel = '',
        targetLabel = '',
        address = ''
    } = req.body;

    if (!userId) return res.status(400).json({ message: 'Thieu userId.' });

    const sqlCheck = 'SELECT id FROM student_profiles WHERE user_id = ? LIMIT 1';
    db.query(sqlCheck, [userId], (checkErr, checkRows) => {
        if (checkErr) {
            return res.status(500).json({ message: 'Loi kiem tra ho so.', error: checkErr.message });
        }

        if (checkRows.length) {
            const sqlUpdate = `
                UPDATE student_profiles
                SET first_name = ?, last_name = ?, email = ?, phone = ?, birthday = ?, nationality = ?,
                    current_level = ?, target_label = ?, address = ?
                WHERE user_id = ?
            `;
            const updateValues = [
                firstName,
                lastName,
                email,
                phone,
                birthday,
                nationality,
                currentLevel,
                targetLabel,
                address,
                userId
            ];
            db.query(sqlUpdate, updateValues, (err) => {
                if (err) return res.status(500).json({ message: 'Loi cap nhat ho so.', error: err.message });
                return res.json({ message: 'Da cap nhat thong tin ca nhan.' });
            });
            return;
        }

        const sqlInsert = `
            INSERT INTO student_profiles
                (user_id, first_name, last_name, email, phone, birthday, nationality, current_level, target_label, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
            userId,
            firstName,
            lastName,
            email,
            phone,
            birthday,
            nationality,
            currentLevel,
            targetLabel,
            address
        ];
        db.query(sqlInsert, insertValues, (err) => {
            if (err) return res.status(500).json({ message: 'Loi tao ho so.', error: err.message });
            return res.json({ message: 'Da tao ho so sinh vien.' });
        });
    });
});

app.post('/api/student/documents', async (req, res) => {
    const { userId, documents = [] } = req.body;
    if (!userId) return res.status(400).json({ message: 'Thieu userId.' });

    try {
        const existingDocs = await dbQuery('SELECT doc_name, file_name FROM student_profile_documents WHERE user_id = ?', [userId]);
        const existingNames = existingDocs.map(d => d.doc_name);

        for (const doc of documents) {
            // Find if existing doc has the same actual file to skip resetting status,
            // However, we want to reset 'status' to 'pending' if the user updates the document. 
            // In our simple case, if the user sent it, they might have re-uploaded.
            // But if they didn't re-upload, we don't want to reset status to pending.
            const existingDoc = existingDocs.find(d => d.doc_name === doc.docName);
            const isFileChanged = existingDoc ? existingDoc.file_name !== doc.fileName : true;

            if (existingNames.includes(doc.docName)) {
                if (isFileChanged) {
                    await dbQuery(
                        'UPDATE student_profile_documents SET file_name = ?, file_size = ?, status = "pending", admin_feedback = NULL WHERE user_id = ? AND doc_name = ?',
                        [doc.fileName || '', doc.fileSize || '', userId, doc.docName]
                    );
                } else {
                    await dbQuery(
                        'UPDATE student_profile_documents SET file_name = ?, file_size = ? WHERE user_id = ? AND doc_name = ?',
                        [doc.fileName || '', doc.fileSize || '', userId, doc.docName]
                    );
                }
            } else {
                await dbQuery(
                    'INSERT INTO student_profile_documents (user_id, doc_name, file_name, file_size, status) VALUES (?, ?, ?, ?, "pending")',
                    [userId, doc.docName || '', doc.fileName || '', doc.fileSize || '']
                );
            }
        }
        res.json({ message: 'Da luu danh sach tai lieu.' });
    } catch (err) {
        res.status(500).json({ message: 'Loi luu tai lieu.', error: err.message });
    }
});

app.post('/api/student/complete', (req, res) => {
    const { userId, isCompleted = 1 } = req.body;
    if (!userId) return res.status(400).json({ message: 'Thieu userId.' });

    const sql = 'UPDATE student_profiles SET is_completed = ?, application_status = "processing" WHERE user_id = ?';
    db.query(sql, [isCompleted ? 1 : 0, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Loi cap nhat trang thai ho so.', error: err.message });
        return res.json({ message: 'Da cap nhat trang thai hoan tat.' });
    });
});

app.post('/api/student/resubmit', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Thieu userId.' });

    const sql = 'UPDATE student_profiles SET application_status = "processing" WHERE user_id = ?';
    db.query(sql, [userId], (err) => {
        if (err) return res.status(500).json({ message: 'Loi cap nhat trang thai ho so.', error: err.message });
        return res.json({ message: 'Da nop lai ho so thanh cong. Ho so hien dang duoc xu ly.' });
    });
});


app.post('/api/student/documents/delete', async (req, res) => {
    const { userId, docName, fileUrl } = req.body || {};
    const normalizedUserId = Number(userId);
    if (!normalizedUserId || !docName) {
        return res.status(400).json({ message: 'userId va docName la bat buoc.' });
    }

    let cloudinaryError = '';
    if (fileUrl) {
        const info = parseCloudinaryUrl(fileUrl);
        if (info && info.publicId) {
            const typesToTry = info.resourceType ? [info.resourceType, 'raw', 'image', 'video'] : ['raw', 'image', 'video'];
            for (const t of typesToTry) {
                try {
                    const result = await cloudinary.uploader.destroy(info.publicId, { resource_type: t });
                    if (result && result.result && result.result !== 'not found') {
                        cloudinaryError = '';
                        break;
                    }
                } catch (err) {
                    cloudinaryError = err.message || 'Khong the xoa tep tren Cloudinary.';
                }
            }
        }
    }

    const sql = `
        UPDATE student_profile_documents
        SET file_name = '', file_size = '', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND doc_name = ?
        LIMIT 1
    `;
    db.query(sql, [normalizedUserId, docName], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Khong the cap nhat tai lieu.', error: err.message });
        }
        return res.json({ message: 'Da xoa tai lieu.', cloudinaryError });
    });
});

app.get('/api/admin/students', (req, res) => {
    const fullName = (req.query.fullName || '').toString().trim().toLowerCase();
    const phone = (req.query.phone || '').toString().trim();
    const status = (req.query.status || '').toString().trim().toLowerCase();
    const currentLevel = (req.query.currentLevel || '').toString().trim();
    const assignedStaffName = (req.query.assignedStaffName || '').toString().trim();
    const date = (req.query.date || '').toString().trim();
    const checkColumnSql = `
        SELECT COUNT(*) AS count_col
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'student_profiles'
          AND COLUMN_NAME = 'assigned_staff_name'
    `;

    db.query(checkColumnSql, (checkErr, checkRows) => {
        if (checkErr) {
            return res.status(500).json({ message: 'Loi kiem tra cau truc bang.', error: checkErr.message });
        }

        const hasAssignedStaffColumn = Number(checkRows?.[0]?.count_col || 0) > 0;
        const assignedSelect = hasAssignedStaffColumn
            ? "COALESCE(sp.assigned_staff_name, '') AS assigned_staff_name"
            : "'' AS assigned_staff_name";

        const sql = `
            SELECT
                u.id AS user_id,
                u.full_name,
                u.email AS account_email,
                sp.first_name,
                sp.last_name,
                sp.phone,
                sp.current_level,
                ${assignedSelect},
                sp.is_completed,
                sp.updated_at,
                (
                    SELECT COUNT(*)
                    FROM student_profile_documents d
                    WHERE d.user_id = u.id
                      AND TRIM(COALESCE(d.file_name, '')) <> ''
                ) AS document_count
            FROM users u
            INNER JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.role = \'student\'
              AND COALESCE(u.account_status, 'active') = 'active'
              AND (? = '' OR LOWER(TRIM(u.full_name)) LIKE CONCAT('%', ?, '%'))
              AND (? = '' OR TRIM(sp.phone) LIKE CONCAT('%', ?, '%'))
            ORDER BY sp.updated_at DESC, u.id DESC
        `;

        db.query(sql, [fullName, fullName, phone, phone], (err, rows) => {
            if (err) {
                return res.status(500).json({ message: 'Loi lay danh sach sinh vien.', error: err.message });
            }
            let students = (rows || []).map((r) => {
                const documentCount = Number(r.document_count || 0);
                const statusKey = r.is_completed ? 'completed' : (documentCount > 0 ? 'processing' : 'received');
                return {
                    userId: r.user_id,
                    fullName: r.full_name,
                    email: r.account_email,
                    firstName: r.first_name,
                    lastName: r.last_name,
                    phone: r.phone,
                    currentLevel: r.current_level,
                    assignedStaffName: r.assigned_staff_name || '',
                    isCompleted: r.is_completed,
                    documentCount,
                    updatedAt: r.updated_at,
                    statusKey
                };
            });

            if (currentLevel) {
                students = students.filter((s) => (s.currentLevel || '').trim().toLowerCase() === currentLevel.trim().toLowerCase());
            }
            if (assignedStaffName) {
                students = students.filter((s) => (s.assignedStaffName || '').trim().toLowerCase() === assignedStaffName.trim().toLowerCase());
            }
            if (status) {
                students = students.filter((s) => s.statusKey === status);
            }
            if (date) {
                students = students.filter((s) => {
                    if (!s.updatedAt) return false;
                    const d = new Date(s.updatedAt);
                    if (Number.isNaN(d.getTime())) return false;
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}` === date;
                });
            }

            return res.json({ students });
        });
    });
});

app.get('/api/admin/staff-options', (req, res) => {
    const sql = `
        SELECT DISTINCT TRIM(full_name) AS full_name
        FROM users
        WHERE role = 'admin'
          AND COALESCE(account_status, 'active') = 'active'
          AND TRIM(COALESCE(full_name, '')) <> ''
        ORDER BY full_name ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Loi lay danh sach nhan vien.', error: err.message });
        }
        const staffNames = (rows || []).map((r) => r.full_name).filter(Boolean);
        return res.json({ staffNames });
    });
});

app.get('/api/admin/student/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) {
        return res.status(400).json({ message: 'userId khong hop le.' });
    }

    const sqlStudent = `
        SELECT
            u.id AS user_id,
            u.full_name,
            u.email AS account_email,
            sp.first_name,
            sp.last_name,
            sp.email AS profile_email,
            sp.phone,
            sp.birthday,
            sp.nationality,
            sp.current_level,
            sp.target_label,
            sp.assigned_staff_name,
            sp.address,
            sp.is_completed
        FROM users u
        INNER JOIN student_profiles sp ON sp.user_id = u.id
        WHERE u.id = ? AND u.role = \'student\'
          AND COALESCE(u.account_status, 'active') = 'active'
        LIMIT 1
    `;

    db.query(sqlStudent, [userId], (studentErr, studentRows) => {
        if (studentErr) {
            return res.status(500).json({ message: 'Loi lay thong tin sinh vien.', error: studentErr.message });
        }
        if (!studentRows.length) {
            return res.status(404).json({ message: 'Khong tim thay sinh vien.' });
        }

        const s = studentRows[0];
        const sqlDocs = `
            SELECT doc_name, file_name, file_size, created_at, updated_at
            FROM student_profile_documents
            WHERE user_id = ?
            ORDER BY id ASC
        `;
        db.query(sqlDocs, [userId], (docErr, docsRows) => {
            if (docErr) {
                return res.status(500).json({ message: 'Loi lay tai lieu sinh vien.', error: docErr.message });
            }
            return res.json({
                student: {
                    userId: s.user_id,
                    fullName: s.full_name,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    email: s.profile_email || s.account_email,
                    phone: s.phone,
                    birthday: s.birthday,
                    nationality: s.nationality,
                    currentLevel: s.current_level,
                    targetLabel: s.target_label,
                    assignedStaffName: s.assigned_staff_name || '',
                    address: s.address,
                    isCompleted: s.is_completed
                },
                documents: docsRows || []
            });
        });
    });
});

app.post('/api/admin/assign-staff', (req, res) => {
    const { userId, assignedStaffName = '' } = req.body;
    const normalizedUserId = Number(userId);
    if (!normalizedUserId) {
        return res.status(400).json({ message: 'userId khong hop le.' });
    }

    const sql = `
        UPDATE student_profiles
        SET assigned_staff_name = ?
        WHERE user_id = ?
    `;
    db.query(sql, [assignedStaffName.trim(), normalizedUserId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Loi cap nhat nhan vien phu trach.', error: err.message });
        }
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Khong tim thay ho so sinh vien de cap nhat.' });
        }
        return res.json({ message: 'Da cap nhat nhan vien phu trach.' });
    });
});

app.get('/api/admin/student/:userId/notes', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) {
        return res.status(400).json({ message: 'userId khong hop le.' });
    }
    const sql = `
        SELECT id, admin_id, admin_name, admin_role, content, created_at 
        FROM student_notes 
        WHERE student_id = ? 
        ORDER BY created_at DESC
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Loi lay danh sach ghi chu.', error: err.message });
        return res.json({ notes: rows || [] });
    });
});

app.post('/api/admin/student/notes', (req, res) => {
    const { studentId, adminId, adminName, adminRole, content } = req.body;
    if (!studentId || !content) {
        return res.status(400).json({ message: 'Thieu thong tin bat buoc.' });
    }
    const sql = `
        INSERT INTO student_notes (student_id, admin_id, admin_name, admin_role, content) 
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [studentId, adminId || null, adminName || '', adminRole || '', content], (err, result) => {
        if (err) return res.status(500).json({ message: 'Loi luu ghi chu.', error: err.message });
        return res.status(201).json({ 
            message: 'Da luu ghi chu.', 
            note: {
                id: result.insertId,
                student_id: studentId,
                admin_id: adminId || null,
                admin_name: adminName || '',
                admin_role: adminRole || '',
                content,
                created_at: new Date().toISOString()
            }
        });
    });
});
app.post('/api/admin/create-student', async (req, res) => {
    const { fullName, email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!fullName || !normalizedEmail || !password) {
        return res.status(400).json({ message: 'Thieu thong tin dang ky.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Mat khau phai co it nhat 6 ky tu.' });
    }

    try {
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = await scryptHash(password, salt);

        const sql = `
            INSERT INTO users (full_name, email, role, role_id, account_status, password_salt, password_hash)
            VALUES (?, ?, 'student', 5, 'active', ?, ?)
        `;
        db.query(sql, [fullName.trim(), normalizedEmail, salt, passwordHash], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email da ton tai.' });
                }
                return res.status(500).json({ message: 'Khong the tao tai khoan.', error: err.message });
            }

            return res.status(201).json({
                message: 'Tao tai khoan sinh vien thanh cong.',
                user: {
                    id: result.insertId,
                    fullName: fullName.trim(),
                    email: normalizedEmail,
                    role: 'student',
                    accountStatus: 'active'
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Loi xu ly mat khau.', error: error.message });
    }
});


app.post('/api/admin/delete-student', async (req, res) => {
    const { adminId, adminEmail, adminPassword, studentId } = req.body;
    const normalizedStudentId = Number(studentId);
    if (!normalizedStudentId || !adminPassword) {
        return res.status(400).json({ message: 'Thieu thong tin xoa tai khoan.' });
    }

    try {
        const adminSql = adminId
            ? 'SELECT id, role, account_status, password_salt, password_hash FROM users WHERE id = ? AND role = \'admin\' LIMIT 1'
            : 'SELECT id, role, account_status, password_salt, password_hash FROM users WHERE email = ? AND role = \'admin\' LIMIT 1';
        const adminParams = adminId ? [adminId] : [(adminEmail || '').trim().toLowerCase()];
        const adminRows = await dbQuery(adminSql, adminParams);
        if (!adminRows.length) {
            return res.status(401).json({ message: 'Khong tim thay tai khoan admin.' });
        }
        const admin = adminRows[0];
        if (admin.account_status === 'pending') {
            return res.status(403).json({ message: 'Tai khoan admin chua duoc phe duyet.' });
        }
        if (admin.account_status === 'rejected') {
            return res.status(403).json({ message: 'Tai khoan admin bi tu choi.' });
        }

        const inputHash = await scryptHash(adminPassword, admin.password_salt);
        if (inputHash !== admin.password_hash) {
            return res.status(401).json({ message: 'Mat khau admin khong dung.' });
        }

        const studentRows = await dbQuery('SELECT id FROM users WHERE id = ? AND role = \'student\' LIMIT 1', [normalizedStudentId]);
        if (!studentRows.length) {
            return res.status(404).json({ message: 'Khong tim thay tai khoan sinh vien.' });
        }

        await dbQuery('DELETE FROM users WHERE id = ? AND role = \'student\'', [normalizedStudentId]);
        return res.json({ message: 'Da xoa tai khoan sinh vien.' });
    } catch (err) {
        return res.status(500).json({ message: 'Loi xoa tai khoan sinh vien.', error: err.message });
    }
});

app.post('/api/admin/document/approve', async (req, res) => {
    const { userId, docName } = req.body;
    if (!userId || !docName) return res.status(400).json({ message: 'Thiếu thông tin.' });

    try {
        await dbQuery(
            "UPDATE student_profile_documents SET status = 'approved', admin_feedback = '' WHERE user_id = ? AND doc_name = ?",
            [userId, docName]
        );
        res.json({ message: 'Đã phê duyệt tài liệu.' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi phê duyệt.', error: e.message });
    }
});

app.post('/api/admin/document/reject', async (req, res) => {
    const { userId, docName, feedback } = req.body;
    if (!userId || !docName || !feedback) return res.status(400).json({ message: 'Thiếu thông tin hoặc lý do từ chối.' });

    try {
        await dbQuery(
            "UPDATE student_profile_documents SET status = 'rejected', admin_feedback = ? WHERE user_id = ? AND doc_name = ?",
            [feedback, userId, docName]
        );
        res.json({ message: 'Đã từ chối tài liệu.' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi từ chối.', error: e.message });
    }
});

app.post('/api/admin/profile/approve-all', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Thiếu user ID.' });

    try {
        const docs = await dbQuery("SELECT doc_name, status FROM student_profile_documents WHERE user_id = ?", [userId]);
        const rejectedOrPending = docs.filter(d => d.status !== 'approved');
        if (rejectedOrPending.length > 0) {
            return res.status(400).json({ message: 'Không thể phê duyệt toàn bộ vì có tài liệu chưa được duyệt hoặc bị từ chối.' });
        }

        await dbQuery("UPDATE student_profiles SET application_status = 'completed', is_completed = 1 WHERE user_id = ?", [userId]);
        res.json({ message: 'Hồ sơ đã được phê duyệt thành công.' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi phê duyệt hồ sơ.', error: e.message });
    }
});

app.post('/api/admin/profile/request-fix', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Thiếu user ID.' });

    try {
        await dbQuery("UPDATE student_profiles SET application_status = 'fix_required' WHERE user_id = ?", [userId]);
        res.json({ message: 'Đã yêu cầu sinh viên bổ sung hồ sơ.' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi yêu cầu bổ sung.', error: e.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { fullName, email, password, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedRole = role === 'admin' ? 'admin' : 'student';
    const requestedRoleId = normalizedRole === 'admin' ? 4 : 5;

    if (!fullName || !normalizedEmail || !password) {
        return res.status(400).json({ message: 'Thieu thong tin dang ky.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Mat khau phai co it nhat 6 ky tu.' });
    }

    try {
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = await scryptHash(password, salt);

        const sql = `
            INSERT INTO users (full_name, email, role, role_id, account_status, password_salt, password_hash)
            VALUES (?, ?, ?, ?, 'pending', ?, ?)
        `;
        db.query(sql, [fullName.trim(), normalizedEmail, normalizedRole, requestedRoleId, salt, passwordHash], async (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email da ton tai.' });
                }
                return res.status(500).json({ message: 'Khong the tao tai khoan.', error: err.message });
            }

            try {
                await dbQuery(
                    `
                        INSERT INTO security_access_requests (user_id, requested_role_id, request_status)
                        VALUES (?, ?, 'pending')
                    `,
                    [result.insertId, requestedRoleId]
                );

                return res.status(201).json({
                    message: normalizedRole === 'student'
                        ? 'Dang ky thanh cong. Tai khoan sinh vien dang cho phe duyet.'
                        : 'Dang ky thanh cong. Tai khoan quan tri dang cho phe duyet.',
                    user: {
                        id: result.insertId,
                        fullName: fullName.trim(),
                        email: normalizedEmail,
                        role: normalizedRole,
                        accountStatus: 'pending'
                    }
                });
            } catch (securityErr) {
                return res.status(500).json({ message: 'Khong the tao yeu cau phe duyet.', error: securityErr.message });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Loi xu ly mat khau.', error: error.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedRole = role === 'admin' ? 'admin' : 'student';

    if (!normalizedEmail || !password) {
        return res.status(400).json({ message: 'Vui long nhap email va mat khau.' });
    }

    const sql = 'SELECT id, full_name, email, role, role_id, account_status, password_salt, password_hash FROM users WHERE email = ? AND role = ? LIMIT 1';
    db.query(sql, [normalizedEmail, normalizedRole], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Loi truy van dang nhap.', error: err.message });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Email, mat khau hoac vai tro khong dung.' });
        }

        const user = results[0];
        try {
            const inputHash = await scryptHash(password, user.password_salt);
            if (inputHash !== user.password_hash) {
                return res.status(401).json({ message: 'Email, mat khau hoac vai tro khong dung.' });
            }

            if (user.account_status === 'pending') {
                return res.status(403).json({ message: 'Tai khoan cua ban dang cho duoc phe duyet. Vui long lien he quan tri vien.' });
            }

            if (user.account_status === 'rejected') {
                return res.status(403).json({ message: 'Tai khoan cua ban da bi tu choi. Vui long dang ky lai hoac lien he quan tri vien.' });
            }

            return res.json({
                message: 'Dang nhap thanh cong.',
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role,
                    accountStatus: user.account_status
                }
            });
        } catch (hashErr) {
            return res.status(500).json({ message: 'Loi xac thuc mat khau.', error: hashErr.message });
        }
    });
});

app.get('/api/security/pending-requests', (req, res) => {
    const sql = `
        SELECT
            r.id,
            u.full_name AS name,
            u.email,
            sr.name AS requested_role_name,
            r.requested_at
        FROM security_access_requests r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN security_roles sr ON sr.id = r.requested_role_id
        WHERE r.request_status = 'pending'
        ORDER BY r.requested_at DESC, r.id DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Loi lay danh sach phe duyet.', error: err.message });
        }
        const requests = (rows || []).map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            requestedRoleName: row.requested_role_name,
            requestDate: row.requested_at
        }));
        return res.json({ requests });
    });
});

app.post('/api/security/approve', async (req, res) => {
    const { requestId } = req.body;
    const normalizedId = Number(requestId);
    if (!normalizedId) return res.status(400).json({ message: 'requestId khong hop le.' });

    try {
        const requests = await dbQuery(
            'SELECT user_id, requested_role_id FROM security_access_requests WHERE id = ? LIMIT 1',
            [normalizedId]
        );
        if (!requests.length) {
            return res.status(404).json({ message: 'Khong tim thay yeu cau.' });
        }

        const request = requests[0];
        await dbQuery(
            "UPDATE security_access_requests SET request_status = 'approved', reviewed_at = NOW() WHERE id = ?",
            [normalizedId]
        );
        await dbQuery(
            "UPDATE users SET account_status = 'active', role_id = ? WHERE id = ?",
            [request.requested_role_id, request.user_id]
        );

        return res.json({ message: 'Da phe duyet yeu cau.' });
    } catch (err) {
        return res.status(500).json({ message: 'Loi phe duyet yeu cau.', error: err.message });
    }
});

app.post('/api/security/reject', async (req, res) => {
    const { requestId } = req.body;
    const normalizedId = Number(requestId);
    if (!normalizedId) return res.status(400).json({ message: 'requestId khong hop le.' });

    try {
        const requests = await dbQuery(
            'SELECT user_id FROM security_access_requests WHERE id = ? LIMIT 1',
            [normalizedId]
        );
        if (!requests.length) {
            return res.status(404).json({ message: 'Khong tim thay yeu cau.' });
        }

        const request = requests[0];
        await dbQuery(
            "UPDATE security_access_requests SET request_status = 'rejected', reviewed_at = NOW() WHERE id = ?",
            [normalizedId]
        );
        await dbQuery(
            "UPDATE users SET account_status = 'rejected' WHERE id = ?",
            [request.user_id]
        );

        return res.json({ message: 'Da tu choi yeu cau.' });
    } catch (err) {
        return res.status(500).json({ message: 'Loi tu choi yeu cau.', error: err.message });
    }
});

app.get('/api/security/users', (req, res) => {
    const search = (req.query.search || '').toString().trim().toLowerCase();
    const sql = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.role_id,
            sr.name AS role_name
        FROM users u
        LEFT JOIN security_roles sr ON sr.id = u.role_id
        WHERE u.role = 'admin'
          AND COALESCE(u.account_status, 'active') = 'active'
          AND (? = '' OR LOWER(TRIM(u.full_name)) LIKE CONCAT('%', ?, '%') OR LOWER(TRIM(u.email)) LIKE CONCAT('%', ?, '%'))
        ORDER BY u.full_name ASC, u.id ASC
    `;

    db.query(sql, [search, search, search], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi lấy danh sách nhân viên.', error: err.message });
        }
        const users = (rows || []).map((row) => ({
            id: row.id,
            name: row.full_name,
            email: row.email,
            roleId: row.role_id,
            roleName: row.role_name
        }));
        return res.json({ users });
    });
});

app.get('/api/security/permissions/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId khong hop le.' });

    const sql = `
        SELECT resource, can_view, can_edit, can_delete, can_approve
        FROM security_user_permissions
        WHERE user_id = ?
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Loi lay phan quyen.', error: err.message });
        }
        const permissions = (rows || []).map((row) => ({
            resource: row.resource,
            view: !!row.can_view,
            edit: !!row.can_edit,
            delete: !!row.can_delete,
            approve: !!row.can_approve
        }));
        return res.json({ permissions });
    });
});

app.put('/api/security/permissions/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId khong hop le.' });

    const { permissions = [] } = req.body;
    if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Du lieu phan quyen khong hop le.' });
    }

    const sql = `
        INSERT INTO security_user_permissions (user_id, resource, can_view, can_edit, can_delete, can_approve)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            can_view = VALUES(can_view),
            can_edit = VALUES(can_edit),
            can_delete = VALUES(can_delete),
            can_approve = VALUES(can_approve)
    `;

    const updates = permissions.map((p) => {
        const resource = p.resource || '';
        return dbQuery(sql, [
            userId,
            resource,
            p.view ? 1 : 0,
            p.edit ? 1 : 0,
            p.delete ? 1 : 0,
            p.approve ? 1 : 0
        ]);
    });

    Promise.all(updates)
        .then(() => res.json({ message: 'Da cap nhat phan quyen.' }))
        .catch((err) => res.status(500).json({ message: 'Loi cap nhat phan quyen.', error: err.message }));
});

app.get('/api/admin/history/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId khong hop le.' });

    const sql = `
        SELECT * FROM student_status_history 
        WHERE student_id = ? 
        ORDER BY created_at DESC
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Loi lay lich su.', error: err.message });
        res.json({ history: rows || [] });
    });
});

app.post('/api/admin/history', (req, res) => {
    const { userId, adminId, adminName, adminRole, status, note } = req.body;
    if (!userId || !status) return res.status(400).json({ message: 'Thieu thong tin yeu cau.' });

    const sqlUpdate = 'UPDATE student_profiles SET application_status = ? WHERE user_id = ?';
    db.query(sqlUpdate, [status, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Loi cap nhat trang thai profile.', error: err.message });

        const sqlInsert = `
            INSERT INTO student_status_history (student_id, admin_id, admin_name, admin_role, status, note)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sqlInsert, [userId, adminId || null, adminName || '', adminRole || '', status, note || ''], (insertErr) => {
            if (insertErr) return res.status(500).json({ message: 'Loi them lich su.', error: insertErr.message });
            res.json({ message: 'Cập nhật trạng thái và lưu lịch sử thành công!' });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
