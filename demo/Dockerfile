FROM node:16
WORKDIR /usr/app

# Bundle APP files
COPY config config
COPY model model
COPY routes routes
COPY src src
COPY test test
COPY package.json .
COPY ecosystem.config.js .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install pm2 --location=global
RUN npm install --omit=dev

# Expose the listening port of your app
EXPOSE 3000

# Show current folder structure in logs
RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]