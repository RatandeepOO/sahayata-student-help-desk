# Sahayata - Deployment Guide for Netlify

## 🚀 Deploying to Netlify

This guide will help you deploy the Sahayata help desk application to Netlify.

### Prerequisites

- A GitHub/GitLab/Bitbucket account
- A Netlify account (free tier works fine)
- Node.js 18+ installed locally

### Step 1: Prepare Your Repository

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Ensure the `netlify.toml` file is in your repository root

### Step 2: Connect to Netlify

1. Go to [netlify.com](https://www.netlify.com) and log in
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider and authorize Netlify
4. Select your repository

### Step 3: Configure Build Settings

Netlify should auto-detect Next.js settings, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18 or higher

### Step 4: Deploy

1. Click "Deploy site"
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like `https://random-name.netlify.app`

### Step 5: Custom Domain (Optional)

1. Go to "Domain settings" in your Netlify dashboard
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS

## 🔧 Environment Variables

This app uses localStorage for data persistence, so no environment variables are needed. All data is stored in the browser.

## 📝 Admin Credentials

Default admin accounts (hardcoded):

| Email | Password | Department |
|-------|----------|------------|
| cse@sahayata.com | CSEADMIN | CSE |
| elex@sahayata.com | ELEXADMIN | Electronics |
| pharma@sahayata.com | PHARMAADMIN | Pharmacy |
| mech@sahayata.com | MECHADMIN | Mechanical |
| elec@sahayata.com | ELECADMIN | Electrical |

## 🎓 User Roles

### Students
- Raise complaints
- View complaint status
- Volunteer to help other students
- Earn points by resolving issues
- Chat with volunteers
- View leaderboard

### Technical Team
- Accept complaints in their department
- Transfer complaints to other team members
- Mark complaints as resolved
- Earn points for resolved complaints

### Admins
- View all complaints
- Delete fraudulent complaints
- Manage technical team availability
- View student registry and points
- Send messages to students

## 📱 Features

- ✅ Authentication (Student/Technical/Admin)
- ✅ Gender-based avatar generation
- ✅ Complaint management system
- ✅ Points and leaderboard
- ✅ Real-time notifications
- ✅ Chat functionality
- ✅ Analytics dashboard
- ✅ Admin controls
- ✅ Technical team workflow
- ✅ Responsive design

## 🔄 Updates and Maintenance

To update your deployed app:

1. Make changes to your code locally
2. Push changes to your Git repository
3. Netlify will automatically rebuild and deploy

## 🐛 Troubleshooting

### Build Fails

- Check Node.js version is 18+
- Ensure all dependencies are in `package.json`
- Check build logs in Netlify dashboard

### App Not Loading

- Clear browser cache
- Check browser console for errors
- Verify the build completed successfully

### Data Not Persisting

- This app uses localStorage - data is browser-specific
- Each user/device will have separate data
- For production, consider migrating to a database

## 📞 Support

For issues or questions:
- Check the Netlify documentation: https://docs.netlify.com
- Review Next.js deployment guide: https://nextjs.org/docs/deployment

## 🎉 Success!

Your Sahayata help desk application is now live and ready to help students manage complaints efficiently!
