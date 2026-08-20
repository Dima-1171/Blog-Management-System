import { User, Blog } from './db.js';
import { Op } from 'sequelize';

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────

/**
 * Register a new user account.
 * Returns the created User, or null if the email is already taken.
 */
export async function userRegistration(firstName, lastName, email, phoneNumber, password) {
    try {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            console.log('  ⚠  Email is already registered.');
            return null;
        }
        const user = await User.create({ firstName, lastName, email, phoneNumber, password });
        console.log(`  ✅  Registered successfully! Welcome, ${user.firstName}.`);
        return user;
    } catch (err) {
        console.error('  ❌  Registration failed:', err.message);
        return null;
    }
}

/**
 * Authenticate a user by email + password.
 * Returns the User object on success, or null on failure.
 * Deactivated accounts are blocked here.
 */
export async function login(email, password) {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('  ⚠  No account found with that email.');
            return null;
        }
        if (!user.isActive) {
            console.log('  ❌  User is deactivated');
            return null;
        }
        if (user.password !== password) {
            console.log('  ⚠  Incorrect password.');
            return null;
        }
        console.log(`  ✅  Login successful! Welcome, ${user.firstName} (${user.role}).`);
        return user;
    } catch (err) {
        console.error('  ❌  Login failed:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────
//  USER MANAGEMENT  (Admin)
// ─────────────────────────────────────────────

/**
 * List all users. Admin only.
 */
export async function allUsers() {
    try {
        const users = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'isActive', 'role', 'createAt'],
            order: [['id', 'ASC']],
        });
        if (users.length === 0) {
            console.log('  No users found.');
            return [];
        }
        console.log('\n' + formatTable(
            users.map(u => u.toJSON()),
            ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'isActive', 'role']
        ));
        return users;
    } catch (err) {
        console.error('  ❌  Failed to fetch users:', err.message);
        return [];
    }
}

export { allUsers as listUsers };

/**
 * Find a user by primary key (id).
 */
export async function searchUser(id) {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            console.log('  User not found.');
            return null;
        }
        console.log(JSON.stringify(user.toJSON(), null, 2));
        return user;
    } catch (err) {
        console.error('  ❌  Search failed:', err.message);
        return null;
    }
}

/**
 * Update a user's fields. Admin only.
 * @param {number} id - User ID
 * @param {object} data - Fields to update (e.g. { isActive: false, role: 'admin' })
 */
export async function updateUser(id, data) {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            console.log('  User not found.');
            return null;
        }
        await user.update(data);
        console.log('  ✅  User updated successfully.');
        return user;
    } catch (err) {
        console.error('  ❌  Update failed:', err.message);
        return null;
    }
}

/**
 * Delete a user by ID. Admin only. Cascades to their blogs.
 */
export async function deleteUser(id) {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            console.log('  User not found.');
            return false;
        }
        await user.destroy();
        console.log(`  ✅  User "${user.firstName} ${user.lastName}" and all their blogs have been deleted.`);
        return true;
    } catch (err) {
        console.error('  ❌  Delete failed:', err.message);
        return false;
    }
}

// ─────────────────────────────────────────────
//  BLOG — READER  (no login required)
// ─────────────────────────────────────────────

/**
 * View all blogs with author info. Available to anyone.
 */
export async function allBlog() {
    try {
        const blogs = await Blog.findAll({
            include: [{
                model: User,
                attributes: ['firstName', 'lastName'],
            }],
            order: [['id', 'ASC']],
        });
        if (blogs.length === 0) {
            console.log('  No blogs available yet.');
            return [];
        }
        blogs.forEach(b => {
            const author = b.User ? `${b.User.firstName} ${b.User.lastName}` : 'Unknown';
            console.log(`\n  [${ b.id }] ${ b.blogTitle }  |  ${ b.category }  |  By: ${ author }  |  ${ formatDate(b.createAt) }`);
            console.log(`       ${ b.blog.slice(0, 120) }${ b.blog.length > 120 ? '...' : '' }`);
        });
        return blogs;
    } catch (err) {
        console.error('  ❌  Failed to fetch blogs:', err.message);
        return [];
    }
}

// ─────────────────────────────────────────────
//  BLOG — USER  (own blogs only)
// ─────────────────────────────────────────────

/**
 * Get all blogs belonging to a specific user.
 * Prints "No blogs are found" if the user has none (per spec).
 */
export async function getUserBlogs(userId) {
    try {
        const blogs = await Blog.findAll({
            where: { userId },
            order: [['id', 'ASC']],
        });
        if (blogs.length === 0) {
            console.log('  No blogs are found');
            return [];
        }
        console.log('');
        blogs.forEach(b =>
            console.log(`  [${b.id}] ${b.blogTitle}  |  ${b.category}  |  ${formatDate(b.createAt)}`)
        );
        return blogs;
    } catch (err) {
        console.error('  ❌  Failed to fetch your blogs:', err.message);
        return [];
    }
}

/**
 * Create a new blog post for the given user.
 */
