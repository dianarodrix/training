FROM node:version node
WORKDIR /usr/app
COPY package*.json ./
RUN npm install pm2 -g
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["pm2-runtime","pm2.proccess.json"]