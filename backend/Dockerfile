# Use a slim Python base image
FROM python:3.13-slim

# Install uv by copying from its official Docker image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory
WORKDIR /app

# Copy project files into the container
COPY . /app

# Install dependencies using uv
# Use --mount to cache uv's dependency resolution for faster builds
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# Run the application using uv to ensure the correct environment
# CMD ["uv", "run", "fastapi", "dev"]
CMD ["uv", "run", "fastapi", "dev", "main.py", "--host", "0.0.0.0", "--port", "8000"]