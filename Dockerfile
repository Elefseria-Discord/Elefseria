FROM node:20.12.2-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn
RUN yarn global add nodemon
COPY . .
CMD [ "yarn", "dev" ]