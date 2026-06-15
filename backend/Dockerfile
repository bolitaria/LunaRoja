FROM node:18-slim

WORKDIR /app

# Install Node.js dependencies (production only)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Create necessary upload directories
RUN mkdir -p uploads/reports uploads/actions uploads/featured uploads/campaigns

EXPOSE 5000

CMD ["npm", "start"]