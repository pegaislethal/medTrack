# MedTrack - Pharmacy Management and Medicine Purchase System

MedTrack is a MERN-based pharmacy management and medicine purchase system. It uses MongoDB, Express.js, React/Next.js, and Node.js to manage medicines, staff/admin access, billing, purchases, OTP authentication, email alerts, and Khalti payment verification.

This README is written in a student-friendly way so the full system flow can be understood and explained during a project defence or viva.

---

## 1. Project Overview

MedTrack is a web-based pharmacy and medicine management system. The project helps a pharmacy digitize its daily work such as managing medicine details, stock quantity, expiry dates, sales records, staff accounts, and payment flow.

The backend is built with Node.js, Express.js, and MongoDB using Mongoose models. The frontend is built with Next.js, React, TypeScript, and Tailwind CSS. The application supports secure signup/login with email OTP verification, JWT-based protected APIs, medicine inventory management, billing/cart flow, cash purchase flow, Khalti payment initiation and verification, dashboard analytics, low stock alerts, and expiry alerts.

In the codebase, admins are stored in a separate `Admin` collection. Normal users and pharmacist/staff accounts are stored in the `User` collection. Pharmacist accounts are created and managed by admin through pharmacist routes; there is no separate `Pharmacist` database model. Pharmacist are user for now 

---

## 2. Project Objectives

- Digitize pharmacy and medicine inventory management.
- Allow authenticated users/staff to browse and search medicines.
- Allow users/staff to add medicines to a cart-like billing screen and complete purchases.
- Allow admins/pharmacists to add, update, delete, and monitor medicines.
- Reduce manual inventory mistakes by updating stock through the system.
- Provide secure registration and login using email OTP.
- Protect backend APIs using JWT authentication.
- Support cash purchase and Khalti online payment flow.
- Track purchase history and show dashboard analytics.
- Help pharmacy staff identify low stock and expiring medicines.
- Improve pharmacy workflow using a web-based system.

---

## 3. Main Users / Roles

### User / Customer

A normal user/customer account is stored in the `User` collection. A user can:

- Register using full name, email, and password.
- Verify account registration using email OTP.
- Login using email and password.
- Verify login using email OTP.
- Access protected pages after JWT token is saved in local storage.
- Browse medicine records through authenticated medicine pages.
- Search medicines by name, batch number, or category where supported by the frontend.
- Add medicines to the billing cart on the `/billing` page.
- Enter customer details during checkout.
- Complete a cash purchase.
- Start Khalti payment for one medicine at a time.
- View purchase/sales history through the sales page/API when authenticated.

Important note: The project does not contain a separate persistent `Cart` model or cart API route. The cart on the billing page is handled in frontend state and then converted into purchase/payment API calls.

### Pharmacist / Staff

Pharmacists are handled as `User` records created by the admin from the pharmacist management page. There is no separate pharmacist schema. A pharmacist/staff account can use the authenticated pharmacy workspace to:

- Login securely.
- Access the dashboard.
- View medicines.
- Manage medicine records where the backend allows `admin` or `pharmacist` access.
- Create billing transactions.
- View sales history.
- Check low stock and expiry alerts.

### Admin

Admin users are stored in the separate `Admin` collection. Admin can:

- Register and verify admin account using OTP.
- Login with password and login OTP.
- Access admin/staff dashboard.
- Add, update, and delete medicines.
- Upload medicine images.
- Manage pharmacist/staff users.
- View dashboard metrics such as total medicines, low stock, expiring medicines, revenue, units sold, and orders.
- View recent activities.
- View and delete users through backend admin routes.
- View purchase analytics and purchase history.
- Receive low stock or expiry alert emails when email configuration is enabled.

### Role Handling in This Project

- `Admin` has its own model and admin routes.
- `Pharmacist` is a logical role handled through `User` records managed by admin.
- Medicine management routes allow `admin` and `pharmacist` access.
- Some user-facing pages and staff-facing pages share the same protected dashboard layout.
- Category management is not a separate module; medicine category is stored as a text field in the `Medicine` model.
- Delivery/order status update routes were not found. The current order state is mainly tracked through `paymentStatus` in the `Purchase` model.

---

## 4. Full Project Flow

### Authentication Flow

