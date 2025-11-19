# Sahayata - College Help Desk System

A comprehensive help desk application for college students to raise complaints, volunteer to help peers, and earn points for resolving issues.

## 🎯 Features

### For Students
- **Raise Complaints**: Submit detailed complaints with title, description, category, difficulty, emergency status, and fix deadline
- **Volunteer System**: Help fellow students by volunteering to resolve their complaints
- **Points & Leaderboard**: Earn points based on difficulty (Easy: 10, Medium: 25, Hard: 50)
- **Real-time Notifications**: Get notified when complaints are resolved or messages received
- **Chat Functionality**: Communicate with volunteers working on your complaints
- **Analytics Dashboard**: View complaint statistics with interactive charts
- **Profile Management**: Update personal information and avatar

### For Technical Team
- **Department-based Assignment**: View complaints filtered by your department
- **Accept/Transfer**: Accept complaints or transfer them to other team members
- **Track Progress**: Monitor active tasks and completed work
- **Earn Points**: Get rewarded for resolving complaints

### For Admins
- **Complaint Overview**: Monitor all complaints across departments
- **Fraud Detection**: Remove unwanted or fraudulent complaints
- **Team Management**: Check technical team availability status
- **Student Registry**: View all students with their points and achievements
- **Messaging**: Send direct messages to students

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Components**: Shadcn/UI + Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Storage**: LocalStorage (browser-based)
- **Date Handling**: date-fns

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Admin Credentials

| Email | Password | Department |
|-------|----------|------------|
| cse@sahayata.com | CSEADMIN | CSE |
| elex@sahayata.com | ELEXADMIN | Electronics |
| pharma@sahayata.com | PHARMAADMIN | Pharmacy |
| mech@sahayata.com | MECHADMIN | Mechanical |
| elec@sahayata.com | ELECADMIN | Electrical |

## 🌐 Deployment

This app is optimized for Netlify deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Deploy with default Next.js settings
4. Your app is live!

## 📱 User Guide

### Students

1. **Sign Up**: Create an account with your details (name, branch, roll number, etc.)
2. **Raise a Complaint**: Click "Raise Complaint" and fill in the form
3. **Volunteer**: Go to the Volunteer tab to help others and earn points
4. **Track Progress**: Monitor your complaints in the Dashboard
5. **Check Leaderboard**: See where you rank among peers

### Technical Team

1. **Sign Up**: Register as technical team with your department
2. **View Complaints**: See open complaints for your department
3. **Accept Tasks**: Click "Accept" to start working on a complaint
4. **Resolve**: Mark complaints as resolved when fixed
5. **Transfer**: Transfer complaints to other team members if needed

### Admins

1. **Login**: Use admin credentials
2. **Monitor**: View all complaints and their status
3. **Manage**: Delete fraudulent complaints
4. **Control**: Toggle technical team availability
5. **Communicate**: Send messages to students

## 🎨 Key Components

- **Authentication System**: Login/Signup with role-based routing
- **Dashboard**: Stats, charts, and complaint management
- **Volunteer Page**: Browse and accept open complaints
- **Leaderboard**: Gamified ranking system
- **Notifications**: Real-time updates on activity
- **Profile**: Customizable user profiles with avatars
- **Admin Panel**: Complete control over the system
- **Technical Dashboard**: Workflow for maintenance teams

## 🔧 Configuration

### Categories
- Electrical
- Mechanical
- Networking
- Plumbing
- Civil
- Other

### Difficulty Levels
- Easy (10 points)
- Medium (25 points)
- Hard (50 points)

### Complaint Status
- Open
- In Progress
- Resolved
- Closed

## 📊 Data Storage

This application uses browser localStorage for data persistence. Each user's data is stored locally on their device. For production use with multiple users, consider migrating to:

- Firebase
- Supabase
- MongoDB
- PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Acknowledgments

Built with ❤️ for college students to make campus life easier by providing a streamlined way to report and resolve issues.