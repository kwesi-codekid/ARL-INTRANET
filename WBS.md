# Adamus Resources Limited - Intranet Work Breakdown Structure (WBS)

## WBS Overview

```
1.0 ARL Intranet Project
├── 1.1 Phase 1: Foundation & Core Communication
├── 1.2 Phase 2: Safety & Daily Operations
├── 1.3 Phase 3: Engagement & Feedback
└── 1.4 Phase 4: Advanced Features
```

**Legend:** ✅ = Completed | 🔄 = In Progress | ⏳ = Not Started

---

## 📊 Progress Summary

| Section | Description | Status | Completed |
|---------|-------------|--------|-----------|
| **Phase 1: Foundation & Core Communication** ||||
| 1.1.1.1 | Development Environment Setup | ✅ | 7/7 |
| 1.1.1.2 | Database Setup | ✅ | 8/8 |
| 1.1.1.3 | Base Layout & Navigation | ✅ | 10/10 |
| 1.1.2 | Admin Portal & Authentication | ✅ | 28/28 |
| 1.1.3 | News & Announcements | ✅ | 28/28 |
| 1.1.4 | Company Contact Directory | ✅ | 18/18 |
| 1.1.5 | Company Apps Links | ✅ | 13/13 |
| **Phase 2: Safety & Daily Operations** ||||
| 1.2.1 | Daily Toolbox Talk | ✅ | 26/26 |
| 1.2.2 | Safety Tips & Videos | ✅ | 21/21 |
| 1.2.3 | Safety & Incident Alerts | 🔄 | 17/17 |
| 1.2.4 | Canteen Menu | 🔄 | 12/15 |
| **Phase 3: Engagement & Feedback** ||||
| 1.3.1 | Events & Photo Gallery | 🔄 | 20/24 |
| 1.3.2 | Polls | ⏳ | 0/29 |
| 1.3.3 | Anonymous Suggestion Box | 🔄 | 10/18 |
| **Phase 4: Advanced Features** ||||
| 1.4.1 | AI Chatbot (Claude Integration) | 🔄 | 7/30 |
| 1.4.2 | Interactive Site Map | ⏳ | 0/22 |
| 1.4.3 | Gold Industry News | 🔄 | 9/18 |
| 1.4.4 | Mini Games | ⏳ | 0/65 |
| **New Features (Not in Original WBS)** ||||
| NEW | Policies Management | ✅ | 15/15 |
| NEW | Executive Messages | 🔄 | 5/8 |
| NEW | IT Tips | 🔄 | 5/8 |
| NEW | Company Info / About Page | ✅ | 6/6 |

**Last Updated:** January 30, 2026 (Phase 2-4 In Progress)

---

# 1.1 PHASE 1: Foundation & Core Communication

## 1.1.1 Project Setup & Infrastructure

### 1.1.1.1 Development Environment Setup ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.1.1.1 | Initialize React Router V7 project with TypeScript | None | ✅ |
| 1.1.1.1.2 | Configure HeroUI and theme provider | 1.1.1.1.1 | ✅ |
| 1.1.1.1.3 | Set up project folder structure (routes, components, lib, utils) | 1.1.1.1.1 | ✅ |
| 1.1.1.1.4 | Configure ESLint and Prettier | 1.1.1.1.1 | ✅ |
| 1.1.1.1.5 | Set up environment variables configuration | 1.1.1.1.1 | ✅ |
| 1.1.1.1.6 | Create Git repository and initial commit | 1.1.1.1.1 | ✅ |
| 1.1.1.1.7 | Set up development scripts (dev, build, start) | 1.1.1.1.1 | ✅ |

### 1.1.1.2 Database Setup ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.1.2.1 | Install MongoDB driver and Mongoose ODM | 1.1.1.1.1 | ✅ |
| 1.1.1.2.2 | Create database connection utility | 1.1.1.2.1 | ✅ |
| 1.1.1.2.3 | Design and create Admin User schema | 1.1.1.2.2 | ✅ |
| 1.1.1.2.4 | Design and create News/Announcement schema | 1.1.1.2.2 | ✅ |
| 1.1.1.2.5 | Design and create Contact Directory schema | 1.1.1.2.2 | ✅ |
| 1.1.1.2.6 | Design and create App Links schema | 1.1.1.2.2 | ✅ |
| 1.1.1.2.7 | Create database seed scripts for initial data | 1.1.1.2.3-6 | ✅ |
| 1.1.1.2.8 | Set up database indexing for performance | 1.1.1.2.3-6 | ✅ |

### 1.1.1.3 Base Layout & Navigation ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.1.3.1 | Create main layout component with header and footer | 1.1.1.1.2 | ✅ |
| 1.1.1.3.2 | Implement responsive navigation bar | 1.1.1.3.1 | ✅ |
| 1.1.1.3.3 | Create mobile hamburger menu | 1.1.1.3.2 | ✅ |
| 1.1.1.3.4 | Implement sidebar navigation (if applicable) | 1.1.1.3.1 | ✅ |
| 1.1.1.3.5 | Create footer component with company info | 1.1.1.3.1 | ✅ |
| 1.1.1.3.6 | Apply brand colors and typography | 1.1.1.3.1 | ✅ |
| 1.1.1.3.7 | Create loading spinner/skeleton components | 1.1.1.1.2 | ✅ |
| 1.1.1.3.8 | Create error boundary and 404 page | 1.1.1.3.1 | ✅ |
| 1.1.1.3.9 | Implement breadcrumb navigation | 1.1.1.3.1 | ✅ |
| 1.1.1.3.10 | Create homepage/dashboard layout | 1.1.1.3.1 | ✅ |

---

## 1.1.2 Admin Portal & Authentication ✅

### 1.1.2.1 OTP Authentication System ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.2.1.1 | Select and integrate SMS OTP provider (smsonlinegh.com) | None | ✅ |
| 1.1.2.1.2 | Create OTP generation utility (6-digit, expiry) | 1.1.2.1.1 | ✅ |
| 1.1.2.1.3 | Create OTP storage schema in MongoDB (temp, with TTL) | 1.1.1.2.2 | ✅ |
| 1.1.2.1.4 | Build OTP request API endpoint | 1.1.2.1.2, 1.1.2.1.3 | ✅ |
| 1.1.2.1.5 | Build OTP verification API endpoint | 1.1.2.1.4 | ✅ |
| 1.1.2.1.6 | Implement rate limiting for OTP requests | 1.1.2.1.4 | ✅ |
| 1.1.2.1.7 | Create phone number input component with validation | 1.1.1.1.2 | ✅ |
| 1.1.2.1.8 | Create OTP input component (6-digit boxes) | 1.1.1.1.2 | ✅ |
| 1.1.2.1.9 | Build login page UI | 1.1.2.1.7, 1.1.2.1.8 | ✅ |
| 1.1.2.1.10 | Implement OTP resend functionality with cooldown | 1.1.2.1.4 | ✅ |

