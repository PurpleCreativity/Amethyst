# Use the official Node.js image as a base image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the application code
COPY . .

# Either 3000 or 8080, 3000 is for Express Nodejs apps, and 8080 is for webservers
EXPOSE 8080

# Run the app
CMD ["npm", "run", "start"]