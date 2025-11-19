import React from 'react';
import { BuildingDefinitions } from '../gameplay/rules/BuildingRules';

interface SidebarProps {
    resources: number;
    onBuild: (buildingId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ resources, onBuild }) => {
    return (
        <div style={{
            width: '200px',
            height: '100%',
            background: '#222',
            color: 'white',
            padding: '10px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                Resources: ${resources}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontWeight: 'bold' }}>Buildings</div>
                {Object.values(BuildingDefinitions).map(def => (
                    <button
                        key={def.id}
                        onClick={() => onBuild(def.id)}
                        disabled={resources < def.cost}
                        style={{
                            padding: '10px',
                            background: resources >= def.cost ? '#444' : '#333',
                            color: resources >= def.cost ? 'white' : '#888',
                            border: '1px solid #555',
                            cursor: resources >= def.cost ? 'pointer' : 'not-allowed',
                            textAlign: 'left'
                        }}
                    >
                        <div>{def.name}</div>
                        <div style={{ fontSize: '12px', color: '#aaa' }}>${def.cost}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};
