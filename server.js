const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('./database');
const fs = require('fs');

const app = express();
const PORT = 5000;

// 1. Cấu hình App
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Cấu hình Session
app.use(session({
    secret: 'mysecretkey123', // Chuỗi bí mật
    resave: false,
    saveUninitialized: false
}));

// Cấu hình Upload (Multer)
// Kiểm tra và tạo thư mục uploads nếu chưa có
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Đặt tên file: thời gian + tên gốc
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware: Kiểm tra đăng nhập
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// --- ROUTES ---

// Trang chủ (Mặc định vào login)
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Đăng ký
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    // Mã hóa mật khẩu
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return res.render('register', { error: 'Tên đăng nhập đã tồn tại!' });
        }
        res.redirect('/login');
    });
});

// Đăng nhập
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
        // Lưu session
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/home');
    });
});

// Home Page (Yêu cầu đăng nhập)
app.get('/home', requireLogin, (req, res) => {
    // Đọc danh sách file đã upload để hiển thị
    fs.readdir(uploadDir, (err, files) => {
        res.render('home', { 
            username: req.session.username,
            files: files || [] 
        });
    });
});

// Xử lý Upload
app.post('/upload', requireLogin, upload.array('myFiles', 10), (req, res) => {
    // upload.array cho phép upload nhiều file hoặc thư mục
    res.redirect('/home');
});

// About & Contact
app.get('/about', requireLogin, (req, res) => res.render('about'));
app.get('/contact', requireLogin, (req, res) => res.render('contact'));

// Đăng xuất
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});