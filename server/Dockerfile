# Use the official Node.js image as the base
FROM node:20-alpine
# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your app runs on (Render assigns the PORT environment variable)
EXPOSE 10000

# The command to start your backend
CMD ["npm", "start"]