# Use the official Node.js image as a base image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if exists)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (default for Express is 3000)
EXPOSE 8080

# Run the app
CMD ["npm", "run", "start"]