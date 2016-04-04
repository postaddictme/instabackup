FROM ubuntu:latest
MAINTAINER r.kapishev@gmail.com
RUN apt-get -y update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash - && apt-get install -y nodejs && apt-get install -y build-essential
COPY . /src
RUN cd /src; npm install
EXPOSE 8080
CMD cd /src && nodejs ./app.js