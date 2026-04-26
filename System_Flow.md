# MedTrack System Flow & Architecture

This document outlines the complete architecture, data flow, and technology stack of the MedTrack application.

## 1. Technology Stack

### Front-End (Client Side)
*   **Framework:** Next.js (React)
    *   *Why:* Provides server-side rendering, fast routing, and SEO benefits.
*   **Styling:** Tailwind CSS & Lucide React (for icons)
    *   *Why:* Rapid UI development with utility-first styling.
*   **Networking:** Axios (for HTTP API calls), Socket.io-client (for real-time updates).

### Back-End (Server Side)
*   **Environment:** Node.js with Express.js
    *   *Why:* Scalable runtime environment that's highly suitable for handling asynchronous data and API routing.
*   **Database:** MongoDB & Mongoose
    *   *Why:* NoSQL database, excellent for flexible schema designs (Users, Medicines, Purchases).
*   **Authentication:** JWT, Passport.js, eSewa Integration
    *   *Why:* Secure token-based authentication and secure third-party payment gateway hookups.
*   **Real-time:** Socket.io
    *   *Why:* For live alerts and updates (e.g., verifying immediately if an order's payment gets approved).
*   **File Storage:** Cloudinary & Multer
    *   *Why:* Multer parses incoming file requests, and Cloudinary hosts images (like Medicine pictures/prescriptions) in the cloud securely.
*   **Background Jobs:** node-cron
    *   *Why:* For scheduling repetitive backend tasks (like checking for expired medicines or pruning old unpaid orders).

---

## 2. Core Entities (Database Models)

*   **User / Admin / Pharmacist:** Manages role-based access. Only authorized staff and admins can perform CRUD (Create, Read, Update, Delete) on inventory.
*   **Medicine:** Stores medical inventory details including name, price, stock quantity, and images.
*   **Purchase:** Records transactions linking the Buyer (User) to a Medicine, storing quantities, unit prices, eSewa transaction IDs, and whether a prescription is attached.

---

## 3. High-Level System Flow

### A. Authentication & Access Flow
1.  **User Visits:** A visitor navigates to the MedTrack frontend.
2.  **Signup/Login:** They submit credentials. The Next.js frontend sends an API POST request (via Axios) to the Backend User Routes.
3.  **Token Generation:** The Node.js server validates credentials using `bcrypt` and generates a secure JSON Web Token (JWT).
4.  **Session Establishment:** This token is returned and stored on the frontend to authenticate all subsequent requests. Role-based layouts redirect regular users to stores, and Admins/Staff to the dashboard.

### B. Inventory Management Flow (Staff/Admin)
1.  **Upload:** An Admin adds a new medicine on the frontend dashboard.
2.  **Processing:** The request hits the backend `medicine.route.js`.
3.  **File Hosting:** The backend uses `multer` to intercept the image and delegates uploading it to `Cloudinary`.
4.  **Database Storage:** Once Cloudinary returns a secure image URL, the Node.js server saves the full medicine profile into MongoDB via Mongoose.

### C. Purchase & Payment Flow (eSewa Integration)
1.  **Add to Cart & Checkout:** A user selects a medicine and fills out their shipping details (and uploads a prescription if needed).
2.  **Order Creation:** The frontend sends a purchase request. The backend creates a **Purchase** record in MongoDB marked as `PENDING`.
3.  **Real-Time Subcription:** The frontend uses Socket.io to join an "Order Room" (`socket.join(orderId)`) to listen for real-time state changes about this specific transaction.
4.  **Payment Processing:** The user is redirected to the eSewa gateway to pay using their secure portal.
5.  **Payment Verification:** After payment, eSewa hits a verification success URI on the backend (`payment.route.js`).
6.  **Fulfillment:** The backend verifies the `transactionId` (refId) directly with eSewa. If valid, the database Purchase record is updated to `PAID`.
7.  **Real-Time Notification:** The backend emits a Socket.io event to the specific Order Room. The frontend receives the notification instantly and displays a "Payment Success" pop-up/page.

### D. Automated Maintenance (Cron Jobs)
*   **Background Work:** Behind the scenes, `node-cron` routines execute locally on the Node.js server to routinely check database records. For example, it might email admins about expiring inventories or automatically cancel purchase intents that have been `PENDING` for too long.

---