export async function createBlog(userId, blogTitle, blog, category) {
    try {
        const newBlog = await Blog.create({ userId, blogTitle, blog, category });
        console.log(`  ✅  Blog created: "${newBlog.blogTitle}"`);
        return newBlog;
    } catch (err) {
        console.error('  ❌  Failed to create blog:', err.message);
        return null;
    }
}

/**
 * Search blogs by ID or partial title.
 * If userId is provided, results are scoped to that user's blogs only.
 * @param {string} query
 * @param {number|null} userId - Scope search to a specific user (User journey). Pass null for Admin.
 */
export async function searchBlog(query, userId = null) {
    try {
        const isNumeric = !isNaN(query) && query.trim() !== '' && !isNaN(parseFloat(query));

        let whereClause = isNumeric
            ? { [Op.or]: [{ id: Number(query) }, { blogTitle: { [Op.like]: `%${query}%` } }] }
            : { blogTitle: { [Op.like]: `%${query}%` } };

        // Scope to user's own blogs if userId is provided
        if (userId !== null) {
            whereClause = { ...whereClause, userId };
        }

        const blogs = await Blog.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['firstName', 'lastName'] }],
            order: [['id', 'ASC']],
        });

        if (blogs.length === 0) {
            console.log('  Blog not found.');
            return [];
        }

        blogs.forEach(b => {
            const author = b.User ? `${b.User.firstName} ${b.User.lastName}` : 'Unknown';
            console.log(`\n  [${b.id}] ${b.blogTitle}  |  ${b.category}  |  By: ${author}`);
            console.log(`       ${b.blog}`);
        });
        return blogs;
    } catch (err) {
        console.error('  ❌  Search failed:', err.message);
        return [];
    }
}

/**
 * Update a blog's fields.
 * If userId is provided, enforces ownership — the user can only update their own blogs.
 * @param {number} id - Blog ID
 * @param {object} data - Fields to update
 * @param {number|null} userId - Owner check. Pass null to skip (Admin).
 */
export async function updateBlog(id, data, userId = null) {
    try {
        const blog = await Blog.findByPk(id);
        if (!blog) {
            console.log('  Blog not found.');
            return null;
        }
        // Ownership check for regular users
        if (userId !== null && blog.userId !== userId) {
            console.log('  ⚠  You can only update your own blogs.');
            return null;
        }
        await blog.update(data);
        console.log('  ✅  Blog updated successfully.');
        return blog;
    } catch (err) {
        console.error('  ❌  Update failed:', err.message);
        return null;
    }
}

/**
 * Delete a blog by ID.
 * If userId is provided, enforces ownership — the user can only delete their own blogs.
 * @param {number} id - Blog ID
 * @param {number|null} userId - Owner check. Pass null to skip (Admin).
 */
export async function deleteBlog(id, userId = null) {
    try {
        const blog = await Blog.findByPk(id);
        if (!blog) {
            console.log('  Blog not found.');
            return false;
        }
        // Ownership check for regular users
        if (userId !== null && blog.userId !== userId) {
            console.log('  ⚠  You can only delete your own blogs.');
            return false;
        }
        const title = blog.blogTitle;
        await blog.destroy();
        console.log(`  ✅  Blog "${title}" deleted successfully.`);
        return true;
    } catch (err) {
        console.error('  ❌  Delete failed:', err.message);
        return false;
    }
}

// ─────────────────────────────────────────────
//  BLOG — ADMIN  (all users' blogs)
// ─────────────────────────────────────────────

/**
 * View all blogs from all users, with author info. Admin only.
 */
export async function allUsersBlog() {
    try {
        const blogs = await Blog.findAll({
            include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }],
            order: [['id', 'ASC']],
        });
        if (blogs.length === 0) {
            console.log('  No blogs found.');
            return [];
        }
        blogs.forEach(b => {
            const author = b.User ? `${b.User.firstName} ${b.User.lastName} <${b.User.email}>` : 'Unknown';
            console.log(`\n  [${b.id}] ${b.blogTitle}  |  ${b.category}  |  User ID: ${b.userId}  |  ${author}`);
            console.log(`       ${b.blog.slice(0, 120)}${b.blog.length > 120 ? '...' : ''}`);
        });
        return blogs;
    } catch (err) {
        console.error('  ❌  Failed to fetch blogs:', err.message);
        return [];
    }
}

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

/**
 * Render an array of objects as a plain-text aligned table in the console.
 */
function formatTable(rows, columns) {
    if (!rows.length) return '';
    const widths = columns.map(col =>
        Math.max(col.length, ...rows.map(r => String(r[col] ?? '').length))
    );
    const hr  = '  +' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    const head = '  |' + columns.map((col, i) => ' ' + col.padEnd(widths[i]) + ' |').join('');
    const body = rows.map(row =>
        '  |' + columns.map((col, i) => ' ' + String(row[col] ?? '').padEnd(widths[i]) + ' |').join('')
    ).join('\n');
    return [hr, head, hr, body, hr].join('\n');
}
