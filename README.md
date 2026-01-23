# OJT Hours Tracker

A modern, fully responsive web application to track On-the-Job Training (OJT) hours with a clean and intuitive interface.

## 🚀 Features

- **Company Details Input**: Enter company name and total required OJT hours
- **Time Records Management**: 
  - Add new time entries
  - Edit time in/out records inline
  - Delete entries
  - Automatic hour calculation
- **Progress Tracking**: 
  - Visual progress bar
  - Hours completed, remaining, and total display
  - Real-time updates
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, glassmorphic design with smooth animations

## 🛠️ Tech Stack

- **React** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development
- Custom gradient designs and animations

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Header.tsx          # App header with title and date
│   ├── CompanyInput.tsx    # Company name and total hours input
│   ├── HoursProgress.tsx   # Progress tracking and statistics
│   └── TimeRecords.tsx     # Time in/out records management
├── App.tsx                 # Main application component
├── App.css                 # Custom styles and animations
└── index.css               # Global styles with Tailwind
```

## 🎨 Features per File

### Header.tsx
- Displays app title with gradient icon
- Shows current date
- Responsive design

### CompanyInput.tsx
- Input field for company name
- Input field for total required hours
- Glassmorphic card design with hover effects

### HoursProgress.tsx
- Animated progress bar
- Statistics grid showing completed, remaining, and total hours
- Status message with dynamic colors
- Percentage calculation

### TimeRecords.tsx
- List of time entries with date formatting
- Editable time in/out fields
- Add new entry button
- Delete functionality
- Automatic hours calculation
- Scrollable list with custom styling

## 🎯 Usage

1. **Set Company Details**: Enter your company name and total required OJT hours
2. **Add Time Records**: Click the "+ Add" button to create new time entries
3. **Edit Times**: Click on the time fields to adjust time in/out
4. **Track Progress**: View your progress in the Hours Summary card
5. **Delete Entries**: Click the trash icon to remove unwanted entries

## 📱 Responsive Design

The app is fully responsive with:
- Desktop: Two-column grid layout
- Tablet: Stacked cards with optimized spacing
- Mobile: Single column with touch-friendly controls

## 🎨 Design Philosophy

The design follows modern web design principles:
- Glassmorphism effects
- Smooth gradient backgrounds
- Micro-animations for better UX
- Color-coded statistics
- Clean typography with Inter font

## 📝 License

MIT License - Feel free to use this project for your OJT tracking needs!

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
