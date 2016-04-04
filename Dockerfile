FROM ubuntu:latest
MAINTAINER r.kapishev@gmail.com
RUN curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
RUN apt-get -y update
RUN apt-get install -y nodejs
RUN apt-get install -y build-essential
RUN apt-get install -y npm
COPY . /src
RUN cd /src; npm install
RUN export PORT=8080
EXPOSE 8080
CMD cd /src && nodejs ./app.js