1. User or admin fills the signup form.
2. Backend validates input.
3. Password is hashed using `bcryptjs`.
4. A 6-digit OTP is generated using `otp-generator`.
5. OTP is stored in the user/admin document.
6. OTP email is sent using the Nodemailer mailer utility.
7. User/admin submits OTP for verification.
8. Backend checks OTP, marks the account as verified, and clears OTP.
9. During login, user/admin submits email and password.
10. Backend compares password with hashed password.
11. Backend sends another OTP for login verification.
12. After successful login OTP verification, backend generates a JWT token.
13. Frontend saves token and user/admin data in `localStorage`.
14. Protected frontend pages check the token before rendering.
15. Protected backend routes require `Authorization: Bearer <token>`.
16. Role-based middleware checks whether the authenticated account can access admin/pharmacist routes.

Forgot password flow:

- User enters email on `/forgot-password`.
- Backend sends OTP and stores it in the user document.
- Frontend shows an OTP step for the user experience.
- After that, frontend sends email and new password to the reset endpoint.
- Backend hashes the new password and updates the account.

Note: In the inspected backend code, the reset password endpoint updates the password using email and new password. The OTP step exists in the frontend flow, while the backend reset endpoint itself does not check an OTP parameter.

### Medicine Browsing Flow

1. Medicines are stored in the `Medicine` collection.
2. Authenticated users fetch medicines using `GET /api/medicines`.
3. Medicine data includes name, batch number, category, manufacturer, quantity, price, expiry date, description, and optional image.
4. Frontend pages filter/search medicines locally after loading them.
5. Medicine details can be viewed from the data shown in the frontend, and a backend single-medicine route also exists.

### Cart and Checkout Flow

1. User/staff opens the `/billing` page.
2. Frontend loads medicines from the backend.
3. User/staff searches medicines and adds items to the cart.
4. Cart quantity cannot exceed available stock in the frontend.
5. Total price is calculated in the frontend.
6. User/staff enters customer details.
7. User/staff selects payment method: Cash or Khalti.
8. For cash purchase, frontend calls `POST /api/medicines/:id/purchase` for each cart item.
9. Backend immediately reduces stock and creates a paid `Purchase` record for cash purchase.
10. For Khalti, frontend currently supports one medicine per payment.
11. Backend creates or reuses a pending purchase and sends a payment initiation request to Khalti.
12. Stock is reduced only after successful Khalti verification.

### Khalti Payment Flow

1. User/staff selects Khalti on the billing checkout modal.
2. Frontend calls `POST /api/payment/khalti/initiate`.
3. Backend validates medicine, quantity, price, buyer, and customer information.
4. Backend creates a pending `Purchase` record with `paymentMethod: "Khalti"` and `paymentStatus: "PENDING"`.
5. Backend calls Khalti initiate API using `KHALTI_SECRET`.
6. Khalti returns `pidx` and `payment_url`.
7. Backend stores `pidx` in the purchase record.
8. Frontend redirects user to Khalti checkout using `payment_url`.
9. After payment, Khalti redirects to `/payment/khalti/callback`.
10. Frontend calls `POST /api/payment/khalti/verify` with `pidx`.
11. Backend calls Khalti lookup API.
12. Backend checks payment status and verifies amount.
13. If payment is completed, backend reduces stock, marks purchase as `PAID`, stores transaction details, and sets `stockReduced: true`.
14. If payment is pending or failed, backend updates payment status accordingly.

Mock/legacy payment note:

- The active Khalti flow verifies payment through the backend lookup API.
- A legacy non-Khalti confirmation route `POST /api/payment/confirm` still exists and can mark a pending order as paid after ownership checks.
- Empty frontend folders named `mock-khalti-payment` and `purchases` exist, but no active `page.tsx` route was found inside them.

### Admin/Pharmacist Flow

1. Admin or pharmacist logs in and completes OTP verification.
2. Frontend stores JWT token and user/admin details.
3. Dashboard loads medicines, purchase history, purchase analytics, and recent activities.
4. Admin/pharmacist can add, edit, or delete medicines.
5. Admin can create, update, view, and delete pharmacist/staff accounts.
6. Billing page supports customer checkout and sales recording.
7. Sales page shows purchase history and date filtering.
8. Alerts page shows low stock, out of stock, expired, and expiring soon medicines.
9. Dashboard report can be exported as PDF using `jsPDF` and `jspdf-autotable`.

---

## 5. Routes Explanation

The backend base route is `/api`. For example, the user register route is `/api/users/register`.

### General Backend Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| GET | `/` | Backend health message | Public |
| GET | `/api/` | API health message | Public |
| GET | `/api/current-user` | Get currently logged-in user from JWT | Authenticated |

