FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install node deps
RUN npm install

# Install python deps
RUN pip3 install -r requirements.txt

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "server.js"]