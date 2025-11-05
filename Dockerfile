FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure a root-level public/ exists in the build image by copying from src/public when present.
# This avoids failing later COPY steps when the project keeps static assets under src/public.
RUN if [ -d src/public ]; then cp -r src/public public; fi

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build
# The `npm run build` script already runs the TypeScript build that emits JS into `dist`
# (it runs `tsc --project tsconfig.build.json && next build`). The extra `npx tsc`
# invocation was redundant and is removed to speed up the Docker build.

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY .env .env

# Ensure runtime has production node_modules so runtime require() finds packages like reflect-metadata
# Copy from the deps stage (npm ci) into the runner image
COPY --from=deps /app/node_modules ./node_modules
# Do NOT copy node_modules from the builder stage — the `deps` stage already
# contains a clean install of production dependencies and is the single source
# of truth for runtime modules. Copying from both stages duplicated files and
# increased image size.

# Set the correct permission for prerender cache
# Ensure .next exists before changing ownership to avoid build failure when .next was copied from builder
RUN mkdir -p .next
RUN chown -R node:node .next

# Expose the listening port
EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Run the app
CMD ["node", "server.js"]