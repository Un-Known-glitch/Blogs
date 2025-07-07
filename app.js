const express = require('express');
const { blogs, users } = require('./model/index');
const { where } = require('sequelize');
const bcrypt = require("bcryptjs");
const session = require("express-session");
const requireLogin = require("./middleware/middleware");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// Session middleware (only once!)
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  req.user = req.session.user || null;
  res.locals.currentUser = req.user;
  next();
});
// Make user available in all views
// app.use((req, res, next) => {
//   res.locals.currentUser = req.session.user || null;
//   next();
// });

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.use("/uploads", express.static("uploads"));

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', async (req, res) => {
  const allBlogs = await blogs.findAll({
    include: {
      model:users,
      attributes: ["Username"],
    },
  });
  res.render("blogs", { blogs: allBlogs });
});

app.get('/add', requireLogin, (req, res) => {
  res.render('add');
});

app.post('/add',requireLogin,upload.single("image"), async (req, res) => {
  const { title, subtitle, description } = req.body;
  await blogs.create({
    title,
    subtitle,
    description,
    image: req.file ? req.file.filename : null,
    userId: req.user.id,
  });
  res.redirect('/');
});

app.get("/single/:id", async (req, res) => {
  const id = req.params.id;
  const blog = await blogs.findAll({
    where: { id },
  });
  res.render("singleBlog", { blog });
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  blogs.destroy({ where: { id } });
  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const blog = await blogs.findAll({ where: { id } });
  res.render("editBlog", { blog });
});

app.post("/editBlog/:id", async (req, res) => {
  const id = req.params.id;
  const { title, subtitle, description, image } = req.body;
  await blogs.update(
    { title, subtitle, description, image },
    { where: { id } }
  );
  res.redirect("/single/" + id);
});

// Signup (Login)
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { Username, Email, Password } = req.body;
  const user = await users.findOne({ where: { Username } });

  if (!user) return res.send("User not found");
  const valid = bcrypt.compareSync(Password, user.Password);
  if (!valid) return res.send("Invalid Password");

  req.session.user = {
    id: user.id,
    Username: user.Username,
  };
  res.redirect("/");
});

// Register
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { Username, Email, Password } = req.body;

  await users.create({
    Username,
    Email,
    Password: bcrypt.hashSync(Password, 8),
  });

  res.redirect('/signup');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