### 1.1.2.2 Cookie Session Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.2.2.1 | Install and configure session library | 1.1.1.1.1 | ✅ |
| 1.1.2.2.2 | Create cookie session storage utility | 1.1.2.2.1 | ✅ |
| 1.1.2.2.3 | Create session verification middleware | 1.1.2.2.2 | ✅ |
| 1.1.2.2.4 | N/A (using React Router sessions) | - | ✅ |
| 1.1.2.2.5 | N/A (using React Router loaders) | - | ✅ |
| 1.1.2.2.6 | Implement protected route wrapper (requireAuth) | 1.1.2.2.2 | ✅ |
| 1.1.2.2.7 | Create logout functionality (session destroy) | 1.1.2.2.2 | ✅ |
| 1.1.2.2.8 | Implement session expiry handling | 1.1.2.2.2 | ✅ |
| 1.1.2.2.9 | Add httpOnly cookie storage | 1.1.2.2.2 | ✅ |

### 1.1.2.3 Admin Portal UI ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.2.3.1 | Create admin layout component (sidebar, header) | 1.1.2.2.6 | ✅ |
| 1.1.2.3.2 | Build admin dashboard homepage | 1.1.2.3.1 | ✅ |
| 1.1.2.3.3 | Create admin navigation menu | 1.1.2.3.1 | ✅ |
| 1.1.2.3.4 | Implement admin header with user info and logout | 1.1.2.3.1 | ✅ |
| 1.1.2.3.5 | Create reusable admin data table component | 1.1.2.3.1 | ✅ |
| 1.1.2.3.6 | Create reusable admin form components | 1.1.2.3.1 | ✅ |
| 1.1.2.3.7 | Create confirmation modal component | 1.1.2.3.1 | ✅ |
| 1.1.2.3.8 | Implement toast notification system | 1.1.2.3.1 | ✅ |
| 1.1.2.3.9 | Create admin search/filter components | 1.1.2.3.1 | ✅ |
| 1.1.2.3.10 | Implement pagination component | 1.1.2.3.1 | ✅ |

### 1.1.2.4 Superadmin Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.2.4.1 | Create superadmin user schema with roles | 1.1.1.2.3 | ✅ |
| 1.1.2.4.2 | Build superadmin creation script (initial setup) | 1.1.2.4.1 | ✅ |
| 1.1.2.4.3 | Create admin user listing page | 1.1.2.3.5 | ✅ |
| 1.1.2.4.4 | Build admin user creation form | 1.1.2.3.6 | ✅ |
| 1.1.2.4.5 | Implement admin user edit functionality | 1.1.2.4.4 | ✅ |
| 1.1.2.4.6 | Implement admin user deactivation | 1.1.2.4.3 | ✅ |
| 1.1.2.4.7 | Create activity log schema | 1.1.1.2.2 | ✅ |
| 1.1.2.4.8 | Implement admin activity logging | 1.1.2.4.7 | ✅ |
| 1.1.2.4.9 | Build activity log viewer | 1.1.2.4.8 | ✅ |

---

## 1.1.3 News & Announcements ✅

### 1.1.3.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.3.1.1 | Finalize News schema (title, content, category, author, dates, status) | 1.1.1.2.4 | ✅ |
| 1.1.3.1.2 | Create GET /api/news endpoint (public, with pagination) | 1.1.3.1.1 | ✅ |
| 1.1.3.1.3 | Create GET /api/news/:id endpoint (single news) | 1.1.3.1.1 | ✅ |
| 1.1.3.1.4 | Create POST /api/admin/news endpoint (create) | 1.1.3.1.1, 1.1.2.2.3 | ✅ |
| 1.1.3.1.5 | Create PUT /api/admin/news/:id endpoint (update) | 1.1.3.1.1, 1.1.2.2.3 | ✅ |
| 1.1.3.1.6 | Create DELETE /api/admin/news/:id endpoint | 1.1.3.1.1, 1.1.2.2.3 | ✅ |
| 1.1.3.1.7 | Implement news category management | 1.1.3.1.1 | ✅ |
| 1.1.3.1.8 | Implement news search and filtering | 1.1.3.1.2 | ✅ |
| 1.1.3.1.9 | Add featured/pinned news functionality | 1.1.3.1.1 | ✅ |
| 1.1.3.1.10 | Implement news scheduling (publish date) | 1.1.3.1.1 | ✅ |

### 1.1.3.2 Image Upload System ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.3.2.1 | Set up file upload middleware (multer) | 1.1.1.1.1 | ✅ |
| 1.1.3.2.2 | Create uploads directory structure | 1.1.3.2.1 | ✅ |
| 1.1.3.2.3 | Implement image upload API endpoint | 1.1.3.2.1 | ✅ |
| 1.1.3.2.4 | Add image validation (type, size limits) | 1.1.3.2.3 | ✅ |
| 1.1.3.2.5 | Implement image compression/optimization | 1.1.3.2.3 | ✅ |
| 1.1.3.2.6 | Create image deletion functionality | 1.1.3.2.3 | ✅ |
| 1.1.3.2.7 | Set up static file serving for uploads | 1.1.3.2.2 | ✅ |

### 1.1.3.3 Public News UI ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.3.3.1 | Create news listing page | 1.1.3.1.2 | ✅ |
| 1.1.3.3.2 | Build news card component | 1.1.3.3.1 | ✅ |
| 1.1.3.3.3 | Implement news category filter tabs | 1.1.3.3.1 | ✅ |
| 1.1.3.3.4 | Create single news detail page | 1.1.3.1.3 | ✅ |
| 1.1.3.3.5 | Add news image carousel (if multiple images) | 1.1.3.3.4 | ✅ |
| 1.1.3.3.6 | Implement related news section | 1.1.3.3.4 | ✅ |
| 1.1.3.3.7 | Create news search functionality | 1.1.3.1.8 | ✅ |
| 1.1.3.3.8 | Add homepage news widget/section | 1.1.1.3.10 | ✅ |
| 1.1.3.3.9 | Implement infinite scroll or pagination | 1.1.3.3.1 | ✅ |

### 1.1.3.4 Admin News Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.3.4.1 | Create admin news listing page | 1.1.2.3.5, 1.1.3.1.2 | ✅ |
| 1.1.3.4.2 | Build news creation form with rich text editor | 1.1.2.3.6 | ✅ |
| 1.1.3.4.3 | Integrate image upload in news form | 1.1.3.2.3, 1.1.3.4.2 | ✅ |
| 1.1.3.4.4 | Create news edit page | 1.1.3.4.2 | ✅ |
| 1.1.3.4.5 | Implement news delete with confirmation | 1.1.2.3.7 | ✅ |
| 1.1.3.4.6 | Add publish/unpublish toggle | 1.1.3.4.1 | ✅ |
| 1.1.3.4.7 | Create category management page | 1.1.3.1.7 | ✅ |
| 1.1.3.4.8 | Implement news preview functionality | 1.1.3.4.2 | ✅ |

