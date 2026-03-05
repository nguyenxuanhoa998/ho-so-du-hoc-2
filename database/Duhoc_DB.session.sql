CREATE DATABASE IF NOT EXISTS du_hoc_db;
USE du_hoc_db;
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    level VARCHAR(100),
    status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student UNIQUE (full_name, phone, email)
);

CREATE TABLE IF NOT EXISTS student_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    doc_name VARCHAR(255) NOT NULL,
    file_path TEXT DEFAULT NULL,       
    is_submitted TINYINT(1) DEFAULT 0, 
    step INT DEFAULT 1,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    password_salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
