FROM node:12

COPY ./dist ~/opt/app

EXPOSE 80

COPY . opt/app