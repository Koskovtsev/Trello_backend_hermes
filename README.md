# Trello Clone — Scalable REST API with Node.js & PostgreSQL
A robust backend implementation for a project management tool, focusing on complex data relations, secure authentication, and high-performance state synchronization for Drag-and-Drop interfaces.

## 🚀 Key Technical Highlights
### 1. Advanced Data Architecture
* **Nested Hierarchy:** Engineered a scalable relational model: `User -> Boards -> Lists -> Cards`.
* **Positional Synchronization:** Implemented logic to handle precise card and list reordering, ensuring data consistency across multiple clients.
* **Dynamic Customization:** Integrated a flexible `custom` JSON-like field for each entity to allow extensible metadata without schema migrations.

### 2. Secure Authentication System
* **JWT Architecture:** Implemented a full-cycle authentication system using **Access Tokens** (short-lived) and **Refresh Tokens** (long-lived).
* **Security First:** Used **bcryptjs** for salted password hashing and secure token rotation to prevent unauthorized access.
* **Middleware Protection:** Developed a custom authentication layer to protect sensitive routes and validate user permissions.

### 3. API Design & Performance
* **Prisma ORM:** Leveraged Prisma for type-safe database queries and efficient migrations.
* **Optimized Responses:** Designed the API to return only necessary data, reducing payload size for faster frontend rendering.
* **Scalable Infrastructure:** Fully compatible with cloud hosting (Render) and serverless databases (Neon PostgreSQL).

## 🛠 Tech Stack
* **Runtime:** Node.js, TypeScript.
* **Framework:** Express.js.
* **Database:** PostgreSQL (via Neon), Prisma ORM.
* **Security:** JSON Web Tokens (JWT), bcryptjs.
* **Dev Tools:** ts-node, dotenv, ESLint.

## 🎯 Key Learnings
* **Database Integrity:** Deeply understood relational constraints and the importance of transactional consistency in project management tools.
* **Auth Workflow:** Mastered the a full-cycle JWT rotation flow, improving both security and user experience.
* **System Design:** Learned how to design an API that supports complex frontend interactions like Drag-and-Drop without creating bottlenecks.
