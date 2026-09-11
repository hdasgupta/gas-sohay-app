git fetch
git merge origin/main
npm install
npm run build
sh find_duplicate_gas_functions.sh ./src/gas
sh find_undeclared.sh ./src/gas/
sh copy_js_to_gs.sh ./src/gas/ ./dist/
clasp push
