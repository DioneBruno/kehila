FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
RUN pnpm install --ignore-scripts

COPY . .
ENV SKIP_TYPE_CHECK=true
RUN pnpm run postinstall && pnpm build


FROM nginx:alpine AS runner

COPY --from=builder /app/dist/spa /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