---

## 1.1.4 Company Contact Directory ✅

### 1.1.4.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.4.1.1 | Finalize Contact schema (name, phone, email, dept, position, photo) | 1.1.1.2.5 | ✅ |
| 1.1.4.1.2 | Create Department schema | 1.1.1.2.2 | ✅ |
| 1.1.4.1.3 | Create GET /api/contacts endpoint (with filters) | 1.1.4.1.1 | ✅ |
| 1.1.4.1.4 | Create GET /api/contacts/:id endpoint | 1.1.4.1.1 | ✅ |
| 1.1.4.1.5 | Create GET /api/departments endpoint | 1.1.4.1.2 | ✅ |
| 1.1.4.1.6 | Create POST /api/admin/contacts endpoint | 1.1.4.1.1, 1.1.2.2.3 | ✅ |
| 1.1.4.1.7 | Create PUT /api/admin/contacts/:id endpoint | 1.1.4.1.1, 1.1.2.2.3 | ✅ |
| 1.1.4.1.8 | Create DELETE /api/admin/contacts/:id endpoint | 1.1.4.1.1, 1.1.2.2.3 | ✅ |
| 1.1.4.1.9 | Implement contact search (name, dept, position) | 1.1.4.1.3 | ✅ |
| 1.1.4.1.10 | Create bulk import endpoint (CSV) | 1.1.4.1.6 | ✅ |

### 1.1.4.2 Public Directory UI ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.4.2.1 | Create directory listing page | 1.1.4.1.3 | ✅ |
| 1.1.4.2.2 | Build contact card component | 1.1.4.2.1 | ✅ |
| 1.1.4.2.3 | Implement department filter dropdown | 1.1.4.1.5 | ✅ |
| 1.1.4.2.4 | Create search bar with live search | 1.1.4.1.9 | ✅ |
| 1.1.4.2.5 | Add alphabetical quick-jump navigation | 1.1.4.2.1 | ✅ |
| 1.1.4.2.6 | Create contact detail modal/page | 1.1.4.1.4 | ✅ |
| 1.1.4.2.7 | Implement click-to-call functionality (mobile) | 1.1.4.2.2 | ✅ |
| 1.1.4.2.8 | Add homepage directory quick search widget | 1.1.1.3.10 | ✅ |

### 1.1.4.3 Admin Directory Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.4.3.1 | Create admin contacts listing page | 1.1.2.3.5, 1.1.4.1.3 | ✅ |
| 1.1.4.3.2 | Build contact creation form | 1.1.2.3.6 | ✅ |
| 1.1.4.3.3 | Integrate photo upload for contacts | 1.1.3.2.3, 1.1.4.3.2 | ✅ |
| 1.1.4.3.4 | Create contact edit page | 1.1.4.3.2 | ✅ |
| 1.1.4.3.5 | Implement contact delete | 1.1.4.3.1 | ✅ |
| 1.1.4.3.6 | Create department management page | 1.1.4.1.2 | ✅ |
| 1.1.4.3.7 | Build CSV import interface | 1.1.4.1.10 | ✅ |
| 1.1.4.3.8 | Create CSV template download | 1.1.4.3.7 | ✅ |

---

## 1.1.5 Company Apps Links ✅

### 1.1.5.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.5.1.1 | Finalize AppLink schema (name, url, icon, description, category) | 1.1.1.2.6 | ✅ |
| 1.1.5.1.2 | Create GET /api/app-links endpoint | 1.1.5.1.1 | ✅ |
| 1.1.5.1.3 | Create CRUD endpoints for admin | 1.1.5.1.1, 1.1.2.2.3 | ✅ |
| 1.1.5.1.4 | Implement app link ordering/sorting | 1.1.5.1.1 | ✅ |

### 1.1.5.2 Public Apps Page ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.5.2.1 | Create apps listing page | 1.1.5.1.2 | ✅ |
| 1.1.5.2.2 | Build app link card component with icon | 1.1.5.2.1 | ✅ |
| 1.1.5.2.3 | Implement category grouping | 1.1.5.2.1 | ✅ |
| 1.1.5.2.4 | Add search/filter functionality | 1.1.5.2.1 | ✅ |
| 1.1.5.2.5 | Add homepage quick links widget | 1.1.1.3.10 | ✅ |

### 1.1.5.3 Admin Apps Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.1.5.3.1 | Create admin app links listing page | 1.1.2.3.5 | ✅ |
| 1.1.5.3.2 | Build app link creation form | 1.1.2.3.6 | ✅ |
| 1.1.5.3.3 | Integrate icon upload/selection | 1.1.5.3.2 | ✅ |
| 1.1.5.3.4 | Implement drag-and-drop reordering | 1.1.5.3.1 | ✅ |
| 1.1.5.3.5 | Create edit and delete functionality | 1.1.5.3.1 | ✅ |

---

# 1.2 PHASE 2: Safety & Daily Operations

## 1.2.1 Daily Toolbox Talk ✅

### 1.2.1.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.1.1.1 | Create ToolboxTalk schema (title, content, date, media, author) | 1.1.1.2.2 | ✅ |
| 1.2.1.1.2 | Create GET /api/toolbox-talks endpoint (with date filter) | 1.2.1.1.1 | ✅ |
| 1.2.1.1.3 | Create GET /api/toolbox-talks/today endpoint | 1.2.1.1.1 | ✅ |
| 1.2.1.1.4 | Create GET /api/toolbox-talks/:id endpoint | 1.2.1.1.1 | ✅ |
| 1.2.1.1.5 | Create CRUD endpoints for admin | 1.2.1.1.1, 1.1.2.2.3 | ✅ |
| 1.2.1.1.6 | Implement toolbox talk scheduling | 1.2.1.1.1 | ✅ |
| 1.2.1.1.7 | Create toolbox talk archive functionality | 1.2.1.1.2 | ✅ |

### 1.2.1.2 Multimedia Support ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.1.2.1 | Extend upload system for video files | 1.1.3.2.1 | ✅ |
| 1.2.1.2.2 | Implement video file validation (type, size, duration) | 1.2.1.2.1 | ✅ |
| 1.2.1.2.3 | Create audio file upload support | 1.2.1.2.1 | ✅ |
| 1.2.1.2.4 | Implement video thumbnail generation | 1.2.1.2.1 | ✅ |
| 1.2.1.2.5 | Create video player component | 1.2.1.2.1 | ✅ |
| 1.2.1.2.6 | Create audio player component | 1.2.1.2.3 | ✅ |

