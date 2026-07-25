# Security Audit Report: SplitStay

## 1. Security Posture Rating

**🟠 NEEDS WORK — Significant gaps that would be exploitable.**

The application demonstrates some good fundamental practices, such as proper password hashing and use of parameterized database queries, which successfully prevents basic injection attacks. However, it suffers from critical authorization flaws (Broken Access Control / IDOR). The lack of cross-checks ensuring a user belongs to the group they are interacting with means any authenticated user can view, modify, or add expenses and members to *any* group in the system. Furthermore, tokens are stored insecurely in `localStorage` and never expire. These flaws must be addressed before any production deployment.

## 2. Critical And High Findings

- **CRITICAL**: Missing Authorization (IDOR) on group endpoints (`get_members`, `add_member`, `get_expenses`, `add_expense`, `get_balances`, `get_settlements`). An attacker can query or modify data for groups they are not a member of.
- **CRITICAL**: Insecure Expense Attribution (IDOR). In `add_expense`, the `payer_id` can be specified arbitrarily in the request body, allowing a user to maliciously attribute an expense to someone else.
- **HIGH**: Token stored in `localStorage` (`frontend/src/components/Login.jsx`). This makes the application highly susceptible to XSS token theft.
- **HIGH**: Missing JWT Expiration (`backend/app.py`). Tokens never expire (`JWT_ACCESS_TOKEN_EXPIRES = False`), meaning stolen tokens are valid forever.
- **HIGH**: Known Vulnerability in Frontend Dependency (`react-router-dom`). `npm audit` reports a high severity RSC Mode CSRF bypass vulnerability.
- **HIGH**: Hardcoded JWT Secret Fallback (`backend/app.py`). The app runs with a default 'super-secret-key-change-in-prod' if the environment variable is missing, instead of failing on startup.

## 3. Quick Wins

- Change `app.config['JWT_ACCESS_TOKEN_EXPIRES']` to a reasonable expiration time (e.g., 1 or 2 hours).
- Remove the default fallback for `JWT_SECRET_KEY` and make the app throw an error if it's missing on startup.
- Run `npm audit fix --force` in the frontend directory to patch the `react-router` vulnerability.
- Add `.env` and `.env.*` to `.gitignore` in both the `frontend` and `backend` directories.
- Fix the `add_expense` route to strictly use `payer_id = user_id` rather than trusting user input from the request body.

## 4. Prioritized Remediation Plan

1. **Fix Insecure Expense Attribution (IDOR)** (Critical, ~5 mins): In `routes.py`, remove `data.get('payer_id', user_id)` and forcefully set `payer_id = user_id` to prevent impersonation.
2. **Implement Group Authorization Checks** (Critical, ~45 mins): Add a helper function to verify `GroupMember` status for `user_id` and `group_id` across all `/groups/<id>/*` endpoints. Return a 403 Forbidden if the user is not a member.
3. **Move JWT from `localStorage` to HttpOnly Cookie** (High, ~60 mins): Update `Login.jsx` and the backend `app.py` to use `flask_jwt_extended`'s built-in cookie support (`JWT_TOKEN_LOCATION = ['cookies']`).
4. **Enable JWT Expiration & Enforce Secrets** (High, ~10 mins): Remove the `False` override for token expiration in `app.py`. Fail fast if `JWT_SECRET_KEY` is not present in the environment variables.
5. **Update Frontend Dependencies** (High, ~5 mins): Resolve the `react-router` CSRF bypass finding via `npm audit fix`.
6. **Add `.gitignore` to Backend** (Medium, ~5 mins): Ensure `.env` is ignored to prevent accidental credential commits.
7. **Implement Input Validation** (Medium, ~30 mins): Add a library like `marshmallow` or use `pydantic` to validate incoming JSON payloads strictly (e.g., ensuring `amount` is positive).
8. **Configure CORS Properly** (Medium, ~10 mins): Restrict `flask-cors` in `app.py` to only allow requests from the exact frontend origin (e.g., `http://localhost:5173`), rather than `*`.

## 5. What's Already Done Right

- **SQL Injection Prevention**: The codebase correctly uses SQLAlchemy's `text()` with parameterized variables (e.g., `:group_id`), mitigating raw SQL injections even in complex queries.
- **Password Security**: Uses `werkzeug.security.generate_password_hash` correctly to store salted hashes (defaults to scrypt/pbkdf2), preventing plain-text password exposure.
- **Authentication Check**: Almost all sensitive API endpoints are protected with `@jwt_required()`, meaning unauthenticated guests cannot access the API.
- **HTTP Methods**: Operations correctly use appropriate HTTP methods (e.g., POST for adding expenses/members, GET for fetching data).

## 6. Checklist Summary

