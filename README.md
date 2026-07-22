## AI Learning Platform

## Overview
The AI Learning Platform is an intelligent, automated, and interactive e-learning ecosystem designed to transform how individuals consume educational content. It converts raw study materials into structured curricula, providing real-time AI tutoring, automated quizzes, and seamless progress tracking.

## Problem Statement
Traditional e-learning systems and self-study workflows rely on static, one-size-fits-all content that fails to adapt to custom reference materials or individual learning paths. Learners and educators face a significant bottleneck in instantly converting raw study documents into structured curricula, generating dynamic practice assessments, and accessing real-time, context-aware tutoring without heavy manual effort.

## Our Solution
The platform automatically converts raw study materials such as PDFs into structured, dynamic curricula complete with context-aware tutoring, automated practice quizzes, real-time progress tracking, and secure authentication unified within an intuitive personal dashboard.

## Core Features
* **Advanced User Authentication:** Secure registration and login supporting email/password, Google OAuth, GitHub OAuth, and 6-digit OTP verification.
* **PDF Document Processing:** Upload and parse raw reference files to extract key concepts and study topics automatically.
* **AI-Powered Course Generation:** Instantly transforms uploaded documents into structured, modular courses and personalized learning paths.
* **Interactive AI Chatbot:** Real-time conversational assistant providing context-aware guidance and answering student questions.
* **Automated Quiz Generation:** Dynamic practice tests generated from course content to verify knowledge retention.
* **Learning Progress Tracking:** Real-time milestone monitoring and performance metric visualization.
* **Personalized User Dashboard:** Centralized control center to manage profiles, view enrolled courses, and track academic history.

## Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion, Lucide React, Axios.
* **Backend:** Node.js, Express, Mongoose, JWT, Brevo API(for mail), DOKER
* **Database:** MongoDB, AWS

## Getting Started

### Prerequisites
* Node.js installed on your machine.
* MongoDB database instance.
* Brevo API key for transactional email verification.

### Installation & Setup

Clone the repository and install dependencies for both frontend and backend:

```bash
git clone [https://github.com/your-username/ai-learning-platform.git](https://github.com/your-username/ai-learning-platform.git)
cd ai-learning-platform
```

### Backend SetupBashcd backend
```bash
npm install
```
Create a .env file in the backend directory:Code snippetPORT=5000
* MONGO_URI=your_mongodb_connection_string
* JWT_SECRET=your_jwt_secret
* BREVO_API_KEY=your_brevo_api_key
* BREVO_SENDER_EMAIL=your_verified_sender_email
* GOOGLE_CLIENT_ID=your_google_client_id
* GITHUB_CLIENT_ID=your_github_client_id
* GITHUB_CLIENT_SECRET=your_github_client_secret

Start the backend server
```bash
npm run dev
```

### Frontend SetupBashcd frontend

```bash
npm install
```

Create a .env.local file in the frontend directory:
```bash
Code snippet
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
 ```

Run the development server:
```bash
npm run dev
```