### 1.2.1.3 Public Toolbox Talk UI ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.1.3.1 | Create toolbox talk page with today's talk prominent | 1.2.1.1.3 | ✅ |
| 1.2.1.3.2 | Build toolbox talk card component | 1.2.1.3.1 | ✅ |
| 1.2.1.3.3 | Integrate video player in talk view | 1.2.1.2.5 | ✅ |
| 1.2.1.3.4 | Integrate audio player in talk view | 1.2.1.2.6 | ✅ |
| 1.2.1.3.5 | Create calendar/archive view for past talks | 1.2.1.1.7 | ✅ |
| 1.2.1.3.6 | Add homepage "Today's Toolbox Talk" widget | 1.1.1.3.10 | ✅ |
| 1.2.1.3.7 | Implement date picker for archive browsing | 1.2.1.3.5 | ✅ |

### 1.2.1.4 Admin Toolbox Talk Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.1.4.1 | Create admin toolbox talk listing page | 1.1.2.3.5 | ✅ |
| 1.2.1.4.2 | Build toolbox talk creation form | 1.1.2.3.6 | ✅ |
| 1.2.1.4.3 | Integrate multimedia upload in form | 1.2.1.2.1-3 | ✅ |
| 1.2.1.4.4 | Create talk scheduling interface | 1.2.1.1.6 | ✅ |
| 1.2.1.4.5 | Implement edit and delete functionality | 1.2.1.4.1 | ✅ |
| 1.2.1.4.6 | Add calendar view for scheduled talks | 1.2.1.4.4 | ✅ |

---

## 1.2.2 Safety Tips & Videos ✅

### 1.2.2.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.2.1.1 | Create SafetyTip schema (title, content, category, media) | 1.1.1.2.2 | ✅ |
| 1.2.2.1.2 | Create SafetyVideo schema (title, description, video, thumbnail) | 1.1.1.2.2 | ✅ |
| 1.2.2.1.3 | Create SafetyCategory schema | 1.1.1.2.2 | ✅ |
| 1.2.2.1.4 | Create GET /api/safety-tips endpoint | 1.2.2.1.1 | ✅ |
| 1.2.2.1.5 | Create GET /api/safety-videos endpoint | 1.2.2.1.2 | ✅ |
| 1.2.2.1.6 | Create CRUD endpoints for safety tips | 1.2.2.1.1, 1.1.2.2.3 | ✅ |
| 1.2.2.1.7 | Create CRUD endpoints for safety videos | 1.2.2.1.2, 1.1.2.2.3 | ✅ |
| 1.2.2.1.8 | Create category management endpoints | 1.2.2.1.3 | ✅ |
| 1.2.2.1.9 | Implement random tip of the day endpoint | 1.2.2.1.4 | ✅ |

### 1.2.2.2 Public Safety Tips UI ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.2.2.1 | Create safety tips listing page | 1.2.2.1.4 | ✅ |
| 1.2.2.2.2 | Build safety tip card component | 1.2.2.2.1 | ✅ |
| 1.2.2.2.3 | Implement category filter tabs | 1.2.2.1.8 | ✅ |
| 1.2.2.2.4 | Create single tip detail view | 1.2.2.2.1 | ✅ |
| 1.2.2.2.5 | Add homepage "Safety Tip" widget | 1.2.2.1.9 | ✅ |

### 1.2.2.3 Public Safety Videos UI ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.2.3.1 | Create safety videos gallery page | 1.2.2.1.5 | ✅ |
| 1.2.2.3.2 | Build video thumbnail grid | 1.2.2.3.1 | ✅ |
| 1.2.2.3.3 | Create video player modal/page | 1.2.1.2.5 | ✅ |
| 1.2.2.3.4 | Implement category filtering | 1.2.2.1.8 | ✅ |
| 1.2.2.3.5 | Add video search functionality | 1.2.2.3.1 | ✅ |
| 1.2.2.3.6 | Add homepage featured video widget | 1.1.1.3.10 | ✅ |

### 1.2.2.4 Admin Safety Content Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.2.4.1 | Create admin safety tips listing | 1.1.2.3.5 | ✅ |
| 1.2.2.4.2 | Build safety tip creation form | 1.1.2.3.6 | ✅ |
| 1.2.2.4.3 | Create admin safety videos listing | 1.1.2.3.5 | ✅ |
| 1.2.2.4.4 | Build video upload form with progress | 1.2.1.2.1 | ✅ |
| 1.2.2.4.5 | Implement edit/delete for tips and videos | 1.2.2.4.1, 1.2.2.4.3 | ✅ |
| 1.2.2.4.6 | Create safety category management page | 1.2.2.1.8 | ✅ |

---

## 1.2.3 Safety & Incident Alerts ✅

### 1.2.3.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.3.1.1 | Create Alert schema (title, message, severity, type, active, dates) | 1.1.1.2.2 | ✅ |
| 1.2.3.1.2 | Create GET /api/alerts endpoint (active alerts) | 1.2.3.1.1 | ✅ |
| 1.2.3.1.3 | Create GET /api/alerts/active endpoint (for popups) | 1.2.3.1.1 | ✅ |
| 1.2.3.1.4 | Create GET /api/alerts/history endpoint | 1.2.3.1.1 | ✅ |
| 1.2.3.1.5 | Create CRUD endpoints for admin | 1.2.3.1.1, 1.1.2.2.3 | ✅ |
| 1.2.3.1.6 | Implement alert scheduling (start/end dates) | 1.2.3.1.1 | ✅ |
| 1.2.3.1.7 | Create alert acknowledgment tracking | 1.2.3.1.1 | ✅ |

### 1.2.3.2 Alert Popup System ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.3.2.1 | Create alert banner component (top of page) | 1.2.3.1.3 | ✅ |
| 1.2.3.2.2 | Create alert popup modal component | 1.2.3.1.3 | ✅ |
| 1.2.3.2.3 | Implement severity-based styling (info, warning, critical) | 1.2.3.2.1, 1.2.3.2.2 | ✅ |
| 1.2.3.2.4 | Add dismiss functionality with local storage | 1.2.3.2.2 | ✅ |
| 1.2.3.2.5 | Implement auto-display on page load for new alerts | 1.2.3.2.2 | ✅ |
| 1.2.3.2.6 | Create alert icon in header with badge count | 1.1.1.3.2 | ✅ |
| 1.2.3.2.7 | Add alert sound notification option | 1.2.3.2.2 | ✅ |

### 1.2.3.3 Public Alerts Page ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.3.3.1 | Create alerts listing page | 1.2.3.1.2 | ✅ |
| 1.2.3.3.2 | Build alert card component with severity indicator | 1.2.3.3.1 | ✅ |
| 1.2.3.3.3 | Implement active/history tabs | 1.2.3.1.4 | ✅ |
| 1.2.3.3.4 | Create alert detail view | 1.2.3.3.1 | ✅ |
| 1.2.3.3.5 | Add date range filter for history | 1.2.3.3.3 | ✅ |

