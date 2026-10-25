FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json index.mjs adapter.mjs ./
COPY src ./src
USER node
EXPOSE 8080
CMD ["node", "index.mjs"]