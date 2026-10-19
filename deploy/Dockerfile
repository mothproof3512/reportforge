# Reportforge: web app + CLI renderer in one image.
# Node 22 + Typst + LibreOffice (DOCX checks) + bundled fonts.
FROM node:22-bookworm-slim

ARG TYPST_VERSION=0.15.1
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils poppler-utils libreoffice-writer fonts-dejavu tar \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" \
       | tar -xJ -C /tmp \
    && mv /tmp/typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst \
    && typst --version

WORKDIR /opt/reportforge
COPY package.json package-lock.json* ./
COPY packages ./packages
RUN npm install --no-audit --no-fund
COPY . .
RUN node apps/web/build.mjs

ENV NODE_ENV=production RF_DATA=/data RF_PORT=3000 RF_HOST=0.0.0.0
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "--import", "tsx", "apps/web/server/index.ts"]
