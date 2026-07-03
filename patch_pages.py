import os
import re

PORTAL_DIR = "/Users/ghost/Downloads/AZM-businessPortal/src/pages"

FILES = [
    "DineIn.jsx",
    "Guests.jsx",
    "Marketing.jsx",
    "Finance.jsx",
    "SeatMapEditor.jsx",
    "Showcase.jsx"
]

auth_import = "import { useAuth } from '@/lib/AuthContext';\n"

for f in FILES:
    path = os.path.join(PORTAL_DIR, f)
    with open(path, "r") as file:
        content = file.read()
    
    # Check if AuthContext is already imported
    if "useAuth" not in content:
        # insert it after the first import or at the top
        content = auth_import + content
    
    # Find the function signature
    # Pattern: export default function XYZ({ businessId, ... }) {
    # Replace with: export default function XYZ() {
    # And inject the useAuth boilerplate.
    
    func_match = re.search(r'export default function (\w+)\(([^)]*)\)\s*\{', content)
    if func_match:
        func_name = func_match.group(1)
        params_str = func_match.group(2)
        
        # Replace the signature
        content = content[:func_match.start()] + f'export default function {func_name}() {{\n' + \
                  '  const { bizProfile, isAdmin, selectedBusinessId } = useAuth();\n' + \
                  '  const businessId = bizProfile?.id;\n\n' + \
                  '  if (!businessId) {\n' + \
                  '    return (\n' + \
                  '      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">\n' + \
                  '        {isAdmin ? "Select a business from the sidebar dropdown to view." : "No business profile found."}\n' + \
                  '      </div>\n' + \
                  '    );\n' + \
                  '  }\n' + content[func_match.end():]
        
        # Write back
        with open(path, "w") as file:
            file.write(content)
        print(f"Patched {f}")
    else:
        print(f"Skipped {f} (pattern not found)")