1.1 ❌  1.2 ❌  1.3 ✅  1.4 ⚠️  1.5 ⬚  1.6 ❌
2.1 ⬚  2.2 ⬚  2.3 ⬚  2.4 ⬚  2.5 ⬚  2.6 ⬚  2.7 ✅  2.8 ⬚
3.1 ✅  3.2 ❌  3.3 ⬚  3.4 ⬚  3.5 ❌  3.6 ❌  3.7 ⬚  3.8 ⬚
4.1 ❌  4.2 ❌  4.3 ⚠️  4.4 ✅  4.5 ❌  4.6 ⬚
5.1 ❌  5.2 ✅  5.3 ✅  5.4 ❌  5.5 ⚠️
6.1 ⬚  6.2 ❌  6.3 ❌
7.1 ❌  7.2 ⬚
8.1 ⬚  8.2 ⬚  8.3 ⬚

---

## Detailed Findings

┌─────────────────────────────────────────────────────────┐
│ FINDING #1                                              │
├──────────┬──────────────────────────────────────────────┤
│ Severity │ CRITICAL                                     │
│ Category │ Missing Authorization (IDOR)                 │
│ Location │ backend/routes.py:100, 74, 82, 131, 169, 208 │
│ CWE      │ CWE-285 (Improper Authorization)             │
├──────────┴──────────────────────────────────────────────┤
│ What's wrong:                                           │
│ The API endpoints for accessing or modifying a group's  │
│ data (members, expenses, balances) require a valid JWT  │
│ but do not check if the requesting user is actually a   │
│ member of that specific `group_id`.                     │
│                                                         │
│ Why it matters:                                         │
│ Any authenticated user on the platform can simply       │
│ guess or iterate over group IDs (1, 2, 3...) to view    │
│ all expenses, see who is in the group, and add          │
│ themselves or others to any group.                      │
│                                                         │
│ The vulnerable code:                                    │
│ ```python                                               │
│ @api_bp.route('/groups/<int:group_id>/expenses', methods=['GET'])
│ @jwt_required()
│ def get_expenses(group_id):
│     user_id = int(get_jwt_identity())
│     # Missing check if user_id is in group_id!
│     expenses = Expense.query.filter_by(group_id=group_id)...
│ ```                                                     │
│                                                         │
│ The fix:                                                │
│ ```python                                               │
│ @api_bp.route('/groups/<int:group_id>/expenses', methods=['GET'])
│ @jwt_required()
│ def get_expenses(group_id):
│     user_id = int(get_jwt_identity())
│     
│     # Add authorization check
│     membership = GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first()
│     if not membership:
│         return jsonify({"message": "Unauthorized"}), 403
│         
│     expenses = Expense.query.filter_by(group_id=group_id)...
│ ```                                                     │
│                                                         │
│ Effort: ~45 minutes (Requires helper function & update) │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FINDING #2                                              │
├──────────┬──────────────────────────────────────────────┤
│ Severity │ CRITICAL                                     │
│ Category │ Insecure Identity from Request Body          │
│ Location │ backend/routes.py:135                        │
│ CWE      │ CWE-639 (Auth Bypass Through User-Controlled Key)
├──────────┴──────────────────────────────────────────────┤
│ What's wrong:                                           │
│ In the `add_expense` route, the application takes the   │
│ `payer_id` from the request JSON payload.               │
│                                                         │
│ Why it matters:                                         │
│ An attacker can intercept the POST request and change   │
│ the `payer_id` to the ID of another user. They could    │
│ create fraudulent expenses where someone else pays for  │
│ the attacker's debts, entirely manipulating balances.   │
│                                                         │
│ The vulnerable code:                                    │
│ ```python                                               │
│ @api_bp.route('/groups/<int:group_id>/expenses', methods=['POST'])
│ @jwt_required()
│ def add_expense(group_id):
│     user_id = int(get_jwt_identity())
│     data = request.get_json()
│     
│     payer_id = data.get('payer_id', user_id) # VULNERABLE
│ ```                                                     │
│                                                         │
│ The fix:                                                │
│ ```python                                               │
│ @api_bp.route('/groups/<int:group_id>/expenses', methods=['POST'])
│ @jwt_required()
│ def add_expense(group_id):
│     user_id = int(get_jwt_identity())
│     data = request.get_json()
│     
│     # Force the payer to be the authenticated user
│     payer_id = user_id 
│ ```                                                     │
│                                                         │
│ Effort: ~5 minutes                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FINDING #3                                              │
├──────────┬──────────────────────────────────────────────┤
│ Severity │ HIGH                                         │
│ Category │ Insecure Session Storage                     │
│ Location │ frontend/src/components/Login.jsx:19         │
│ CWE      │ CWE-312 (Cleartext Storage of Sensitive Info)│
├──────────┴──────────────────────────────────────────────┤
│ What's wrong:                                           │
│ The JWT access token is stored in `localStorage` in the │
│ browser.                                                │
│                                                         │
│ Why it matters:                                         │
│ `localStorage` is accessible to any JavaScript running  │
│ on the origin. If an attacker finds a single XSS        │
│ vulnerability, they can steal the user's token and      │
│ fully hijack their session.                             │
│                                                         │
│ The vulnerable code:                                    │
│ ```javascript                                           │
│ const res = await api.post('/auth/login', { email, password });
│ localStorage.setItem('token', res.data.token);
│ ```                                                     │
│                                                         │
│ The fix:                                                │
│ ```javascript                                           │
│ // Backend: Configure Flask-JWT-Extended to use cookies
│ // app.config['JWT_TOKEN_LOCATION'] = ['cookies']
│ // app.config['JWT_COOKIE_SECURE'] = True
│ // app.config['JWT_COOKIE_CSRF_PROTECT'] = True
│ 
│ // Frontend: Let the browser handle cookies automatically.
│ // Remove localStorage calls and ensure axios sends credentials:
│ // axios.defaults.withCredentials = true;
│ ```                                                     │
│                                                         │
│ Effort: ~60 minutes                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FINDING #4                                              │
├──────────┬──────────────────────────────────────────────┤
│ Severity │ HIGH                                         │
│ Category │ Missing JWT Expiration                       │
│ Location │ backend/app.py:18                            │
│ CWE      │ CWE-613 (Insufficient Session Expiration)    │
├──────────┴──────────────────────────────────────────────┤
│ What's wrong:                                           │
│ `JWT_ACCESS_TOKEN_EXPIRES` is set to `False`, disabling │
│ token expiration entirely.                              │
│                                                         │
│ Why it matters:                                         │
│ If a token is compromised (e.g., via the localStorage   │
│ vulnerability above), the attacker maintains permanent  │
│ access to the user's account until the JWT secret key   │
│ itself is rotated server-side.                          │
│                                                         │
│ The vulnerable code:                                    │
│ ```python                                               │
│ app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False # Disable expiration for development
│ ```                                                     │
│                                                         │
│ The fix:                                                │
│ ```python                                               │
│ from datetime import timedelta
│ app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
│ ```                                                     │
│                                                         │
│ Effort: ~5 minutes                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FINDING #5                                              │
├──────────┬──────────────────────────────────────────────┤
│ Severity │ HIGH                                         │
│ Category │ Hardcoded Secrets & Missing Validation       │
│ Location │ backend/app.py:17                            │
│ CWE      │ CWE-798 (Use of Hard-coded Credentials)      │
├──────────┴──────────────────────────────────────────────┤
│ What's wrong:                                           │
│ The application provides a fallback secret key for JWT  │
│ generation if the environment variable is not set.      │
│                                                         │
│ Why it matters:                                         │
│ If deployed to production without `JWT_SECRET_KEY` set, │
│ it will silently run using 'super-secret-key-change-in-prod'.
│ An attacker knowing this codebase can forge valid JWTs  │
│ for any user and completely compromise the system.      │
│                                                         │
│ The vulnerable code:                                    │
│ ```python                                               │
│ app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-in-prod')
│ ```                                                     │
│                                                         │
│ The fix:                                                │
│ ```python                                               │
│ secret = os.environ.get('JWT_SECRET_KEY')
│ if not secret:
│     raise ValueError("No JWT_SECRET_KEY set for application")
│ app.config['JWT_SECRET_KEY'] = secret
│ ```                                                     │
│                                                         │
│ Effort: ~5 minutes                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FINDING #6                                              │
├──────────┬──────────────────────────────────────────────┤
│ Severity │ HIGH                                         │
│ Category │ Outdated / Vulnerable Dependency             │
│ Location │ frontend/package.json                        │
│ CWE      │ CWE-1035 (Vulnerable 3rd Party Component)    │
├──────────┴──────────────────────────────────────────────┤
│ What's wrong:                                           │
│ `npm audit` flagged two high-severity vulnerabilities   │
│ in `react-router` and `react-router-dom` (RSC Mode CSRF │
│ Bypass).                                                │
│                                                         │
│ Why it matters:                                         │
│ Attackers could exploit this to perform CSRF attacks,   │
│ executing arbitrary route actions on behalf of the user.│
│                                                         │
│ The vulnerable code:                                    │
│ ```json                                                 │
│ "react-router-dom": "^7.18.1"                           │
│ ```                                                     │
│                                                         │
│ The fix:                                                │
│ ```bash                                                 │
│ npm audit fix --force                                   │
│ ```                                                     │
│                                                         │
│ Effort: ~10 minutes                                     │
└─────────────────────────────────────────────────────────┘
