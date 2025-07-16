#!/usr/bin/env node

/**
 * Script to fix remaining lint issues in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining lint issues...\n');

// List of files to fix with specific patterns
const fixes = [
  // Fix unused variables by prefixing with underscore
  {
    file: 'src/components/customers/CustomerStatusDialog.tsx',
    pattern: /const \{ from, currentStoreId, isPinSession \} = useStoreData\(\);/,
    replacement: 'const { from: _from, currentStoreId: _currentStoreId, isPinSession: _isPinSession } = useStoreData();'
  },
  {
    file: 'src/components/customers/CustomersView.tsx',
    pattern: /import \{ Button \} from "@\/components\/ui\/button";\nimport \{ Card, CardContent, CardHeader, CardTitle \} from "@\/components\/ui\/card";\nimport \{ Input \} from "@\/components\/ui\/input";\nimport \{ Badge \} from "@\/components\/ui\/badge";\nimport \{ Avatar, AvatarFallback \} from "@\/components\/ui\/avatar";\nimport \{ Separator \} from "@\/components\/ui\/separator";\nimport \{ Search, Plus, Edit, Trash2, Eye, MoreHorizontal \} from "lucide-react";/,
    replacement: 'import { Button } from "@/components/ui/button";\nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";\nimport { Badge } from "@/components/ui/badge";\nimport { Avatar, AvatarFallback } from "@/components/ui/avatar";\nimport { Separator } from "@/components/ui/separator";\nimport { Plus, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";'
  },
  {
    file: 'src/components/dashboard/SimpleDashboard.tsx',
    pattern: /import \{ cn \} from "@\/lib\/utils";/,
    replacement: ''
  },
  {
    file: 'src/components/dashboard/SimpleDashboard.tsx',
    pattern: /import \{\s*LineChart,\s*Line,\s*XAxis,\s*YAxis,\s*CartesianGrid,\s*Tooltip,\s*ResponsiveContainer,\s*BarChart,\s*Bar,\s*Legend,\s*PieChart,\s*Pie,\s*Cell,\s*\}/,
    replacement: 'import {\n  LineChart,\n  Line,\n  XAxis,\n  YAxis,\n  CartesianGrid,\n  Tooltip,\n  ResponsiveContainer,\n  BarChart,\n  Bar,\n  PieChart,\n  Pie,\n  Cell\n}'
  }
];

// Process each fix
fixes.forEach(fix => {
  const filePath = path.join(__dirname, '..', fix.file);
  
  if (fs.existsSync(filePath)) {
    console.log(`📝 Fixing ${fix.file}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${fix.file}`);
    } else {
      console.log(`⚠️  Pattern not found in ${fix.file}`);
    }
  } else {
    console.log(`❌ File not found: ${fix.file}`);
  }
});

console.log('\n🔧 Script completed. Run "npm run lint" to check remaining issues.');
