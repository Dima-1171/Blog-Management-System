# 📚 Blog Management System

A **console-based blog management application** built with Node.js, Sequelize ORM, and MySQL. Users can register, log in, and manage their own blog posts through an interactive terminal menu. Admins have full control over all users and blogs in the system.

---

## 📋 Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Information](#database-information)
- [Setup Instructions](#setup-instructions)
- [Usage Instructions](#usage-instructions)
- [Project Structure](#project-structure)

---

## 📝 Project Description

The Blog Management System is a CLI (Command-Line Interface) application where:

- **Any reader** can view all published blogs without logging in.
- **Registered users** can log in to create, search, update, and delete their own blog posts.
- **Admins** have elevated access to manage all users and blogs across the entire system.

The application enforces **role-based access control** — a regular user can only modify their own blogs, while a deactivated account is blocked from logging in entirely.

---

## ✨ Features

### 👁️ Reader (No Login Required)
- View all published blogs with author name and content preview

### 👤 Regular User (After Login)
- View all your own blog posts
- Search for a blog by **ID** or **Title** (scoped to your own blogs)
- Create a new blog post with a title, content, and category
- Update your own blog post by ID
- Delete your own blog post by ID

### 🛡️ Admin (After Admin Login)
- View the complete list of all registered users
- View all blogs from all users (with author information)
- Search for any blog by ID or Title across the entire system
- Update any user's `isActive` status or `role`
- Delete any user (automatically deletes all their blogs via cascade)
- Delete any blog post by ID

### 🔒 Security
- Deactivated users (`isActive: false`) are **blocked at login** with the message `"User is deactivated"`
- Ownership is enforced server-side — regular users cannot update or delete another user's blog
- All menu inputs are validated to prevent empty or out-of-range entries

---

## 🛠️ Tech Stack

| Layer       | Technology          |
|-------------|---------------------|
| Runtime     | Node.js (ES Modules)|
| ORM         | Sequelize v6        |
| Database    | MySQL               |
| Config      | dotenv              |

---

## 🗄️ Database Information

### Database Name: `blogdb`

### Table: `users`

| Column      | Type    | Constraints        | Default |
|-------------|---------|--------------------|---------|
| id          | INTEGER | Primary Key, Auto  | —       |
| firstName   | STRING  | NOT NULL           | —       |
| lastName    | STRING  | NOT NULL           | —       |
| email       | STRING  | NOT NULL, Unique   | —       |
| phoneNumber | STRING  | NOT NULL           | —       |
| password    | STRING  | NOT NULL           | —       |
| isActive    | BOOLEAN | —                  | `true`  |
| role        | STRING  | —                  | `user`  |
| createAt    | DATE    | Auto-managed       | —       |
| updateAt    | DATE    | Auto-managed       | —       |

### Table: `blogs`

| Column    | Type    | Constraints              | Default |
|-----------|---------|--------------------------|---------|
| id        | INTEGER | Primary Key, Auto        | —       |
| userId    | INTEGER | FK → users.id, NOT NULL  | —       |
| blogTitle | STRING  | NOT NULL                 | —       |
| blog      | TEXT    | NOT NULL                 | —       |
| category  | STRING  | NOT NULL                 | —       |
| createAt  | DATE    | Auto-managed             | —       |
| updateAt  | DATE    | Auto-managed             | —       |

### Relationship

```
users (1) ──────────── (many) blogs
         [userId FK]
```

- One user can have **many** blogs.
- Each blog belongs to **one** user.
- Deleting a user **cascades** — all their blogs are automatically deleted.

---

## ⚙️ Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://www.mysql.com/) running locally

### Step 1 — Clone the Repository
```bash
git clone <your-repo-url>
cd Blog-Management-System
```

### Step 2 — Install Dependencies
```bash
npm install
```

### Step 3 — Configure the Environment
Create a `.env` file in the project root with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=blogdb
DB_PORT=3306
```

### Step 4 — Create the Database
Open MySQL and run:
```sql
CREATE DATABASE IF NOT EXISTS blogdb;
```
> Tables are created **automatically** on first run via `sequelize.sync({ alter: true })`.

### Step 5 — Run the Application
```bash
node main.js
```

---

## 🚀 Usage Instructions

### Starting the App
When you run `node main.js`, you will see the **Start Menu**:

```
  ──────────────────────────────────────────────────
  📚  Blog Management System
  ──────────────────────────────────────────────────
  1. View All Blogs
  2. Login
  3. Register
  0. Exit
  ──────────────────────────────────────────────────
  Select an option:
```

### Registering a New Account
Choose option `3` and enter your details:
```
  First Name   : John
  Last Name    : Doe
  Email        : john@example.com
  Phone Number : 01712345678
  Password     : secret123
```
All new accounts are created with `role: user` and `isActive: true` by default.

### Logging In
Choose option `2` and enter your email and password. The system will automatically route you to the correct menu based on your role.

### User Menu
```
  1. View Your Blogs
  2. Search Blog by ID / Title
  3. Create Blog
  4. Update Blog
  5. Delete Blog
  0. Logout
```

### Admin Menu
```
  1. View All Users
  2. View All Blogs
  3. Search Blog by ID / Title
  4. Update User
  5. Delete User
  6. Delete Blog
  0. Logout
```

### Creating an Admin Account
All registrations default to `role: user`. To promote a user to admin, either:

**Option A** — Run SQL directly in MySQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

**Option B** — Log in as an existing admin, go to **Update User**, and set the role to `admin`.

### Deactivating a User (Admin only)
Go to **Admin Menu → 4. Update User**, enter the User ID, and type `false` for `isActive`. That user will immediately be blocked from logging in.

---

## 📁 Project Structure

```
Blog-Management-System/
├── .env              # Environment variables (DB credentials) — gitignored
├── .gitignore        # Files excluded from version control
├── db.js             # Sequelize setup, model definitions, and associations
├── index.js          # Service layer — all business logic functions
├── main.js           # CLI entry point — interactive menus and user input
├── package.json      # Project metadata and dependencies
├── package-lock.json # Locked dependency versions
└── README.md         # Project documentation
```

---

## 👤 Author

**Sazia Afrin Dima**

---

## 📌 Project Status

**Status:** CRUD project
