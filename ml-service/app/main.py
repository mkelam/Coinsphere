from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Coinsphere ML Service",
    description="AI-powered crypto price prediction and risk scoring service",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"service": "Coinsphere ML", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Prediction endpoints (to be implemented)
# @app.post("/predict")
# @app.get("/predictions/{symbol}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
