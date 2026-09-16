with open('admin.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

with open('admin.html', 'r', encoding='utf-8') as f:
    html_code = f.read()

import re

# Match variable declarations: const varName = document.getElementById('id');
var_map = {}
for m in re.finditer(r'const\s+([a-zA-Z0-9_]+)\s*=\s*document\.getElementById\(["\']([^"\']+)["\']\);', js_code):
    var_map[m.group(1)] = m.group(2)

lines = js_code.split('\n')
for i, line in enumerate(lines):
    m = re.search(r'([a-zA-Z0-9_]+)\.addEventListener\(', line)
    if m:
        var_name = m.group(1)
        if var_name in var_map:
            el_id = var_map[var_name]
            if f'id="{el_id}"' not in html_code and f"id='{el_id}'" not in html_code:
                print(f"CRITICAL NULL ERROR at line {i+1}: {var_name} (id='{el_id}') is NULL in admin.html!")
            else:
                pass
        else:
            print(f"Unknown var at line {i+1}: {var_name}")