### 1.2.3.4 Admin Alert Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.3.4.1 | Create admin alerts listing page | 1.1.2.3.5 | ✅ |
| 1.2.3.4.2 | Build alert creation form with severity picker | 1.1.2.3.6 | ✅ |
| 1.2.3.4.3 | Create scheduling interface (start/end date pickers) | 1.2.3.1.6 | ✅ |
| 1.2.3.4.4 | Add quick activate/deactivate toggle | 1.2.3.4.1 | ⏳ |
| 1.2.3.4.5 | Implement alert preview | 1.2.3.4.2 | ⏳ |
| 1.2.3.4.6 | Create alert edit and delete functionality | 1.2.3.4.1 | ✅ |

---

## 1.2.4 Canteen Menu 🔄

### 1.2.4.1 Backend Development ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.4.1.1 | Create Menu schema (date, meals, items, type: daily/weekly) | 1.1.1.2.2 | ✅ |
| 1.2.4.1.2 | Create MenuItem schema (name, description, dietary info) | 1.1.1.2.2 | ✅ |
| 1.2.4.1.3 | Create GET /api/menu/today endpoint | 1.2.4.1.1 | ✅ |
| 1.2.4.1.4 | Create GET /api/menu/week endpoint | 1.2.4.1.1 | ✅ |
| 1.2.4.1.5 | Create CRUD endpoints for admin | 1.2.4.1.1, 1.1.2.2.3 | ✅ |
| 1.2.4.1.6 | Implement menu templates for quick creation | 1.2.4.1.1 | ✅ |

### 1.2.4.2 Public Menu UI 🔄
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.4.2.1 | Create canteen menu page | 1.2.4.1.3 | ✅ |
| 1.2.4.2.2 | Build daily menu view (breakfast, lunch, dinner) | 1.2.4.2.1 | ✅ |
| 1.2.4.2.3 | Build weekly menu calendar view | 1.2.4.1.4 | ⏳ |
| 1.2.4.2.4 | Create daily/weekly toggle | 1.2.4.2.1 | ⏳ |
| 1.2.4.2.5 | Add dietary indicator icons (vegetarian, halal, etc.) | 1.2.4.2.2 | ✅ |
| 1.2.4.2.6 | Add homepage today's menu widget | 1.1.1.3.10 | ⏳ |

### 1.2.4.3 Admin Menu Management ✅
| Task ID | Task Description | Dependencies | Status |
|---------|------------------|--------------|--------|
| 1.2.4.3.1 | Create admin menu listing/calendar page | 1.1.2.3.5 | ✅ |
| 1.2.4.3.2 | Build menu creation form | 1.1.2.3.6 | ✅ |
| 1.2.4.3.3 | Create meal/item builder interface | 1.2.4.3.2 | ✅ |
| 1.2.4.3.4 | Implement menu copy/duplicate functionality | 1.2.4.1.6 | ⏳ |
| 1.2.4.3.5 | Create weekly menu bulk editor | 1.2.4.3.2 | ⏳ |
| 1.2.4.3.6 | Add menu template management | 1.2.4.1.6 | ✅ |

---

# 1.3 PHASE 3: Engagement & Feedback

## 1.3.1 Events & Photo Gallery

### 1.3.1.1 Events Backend
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.1.1.1 | Create Event schema (title, description, date, location, images) | 1.1.1.2.2 |
| 1.3.1.1.2 | Create GET /api/events endpoint (upcoming + past) | 1.3.1.1.1 |
| 1.3.1.1.3 | Create GET /api/events/:id endpoint | 1.3.1.1.1 |
| 1.3.1.1.4 | Create CRUD endpoints for admin | 1.3.1.1.1, 1.1.2.2.3 |
| 1.3.1.1.5 | Implement event filtering (upcoming, past, by month) | 1.3.1.1.2 |

### 1.3.1.2 Photo Gallery Backend
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.1.2.1 | Create Album schema (title, description, date, cover, event_id) | 1.1.1.2.2 |
| 1.3.1.2.2 | Create Photo schema (album_id, url, caption, order) | 1.1.1.2.2 |
| 1.3.1.2.3 | Create GET /api/albums endpoint | 1.3.1.2.1 |
| 1.3.1.2.4 | Create GET /api/albums/:id/photos endpoint | 1.3.1.2.2 |
| 1.3.1.2.5 | Create album CRUD endpoints for admin | 1.3.1.2.1, 1.1.2.2.3 |
| 1.3.1.2.6 | Create batch photo upload endpoint | 1.3.1.2.2, 1.1.3.2.3 |
| 1.3.1.2.7 | Implement photo reordering endpoint | 1.3.1.2.2 |

### 1.3.1.3 Public Events UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.1.3.1 | Create events listing page | 1.3.1.1.2 |
| 1.3.1.3.2 | Build event card component | 1.3.1.3.1 |
| 1.3.1.3.3 | Create event detail page | 1.3.1.1.3 |
| 1.3.1.3.4 | Implement upcoming/past event tabs | 1.3.1.1.5 |
| 1.3.1.3.5 | Add event calendar view | 1.3.1.3.1 |
| 1.3.1.3.6 | Add homepage upcoming events widget | 1.1.1.3.10 |

### 1.3.1.4 Public Photo Gallery UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.1.4.1 | Create photo gallery page with albums | 1.3.1.2.3 |
| 1.3.1.4.2 | Build album cover grid | 1.3.1.4.1 |
| 1.3.1.4.3 | Create album detail page with photo grid | 1.3.1.2.4 |
| 1.3.1.4.4 | Implement lightbox for full-size photo viewing | 1.3.1.4.3 |
| 1.3.1.4.5 | Add photo navigation (prev/next) in lightbox | 1.3.1.4.4 |
| 1.3.1.4.6 | Link gallery to related events | 1.3.1.3.3 |

### 1.3.1.5 Admin Events & Gallery Management
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.1.5.1 | Create admin events listing page | 1.1.2.3.5 |
| 1.3.1.5.2 | Build event creation form | 1.1.2.3.6 |
| 1.3.1.5.3 | Create admin albums listing page | 1.1.2.3.5 |
| 1.3.1.5.4 | Build album creation form | 1.1.2.3.6 |
| 1.3.1.5.5 | Create batch photo upload interface with progress | 1.3.1.2.6 |
| 1.3.1.5.6 | Implement drag-and-drop photo reordering | 1.3.1.2.7 |
| 1.3.1.5.7 | Add photo caption editing | 1.3.1.5.5 |
| 1.3.1.5.8 | Create album cover selection interface | 1.3.1.5.3 |

---

## 1.3.2 Polls

