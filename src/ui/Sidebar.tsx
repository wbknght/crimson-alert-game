import React from 'react';
import { Factions } from '../gameplay/rules/FactionData';

interface SidebarProps {
    factionId: string;
    resources: number;
    onBuild: (buildingId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ factionId, resources, onBuild }) => {
    const faction = Factions[factionId];

    if (!faction) return <div>Unknown Faction</div>;

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
                {faction.name}
                <div style={{ fontSize: '14px', color: '#aaa' }}>Resources: ${resources}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontWeight: 'bold' }}>Buildings</div>
                {Object.values(faction.buildings).map(def => (
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
