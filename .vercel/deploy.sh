[ "$VERCEL_GIT_COMMIT_REF" != "main" ] \
&& echo "Not on main branch. Skipping build." && exit 0 \
|| git diff --quiet HEAD^ HEAD .vercel/version.txt \
&& echo ".vercel/version.txt unchanged. Skipping build." && exit 0 \
|| echo ".vercel/version.txt changed on main branch. Building..." && exit 1
