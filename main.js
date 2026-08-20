import readline from 'readline';
import { initDB, closeDB } from './db.js';
import {
    login,
    userRegistration,
    allBlog,
    allUsers,
    allUsersBlog,
    getUserBlogs,
    searchBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    updateUser,
    deleteUser,
} from './index.js';

// ─────────────────────────────────────────────
//  READLINE HELPERS
// ─────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/** Prompts the user and returns their trimmed input. */
function ask(question) {
    return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

/**
 * Prompts until the user enters a non-empty value.
 * @param {string} label - e.g. "Blog Title"
 */
async function askRequired(label) {
    let value = '';
    while (!value) {
        value = await ask(`  ${label}: `);
        if (!value) console.log(`  ⚠  ${label} cannot be empty.`);
    }
    return value;
}

/** Prompts for a numeric menu choice. */
async function askChoice(max) {
    const raw = await ask('  Select an option: ');
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 0 || n > max) return null;
    return n;
}

function divider() { console.log('  ' + '─'.repeat(50)); }
function blank()   { console.log(''); }

// ─────────────────────────────────────────────
//  START MENU  (unauthenticated)
// ─────────────────────────────────────────────

async function startMenu() {
    while (true) {
        try {
            blank();
            divider();
            console.log('  📚  Blog Management System');
            divider();
            console.log('  1. View All Blogs');
            console.log('  2. Login');
            console.log('  3. Register');
            console.log('  0. Exit');
            divider();

            const choice = await askChoice(3);

            if (choice === 1) {
                blank();
                await allBlog();

            } else if (choice === 2) {
                const email    = await askRequired('Email');
                const password = await askRequired('Password');
                const user     = await login(email, password);
                if (user) {
                    if (user.role === 'admin') {
                        await adminMenu(user);
                    } else {
                        await userMenu(user);
                    }
                }

            } else if (choice === 3) {
                blank();
                console.log('  — Create an Account —');
                const firstName   = await askRequired('First Name');
                const lastName    = await askRequired('Last Name');
                const email       = await askRequired('Email');
                const phoneNumber = await askRequired('Phone Number');
                const password    = await askRequired('Password');
                await userRegistration(firstName, lastName, email, phoneNumber, password);

            } else if (choice === 0) {
                blank();
                console.log('  Goodbye! 👋');
                blank();
                break;

            } else {
                console.log('  ⚠  Invalid option. Enter a number from the menu.');
            }
        } catch (err) {
            console.error('  ❌  Unexpected error:', err.message);
        }
    }
}

// ─────────────────────────────────────────────
//  USER MENU  (authenticated regular user)
// ─────────────────────────────────────────────

async function userMenu(user) {
    while (true) {
        try {
            blank();
            divider();
            console.log(`  👤  ${user.firstName} ${user.lastName}  (${user.role})`);
            divider();
            console.log('  1. View Your Blogs');
            console.log('  2. Search Blog by ID / Title');
            console.log('  3. Create Blog');
            console.log('  4. Update Blog');
            console.log('  5. Delete Blog');
            console.log('  0. Logout');
            divider();

            const choice = await askChoice(5);

            if (choice === 1) {
                blank();
                await getUserBlogs(user.id);

            } else if (choice === 2) {
                const query = await askRequired('Blog ID or Title');
                blank();
                // Scoped to the current user's blogs only
                await searchBlog(query, user.id);

            } else if (choice === 3) {
                blank();
                console.log('  — New Blog Post —');
                const blogTitle = await askRequired('Blog Title');
                const blog      = await askRequired('Blog Content');
                const category  = await askRequired('Category');
                await createBlog(user.id, blogTitle, blog, category);

            } else if (choice === 4) {
                blank();
                const id = await askRequired('Blog ID to update');
                console.log('  (Leave a field blank to keep it unchanged)');
                const blogTitle = await ask('  New Title    : ');
                const blog      = await ask('  New Content  : ');
                const category  = await ask('  New Category : ');

                const data = {};
                if (blogTitle) data.blogTitle = blogTitle;
                if (blog)      data.blog      = blog;
                if (category)  data.category  = category;

                if (Object.keys(data).length === 0) {
                    console.log('  ⚠  Nothing to update.');
                } else {
                    // Ownership enforced inside updateBlog
                    await updateBlog(id, data, user.id);
                }

            } else if (choice === 5) {
                const id = await askRequired('Blog ID to delete');
                // Ownership enforced inside deleteBlog
                await deleteBlog(id, user.id);

            } else if (choice === 0) {
                console.log(`  Logged out. See you, ${user.firstName}!`);
                break;

            } else {
                console.log('  ⚠  Invalid option. Enter a number from the menu.');
            }
        } catch (err) {
            console.error('  ❌  Unexpected error:', err.message);
        }
    }
}

// ─────────────────────────────────────────────
//  ADMIN MENU  (authenticated admin)
// ─────────────────────────────────────────────

async function adminMenu(user) {
    while (true) {
        try {
            blank();
            divider();
            console.log(`  🛡️   Admin Panel  |  ${user.firstName} ${user.lastName}`);
            divider();
            console.log('  1. View All Users');
            console.log('  2. View All Blogs');
            console.log('  3. Search Blog by ID / Title');
            console.log('  4. Update User');
            console.log('  5. Delete User');
            console.log('  6. Delete Blog');
            console.log('  0. Logout');
            divider();

            const choice = await askChoice(6);

            if (choice === 1) {
                blank();
                await allUsers();

            } else if (choice === 2) {
                blank();
                await allUsersBlog();

            } else if (choice === 3) {
                const query = await askRequired('Blog ID or Title');
                blank();
                // Admin sees all blogs — no userId scoping
                await searchBlog(query, null);

            } else if (choice === 4) {
                blank();
                const id = await askRequired('User ID to update');
                console.log('  (Leave a field blank to keep it unchanged)');
                const isActiveInput = await ask('  Set isActive (true / false / blank): ');
                const roleInput     = await ask('  Set role     (user / admin / blank): ');

                const data = {};
                if (isActiveInput === 'true')  data.isActive = true;
                if (isActiveInput === 'false') data.isActive = false;
                if (roleInput === 'user' || roleInput === 'admin') data.role = roleInput;

                if (Object.keys(data).length === 0) {
                    console.log('  ⚠  Nothing to update.');
                } else {
                    await updateUser(id, data);
                }

            } else if (choice === 5) {
                const id = await askRequired('User ID to delete');
                await deleteUser(id);

            } else if (choice === 6) {
                const id = await askRequired('Blog ID to delete');
                // Admin bypasses ownership check (null userId)
                await deleteBlog(id, null);

            } else if (choice === 0) {
                console.log(`  Logged out. See you, ${user.firstName}!`);
                break;

            } else {
                console.log('  ⚠  Invalid option. Enter a number from the menu.');
            }
        } catch (err) {
            console.error('  ❌  Unexpected error:', err.message);
        }
    }
}

// ─────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────

try {
    await initDB();
    await startMenu();
} catch (err) {
    console.error('  ❌  Fatal error:', err.message);
    process.exit(1);
} finally {
    rl.close();
    await closeDB();
}
