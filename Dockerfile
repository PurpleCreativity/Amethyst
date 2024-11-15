# Use the official Node.js image from the Docker Hub
FROM node:22

# Set the working directory inside the container
WORKDIR /src

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . /.

# Expose the port the app runs on
EXPOSE 8008

# Command to run the application
CMD ["npm", "run", "start"]
