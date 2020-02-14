FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Install Promtail
RUN curl -O -L "https://github.com/grafana/loki/releases/download/v1.3.0/promtail-linux-amd64.zip"
RUN unzip "promtail-linux-amd64.zip"
RUN chmod a+x "promtail-linux-amd64"
COPY ./promtail/app-config.yml /etc/promtail/app-config.yaml

EXPOSE 3001
CMD [ "bash", "./bin/start.sh"]