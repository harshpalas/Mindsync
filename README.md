# MindSync

MindSync is a comprehensive personal productivity and study companion application designed to help users organize their academic and personal lives. It integrates task management, note-taking, journaling, and study tracking into a single, unified interface.

## 🚀 Key Features

- **📊 Smart Dashboard**: Get a snapshot of your day with pending tasks, quick stats, journal streaks, and recent activity.
- **📝 Journaling System**: specific daily journaling feature with streak tracking to build consistent habits.
- **📒 Advanced Note-Taking**: Create, organize, and search notes for your classes or personal thoughts.
- **✅ Task Management**: Track your to-dos with status updates (To Do, In Progress, Done).
- **📚 Study Tracker**: Manage your subjects, track progress, and organize study resources.
- **🔐 Secure Authentication**: Robust user authentication system powered by NextAuth.js.

## 🛠️ Tech Stack

This project is built using modern web technologies:

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Image Storage**: [Cloudinary](https://cloudinary.com/)
- **Date Handling**: [date-fns](https://date-fns.org/) & [React Day Picker](https://react-day-picker.js.org/)

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A MongoDB database (local or Atlas)
- A Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   \\\ash
   git clone https://github.com/yourusername/mindsync.git
   cd mindsync/Mindsync
   \\\

2. **Install dependencies**
   \\\ash
   npm install
   \\\

3. **Configure Environment Variables**
   Create a \.env.local\ file in the root directory and add the following variables:

   \\\env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key

   # Cloudinary (Optional, for image features)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email (Optional, for password reset)
   EMAIL_SERVER_USER=your_email_user
   EMAIL_SERVER_PASSWORD=your_email_password
   EMAIL_SERVER_HOST=smtp.example.com
   EMAIL_SERVER_PORT=587
   EMAIL_FROM=noreply@example.com
   \\\

4. **Run the development server**
   \\\ash
   npm run dev
   \\\

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

Mindsync/
│
├── app/                         # Next.js App Router (pages + APIs)
│   ├── api/                     # Backend API endpoints
│   ├── auth/                    # Authentication pages (signin, signup)
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main dashboard page
│
├── components/                  # Reusable UI components
│   ├── ui/                      # Shadcn UI primitive components
│   └── ...                      # Feature-specific components (JournalView, etc.)
│
├── lib/                         # Utilities & configurations
│   ├── mongodb.ts               # MongoDB connection setup
│   └── auth.ts                  # Authentication logic (NextAuth config)
│
├── types/                       # TypeScript type definitions
│
├── public/                      # Static assets (images, icons, etc.)
│
└── README.md                    # Project documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
