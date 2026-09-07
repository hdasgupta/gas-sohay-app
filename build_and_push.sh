git fetch
git merge origin/main
npm install
npm run build
sh copy_js_to_gs.sh ./src/gas/ ./dist/
clasp push