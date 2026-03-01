# 🎉 CelebrateHub

> A full-stack-style event management platform built in HTML, CSS & JavaScript.

---

## 📁 Folder Structure

```
CelebrateHub/
├── css/
│   ├── style.css        ← Global variables, buttons, forms, navbar, footer
│   ├── public.css       ← Home, About, Services, Contact pages
│   ├── auth.css         ← Login, Register, Role Selection pages
│   └── dashboard.css    ← User & Vendor dashboards
│
├── js/
│   ├── state.js         ← Global state, localStorage, seed data
│   ├── router.js        ← Navigation helpers
│   ├── auth.js          ← Login, Register, OTP logic
│   ├── user.js          ← User dashboard rendering
│   ├── vendor.js        ← Vendor dashboard rendering
│   └── modals.js        ← Booking, Payment, Rating, Photos modals
│
├── pages/
│   ├── index.html           ← Home page
│   ├── about.html           ← About CelebrateHub
│   ├── services.html        ← All service categories
│   ├── contact.html         ← Contact form + info
│   ├── login.html           ← Login page
│   ├── register.html        ← Registration page
│   ├── role.html            ← Role selection (User / Vendor)
│   ├── user-dashboard.html  ← Customer dashboard
│   └── vendor-dashboard.html← Vendor dashboard
│
└── README.md
```

---

## 🚀 How to Run

1. Open the `pages/` folder
2. Double-click `index.html` to open in your browser
3. Navigate using the navbar

> No server required. All data is stored in `localStorage`.

---

## 🔐 Login Instructions

- **Demo OTP**: `123456` (works for all logins)
- Register a new account or use any email + OTP `123456` to log in

---

## 📋 Features

### Public Pages
| Page | Description |
|------|-------------|
| Home | Hero + service categories + stats |
| About | Mission, vision, team, how it works |
| Services | All 9 service categories with details |
| Contact | Contact info + message form + FAQ |

### Auth Flow
| Page | Description |
|------|-------------|
| Register | Username, Email, Mobile, OTP |
| Login | Email + OTP → Role Selection |
| Role Selection | Choose Customer or Vendor |

### User Dashboard (Customer)
| Tab | Features |
|-----|----------|
| Home | Browse all services with search & price/category filters |
| Services | Each card shows: name, location, price, owner, mobile, photos, invitation card, book & wishlist |
| My Bookings | View status, pay 💳, rate ⭐, delete 🗑 bookings |
| Wishlist | Saved/hearted services |
| Profile | Account details + recent bookings summary |

### Vendor Dashboard
| Tab | Features |
|-----|----------|
| Overview | Stats (services, pending, accepted) + nearby services |
| My Services | All vendor's listed services with delete option |
| Add Service | Full form to publish a new service |
| Requests | Accept ✅ or Reject ❌ customer booking requests |

---

## 🎨 Design

- **Font**: Playfair Display (headings) + DM Sans (body)
- **Colors**: Deep purple/navy + Gold + Rose
- **Theme**: Luxury event planning aesthetic
- **Responsive**: Works on mobile, tablet, desktop

---

## 🛠 Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — No frameworks, no dependencies
- **localStorage** — Persistent data storage

---

*Built with ❤️ for CelebrateHub*
