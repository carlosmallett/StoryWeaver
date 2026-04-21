# StoryWeaver - Complete User Flow with Authentication

## 🔐 Authentication Flow

### **1. Landing Page (Login)**
**Route:** `/` or `/login`

**First-time visitors see:**
- StoryWeaver logo and tagline
- Login form with:
  - Email field
  - Password field
  - "Sign In" button
- Link to create account ("Don't have an account? Sign up")
- Info card explaining the platform benefits

**Returning users:**
- Enter credentials
- Click "Sign In"
- Redirected to `/welcome` page

---

### **2. Sign Up Page**
**Route:** `/signup`

**New users create account:**
- Full name field
- Email field
- Password field (minimum 6 characters)
- Confirm password field
- "Create Account" button
- Link back to login ("Already have an account? Sign in")

**Benefits displayed:**
- ✓ Personalized reading levels
- ✓ Adaptive learning questions
- ✓ Track progress over time

**After signup:**
- Account created with Supabase Auth
- Email auto-confirmed (no email verification needed)
- User automatically signed in
- Redirected to `/welcome` page

---

## 🎓 Post-Authentication Flow

### **3. Welcome Page (Main Hub)**
**Route:** `/welcome`

**Protected page** - requires authentication

**User sees:**
- Personalized greeting: "Welcome, [Name]! 👋"
- Sign Out button (top right)
- Two main cards:
  - **Student Zone** → Takes to interest quiz
  - **Parent Dashboard** → Shows metrics
- "How it Works" section
- "Skip to Library" button for returning users

---

### **4. Interest Quiz & Diagnostic**
**Route:** `/quiz`

**Protected page** - requires authentication

Same 3-step process:
1. Enter student name and grade
2. Choose 2+ interests from 8 categories
3. Quick reading diagnostic (grades 3-4 only)

**Result:** Profile saved and redirected to Library

---

### **5. Story Library**
**Route:** `/library`

**Protected page** - requires authentication

**Navigation includes:**
- Home button → Returns to `/welcome`
- Progress button → Goes to `/dashboard`

Browse and select stories as before

---

### **6. Adaptive Reading Session**
**Route:** `/read/:topicId`

**Protected page** - requires authentication

Same adaptive reading experience with:
- Dynamic typography
- Comprehension questions
- Adaptive scaffolding
- Metrics tracking

---

### **7. Parent Dashboard**
**Route:** `/dashboard`

**Protected page** - requires authentication

View all reading metrics and progress

**Navigation:**
- Home button → Returns to `/welcome`

---

## 🔒 Security Features

### **Authentication State Management**
- **AuthContext** manages user session
- Checks for existing session on app load
- Stores user ID in localStorage
- Provides auth methods: `signIn`, `signUp`, `signOut`, `getAccessToken`

### **Protected Routes**
- All pages except `/login` and `/signup` are protected
- Unauthenticated users automatically redirected to `/login`
- Shows loading spinner while checking auth state

### **Backend Authentication**
- **Signup endpoint** (`POST /signup`):
  - Uses Supabase Admin API
  - Creates user with service role key
  - Auto-confirms email (no email server needed)
  - Stores user metadata (name)
- **Session tokens**: Frontend uses Supabase client for auth
- **User data**: Each user has unique ID for tracking progress

---

## 📊 Complete User Journey

```
1. Visit site → Login Page (/)
   ├─ New user? → Click "Sign up" → Signup Page (/signup)
   │   └─ Create account → Auto login → Welcome Page
   └─ Existing user? → Enter credentials → Welcome Page

2. Welcome Page (/welcome)
   ├─ Student Zone → Interest Quiz (/quiz)
   │   └─ Complete quiz → Library (/library)
   │       └─ Select story → Reading Session (/read/:topicId)
   │           └─ Complete → Back to Library
   └─ Parent Dashboard (/dashboard)
       └─ View metrics → Continue Reading → Library

3. Logout
   └─ Sign Out button → Back to Login Page
```

---

## 🛡️ Data Security

### **What's Stored**
- **Supabase Auth**: Email, encrypted password, user metadata (name)
- **KV Store**: User profiles, reading metrics, story data
- **localStorage**: User ID, cached profile (local only)

### **Access Control**
- Service role key NEVER sent to frontend
- Only used in server-side signup endpoint
- Frontend uses public anon key
- Session tokens for authenticated requests

---

## 🚀 Technical Implementation

### **Frontend Auth Components**
- `AuthContext.tsx` - Auth state management
- `ProtectedRoute.tsx` - Route protection wrapper
- `LoginPage.tsx` - Login form
- `SignupPage.tsx` - Registration form

### **Backend Endpoints**
- `POST /signup` - Create new user account
- All other endpoints remain the same

### **Session Management**
- Supabase handles session tokens
- Frontend checks session on mount
- Automatic token refresh
- Persisted across page reloads

---

## 🎯 User Experience Benefits

1. **Seamless Authentication**
   - No email verification required
   - Fast signup process
   - Auto-login after signup

2. **Persistent Sessions**
   - Stay logged in across visits
   - Secure token management
   - Easy sign out

3. **Protected Content**
   - Personalized experience
   - User-specific data
   - Private progress tracking

4. **Multi-User Support**
   - Multiple students can have accounts
   - Each has own profile and metrics
   - Parents can view child's dashboard

---

## 📝 Setup Requirements

### **Required Secrets in Supabase**
1. `OPENAI_API_KEY` - For story generation (already documented)
2. `SUPABASE_URL` - Auto-configured
3. `SUPABASE_ANON_KEY` - Auto-configured
4. `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured

No additional setup needed for authentication!

---

## 🔄 Flow Comparison

### **Before (Old Flow)**
```
Welcome → Choose Student/Parent → Quiz/Dashboard → Library → Read
```

### **After (With Auth)**
```
Login/Signup → Welcome → Choose Student/Parent → Quiz/Dashboard → Library → Read
                  ↑
                  └── Sign Out returns here
```

The authentication layer adds security while maintaining the same educational experience!
