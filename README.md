# 🧠 AI Resume Builder

An intelligent, full-stack resume builder powered by GROQ AI — built with Next.js, MongoDB, and Tailwind CSS.

🔗 **Live Demo:- https://resume-builder-topaz-mu.vercel.app

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with HTTP-only cookies
- 📝 **Multi-step Resume Form** — Personal Info, Education, Skills, Projects, Experience, Achievements, Summary
- 🤖 **AI-Powered Content Generation** — GROQ AI generates professional summaries, skills, experience descriptions, and project descriptions
- 📄 **Resume Preview** — Live preview of your complete resume
- 📥 **PDF Download** — Download your resume as a PDF
- 📊 **ATS Score Checker** — Check how well your resume performs against ATS systems
- 💾 **Auto-save** — Every section auto-saves to MongoDB
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- 🛡️ **Route Protection** — Middleware-based auth guard on all protected routes

---

## 🛠️ Tech Stack

### Frontend
| Tech | Usage |
|---|---|
| Next.js 15 (App Router) | Framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Axios | HTTP client |

### Backend
| Tech | Usage |
|---|---|
| Next.js API Routes | REST API |
| MongoDB + Mongoose | Database |
| JWT + HTTP-only Cookies | Authentication |
| GROQ SDK | AI generation |
| bcrypt | Password hashing |

---

## 📁 Project Structure

```
resume-builder/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── resume/
│   │   │   │   ├── create/route.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── [resumeId]/route.ts
│   │   │   └── ai/
│   │   │       ├── generate-summery/route.ts
│   │   │       ├── generate-skills/route.ts
│   │   │       ├── generate-experience/route.ts
│   │   │       ├── generate-project-description/route.ts
│   │   │       ├── improve-content/route.ts
│   │   │       └── ats-score/route.ts
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── resume/
│   │       └── [resumeId]/
│   │           ├── personal-info/page.tsx
│   │           ├── education/page.tsx
│   │           ├── skills/page.tsx
│   │           ├── projects/page.tsx
│   │           ├── experience/page.tsx
│   │           ├── achievements/page.tsx
│   │           ├── summary/page.tsx
│   │           └── preview/page.tsx
│   ├── models/
│   │   ├── user.model.ts
│   │   └── resume.model.ts
│   ├── lib/
│   │   ├── db.ts
│   │   └── jwt.ts
│   └── types/
│       └── resume.types.ts
├── middleware.ts
├── .env.local
└── package.json
```

## 🌐 API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |

### Resume Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resume/create` | Create new resume |
| GET | `/api/resume` | Get all resumes |
| GET | `/api/resume/[resumeId]` | Get single resume |
| PATCH | `/api/resume/[resumeId]` | Update resume |
| DELETE | `/api/resume/[resumeId]` | Delete resume |

### AI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/generate-summery` | Generate professional summary |
| POST | `/api/ai/generate-skills` | Generate skills list |
| POST | `/api/ai/generate-experience` | Generate experience description |
| POST | `/api/ai/generate-project-description` | Generate project description |
| POST | `/api/ai/improve-content` | Improve existing content |
| POST | `/api/ai/ats-score` | Get ATS compatibility score |

---

## 🗺️ Resume Builder Flow

```
Register / Login
      ↓
  Dashboard
      ↓
Create New Resume
      ↓
  Personal Info → Education → Skills → Projects → Experience → Achievements → Summary
      ↓
 Preview Resume
      ↓
 Download PDF

---
## 👨‍💻 Author

**Deepanshu Kumar**
- GitHub: [@DEEPANSHU-KUMAR96](https://github.com/DEEPANSHU-KUMAR96)
