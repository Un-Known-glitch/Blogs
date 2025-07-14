const express = require('express');
const { blogs, users } = require('./model/index');
const bcrypt = require("bcryptjs");
const session = require("express-session");
const requireLogin = require("./middleware/middleware");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  req.user = req.session.user || null;
  res.locals.currentUser = req.user;
  next();
});

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
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes

app.get('/', async (req, res) => {
  const allBlogs = await blogs.findAll({
    include: {
      model: users,
      attributes: ["Username"],
    },
  });
  res.render("blogs", { blogs: allBlogs });
});

app.get('/add', requireLogin, (req, res) => {
  res.render('add');
});

app.post('/add', requireLogin, upload.single("image"), async (req, res) => {
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
  const blog = await blogs.findAll({ where: { id } });
  res.render("singleBlog", { blog });
});

// Restrict delete to admin only
app.get("/delete/:id", requireLogin, async (req, res) => {
  if (req.user.Username !== "admin") {
    return res.status(403).send("Only admin can delete blogs.");
  }

  const id = req.params.id;
  await blogs.destroy({ where: { id } });
  res.redirect("/");
});

// Restrict edit to admin only
app.get("/edit/:id", requireLogin, async (req, res) => {
  if (req.user.Username !== "admin") {
    return res.status(403).send("Only admin can edit blogs.");
  }

  const id = req.params.id;
  const blog = await blogs.findAll({ where: { id } });
  res.render("editBlog", { blog });
});

app.post("/editBlog/:id", requireLogin, async (req, res) => {
  if (req.user.Username !== "admin") {
    return res.status(403).send("Only admin can update blogs.");
  }

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
  res.render("signup", { error: null });
});

app.post("/signup", async (req, res) => {
  const { Username, Email, Password } = req.body;
  const user = await users.findOne({ where: { Username } });

  if (!user) {
    return res.render("signup", { error: "User not found..." });
  }
  const valid = bcrypt.compareSync(Password, user.Password);
  if (!valid) {
    return res.render("signup", { error: "Invalid Password..." });
  }

  req.session.user = {
    id: user.id,
    Username: user.Username,
  };
  res.redirect("/");
});

// Register with username rules
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { Username, Email, Password } = req.body;

  // Block specific usernames
  const forbiddenUsernames = ["admin", "host", "dev"];
  if (forbiddenUsernames.includes(Username.toLowerCase())) {
    return res.render("register", {
      error: "This username is not allowed. Please choose another.",
    });
  }

  // Prevent duplicates
  const existingUser = await users.findOne({ where: { Username } });
  if (existingUser) {
    return res.render("register", { error: "Username already taken." });
  }

  await users.create({
    Username,
    Email,
    Password: bcrypt.hashSync(Password, 8),
  });

  res.redirect('/signup');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