### User Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| POST | `/api/users/register` | Register user and send signup OTP | Public |
| POST | `/api/users/verify-otp` | Verify user signup OTP | Public |
| POST | `/api/users/login` | Validate user password and send login OTP | Public |
| POST | `/api/users/verify-login-otp` | Verify login OTP and return JWT token | Public |
| GET | `/api/users/` | Get all users | Authenticated |
| GET | `/api/users/me` | Get logged-in user | Authenticated |
| POST | `/api/users/password-reset/request` | Send password reset OTP email | Public |
| POST | `/api/users/password-reset/reset` | Reset password with email and new password | Public |

### Admin Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| POST | `/api/admin/register` | Register admin and send signup OTP | Public |
| POST | `/api/admin/verify-otp` | Verify admin signup OTP | Public |
| POST | `/api/admin/login` | Validate admin password and send login OTP | Public |
| POST | `/api/admin/verify-login-otp` | Verify admin login OTP and return JWT token | Public |
| GET | `/api/admin/page` | Get all users for admin view | Admin |
| DELETE | `/api/admin/user/:id` | Delete a user by id | Admin |
| GET | `/api/admin/activities` | Get recent purchases and pharmacist creation activity | Admin or Pharmacist |

### Pharmacist Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| POST | `/api/pharmacists/` | Create pharmacist/staff user | Admin |
| GET | `/api/pharmacists/` | Get all pharmacist/staff users | Admin |
| PUT | `/api/pharmacists/:id` | Update pharmacist/staff user | Admin |
| DELETE | `/api/pharmacists/:id` | Delete pharmacist/staff user | Admin |

### Medicine Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| POST | `/api/medicines/` | Add medicine with optional image upload | Admin or Pharmacist |
| GET | `/api/medicines/` | Get all medicines | Authenticated |
| GET | `/api/medicines/analytics/purchases` | Get purchase summary and top medicines | Admin or Pharmacist |
| GET | `/api/medicines/purchases/history` | Get purchase history; supports `fromDate` and `toDate` query filters | Authenticated |
| POST | `/api/medicines/:id/purchase` | Purchase medicine directly, used for cash purchase | Authenticated |
| GET | `/api/medicines/:id` | Get one medicine by id | Authenticated |
| PUT | `/api/medicines/:id` | Update medicine details | Admin or Pharmacist |
| DELETE | `/api/medicines/:id` | Delete medicine and Cloudinary image if available | Admin or Pharmacist |

### Cart Routes

No separate backend cart routes were found.

The cart exists in frontend state inside `/billing`. When checkout is completed, the cart items are sent to medicine purchase or Khalti payment routes.

### Order / Purchase Routes

There is no separate `order.route.js`. Orders are represented by the `Purchase` model.

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| POST | `/api/medicines/:id/purchase` | Create paid purchase and reduce stock for cash flow | Authenticated |
| GET | `/api/medicines/purchases/history` | View purchase/order history | Authenticated |
| GET | `/api/medicines/analytics/purchases` | View purchase/order analytics | Admin or Pharmacist |
| POST | `/api/payment/initiate` | Create pending generic/eSewa-style payment order | Authenticated |
| POST | `/api/payment/confirm` | Confirm legacy non-Khalti payment and mark order paid | Authenticated |
| POST | `/api/payment/khalti/initiate` | Create pending Khalti order and return payment URL | Authenticated |
| POST | `/api/payment/khalti/verify` | Verify Khalti payment and update order/payment status | Authenticated |

### Payment Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| GET | `/api/payment/config` | Get configured payment provider details | Public |
| POST | `/api/payment/initiate` | Initiate generic/eSewa-style payment | Authenticated |
| POST | `/api/payment/confirm` | Confirm legacy non-Khalti payment | Authenticated |
| POST | `/api/payment/khalti/initiate` | Initiate Khalti payment | Authenticated |
| POST | `/api/payment/khalti/verify` | Verify Khalti payment with lookup API | Authenticated |
| GET | `/api/payment/success` | Redirect handler for successful generic payment | Public |
| GET | `/api/payment/failure` | Redirect handler for failed generic payment | Public |

### OTP / Email Routes

| Method | Route | Description | Access |
| ------ | ----- | ----------- | ------ |
| POST | `/api/users/register` | Generates signup OTP for user | Public |
| POST | `/api/users/verify-otp` | Verifies user signup OTP | Public |
| POST | `/api/users/login` | Generates user login OTP after password check | Public |
| POST | `/api/users/verify-login-otp` | Verifies user login OTP | Public |
| POST | `/api/users/password-reset/request` | Generates password reset OTP email | Public |
| POST | `/api/users/password-reset/reset` | Resets user password | Public |
| POST | `/api/admin/register` | Generates signup OTP for admin | Public |
| POST | `/api/admin/verify-otp` | Verifies admin signup OTP | Public |
| POST | `/api/admin/login` | Generates admin login OTP after password check | Public |
| POST | `/api/admin/verify-login-otp` | Verifies admin login OTP | Public |

