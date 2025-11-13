#!/bin/bash

# Startup script for Constructor Demo Server

echo "🚀 Starting Constructor Demo Server..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
fi

# Check if running with Docker
if [ "$USE_DOCKER" = "true" ]; then
    echo "🐳 Starting with Docker Compose..."
    docker-compose up -d

    echo "⏳ Waiting for services to be healthy..."
    sleep 10

    echo "🌱 Seeding database..."
    docker-compose exec -T app npm run seed

    echo ""
    echo "✅ Application started successfully!"
    echo ""
    echo "📝 Access points:"
    echo "   API: http://localhost:5000"
    echo "   Health: http://localhost:5000/health"
    echo ""
    echo "📋 Logs:"
    echo "   docker-compose logs -f app"
    echo ""
    echo "🛑 To stop:"
    echo "   docker-compose down"
else
    echo "💻 Starting in local mode..."

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi

    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        echo "🔨 Building application..."
        npm run build
    fi

    echo ""
    echo "✅ Starting server..."
    npm start
fi
