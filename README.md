# SplitStay

SplitStay is a modern, high-fidelity expense-splitting application designed to settle shared expenses (like hostel bills, trips, or roommate costs) with the absolute minimum number of transactions. 

It features two distinct surfaces:
1. **Public Landing Page**: A cinematic, GSAP-powered marketing surface with a premium aesthetic and rich micro-animations.
2. **Core Application**: A clean, correctness-first functional dashboard built for seamless group and expense management.

## 🚀 Features

- **Minimum-Cash-Flow Settlement Algorithm**: Calculates the absolute minimum number of transactions needed to settle all debts within a group.
- **Custom & Equal Splits**: Split expenses equally, by exact amounts, or by percentages.
- **Real-time Balance Tracking**: Keep track of net balances per user across all groups using optimized database aggregations.
- **JWT Authentication**: Secure user sign-up and login flow.
- **High-Fidelity UI/UX**: Magnetic buttons, noise overlays, scroll-triggered animations (via GSAP), and a polished design system.

## 🛠️ Technology Stack

**Frontend**
- React 19
- Vite
- Tailwind CSS v3.4.17
- GSAP 3 & ScrollTrigger
- Lucide React

**Backend**
- Python 3
- Flask (RESTful API)
- SQLite / MySQL

## 📁 Project Structure

```
Splitter/
├── backend/            # Flask REST API, Python models, & Settlement Logic
│   ├── app.py          # Main Flask application
│   ├── models.py       # Database models
│   ├── routes.py       # API Endpoints
│   ├── schema.sql      # Database schema definitions
│   └── settlement.py   # Minimum cash flow optimization algorithm
└── frontend/           # React frontend application
    ├── src/            # React components, pages, and hooks
    ├── public/         # Static assets
    ├── index.html      # Main HTML entry point
    └── package.json    # Frontend dependencies and scripts
```

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python 3.8+
- MySQL Server (or SQLite for local dev)

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize the database and start the server:
   ```bash
   flask run
   ```
   *(Ensure you have setup your `.env` for secrets like `JWT_SECRET_KEY` if required)*

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.

## 🧠 Settlement Algorithm
At the core of SplitStay is the **Settlement Optimizer**, a minimum-cash-flow algorithm. It calculates the net balance for each member in a group (total paid minus total owed). By pairing the member who owes the most with the member who is owed the most, it iteratively resolves debts to produce the shortest and simplest path to settle all balances.

## 📄 License
This project is open-source and available under the MIT License.
