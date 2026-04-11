FROM node:20-alpine

WORKDIR /app

ENV HUSKY=0

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/main"]
