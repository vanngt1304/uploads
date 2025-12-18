FROM node:24
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install express ejs sqlite3 bcryptjs express-session multer
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]