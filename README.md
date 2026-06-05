# Sales Order Management — Frontend

React single-page app for the Sales Order Management module (medical distribution).
Built with **Vite, React and Ant Design**.

> Backend (Express + MongoDB REST API) lives in a separate repository.

---

## Features / Screens

- **Create Order** — customer search, product autocomplete, editable items grid
  (Product · Stock · Qty · Rate · Discount · FOC · Total) with a live order summary
  (Subtotal · Discount · Total FOC · VAT · Grand Total), then submit → PDF + email
- **Order Listing** — view / search / filter (by customer, status, date) with an
  interactive **status workflow** dropdown, PDF download and email
- **Customers** — search + detail drawer (profile, credit, outstanding, purchase history)
- **Products** — search + detail drawer with **Comparison / Variations / Alternatives** tabs
- Fully **responsive** (desktop sidebar → mobile hamburger drawer; tables scroll on small screens)

---

## Tech Stack

| Area | Choice |
|---|---|
| Build tool | Vite 6 |
| UI | React 18 + Ant Design 5 |
| Routing | React Router 6 |
| HTTP | Axios |
| Dates | Day.js |

---

## Prerequisites

- **Node.js** 18+ (tested on Node 24)
- The **backend API** running (default `http://localhost:5000`) — see the backend repo

---

## Setup

```bash
# 1. install dependencies
npm install

# 2. (optional) configure the API base URL
cp .env.example .env        # Windows: copy .env.example .env

# 3. start the dev server
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (with API proxy) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Connecting to the Backend

**In development**, Vite proxies any `/api/*` request to `http://localhost:5000`
(configured in `vite.config.js`), so no extra setup is needed when both run locally.

**For a deployed build**, set the API base URL via an environment variable
(see `.env.example`):

```
VITE_API_BASE=https://your-backend-url.com/api
```

If unset, it defaults to `/api` (the dev proxy).

---

## Project Structure

```
frontend/
├── src/
│   ├── api/        # axios client + endpoint helpers
│   ├── pages/      # CustomersPage, ProductsPage, OrderCreatePage, OrdersPage
│   ├── utils/      # formatting + client-side order calc
│   ├── App.jsx     # layout + routing (responsive nav)
│   └── main.jsx    # entry point
├── index.html
├── vite.config.js
├── .env.example
└── package.json
```

---

## Notes

- The dev server runs on port **5173**; the backend on **5000**.
- Make sure the backend is running and seeded before using the app, otherwise
  pages will load but show "no data" / request errors.
