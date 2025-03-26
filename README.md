# AI Agent Framework

A modern framework for building AI-powered applications with OpenAI integration.

## Features

- Workspace management
- AI agent creation and management
- Group collaboration
- Chat functionality
- Prompt management
- OpenAI integration
- Secure authentication
- Rate limiting
- PostgreSQL database

## Tech Stack

- Frontend: React, TypeScript, TailwindCSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI: OpenAI GPT-4
- Authentication: JWT

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-agent-framework.git
cd ai-agent-framework
```

2. Install dependencies:
```bash
# Install shared package dependencies
cd shared
npm install

# Install server dependencies
cd ../server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables:

Create `.env` files in both server and client directories:

Server (.env):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_agent_framework
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
OPENAI_API_KEY=your_openai_api_key
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173
```

Client (.env):
```env
VITE_API_URL=http://localhost:3000
```

4. Set up the database:
```bash
cd server
npm run db:generate
npm run db:push
```

5. Start the development servers:

Server:
```bash
cd server
npm run dev
```

Client:
```bash
cd client
npm run dev
```

The application will be available at:
- Client: http://localhost:5173
- Server: http://localhost:3000

## License

Proprietary - All rights reserved 