### Frontend Routes / Pages

This project uses the Next.js App Router. The `(staff)` folder is a route group, so it does not appear in the URL.

| Frontend Path | Page/Component | Purpose |
| ------------- | -------------- | ------- |
| `/` | `app/page.tsx` | Landing page; redirects authenticated users to dashboard |
| `/login` | `app/login/page.tsx` | User login and login OTP verification |
| `/signup` | `app/signup/page.tsx` | User registration and signup OTP verification |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password reset request, OTP step, and new password form |
| `/admin` | `app/admin/page.tsx` | Admin login and admin login OTP verification |
| `/admin/signup` | `app/admin/signup/page.tsx` | Admin registration and signup OTP verification |
| `/admin/profile` | `app/admin/profile/page.tsx` | Admin profile and logout page |
| `/dashboard` | `app/(staff)/dashboard/page.tsx` | Dashboard with inventory stats, analytics, alerts, and PDF report export |
| `/medicines` | `app/(staff)/medicines/page.tsx` | Medicine inventory list, search, add, edit, delete |
| `/billing` | `app/(staff)/billing/page.tsx` | Billing cart, customer details, cash checkout, Khalti checkout |
| `/sales` | `app/(staff)/sales/page.tsx` | Sales/purchase history with search and date filter |
| `/alerts` | `app/(staff)/alerts/page.tsx` | Low stock, out of stock, expired, and expiring medicine alerts |
| `/pharmacists` | `app/(staff)/pharmacists/page.tsx` | Admin page to manage pharmacist/staff users |
| `/payment/khalti/callback` | `app/payment/khalti/callback/page.tsx` | Khalti callback verification page |
| `/payment-success` | `app/payment-success/page.tsx` | Payment success/verification result page |
| `/payment-failed` | `app/payment-failed/page.tsx` | Payment failure result page |

---

## 6. Database Models / Collections

### User Model

File: `back-end/models/user.model.js`

Purpose:

- Stores normal users/customers.
- Also stores pharmacist/staff accounts created by admin.

Important fields:

- `fullname`: user full name.
- `email`: unique email.
- `password`: hashed password.
- `confirm_password`: optional field in schema.
- `otp`: OTP used for registration, login, or password reset flow.
- `isVerified`: tells whether email verification is completed.
- `profilePicture`: optional Cloudinary-style image object with `public_id` and `url`.
- `createdAt`, `updatedAt`: automatic timestamps.

Relationships:

- `Purchase.buyer` references `User`.
- Pharmacist/staff users are also stored here.

### Admin Model

File: `back-end/models/admin.model.js`

Purpose:

- Stores admin accounts separately from normal users.

Important fields:

- `fullname`: admin full name.
- `email`: unique admin email.
- `password`: hashed password.
- `otp`: OTP for admin registration/login verification.
- `isVerified`: tells whether admin email verification is completed.
- `role`: enum value, currently `admin`.
- `createdAt`, `updatedAt`: automatic timestamps.

Relationships:

- `Medicine.createdBy` references `Admin` in the schema.
- Admin can manage users, pharmacists, medicines, and dashboard data.

### Medicine Model

File: `back-end/models/medicine.model.js`

Purpose:

- Stores medicine inventory records.

Important fields:

- `medicineName`: name of medicine.
- `batchNumber`: unique batch number.
- `category`: category text.
- `manufacturer`: manufacturer name.
- `quantity`: available stock.
- `price`: medicine price.
- `expiryDate`: expiry date.
- `description`: optional description.
- `image`: optional image object with `public_id` and `url`.
- `createdBy`: reference to admin/staff id.
- `createdAt`, `updatedAt`: automatic timestamps.

Relationships:

- `Purchase.medicine` references `Medicine`.
- Stock quantity is reduced during cash purchase or after successful Khalti payment verification.

### Purchase Model

File: `back-end/models/purchase.model.js`

Purpose:

- Stores purchase/order records and payment information.
- Works as the order collection for the project.

Important fields:

- `medicine`: reference to purchased medicine.
- `buyer`: reference to user/customer.
- `quantity`: purchased quantity.
- `unitPrice`: price per medicine.
- `totalPrice`: total order amount in rupees.
- `totalAmount`: payment gateway amount, used especially for Khalti.
- `orderId`: unique order id.
- `paymentMethod`: default `ESEWA`, can also be `Khalti`.
- `paymentStatus`: `PENDING`, `PAID`, or `FAILED`.
- `transactionId`: payment transaction reference.
- `pidx`: Khalti payment identifier.
- `khaltiStatus`: status returned by Khalti.
- `paidAt`: payment completion date.
- `stockReduced`: prevents stock from being reduced more than once.
- `customerName`, `customerAddress`, `customerPhone`, `prescription`: checkout customer details.
- `createdAt`, `updatedAt`: automatic timestamps.

