# Rakshith 360 - Professional Medical AI Assistant

A comprehensive, production-ready medical health assessment application powered by AI, built with React, TypeScript, Supabase, and Vercel.

## ✨ Features

### 🔐 Authentication & Security
- **Email/Password Authentication** via Supabase Auth
- **Password Reset** with secure email-based verification
- **Row-Level Security (RLS)** - Data isolation at the database level
- **Encrypted API Key Storage** - Secure management of provider credentials

### 💬 AI-Powered Chat Interface
- **Multiple AI Provider Support**:
  - **Google Gemini** - High-quality medical reasoning
  - **OpenRouter (FREE)** - Access to Mistral, LLaMA, MythoMax (free models)
  - **DeepSeek** - Alternative AI provider
  - **OpenAI (ChatGPT)** - Premium option
- **Smart Model Auto-Detection** for Gemini
- **Real-time Streaming** responses
- **Chat History** with persistent storage
- **Medical Disclaimer** with every session

### 👤 User Profile Management
- **Personal Information** - Name, Date of Birth, Blood Type
- **Emergency Contacts** - Critical medical information
- **Medical History Tracking**:
  - Allergies management
  - Current medications
  - Medical conditions
  - Vaccination records
- **Profile Completion Percentage** indicator
- **Data Persistence** to Supabase

### 📊 Medical Dashboard
- **Health Summary** - Overview of all medical data
- **Risk Assessment** - Automatic risk level calculation
- **Tabbed Interface** for organized information:
  - Overview tab
  - Medications tab
  - Conditions tab
  - Vaccination history
- **Export Options** - Download medical summary
- **Share Functionality** - Share app with friends

### 🏥 Hospital Recommendations
- **Location-Based Search** using Geoapify API
- **Hospital Filtering** by specialty
- **Distance Calculation** from current location
- **Professional Details** - Contact, ratings, website

### 📱 Responsive Design
- **Mobile-First Approach**
- **Adaptive Layouts** for all screen sizes
- **Touch-Friendly Interface**
- **Dark Mode Support**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- API keys (optional - free options available)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd Rakshith360

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

### Environment Setup

Create `.env.local` with:

```env
# Supabase (Required for backend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (Get free keys from these services)
VITE_GEMINI_API_KEY=your-gemini-key    # Free from Google AI Studio
VITE_OPENROUTER_API_KEY=your-key       # Free from OpenRouter (no credit card)
VITE_DEEPSEEK_API_KEY=your-key         # Optional
VITE_OPENAI_API_KEY=your-key           # Optional

# Location Services
VITE_GEOAPIFY_API_KEY=your-key         # Free from Geoapify
```

### Getting Free API Keys

1. **Google Gemini** (Recommended - high quality)
   - Visit: https://makersuite.google.com/app/apikey
   - Click "Get API Key"
   - Create new project
   - Copy API key

2. **OpenRouter** (FREE - No credit card needed!)
   - Visit: https://openrouter.ai
   - Sign up (GitHub/Google auth)
   - Copy API key
   - Access to free models: Mistral 7B, LLaMA 2, MythoMax

3. **Geoapify** (Free location services)
   - Visit: https://www.geoapify.com/
   - Sign up
   - Free tier includes 3,000 requests/month

### Running Locally

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5000`

## 🏗️ Architecture

### Frontend Stack
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - Component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend Stack
- **Supabase** (PostgreSQL database)
- **Supabase Auth** - User authentication
- **Row-Level Security (RLS)** - Data protection
- **Real-time subscriptions** - Live updates

### Deployment
- **Frontend**: Vercel
- **Backend**: Supabase Cloud
- **CDN**: Vercel Edge Network

## 📋 Database Schema

### Tables
1. **chat_sessions**
   - Stores user conversations
   - UUID-based IDs
   - Title and summary fields

2. **messages**
   - Individual chat messages
   - User ID and session FK
   - Role (user/ai) and timestamp

3. **medical_history**
   - User medical information
   - Allergies, medications, conditions, vaccinations
   - User-specific (RLS protected)

4. **api_keys**
   - Encrypted provider API keys
   - User-specific storage
   - Row-level security enabled

## 🔒 Security Features

### Authentication
- Supabase Auth handles password hashing
- Email verification for password reset
- JWT-based session management
- Automatic logout on auth state change

### Data Protection
- **Row-Level Security (RLS)** on all tables
- Users can only access their own data
- API keys never sent to frontend
- Sensitive data handled securely

### Privacy
- No tracking or analytics
- Medical data stays private
- Can export your data anytime
- Can delete account anytime

## 📖 Usage

### First Time Setup
1. **Register** with email and password
2. **Complete Onboarding** (privacy acknowledgement)
3. **Update Profile** - Add personal and medical information
4. **Configure API Keys** - Add your preferred AI provider key
5. **Start Chat** - Begin medical assessment

### Chat Interface
1. **Type Symptoms** - Describe your health concern
2. **AI Analysis** - Get medical assessment and recommendations
3. **Hospital Search** - Find nearby hospitals if needed
4. **Save Sessions** - All chats are automatically saved

### Medical Dashboard
1. **View Profile** - See all your medical information
2. **Track History** - Medications, allergies, conditions
3. **Export Data** - Download medical summary
4. **Share Profile** - Share the app with others

### Account Settings
- **Add/Update API Keys** - Switch between AI providers
- **Manage Profile** - Update personal information
- **View Security** - Check active sessions

## 🎯 Supported AI Models

### Gemini (Google)
- **gemini-2.0-flash** (default, fastest)
- **gemini-2.0-flash-thinking**
- **gemini-1.5-pro**
- **gemini-1.5-flash**

### OpenRouter (FREE!)
- **Mistral 7B** (Fast, good quality)
- **LLaMA 2** (Open source)
- **MythoMax** (Creative responses)

### DeepSeek
- High-quality reasoning
- Cost-effective

### OpenAI
- **GPT-4o** (Most capable)
- **GPT-4o Mini** (Fast & cheap)
- **GPT-3.5 Turbo**

## 🐛 Troubleshooting

### "Port 5000 already in use"
```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9
# Then restart
npm run dev
```

### "Invalid API key"
- Check key has no extra spaces
- Verify key is for correct provider
- For Gemini, ensure "Generative Language API" is enabled in Google Cloud

### "Database connection error"
- Check Supabase URL and key in .env.local
- Verify internet connection
- Check Supabase project is active

### "RLS permission denied"
- Ensure you're logged in
- Check Supabase RLS policies are enabled
- Verify user_id matches authenticated user

## 📊 Performance

- **Chat Response Time**: < 2 seconds (avg with Gemini)
- **Page Load**: < 1 second
- **Database Queries**: Optimized with indexes
- **Bundle Size**: ~500KB gzipped

## 🔄 CI/CD Pipeline

- **Automatic Deployments** on git push
- **Environment-specific builds** (dev/prod)
- **GitHub Actions** for testing
- **Vercel** for hosting

## 📝 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Ensure tests pass

## 📞 Support

For issues and support:
- Check GitHub Issues
- Review documentation
- Contact development team

## 🎓 Educational Use

This app is suitable for:
- Learning React & TypeScript
- Understanding Supabase integration
- Medical app development patterns
- AI integration examples
- Full-stack development

**Note**: This is a learning/demo application. For real medical advice, consult qualified healthcare professionals.

## 🚀 Future Roadmap

- [ ] Video consultations
- [ ] Doctor integration
- [ ] Prescription management
- [ ] Health tracking (steps, heart rate)
- [ ] Appointment scheduling
- [ ] Insurance integration
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Integration with health devices

---

**Made with ❤️ for better health accessibility**
