https://siamese-dream.vercel.app

# Siamese Dream

A modern, full-stack dream journaling application that helps users record, analyze, and explore their dreams with advanced features including sleep tracking, symbol analysis, and community sharing.
<img width="1456" height="761" alt="Screenshot 2025-09-22 at 11 33 22 AM" src="https://github.com/user-attachments/assets/f02b9725-55e4-4ebe-954f-587ca45bea42" />

## Features

### Core Functionality
- **Dream Journaling**: Record detailed dream entries with rich content and summaries
- **Sleep Tracking**: Track sleep duration, quality, bedtime, and disruptions
- **Lucid Dream Detection**: Mark and filter lucid dreams
- **Mood Scoring**: Rate dream experiences on a numerical scale
- **Symbol Analysis**: Tag dreams with symbols and track patterns over time

### Analytics & Insights
- **Dream Analysis Dashboard**: Visualize dream patterns and statistics
- **Symbol Timeline**: Track symbol usage evolution over time
- **Sleep Pattern Analysis**: Correlate dreams with sleep quality metrics
- **Personal Statistics**: Total dreams, lucid dream frequency, mood trends

### Community Features
- **Dream Feed**: Discover and explore dreams from other users
- **Symbol Filtering**: Browse dreams by specific symbols
- **Popular Symbols**: See trending dream symbols across the community
- **User Profiles**: View other users' dream statistics and recent entries

### Advanced Search
- **Multi-criteria Search**: Filter by content, symbols, dates, mood, and lucidity
- **Date Range Filtering**: Search dreams within specific time periods
- **Mood Range Queries**: Find dreams within specific mood score ranges
- **Pagination Support**: Efficient browsing of large dream collections

## Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **React Router** - Client-side routing
- **Context API** - State management for authentication
- **CSS-in-JS** - Dynamic styling with hover effects and animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Robust relational database
- **bcrypt** - Password hashing and authentication
- **CORS** - Cross-origin resource sharing

### Database Schema
- **Users Table**: Authentication and profile data
- **Dreams Table**: Core dream entries with sleep data![Uploading Screenshot 2025-09-22 at 11.33.22 AM.png…]()

- **Symbols Table**: Reusable dream symbols
- **Dream_Symbols Table**: Many-to-many relationship linking