Relationships:

- References `Medicine`.
- References `User` as buyer.


### Payment Model

No separate payment model was found. Payment fields are stored inside the `Purchase` model.

### OTP / Reset Token Storage

No separate OTP model was found. OTP values are stored in:

- `User.otp`
- `Admin.otp`

---

## 7. Packages Used

### Backend Packages

From `back-end/package.json`:

| Package | Purpose in Project |
| ------- | ------------------ |
| `express` | Creates backend API server and routes |
| `mongoose` | Defines models and interacts with MongoDB |
| `mongodb` | MongoDB driver package available alongside Mongoose |
| `dotenv` | Loads environment variables from `.env` |
| `cors` | Allows frontend and backend communication |
| `bcryptjs` | Hashes and compares passwords |
| `jsonwebtoken` | Creates and verifies JWT authentication tokens |
| `http-status-codes` | Provides readable HTTP status constants |
| `zod` | Validates signup request data |
| `otp-generator` | Generates numeric OTP codes |
| `nodemailer` | Sends OTP, login, password reset, low stock, and expiry emails |
| `multer` | Handles medicine image upload files |
| `cloudinary` | Stores medicine images in cloud storage |
| `axios` | Sends external HTTP requests to Khalti APIs |
| `node-cron` | Runs scheduled expiry alert checks |
| `socket.io` | Backend real-time event setup for payment, stock, and analytics updates |
| `uuid` | Installed for unique id generation, although payment controller currently uses Node `crypto.randomUUID()` |
| `crypto` | Listed in package.json; Node's built-in `crypto` is used for `randomUUID()` |
| `path` | Listed in package.json; Node's built-in `path` is used for file paths |
| `body-parser` | Installed, but current backend uses Express built-in JSON/urlencoded middleware |
| `express-session` | Installed for session support; no active session route was found in inspected code |
| `passport` | Installed for authentication strategies; no active Passport route was found in inspected code |
| `passport-google-oauth20` | Installed for possible Google OAuth support; no active Google OAuth route was found |
| `swagger-jsdoc` | Installed for API documentation generation; no active Swagger setup was found in inspected routes |
| `swagger-ui-express` | Installed for serving Swagger UI; no active Swagger route was found |

Backend scripts:

| Script | Command | Purpose |
| ------ | ------- | ------- |
| `npm run dev` | `nodemon index.js` | Start backend in development |
| `npm start` | `node index.js` | Start backend normally |
| `npm test` | placeholder | No real automated test script is configured |

### Frontend Packages

From `front-end/medtrack/package.json`:

| Package | Purpose in Project |
| ------- | ------------------ |
| `next` | Next.js framework for React frontend and app routing |
| `react` | Builds frontend UI components |
| `react-dom` | Renders React components in the browser |
| `typescript` | Adds static typing to frontend code |
| `tailwindcss` | Styling framework used through global CSS/Tailwind classes |
| `@tailwindcss/postcss` | Tailwind PostCSS integration |
| `lucide-react` | Provides icons used in dashboard, sidebar, tables, and buttons |
| `recharts` | Builds dashboard charts such as sales analytics and top medicines |
| `jspdf` | Generates PDF reports from the dashboard |
| `jspdf-autotable` | Creates tables inside exported PDF reports |
| `socket.io-client` | Client package for real-time socket connection; socket helper exists in `lib/socket.ts` |
| `axios` | Installed for API calls, although current frontend services mainly use `fetch` |
| `uuid` | Installed for unique id support; no direct frontend usage was found in inspected files |
| `eslint` | Linting tool |
| `eslint-config-next` | Next.js ESLint configuration |
| `@types/node` | TypeScript types for Node.js |
| `@types/react` | TypeScript types for React |
| `@types/react-dom` | TypeScript types for React DOM |
| `@types/jspdf` | TypeScript types for jsPDF |
| `baseline-browser-mapping` | Browser compatibility-related package in the frontend dependency tree |

Frontend scripts:

| Script | Command | Purpose |
| ------ | ------- | ------- |
| `npm run dev` | `next dev` | Start frontend development server |
| `npm run build` | `next build` | Build production frontend |
| `npm start` | `next start` | Run built frontend |
| `npm run lint` | `eslint` | Run linting |

---

## 8. Environment Variables

