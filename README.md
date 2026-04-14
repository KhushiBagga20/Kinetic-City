# Kinetic City

Kinetic City is an immersive, interactive learning platform designed to make financial education engaging and accessible. By visualizing financial concepts through dynamic cityscapes and real-time market data, it transforms dry concepts into an interactive journey.

## 🚀 Features
- **Dynamic Learning Paths**: Tailored curriculum tracks (Foundations, Technical Analysis, Wealth Building).
- **Interactive Dashboards**: Real-time stock data fetching and interactive visualizations.
- **AI-Powered Mentorship**: Meet "KINU", your personal AI financial mentor powered by Google Gemini.
- **Stunning UI/UX**: Fast, responsive, and gorgeous interface built with React, Vite, and modern CSS/animations.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TypeScript, Zustand.
- **Backend**: Python, FastAPI, Uvicorn.
- **AI Integration**: Google Generative AI (Gemini 2.0).
- **Market Data**: yfinance.

## 💻 Running Locally

Follow these steps to run the application on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.9 or higher)

### 1. Environment Setup
1. Copy the `env.example` file to create your own `.env` file in the root directory.
```bash
cp env.example .env
```
2. Open the `.env` file and add your Google Gemini API Key:
```
GEMINI_API_KEY=your_actual_api_key_here
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Backend Setup
1. Navigate to the root directory and install the Python dependencies:
```bash
pip install -r requirements.txt
```
2. Start the FastAPI server (runs on port 8000):
```bash
cd backend
python3 -m uvicorn main:app --port 8000 --reload
```

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```
2. Install the Node dependencies:
```bash
npm install
```
3. Copy the root `.env` to the frontend folder (required for API access):
```bash
cp ../.env .env
```
4. Start the Vite development server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to the URL provided by the Vite server (typically `http://localhost:5173`).

### ⚡ Quick Start (All-in-One Scripts)
If you have your environment set up, you can start both the frontend and backend simultaneously using our helper scripts:

- **Mac / Linux / Windows Git Bash**: 
  ```bash
  chmod +x start.sh
  ./start.sh
  ```
- **Windows (CMD / PowerShell)**:
  Simply double-click the `start.bat` file, or run it from your terminal:
  ```cmd
  start.bat
  ```

## 📁 Repository Structure
- `/frontend`: Contains the React UI, components, and state management.
- `/backend`: Contains the FastAPI server, endpoints, and python integrations.
