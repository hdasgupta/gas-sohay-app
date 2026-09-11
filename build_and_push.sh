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
sh check_backend_calls.sh ./src/components/ ./src/gas/
sh check_backend_calls.sh ./src/views/ ./src/gas/
sh copy_js_to_gs.sh ./src/gas/ ./dist/
clasp push