Do not expose real secret values in public repositories. Use placeholders in `.env` files and set real values only in local development or deployment dashboards.

### Backend Environment Variables

The backend reads these variables:

| Variable | Purpose |
| -------- | ------- |
| `PORT` | Backend server port, default is `5000` |
| `MONGODB_URI` | MongoDB connection string used by Mongoose |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `FRONTEND_URL` | Frontend URL used for CORS and payment redirects |
| `CORS_ORIGINS` | Extra comma-separated allowed frontend origins |
| `NODE_MAILER_EMAIL` | Email account used by Nodemailer |
| `NODE_MAILER_PASSWORD` | Email app password used by Nodemailer |
| `MAILER_ENABLED` | Optional flag to enable/disable mailer |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image upload |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PAYMENT_GATEWAY` | Generic payment provider name, default logic uses `ESEWA` |
| `ESEWA_MERCHANT_CODE` | Merchant code for generic/eSewa-style payment flow |
| `ESEWA_CHECKOUT_URL` | Checkout URL for generic/eSewa-style payment flow |
| `KHALTI_SECRET` | Khalti secret key used by backend payment initiation and lookup |
| `VERCEL` | Used to avoid starting the server manually in Vercel/serverless mode |

Variables present in example files but not actively referenced in inspected backend code:

| Variable | Note |
| -------- | ---- |
| `BACKEND_URL` | Useful for deployment notes, but not directly read by current backend code |
| `KHALTI_PUBLIC` | Public key placeholder; current Khalti flow uses backend secret and payment URL |
| `KHALTI_MODE` | Not found in inspected code; Khalti service currently uses the dev Khalti base URL |
| `RESEND_API_KEY` | Present in `.env.example`, but current email implementation uses Nodemailer |
| `RESEND_FROM_EMAIL` | Present in `.env.example`, but current email implementation uses Nodemailer |
| `SESSION_SECRET` | Present in `.env.example`, but active session middleware was not found |

### Frontend Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL used by frontend services |
| `VITE_API_URL` | Fallback API URL from earlier Vite-style configuration |
| `NEXT_PUBLIC_SOCKET_URL` | Present in frontend env example, but current socket helper reads `NEXT_PUBLIC_API_URL` |

Example without real secrets:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
NODE_MAILER_EMAIL=your_email@example.com
NODE_MAILER_PASSWORD=your_email_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
KHALTI_SECRET=your_khalti_secret_key
PAYMENT_GATEWAY=ESEWA
ESEWA_MERCHANT_CODE=your_merchant_code
ESEWA_CHECKOUT_URL=your_checkout_url
```

Frontend example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Important: The backend code uses `MONGODB_URI`, not `MONGO_URI`.

---

## 9. Folder Structure

Main project structure:

```text
code/
  README.md
  System_Flow.md
  back-end/
  front-end/
```

Backend structure:

```text
back-end/
  index.js                 Main Express server entry point
  package.json             Backend dependencies and scripts
  vercel.json              Vercel/serverless deployment config
  config/                  Database, mailer, Cloudinary, Socket.IO config
  controller/              Thin HTTP controllers
  services/                Business logic for users, admins, medicines, payments
  routes/                  Express API route definitions
  models/                  Mongoose schemas
  middlewares/             Auth, validation, and file upload middleware
  utils/                   OTP, email, cron, auth helper utilities
  validations/             Zod request validation schemas
  uploads/                 Upload folder if used locally
```

Frontend structure:

```text
front-end/medtrack/
  app/                     Next.js App Router pages and layouts
    (staff)/               Dashboard, medicines, billing, sales, alerts, pharmacists
    admin/                 Admin login, signup, profile
    login/                 User login page
    signup/                User signup page
    forgot-password/       Password reset flow
    payment/               Khalti callback route
    payment-success/       Payment success page
    payment-failed/        Payment failure page
  components/              Shared UI, layout, and chart components
    layout/                Sidebar and topbar
    ui/                    Button, input, modal, table, badge
  lib/
    api/                   Frontend API service functions
    utils/                 Token and validation helpers
    socket.ts              Socket.IO client helper
  public/                  Static assets
  types/                   Type declarations
  package.json             Frontend dependencies and scripts
```

Generated folders like `node_modules` and `.next` are not important for viva explanation.

---

## 10. How to Run the Project Locally

### Backend

1. Open terminal in the project root.
2. Go to backend folder:

```bash
cd back-end
```

3. Install dependencies:

```bash
npm install
```

