#!/bin/bash

# Start Temporal services using Docker Compose
echo "Starting Temporal services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Create temporal-config directory if it doesn't exist
mkdir -p temporal-config

# Start services
echo "Starting Temporal and PostgreSQL..."
docker-compose -f docker-compose.temporal.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check service status
echo "Checking service status..."
docker-compose -f docker-compose.temporal.yml ps

echo ""
echo "Temporal services are starting up!"
echo ""
echo "Services:"
echo "  - Temporal Server: http://localhost:7233"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.temporal.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.temporal.yml down"
echo ""
echo "Note: It may take a few minutes for all services to be fully ready."
