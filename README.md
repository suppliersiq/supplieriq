# SupplierIQ

Supplier loyalty & performance management platform.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run the database schema
- Open your Supabase dashboard
- Go to **SQL Editor → New query**
- Paste the contents of `schema.sql` and click **RUN**

### 3. Create your admin account
- Go to Supabase dashboard → **Authentication → Users → Add user**
- Add your email + password
- Then run this SQL to set the admin role:
```sql
UPDATE auth.users
SET raw_user_meta_data = '{"role": "admin"}'
WHERE email = 'your@email.com';
```

### 4. Start the dev server
```bash
npm run dev
```

Open http://localhost:5173

## URL Map

| URL | Page | Who |
|-----|------|-----|
| / | Auto-redirect by role | Everyone |
| /login | Login (admin or supplier) | Public |
| /register | Supplier self-registration | Public |
| /dashboard | Main dashboard | Admin |
| /kiosk | QR scanner kiosk | Admin / Staff |
| /delivery | Delivery entry form | Admin / Staff |
| /targets | Target management | Admin |
| /portal-info | Info & pricing portal | Admin preview |
| /cms | Pricing & benefits CMS | Admin |
| /tier-engine | Tier engine simulator | Admin |
| /portal | Supplier portal (QR, targets, tier) | Supplier |

## Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Set these environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