4. Create `.env` file using safe placeholder values. Required important variables include:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
NODE_MAILER_EMAIL=your_email@example.com
NODE_MAILER_PASSWORD=your_email_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
KHALTI_SECRET=your_khalti_secret
```

5. Start backend in development:

```bash
npm run dev
```

6. Or start backend normally:

```bash
npm start
```

Backend default URL:

```text
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

### Frontend

1. Open another terminal from project root.
2. Go to frontend folder:

```bash
cd front-end/medtrack
```

3. Install dependencies:

```bash
npm install
```

4. Create `.env` or `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Start frontend:

```bash
npm run dev
```

Frontend default URL:

```text
http://localhost:3000
```

---

## 11. Deployment Explanation

The frontend and backend should be deployed separately.

No Render-specific configuration file was found in the inspected project. The backend does include `back-end/vercel.json`, which indicates support for Vercel-style serverless deployment. The frontend is a Next.js app, so it can also be deployed on Vercel. If Render is used, the same idea applies: deploy backend and frontend as separate services.

General deployment flow:

- Deploy backend as a Node/Express service.
- Deploy frontend as a Next.js web service.
- Add backend environment variables in the hosting dashboard.
- Add frontend environment variable `NEXT_PUBLIC_API_URL` with the deployed backend API URL.
- Add the deployed frontend URL to backend CORS settings using `FRONTEND_URL` or `CORS_ORIGINS`.
- Backend connects to MongoDB Atlas using `MONGODB_URI`.
- Backend uses service keys for email, Cloudinary, and Khalti.
- Khalti callback/return URL should match the deployed frontend URL.

For Render:

- Backend start command can be `npm start`.
- Backend root directory should be `back-end`.
- Frontend root directory should be `front-end/medtrack`.
- Frontend build command can be `npm run build`.
- Frontend start command can be `npm start`.
- Environment variables must be added in Render dashboard, not hardcoded in code.

---

## 12. Viva Explanation Summary

This project is MedTrack, a MERN stack pharmacy management and medicine purchase system. The frontend is built using Next.js and React, the backend is built using Node.js and Express, and MongoDB is used as the database with Mongoose models.

The system allows users and staff to register, verify their email using OTP, login securely, verify login OTP, and access protected pages using JWT authentication. Passwords are hashed using bcrypt before saving them to the database. The frontend stores the JWT token in local storage and sends it in the authorization header when calling protected APIs.

MedTrack manages medicine inventory with details such as medicine name, batch number, category, manufacturer, stock quantity, price, expiry date, description, and image. Admin or pharmacist users can add, update, and delete medicines. The system also shows low stock and expiry alerts so the pharmacy can manage inventory on time.

For purchasing, the billing page works like a cart. Staff can search medicines, add them to the current order, enter customer details, and choose payment method. For cash payment, the system immediately creates a purchase record and reduces stock. For Khalti payment, the backend creates a pending purchase, sends a payment initiation request to Khalti, redirects the user to Khalti checkout, and verifies payment from the backend using Khalti lookup API before marking the order as paid and reducing stock.

Admin can manage pharmacist/staff users, view dashboard analytics, check recent activity, monitor sales history, and export reports as PDF. The project solves problems of manual pharmacy record keeping, stock mistakes, expiry tracking, and payment/order management by providing a centralized web-based system.

---

## 13. Possible Viva Questions and Answers

### 1. What is MedTrack?

MedTrack is a web-based pharmacy management and medicine purchase system. It manages medicines, stock, billing, purchases, authentication, OTP verification, and payment flow.

### 2. Why did you choose MERN stack?

MERN stack is suitable because MongoDB stores flexible medicine and purchase documents, Express and Node.js handle APIs, and React/Next.js provides a modern interactive frontend.

### 3. What is the role of MongoDB?

MongoDB stores users, admins, medicines, and purchases. The project uses Mongoose schemas to define structure for these collections.

### 4. What is Mongoose?

Mongoose is an ODM library that helps define schemas and interact with MongoDB using models like `User`, `Admin`, `Medicine`, and `Purchase`.

### 5. How does authentication work?

The user enters email and password. Backend checks the password, sends login OTP, verifies OTP, and then returns a JWT token.

### 6. How is password security handled?

Passwords are hashed using `bcryptjs` before saving to the database. During login, the entered password is compared with the hashed password.

### 7. What is JWT?

JWT stands for JSON Web Token. It is used to prove that a user is authenticated. The frontend sends it in the `Authorization` header for protected routes.

### 8. How does OTP verification work?

The backend generates a 6-digit OTP, stores it in the user/admin document, and sends it by email. The user enters the OTP, and the backend verifies it.

### 9. Why is login OTP used?

Login OTP adds an extra security step after password verification. Even if someone knows the password, they still need access to the email OTP.

### 10. How does Khalti payment work?

Frontend asks backend to initiate payment. Backend creates a pending purchase and calls Khalti. Khalti returns a payment URL. After payment, frontend calls backend verification, and backend confirms payment using Khalti lookup API.

### 11. Why is payment verified from the backend?

Backend verification is safer because the secret key stays on the server and the user cannot fake payment success from the browser.

### 12. How is stock managed?

Medicine stock is stored in the `quantity` field. For cash purchase, stock is reduced immediately. For Khalti, stock is reduced only after successful payment verification.

### 13. What is role-based access?

Role-based access means only authorized roles can access certain routes. For example, only admin can manage pharmacist accounts, while medicine management allows admin or pharmacist.

### 14. What can admin do?

Admin can manage medicines, manage pharmacist/staff accounts, view dashboard analytics, view recent activity, view users, and monitor stock and expiry alerts.

### 15. What can pharmacist/staff do?

Pharmacist/staff can access the pharmacy dashboard, view medicines, create billing transactions, manage medicines where allowed, and view sales/alerts.

### 16. How are routes protected?

Protected backend routes use authentication middleware that checks the JWT token from the `Authorization` header.

### 17. What packages did you use for email and OTP?

The project uses `otp-generator` to generate OTP codes and `nodemailer` to send OTP emails.

### 18. What packages did you use for image upload?

The backend uses `multer` to receive uploaded files and `cloudinary` to store medicine images.

### 19. What package is used for payment API requests?

The backend uses `axios` to call Khalti payment APIs.

### 20. What are environment variables?

Environment variables store configuration values such as database URL, JWT secret, email credentials, Cloudinary keys, and Khalti secret without hardcoding them in source code.

### 21. What problem does this project solve?

It reduces manual pharmacy record keeping, improves stock tracking, helps detect low stock and expiry, and provides organized billing and purchase records.

### 22. What is the purpose of the Purchase model?

The `Purchase` model stores order details, buyer, medicine, quantity, price, payment method, payment status, Khalti `pidx`, and customer details.

### 23. Is there a separate Cart model?

No. The cart is handled temporarily in frontend state on the billing page. Final checkout creates purchase records.

### 24. How are low stock and expiry alerts handled?

Frontend calculates and displays alerts from medicine quantity and expiry date. Backend also has a cron job that checks medicines expiring within 30 days and emails admins if mailer is enabled.

### 25. How did you deploy the project?

The frontend and backend are deployed separately. The backend needs MongoDB, email, Cloudinary, Khalti, CORS, and JWT environment variables. The frontend needs the deployed backend API URL.

### 26. What are the limitations of this project?

It depends on internet, MongoDB, email service, and third-party payment gateway. It also does not currently have a mobile app or advanced multi-pharmacy support.

### 27. What future improvements can be added?

Prescription upload, AI medicine recommendation, advanced analytics, notification system, mobile app, and multi-pharmacy support can be added.

---

## 14. Limitations

- The system depends on internet connection and MongoDB availability.
- Email OTP depends on the configured email provider.
- Khalti payment depends on third-party payment gateway availability.
- The cart is frontend-only and not stored permanently as a separate database collection.
- There is no separate payment collection; payment data is stored inside purchase records.
- There is no separate category collection; category is stored as a text field in medicine records.
- Delivery/order status update routes were not found; payment status is the main order status field.
- Advanced analytics can be improved further.
- A mobile app can be added in the future.
- Multi-pharmacy or branch-wise inventory support is not currently implemented.

---

## 15. Future Enhancements

- Prescription upload with image/PDF storage.
- AI-based medicine recommendation or alternative medicine suggestions.
- Advanced sales analytics with monthly, weekly, and category-wise reports.
- Mobile application for customers and pharmacists.
- Multi-pharmacy or branch-wise inventory support.
- Real-time notification system connected to the frontend socket client.
- Better reporting system with downloadable invoices.
- Separate cart collection for persistent customer carts.
- Separate category management module.
- Delivery tracking and order status updates.
- Stronger backend OTP verification for password reset.
- Role field for pharmacist users to make access control clearer.

---

## Quick Technical Summary

- Backend: Node.js, Express.js, MongoDB, Mongoose.
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Authentication: JWT, bcrypt password hashing, email OTP.
- Email: Nodemailer.
- File upload: Multer and Cloudinary.
- Payment: Khalti integration through backend initiation and lookup verification.
- Orders: Stored as `Purchase` documents.
- Cart: Frontend state on billing page.
- Dashboard: Medicine stats, purchase analytics, alerts, recent activity, PDF export.
