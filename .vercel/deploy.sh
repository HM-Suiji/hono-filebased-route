git diff --quiet HEAD^ HEAD .vercel/version.txt && echo ".vercel/version.txt unchanged. Skipping build." && exit 0 || echo ".vercel/version.txt changed. Building..." && exit 1
