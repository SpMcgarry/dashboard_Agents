#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing Node.js..."
    
    # Check OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "Homebrew is not installed. Please install Homebrew first:"
            echo "Visit https://brew.sh for installation instructions"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        else
            echo "Unsupported Linux distribution"
            exit 1
        fi
    else
        echo "Unsupported operating system"
        echo "Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm manually."
    exit 1
fi

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Install additional required dependencies
echo "Installing additional dependencies..."
npm install dotenv @types/dotenv jest @types/jest

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please update the .env file with your API keys"
fi

echo "Installation complete!"
echo "Please update the .env file with your API keys before running the application." 