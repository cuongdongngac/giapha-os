import { Person, Relationship } from "@/types";

interface ExportData {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
  roots: Person[];
  view: 'tree' | 'mindmap';
}

export const generateTreeHTML = (data: ExportData) => {
  // ========================================
  // TREE HTML GENERATOR - Horizontal Layout
  // ========================================
  // Purpose: Generate hierarchical family tree with horizontal layout
  // Layout: Parent -> Children spread horizontally
  // Features: Expand/collapse, print-friendly, responsive
  
  const { personsMap, relationships, roots } = data;

  // Convert Map to Array for JSON serialization
  const personsArray = Array.from(personsMap.entries()).map(([id, person]) => ({
    ...person,
    id
  }));

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gia Phả Phạm Đông Ngạc - Sơ Đồ Cây</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
        /* ========================================
           TREE STYLES - Horizontal Layout
           ======================================== */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f9fafb;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .btn-primary { background: #3b82f6; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .btn-success { background: #10b981; color: white; }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        /* ========================================
           TREE STRUCTURE - Horizontal Layout
           ======================================== */
        .tree-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow-x: auto;
            min-height: 400px;
        }
        
        .tree-node {
            margin: 10px;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fafafa;
            transition: all 0.2s;
            display: inline-block;
            vertical-align: top;
            min-width: 180px;
            position: relative;
        }
        
        .tree-node:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
        }
        
        .node-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
        }
        
        .toggle-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e5e7eb;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .node-content {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .avatar.female { background: #ec4899; }
        
        .node-info {
            flex: 1;
        }
        
        .node-name {
            font-weight: 600;
            color: #1f2937;
        }
        
        .node-details {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
        }
        
        /* ========================================
           CHILDREN CONTAINER - Horizontal Layout
           ======================================== */
        .tree-children {
            margin-top: 30px;
            display: flex;
            flex-direction: row;
            gap: 20px;
            position: relative;
        }
        
        /* Connection line from parent to children */
        .tree-children::before {
            content: '';
            position: absolute;
            top: -30px;
            left: 50%;
            width: 2px;
            height: 30px;
            background: #e5e7eb;
            transform: translateX(-50%);
        }
        
        .tree-children.collapsed {
            display: none;
        }
        
        /* ========================================
           PRINT STYLES
           ======================================== */
        @media print {
            .controls, .btn {
                display: none !important;
            }
            
            .tree-children {
                display: block !important;
            }
            
            body {
                padding: 10px;
            }
            
            .tree-node {
                break-inside: avoid;
            }
        }
        
        /* ========================================
           RESPONSIVE STYLES
           ======================================== */
        @media (max-width: 768px) {
            .controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .tree-container {
                overflow-x: auto;
            }
            
            .tree-node {
                min-width: 150px;
                font-size: 12px;
            }
            
            .tree-children {
                gap: 20px;
            }
            
            .node-content {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 28px;">
                Gia Phả Phạm Đông Ngạc
            </h1>
            <p style="margin: 0; color: #6b7280;">
                Sơ Đồ Cây - Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}
            </p>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="expandAll()">
                Mở Rộng Tất Cả
            </button>
            <button class="btn btn-secondary" onclick="collapseAll()">
                Thu Hẹp Tất Cả
            </button>
            <button class="btn btn-success" onclick="window.print()">
                In
            </button>
        </div>
        
        <div id="tree-root" class="tree-container"></div>
    </div>
    
    <script>
        // ========================================
        // TREE DATA EMBEDDING
        // ========================================
        const TREE_DATA = ${JSON.stringify({
            persons: personsArray,
            relationships,
            roots: roots.map(r => r.id)
        })};
        
        // Create persons map for quick lookup
        const personsMap = new Map(TREE_DATA.persons.map(p => [p.id, p]));
        
        // ========================================
        // TREE REACT COMPONENT - Horizontal Layout
        // ========================================
        function TreeNode({ person, level = 0 }) {
            const [isExpanded, setIsExpanded] = React.useState(level < 2);
            
            const toggleExpanded = () => {
                setIsExpanded(!isExpanded);
            };
            
            // Get children of this person
            const children = TREE_DATA.relationships
                .filter(r => r.type === 'biological_child' && r.person_a === person.id)
                .map(r => personsMap.get(r.person_b))
                .filter(Boolean);
            
            // Render node with horizontal children layout
            return React.createElement('div', { 
                style: { 
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginRight: '10px'
                }
            },
                // Node container with styling
                React.createElement('div', { className: 'tree-node' },
                    // Node header with toggle button
                    React.createElement('div', { className: 'node-header', onClick: toggleExpanded },
                        React.createElement('div', { className: 'toggle-icon' },
                            isExpanded ? '▼' : '▶'
                        ),
                        React.createElement('div', { className: 'node-content' },
                            React.createElement('div', { 
                                className: \`avatar \${person.gender === 'female' ? 'female' : ''}\` 
                            }, person.full_name.charAt(0)),
                            React.createElement('div', { className: 'node-info' },
                                React.createElement('div', { className: 'node-name' }, person.full_name),
                                React.createElement('div', { className: 'node-details' },
                                    person.birth_year ? \`Sinh năm \${person.birth_year}\` : '',
                                    person.other_names ? \` | \${person.other_names}\` : ''
                                )
                            )
                        )
                    )
                ),
                // Children container with horizontal layout
                children.length > 0 && React.createElement('div', {
                    className: \`tree-children \${isExpanded ? '' : 'collapsed'}\`,
                    style: {
                        marginTop: '30px'
                    }
                }, children.map(child => 
                    React.createElement(TreeNode, { 
                        key: child.id, 
                        person: child, 
                        level: level + 1 
                    })
                ))
            );
        }
        
        // ========================================
        // TREE ROOT COMPONENT
        // ========================================
        function FamilyTreeExport() {
            const roots = TREE_DATA.roots.map(id => personsMap.get(id)).filter(Boolean);
            
            return React.createElement('div', { className: 'tree-container' },
                // Root container with flex layout
                React.createElement('div', { 
                    style: { 
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0',
                        position: 'relative',
                        marginBottom: '20px'
                    }
                },
                    roots.map(root => 
                        React.createElement(TreeNode, { 
                            key: root.id, 
                            person: root 
                        })
                    )
                )
            )
        };
        
        // ========================================
        // GLOBAL FUNCTIONS
        // ========================================
        function expandAll() {
            document.querySelectorAll('.tree-children').forEach(el => {
                el.classList.remove('collapsed');
            });
        }
        
        function collapseAll() {
            document.querySelectorAll('.tree-children').forEach(el => {
                el.classList.add('collapsed');
            });
        }
        
        // ========================================
        // MOUNT REACT APP
        // ========================================
        const root = ReactDOM.createRoot(document.getElementById('tree-root'));
        root.render(React.createElement(FamilyTreeExport));
    </script>
</body>
</html>`;
};

export const generateMindmapHTML = (data: ExportData) => {
  // ========================================
  // MINDMAP HTML GENERATOR - Radial Layout
  // ========================================
  // Purpose: Generate mindmap with central node and radial branches
  // Layout: Central node with branches in 4 directions
  // Features: Expand/collapse, print-friendly, responsive
  
  const { personsMap, relationships, roots } = data;

  // Convert Map to Array for JSON serialization
  const personsArray = Array.from(personsMap.entries()).map(([id, person]) => ({
    ...person,
    id
  }));

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gia Phả Phạm Đông Ngạc - Sơ Đồ Tư Duy</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
        /* ========================================
           MINDMAP STYLES - Radial Layout
           ======================================== */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f9fafb;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .btn-primary { background: #3b82f6; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .btn-success { background: #10b981; color: white; }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        /* ========================================
           MINDMAP STRUCTURE - Radial Layout
           ======================================== */
        .mindmap-container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            min-height: 600px;
            position: relative;
            overflow: auto;
        }
        
        .central-node {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 50%;
            text-align: center;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 10;
            min-width: 120px;
            cursor: pointer;
        }
        
        .branch {
            position: absolute;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            min-width: 150px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .branch:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .branch.north { top: 20px; left: 50%; transform: translateX(-50%); }
        .branch.east { right: 20px; top: 50%; transform: translateY(-50%); }
        .branch.south { bottom: 20px; left: 50%; transform: translateX(-50%); }
        .branch.west { left: 20px; top: 50%; transform: translateY(-50%); }
        
        .branch-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .branch-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
        }
        
        .branch-avatar.female { background: #ec4899; }
        
        .branch-name {
            font-weight: 600;
            color: #1f2937;
            flex: 1;
        }
        
        .branch-details {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .branch-children {
            margin-top: 12px;
            padding-left: 12px;
            border-left: 2px solid #e5e7eb;
        }
        
        .branch-child {
            margin: 4px 0;
            padding: 8px;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 12px;
        }
        
        /* ========================================
           CONNECTION LINES - Radial Layout
           ======================================== */
        .connection-line {
            position: absolute;
            background: #e5e7eb;
            z-index: 1;
        }
        
        .connection-line.north {
            width: 2px;
            height: 80px;
            top: 100px;
            left: 50%;
        }
        
        .connection-line.east {
            width: 80px;
            height: 2px;
            top: 50%;
            right: 100px;
        }
        
        .connection-line.south {
            width: 2px;
            height: 80px;
            bottom: 100px;
            left: 50%;
        }
        
        .connection-line.west {
            width: 80px;
            height: 2px;
            top: 50%;
            left: 100px;
        }
        
        /* ========================================
           PRINT STYLES
           ======================================== */
        @media print {
            .controls, .btn {
                display: none !important;
            }
            
            .mindmap-container {
                overflow: visible;
                height: auto;
            }
            
            body {
                padding: 10px;
            }
            
            .branch {
                break-inside: avoid;
            }
        }
        
        /* ========================================
           RESPONSIVE STYLES
           ======================================== */
        @media (max-width: 768px) {
            .controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .mindmap-container {
                padding: 20px;
                min-height: 400px;
            }
            
            .central-node {
                min-width: 100px;
                padding: 16px;
            }
            
            .branch {
                min-width: 120px;
                padding: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 28px;">
                Gia Phả Phạm Đông Ngạc
            </h1>
            <p style="margin: 0; color: #6b7280;">
                Sơ Đồ Tư Duy - Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}
            </p>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="expandAll()">
                Mở Rộng Tất Cả
            </button>
            <button class="btn btn-secondary" onclick="collapseAll()">
                Thu Hẹp Tất Cả
            </button>
            <button class="btn btn-success" onclick="window.print()">
                In
            </button>
        </div>
        
        <div id="mindmap-root" class="mindmap-container"></div>
    </div>
    
    <script>
        // ========================================
        // MINDMAP DATA EMBEDDING
        // ========================================
        const MINDMAP_DATA = ${JSON.stringify({
            persons: personsArray,
            relationships,
            roots: roots.map(r => r.id)
        })};
        
        // Create persons map for quick lookup
        const personsMap = new Map(MINDMAP_DATA.persons.map(p => [p.id, p]));
        
        // ========================================
        // MINDMAP REACT COMPONENT - Radial Layout
        // ========================================
        function MindmapNode({ person, position = 'north' }) {
            const [isExpanded, setIsExpanded] = React.useState(false);
            
            const toggleExpanded = () => {
                setIsExpanded(!isExpanded);
            };
            
            // Get children of this person
            const children = MINDMAP_DATA.relationships
                .filter(r => r.type === 'biological_child' && r.person_a === person.id)
                .map(r => personsMap.get(r.person_b))
                .filter(Boolean);
            
            // Render branch with radial positioning
            return React.createElement('div', { 
                className: \`branch \${position}\`,
                onClick: toggleExpanded 
            },
                React.createElement('div', { className: 'branch-header' },
                    React.createElement('div', { 
                        className: \`branch-avatar \${person.gender === 'female' ? 'female' : ''}\` 
                    }, person.full_name.charAt(0)),
                    React.createElement('div', { className: 'branch-name' }, person.full_name)
                ),
                React.createElement('div', { className: 'branch-details' },
                    person.birth_year ? \`Sinh năm \${person.birth_year}\` : '',
                    person.other_names ? \` | \${person.other_names}\` : ''
                ),
                children.length > 0 && React.createElement('div', { 
                    className: 'branch-children',
                    style: { display: isExpanded ? 'block' : 'none' }
                }, children.map(child => 
                    React.createElement('div', { 
                        key: child.id, 
                        className: 'branch-child' 
                    }, child.full_name)
                ))
            );
        }
        
        // ========================================
        // MINDMAP ROOT COMPONENT
        // ========================================
        function MindmapExport() {
            const roots = MINDMAP_DATA.roots.map(id => personsMap.get(id)).filter(Boolean);
            
            if (roots.length === 0) return null;
            
            const centralPerson = roots[0];
            
            return React.createElement('div', { className: 'mindmap-container' },
                // Connection lines from center to 4 directions
                React.createElement('div', { className: 'connection-line north' }),
                React.createElement('div', { className: 'connection-line east' }),
                React.createElement('div', { className: 'connection-line south' }),
                React.createElement('div', { className: 'connection-line west' }),
                
                // Central node in the middle
                React.createElement('div', { className: 'central-node' },
                    centralPerson.full_name
                ),
                
                // Branch nodes (simplified for demo - in real implementation would calculate positions)
                React.createElement(MindmapNode, { 
                    person: centralPerson, 
                    position: 'north' 
                })
            );
        }
        
        // ========================================
        // GLOBAL FUNCTIONS
        // ========================================
        function expandAll() {
            document.querySelectorAll('.branch-children').forEach(el => {
                el.style.display = 'block';
            });
        }
        
        function collapseAll() {
            document.querySelectorAll('.branch-children').forEach(el => {
                el.style.display = 'none';
            });
        }
        
        // ========================================
        // MOUNT REACT APP
        // ========================================
        const root = ReactDOM.createRoot(document.getElementById('mindmap-root'));
        root.render(React.createElement(MindmapExport));
    </script>
</body>
</html>`;
};

export const generateInteractiveHTML = (data: ExportData) => {
  // ========================================
  // MAIN DISPATCHER - Choose appropriate generator
  // ========================================
  // Purpose: Route to appropriate HTML generator based on view type
  // Logic: Simple switch between tree and mindmap generators
  
  if (data.view === 'tree') {
    return generateTreeHTML(data);
  } else if (data.view === 'mindmap') {
    return generateMindmapHTML(data);
  }
  throw new Error('Unsupported view type');
};

export const downloadHTMLFile = (html: string, filename: string) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