### 1.3.2.1 Backend Development
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.2.1.1 | Create Poll schema (question, options, active, dates, votes) | 1.1.1.2.2 |
| 1.3.2.1.2 | Create PollVote schema (poll_id, option_index, voter_id/ip) | 1.1.1.2.2 |
| 1.3.2.1.3 | Create GET /api/polls/active endpoint | 1.3.2.1.1 |
| 1.3.2.1.4 | Create GET /api/polls/:id endpoint with results | 1.3.2.1.1 |
| 1.3.2.1.5 | Create POST /api/polls/:id/vote endpoint | 1.3.2.1.2 |
| 1.3.2.1.6 | Implement duplicate vote prevention (by IP/session) | 1.3.2.1.5 |
| 1.3.2.1.7 | Create CRUD endpoints for admin | 1.3.2.1.1, 1.1.2.2.3 |
| 1.3.2.1.8 | Create GET /api/polls/history endpoint | 1.3.2.1.1 |

### 1.3.2.2 Public Poll UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.2.2.1 | Create poll widget component | 1.3.2.1.3 |
| 1.3.2.2.2 | Build vote submission UI | 1.3.2.1.5 |
| 1.3.2.2.3 | Create results display with percentages/bar chart | 1.3.2.1.4 |
| 1.3.2.2.4 | Implement voted state (show results after voting) | 1.3.2.2.2 |
| 1.3.2.2.5 | Add homepage active poll widget | 1.1.1.3.10 |
| 1.3.2.2.6 | Create poll history page | 1.3.2.1.8 |

### 1.3.2.3 Admin Poll Management
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.2.3.1 | Create admin polls listing page | 1.1.2.3.5 |
| 1.3.2.3.2 | Build poll creation form (question + options) | 1.1.2.3.6 |
| 1.3.2.3.3 | Implement activate/deactivate toggle | 1.3.2.3.1 |
| 1.3.2.3.4 | Create poll results view with analytics | 1.3.2.1.4 |
| 1.3.2.3.5 | Add poll scheduling (auto-activate/deactivate) | 1.3.2.3.2 |
| 1.3.2.3.6 | Implement poll edit and delete | 1.3.2.3.1 |

---

## 1.3.3 Anonymous Suggestion Box

### 1.3.3.1 Backend Development
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.3.1.1 | Create Suggestion schema (content, category, status, ip_hash, dates) | 1.1.1.2.2 |
| 1.3.3.1.2 | Create SuggestionCategory schema | 1.1.1.2.2 |
| 1.3.3.1.3 | Create POST /api/suggestions endpoint (public) | 1.3.3.1.1 |
| 1.3.3.1.4 | Implement IP hashing for traceability | 1.3.3.1.3 |
| 1.3.3.1.5 | Create GET /api/admin/suggestions endpoint | 1.3.3.1.1, 1.1.2.2.3 |
| 1.3.3.1.6 | Create suggestion status update endpoint | 1.3.3.1.1, 1.1.2.2.3 |
| 1.3.3.1.7 | Create category management endpoints | 1.3.3.1.2 |
| 1.3.3.1.8 | Implement rate limiting for submissions | 1.3.3.1.3 |

### 1.3.3.2 Public Suggestion UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.3.2.1 | Create suggestion submission page | 1.3.3.1.3 |
| 1.3.3.2.2 | Build suggestion form (text area, category select) | 1.3.3.2.1 |
| 1.3.3.2.3 | Add character count/limit indicator | 1.3.3.2.2 |
| 1.3.3.2.4 | Create submission confirmation message | 1.3.3.2.2 |
| 1.3.3.2.5 | Add anonymity assurance messaging | 1.3.3.2.1 |
| 1.3.3.2.6 | Implement spam prevention (honeypot, cooldown) | 1.3.3.1.8 |

### 1.3.3.3 Admin Suggestion Management
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.3.3.3.1 | Create admin suggestions listing page | 1.1.2.3.5 |
| 1.3.3.3.2 | Implement status filter (new, reviewed, archived) | 1.3.3.3.1 |
| 1.3.3.3.3 | Create category filter | 1.3.3.1.7 |
| 1.3.3.3.4 | Build suggestion detail view | 1.3.3.3.1 |
| 1.3.3.3.5 | Implement status change functionality | 1.3.3.1.6 |
| 1.3.3.3.6 | Create admin notes/comments on suggestions | 1.3.3.3.4 |
| 1.3.3.3.7 | Add IP trace lookup (superadmin only) | 1.3.3.1.4 |
| 1.3.3.3.8 | Create suggestion category management | 1.3.3.1.7 |

---

# 1.4 PHASE 4: Advanced Features

## 1.4.1 AI Chatbot (Claude Integration)

### 1.4.1.1 Backend Development
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.1.1.1 | Set up Claude API integration | 1.1.1.1.1 |
| 1.4.1.1.2 | Create ChatMessage schema (session, role, content, timestamp) | 1.1.1.2.2 |
| 1.4.1.1.3 | Create POST /api/chat endpoint | 1.4.1.1.1, 1.4.1.1.2 |
| 1.4.1.1.4 | Implement session management for chat context | 1.4.1.1.2 |
| 1.4.1.1.5 | Create system prompt with company knowledge base | 1.4.1.1.1 |
| 1.4.1.1.6 | Implement response streaming | 1.4.1.1.3 |
| 1.4.1.1.7 | Add rate limiting for chat requests | 1.4.1.1.3 |
| 1.4.1.1.8 | Create coye
ntext retrieval for contacts, news, etc. | 1.4.1.1.5 |

### 1.4.1.2 Knowledge Base Setup
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.1.2.1 | Create FAQ schema (question, answer, category) | 1.1.1.2.2 |
| 1.4.1.2.2 | Build FAQ seeding script | 1.4.1.2.1 |
| 1.4.1.2.3 | Create policy document schema | 1.1.1.2.2 |
| 1.4.1.2.4 | Implement knowledge retrieval for chatbot | 1.4.1.1.5 |
| 1.4.1.2.5 | Create admin FAQ management interface | 1.4.1.2.1 |
| 1.4.1.2.6 | Create admin policy document upload | 1.4.1.2.3 |

### 1.4.1.3 Chatbot UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.1.3.1 | Create floating chat button component | 1.4.1.1.3 |
| 1.4.1.3.2 | Build chat window/drawer component | 1.4.1.3.1 |
| 1.4.1.3.3 | Create message bubble components (user/bot) | 1.4.1.3.2 |
| 1.4.1.3.4 | Implement chat input with send button | 1.4.1.3.2 |
| 1.4.1.3.5 | Add typing indicator during response | 1.4.1.1.6 |
| 1.4.1.3.6 | Implement streaming response display | 1.4.1.1.6 |
| 1.4.1.3.7 | Create suggested prompts/quick actions | 1.4.1.3.2 |
| 1.4.1.3.8 | Add chat history within session | 1.4.1.1.4 |
| 1.4.1.3.9 | Implement chat minimize/maximize | 1.4.1.3.2 |
| 1.4.1.3.10 | Add clear chat functionality | 1.4.1.3.2 |

---

## 1.4.2 Interactive Site Map

