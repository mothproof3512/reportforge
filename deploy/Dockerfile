# Reportforge render service / CLI image.
# Node 22 + Typst + LibreOffice (for DOCX visual checks) + bundled fonts.
FROM node:22-bookworm-slim

ARG TYPST_VERSION=0.15.1
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils poppler-utils libreoffice-writer fonts-dejavu \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" \
       | tar -xJ -C /tmp \
    && mv /tmp/typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst \
    && typst --version

WORKDIR /opt/reportforge
COPY package.json package-lock.json* ./
COPY packages ./packages
RUN npm install --omit=dev --no-audit --no-fund
COPY . .

ENV NODE_ENV=production
# Engagements are mounted at /data; output lands next to the engagement in out/
VOLUME ["/data"]
ENTRYPOINT ["npx", "tsx", "packages/cli/src/index.ts"]
CMD ["--help"]
