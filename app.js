const express = require('express');
const { blogs, users } = require('./model/index');
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { requireLogin, requireAdmin } = require("./middleware/authmiddleware");
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

// Multer config for file uploads
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
  try {
    const allBlogs = await blogs.findAll({
      include: {
        model: users,
        attributes: ["Username"],
      },
    });
    res.render("blogs", { blogs: allBlogs });
  } catch (err) {
    console.error("Error loading blogs:", err);
    res.status(500).send("Server error");
  }
});

app.get('/add', requireLogin, (req, res) => {
  res.render('add');
});

app.post('/add', requireLogin, upload.single("image"), async (req, res) => {
  try {
    const { title, subtitle, description } = req.body;
    await blogs.create({
      title,
      subtitle,
      description,
      image: req.file ? req.file.filename : null,
      userId: req.user.id,
    });
    res.redirect('/');
  } catch (err) {
    console.error("Error adding blog:", err);
    res.status(500).send("Server error");
  }
});

app.get("/single/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await blogs.findOne({ where: { id } });
    if (!blog) return res.status(404).send("Blog not found");
    res.render("singleBlog", { blog });
  } catch (err) {
    console.error("Error loading single blog:", err);
    res.status(500).send("Server error");
  }
});

// Restrict delete to admin only
app.get("/delete/:id", requireLogin, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await blogs.destroy({ where: { id } });
    if (deleted === 0) {
      return res.status(404).send("Blog not found.");
    }
    res.redirect("/");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Server error.");
  }
});

// Restrict edit to admin only
app.get("/edit/:id", requireLogin, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await blogs.findOne({ where: { id } });
    if (!blog) return res.status(404).send("Blog not found.");
    res.render("editBlog", { blog });
  } catch (err) {
    console.error("Edit get error:", err);
    res.status(500).send("Server error.");
  }
});

app.post("/editBlog/:id", requireLogin, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, subtitle, description, image } = req.body;
    const updated = await blogs.update(
      { title, subtitle, description, image },
      { where: { id } }
    );
    if (updated[0] === 0) {
      return res.status(404).send("Blog not found or no changes made.");
    }
    res.redirect("/single/" + id);
  } catch (err) {
    console.error("Edit post error:", err);
    res.status(500).send("Server error.");
  }
});

// Signup (Login)
app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

app.post("/signup", async (req, res) => {
  try {
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
      isAdmin: user.isAdmin, // add this line
    };
    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

// app.post("/signup", async (req, res) => {
//   try {
//     const { Username, Email, Password } = req.body;
//     const user = await users.findOne({ where: { Username } });

//     if (!user) {
//       return res.render("signup", { error: "User not found..." });
//     }
//     const valid = bcrypt.compareSync(Password, user.Password);
//     if (!valid) {
//       return res.render("signup", { error: "Invalid Password..." });
//     }

//     req.session.user = {
//       id: user.id,
//       Username: user.Username,
//     };
//     res.redirect("/");
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).send("Server error");
//   }
// });

// Register with username rules
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  try {
    const { Username, Email, Password } = req.body;

    // Block specific usernames
    // // const forbiddenUsernames = ["admin", "host", "dev"];
    // if (forbiddenUsernames.includes(Username.toLowerCase())) {
    //   return res.render("register", {
    //     error: "This username is not allowed. Please choose another.",
    //   });
    // }

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
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