### 1.4.2.1 Backend Development
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.2.1.1 | Create Location schema (name, type, coordinates, description, contact) | 1.1.1.2.2 |
| 1.4.2.1.2 | Create MapLayer schema (name, image, bounds) | 1.1.1.2.2 |
| 1.4.2.1.3 | Create GET /api/map/locations endpoint | 1.4.2.1.1 |
| 1.4.2.1.4 | Create GET /api/map/layers endpoint | 1.4.2.1.2 |
| 1.4.2.1.5 | Create CRUD endpoints for locations | 1.4.2.1.1, 1.1.2.2.3 |
| 1.4.2.1.6 | Create map layer upload endpoint | 1.4.2.1.2 |
| 1.4.2.1.7 | Implement location search endpoint | 1.4.2.1.1 |

### 1.4.2.2 Interactive Map UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.2.2.1 | Research and select mapping library (Leaflet, OpenLayers) | None |
| 1.4.2.2.2 | Set up map container component | 1.4.2.2.1 |
| 1.4.2.2.3 | Implement custom map layer/image overlay | 1.4.2.1.4 |
| 1.4.2.2.4 | Create location markers | 1.4.2.1.3 |
| 1.4.2.2.5 | Implement marker clustering (if many locations) | 1.4.2.2.4 |
| 1.4.2.2.6 | Build location popup/tooltip with details | 1.4.2.2.4 |
| 1.4.2.2.7 | Implement zoom and pan controls | 1.4.2.2.2 |
| 1.4.2.2.8 | Create location type filter/legend | 1.4.2.2.4 |
| 1.4.2.2.9 | Implement location search with map focus | 1.4.2.1.7 |
| 1.4.2.2.10 | Add fullscreen toggle | 1.4.2.2.2 |
| 1.4.2.2.11 | Ensure mobile touch support | 1.4.2.2.2 |

### 1.4.2.3 Admin Map Management
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.2.3.1 | Create admin locations listing page | 1.1.2.3.5 |
| 1.4.2.3.2 | Build location creation form | 1.1.2.3.6 |
| 1.4.2.3.3 | Implement coordinate picker on map | 1.4.2.2.2 |
| 1.4.2.3.4 | Create location type management | 1.4.2.3.2 |
| 1.4.2.3.5 | Build map layer upload interface | 1.4.2.1.6 |
| 1.4.2.3.6 | Implement location edit and delete | 1.4.2.3.1 |

---

## 1.4.3 Gold Industry News

### 1.4.3.1 Backend Development
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.3.1.1 | Research and select news APIs/RSS feeds (Ghana, World) | None |
| 1.4.3.1.2 | Create ExternalNews schema (title, source, url, summary, date) | 1.1.1.2.2 |
| 1.4.3.1.3 | Build RSS feed parser utility | 1.4.3.1.1 |
| 1.4.3.1.4 | Build news API integration utility | 1.4.3.1.1 |
| 1.4.3.1.5 | Create news aggregation scheduled job | 1.4.3.1.3, 1.4.3.1.4 |
| 1.4.3.1.6 | Implement news deduplication | 1.4.3.1.5 |
| 1.4.3.1.7 | Create GET /api/gold-news endpoint | 1.4.3.1.2 |
| 1.4.3.1.8 | Implement news caching | 1.4.3.1.7 |
| 1.4.3.1.9 | Create fallback for API/feed failures | 1.4.3.1.5 |

### 1.4.3.2 Public Gold News UI
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.3.2.1 | Create gold news listing page | 1.4.3.1.7 |
| 1.4.3.2.2 | Build news card component with source badge | 1.4.3.2.1 |
| 1.4.3.2.3 | Implement Ghana/World filter tabs | 1.4.3.2.1 |
| 1.4.3.2.4 | Add external link handling (opens in new tab) | 1.4.3.2.2 |
| 1.4.3.2.5 | Implement auto-refresh for latest news | 1.4.3.2.1 |
| 1.4.3.2.6 | Add homepage gold news widget | 1.1.1.3.10 |
| 1.4.3.2.7 | Create loading state for news fetching | 1.4.3.2.1 |

### 1.4.3.3 Admin News Source Management
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.3.3.1 | Create NewsSource schema (name, url, type, active) | 1.1.1.2.2 |
| 1.4.3.3.2 | Create admin news sources listing | 1.4.3.3.1 |
| 1.4.3.3.3 | Build news source add/edit form | 1.4.3.3.2 |
| 1.4.3.3.4 | Implement source enable/disable toggle | 1.4.3.3.2 |
| 1.4.3.3.5 | Create manual news fetch trigger | 1.4.3.1.5 |
| 1.4.3.3.6 | Add feed health status display | 1.4.3.3.2 |

---

## 1.4.4 Mini Games

### 1.4.4.1 Games Infrastructure
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.1.1 | Create GameScore schema (game, player_name, score, date) | 1.1.1.2.2 |
| 1.4.4.1.2 | Create GET /api/games/leaderboard/:game endpoint | 1.4.4.1.1 |
| 1.4.4.1.3 | Create POST /api/games/score endpoint | 1.4.4.1.1 |
| 1.4.4.1.4 | Create games listing page | 1.1.1.3.1 |
| 1.4.4.1.5 | Build game card/selection component | 1.4.4.1.4 |
| 1.4.4.1.6 | Create reusable game layout wrapper | 1.4.4.1.4 |
| 1.4.4.1.7 | Build leaderboard component | 1.4.4.1.2 |
| 1.4.4.1.8 | Create name entry modal for high scores | 1.4.4.1.3 |

### 1.4.4.2 Safety Quiz Game
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.2.1 | Create QuizQuestion schema (question, options, answer, category) | 1.1.1.2.2 |
| 1.4.4.2.2 | Create quiz question seed data | 1.4.4.2.1 |
| 1.4.4.2.3 | Create GET /api/games/quiz/questions endpoint | 1.4.4.2.1 |
| 1.4.4.2.4 | Build quiz game component | 1.4.4.1.6 |
| 1.4.4.2.5 | Implement question display with options | 1.4.4.2.4 |
| 1.4.4.2.6 | Add timer for each question | 1.4.4.2.4 |
| 1.4.4.2.7 | Implement answer feedback (correct/incorrect) | 1.4.4.2.4 |
| 1.4.4.2.8 | Create score calculation and display | 1.4.4.2.4 |
| 1.4.4.2.9 | Integrate with leaderboard | 1.4.4.1.7 |
| 1.4.4.2.10 | Create admin quiz question management | 1.4.4.2.1 |

