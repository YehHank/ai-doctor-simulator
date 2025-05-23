# Dockerfile

# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (if available)
COPY package*.json ./
# Using --legacy-peer-deps as it can help with complex dependency trees
RUN npm install --legacy-peer-deps

# Copy the rest of the application source code
COPY . .

# Disable Next.js telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

# Run the build script
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in production as well
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone application output from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy the public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the static assets from the .next/static folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on (Next.js default for standalone is 3000)
EXPOSE 3000

# Define the command to run the application
# The standalone output creates a server.js file for running the app
CMD ["node", "server.js"]
