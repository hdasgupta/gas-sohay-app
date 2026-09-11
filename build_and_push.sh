git fetch
git merge origin/main
npm install
npm run build
sh find_duplicate_gas_functions.sh ./src/gas
sh find_undeclared.sh ./src/gas/
sh search_direct_sheet_reference.sh ./src/gas
sh find_missing_imports.sh ./src/views/
sh find_alert_confirm.sh ./src/components/
sh find_alert_confirm.sh ./src/views/
sh copy_js_to_gs.sh ./src/gas/ ./dist/
clasp push