### 1.4.4.3 Hazard Hunt Game
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.3.1 | Create HazardImage schema (image, hazards coordinates, difficulty) | 1.1.1.2.2 |
| 1.4.4.3.2 | Create hazard image seed data | 1.4.4.3.1 |
| 1.4.4.3.3 | Build hazard hunt game component | 1.4.4.1.6 |
| 1.4.4.3.4 | Implement clickable image with hotspots | 1.4.4.3.3 |
| 1.4.4.3.5 | Add hazard found feedback animation | 1.4.4.3.3 |
| 1.4.4.3.6 | Implement timer and scoring | 1.4.4.3.3 |
| 1.4.4.3.7 | Create difficulty levels | 1.4.4.3.3 |
| 1.4.4.3.8 | Integrate with leaderboard | 1.4.4.1.7 |
| 1.4.4.3.9 | Create admin hazard image management | 1.4.4.3.1 |

### 1.4.4.4 Word Scramble Game
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.4.1 | Create WordList schema (word, hint, category) | 1.1.1.2.2 |
| 1.4.4.4.2 | Create mining/safety word seed data | 1.4.4.4.1 |
| 1.4.4.4.3 | Build word scramble game component | 1.4.4.1.6 |
| 1.4.4.4.4 | Implement letter scrambling logic | 1.4.4.4.3 |
| 1.4.4.4.5 | Create drag-and-drop or type input UI | 1.4.4.4.3 |
| 1.4.4.4.6 | Add hint system | 1.4.4.4.3 |
| 1.4.4.4.7 | Implement scoring with timer bonus | 1.4.4.4.3 |
| 1.4.4.4.8 | Integrate with leaderboard | 1.4.4.1.7 |

### 1.4.4.5 Memory Match Game
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.5.1 | Create MemoryCard schema (image, pair_id, category) | 1.1.1.2.2 |
| 1.4.4.5.2 | Create safety signs/equipment card set | 1.4.4.5.1 |
| 1.4.4.5.3 | Build memory game component | 1.4.4.1.6 |
| 1.4.4.5.4 | Implement card grid layout | 1.4.4.5.3 |
| 1.4.4.5.5 | Create card flip animation | 1.4.4.5.3 |
| 1.4.4.5.6 | Implement match checking logic | 1.4.4.5.3 |
| 1.4.4.5.7 | Add move counter and timer | 1.4.4.5.3 |
| 1.4.4.5.8 | Create difficulty levels (grid sizes) | 1.4.4.5.3 |
| 1.4.4.5.9 | Integrate with leaderboard | 1.4.4.1.7 |

### 1.4.4.6 Trivia Challenge Game
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.6.1 | Create TriviaQuestion schema (question, options, answer, category) | 1.1.1.2.2 |
| 1.4.4.6.2 | Create trivia seed data (mining, Ghana, company) | 1.4.4.6.1 |
| 1.4.4.6.3 | Build trivia game component | 1.4.4.1.6 |
| 1.4.4.6.4 | Implement category selection | 1.4.4.6.3 |
| 1.4.4.6.5 | Create progressive difficulty | 1.4.4.6.3 |
| 1.4.4.6.6 | Add lifelines (50/50, skip) | 1.4.4.6.3 |
| 1.4.4.6.7 | Implement scoring and streaks | 1.4.4.6.3 |
| 1.4.4.6.8 | Integrate with leaderboard | 1.4.4.1.7 |
| 1.4.4.6.9 | Create admin trivia question management | 1.4.4.6.1 |

### 1.4.4.7 Global Leaderboard
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.4.4.7.1 | Create global leaderboard page | 1.4.4.1.2 |
| 1.4.4.7.2 | Implement game tabs/filter | 1.4.4.7.1 |
| 1.4.4.7.3 | Create time period filter (daily, weekly, all-time) | 1.4.4.7.1 |
| 1.4.4.7.4 | Build top players display with ranks | 1.4.4.7.1 |
| 1.4.4.7.5 | Add homepage top scores widget | 1.1.1.3.10 |

---

## 1.5 CROSS-CUTTING CONCERNS

### 1.5.1 Testing
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.5.1.1 | Set up testing framework (Vitest/Jest) | 1.1.1.1.1 |
| 1.5.1.2 | Write unit tests for authentication utilities | 1.1.2.2 |
| 1.5.1.3 | Write unit tests for API endpoints | Per phase |
| 1.5.1.4 | Write integration tests for critical flows | Per phase |
| 1.5.1.5 | Perform cross-browser testing | Per phase |
| 1.5.1.6 | Perform mobile responsiveness testing | Per phase |
| 1.5.1.7 | Perform accessibility testing | Per phase |

### 1.5.2 Documentation
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.5.2.1 | Create API documentation | Per phase |
| 1.5.2.2 | Write admin user guide | Per phase |
| 1.5.2.3 | Create deployment documentation | 1.5.3.1 |
| 1.5.2.4 | Document environment variables and configuration | 1.1.1.1.5 |

### 1.5.3 Deployment
| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| 1.5.3.1 | Configure production build settings | 1.1.1.1.7 |
| 1.5.3.2 | Set up on-premise server environment | None |
| 1.5.3.3 | Configure MongoDB for production | 1.5.3.2 |
| 1.5.3.4 | Set up reverse proxy (Nginx) | 1.5.3.2 |
| 1.5.3.5 | Configure SSL certificates | 1.5.3.4 |
| 1.5.3.6 | Set up process manager (PM2) | 1.5.3.2 |
| 1.5.3.7 | Create deployment scripts | 1.5.3.1-6 |
| 1.5.3.8 | Configure backup automation | 1.5.3.3 |

---

## WBS Summary Statistics

| Phase | Sections | Total Tasks | Completed | Status |
|-------|----------|-------------|-----------|--------|
| Phase 1: Foundation & Core | 5 | ~95 | ~95 | ✅ 100% |
| Phase 2: Safety & Operations | 4 | ~65 | ~55 | 🔄 85% |
| Phase 3: Engagement & Feedback | 3 | ~55 | ~30 | 🔄 55% |
| Phase 4: Advanced Features | 4 | ~95 | ~16 | 🔄 17% |
| New Features (Added) | 4 | ~37 | ~31 | 🔄 84% |
| Cross-Cutting | 3 | ~20 | ~5 | 🔄 25% |
| **Total** | **23** | **~367** | **~232** | **~63%** |

---

## New Features Added (Not in Original WBS)

The following features were added during development:

### Policies Management ✅
- Policy & PolicyCategory schemas
- Full CRUD backend services
- Admin: policies listing, create, edit, categories
- Public: policies listing page, individual policy view

### Executive Messages 🔄
- ExecutiveMessage schema for CEO/leadership messages
- Backend services implemented
- Admin management interface

### IT Tips 🔄
- ITTip schema for IT department tips/guides
- Backend services implemented
- Admin management interface

### Company Info / About Page ✅
- CompanyInfo schema (vision, mission, core values)
- Backend services implemented
- Public About Us page

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | Developer | Initial WBS |
| 1.1 | 2026-01-18 | Developer | Phase 2 progress update |
| 1.2 | 2026-01-30 | Developer | Comprehensive status update - Phase 2-4 progress, new features added |
