# everyonedraw

A collaborative, infinite pixel canvas application.

## Getting Started

Follow these instructions to get the development environment running.

### 1. Start the Database

Run the PostgreSQL database in a Docker container. From the project root:

```bash
docker-compose up -d
```

### 2. Run Database Migrations

Once the database is running, apply the database schema migrations.

```bash
cd backend
npx prisma migrate dev
cd .. 
```

### 3. Start the Backend Server

In a new terminal, navigate to the `backend` directory, install dependencies, and start the server.

```bash
cd backend
npm install
npm run dev
```
The backend will be running at `http://localhost:3001`.

### 4. Start the Frontend Application

In a separate terminal, navigate to the `frontend` directory, install dependencies, and start the application.

```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---
Built with ❤️ for 🌸