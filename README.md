# AI Resume Enhancer

An AI-powered web application that analyzes resumes and provides suggestions to improve clarity, professionalism, and ATS (Applicant Tracking System) compatibility.

## Overview

AI Resume Enhancer helps job seekers strengthen their resumes by leveraging AI to identify weak sections, improve wording, and generate actionable recommendations. The application aims to increase resume quality and improve chances of passing automated resume screening systems.

## Features

### Resume Analysis

* Upload or paste resume content
* Analyze resume structure and formatting
* Identify missing or weak sections

### AI-Powered Suggestions

* Improve professional wording
* Enhance achievement descriptions
* Suggest stronger action verbs
* Optimize content for ATS screening

### Skill Enhancement

* Detect technical and soft skills
* Recommend relevant skills based on target roles
* Highlight skill gaps

### User-Friendly Interface

* Clean and responsive design
* Instant feedback and recommendations
* Easy-to-read analysis results

## Tech Stack

### Frontend
* React
  

### Backend

* Node.js
* Express.js

### AI Integration

* OpenAI API

### Deployment

* Vercel
* Render

## How It Works

1. User uploads or pastes resume content.
2. Resume data is sent to the backend.
3. AI analyzes the resume.
4. Suggestions and improvements are generated.
5. Results are displayed in an organized format.
6. User can update and refine the resume based on recommendations.

## Architecture

```text
Frontend (Next.js)
        │
        ▼
Backend (Express.js)
        │
        ▼
    Gemini API
        │
        ▼
Generated Resume Feedback
```

## Future Improvements

* PDF and DOCX resume uploads
* Resume scoring system
* Role-specific resume optimization
* Cover letter generation
* Keyword matching against job descriptions
* Download enhanced resume

## Installation

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
npm install
node index.js
```


Built to help job seekers improve resume quality using AI-powered analysis and recommendations.
