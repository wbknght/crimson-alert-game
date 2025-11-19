import React from 'react';

interface MainMenuProps {
    onStartGame: (mapType: string, difficulty: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
    const [selectedMap, setSelectedMap] = React.useState('training');
    const [difficulty, setDifficulty] = React.useState('medium');

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            zIndex: 1000
        }}>
            <h1 style={{ fontSize: '48px', marginBottom: '40px', color: '#ff4444', textShadow: '0 0 10px #ff0000' }}>CRIMSON ALERT</h1>

            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
                <label>Select Map:</label>
                <select
                    value={selectedMap}
                    onChange={(e) => setSelectedMap(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
                >
                    <option value="training">Training Camp (2 Players)</option>
                    <option value="4player">Lost Lake (4 Players)</option>
                    <option value="6player">River Crossing (6 Players)</option>
                    <option value="8player">Archipelago (8 Players)</option>
                </select>
            </div>

            <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
                <label>AI Difficulty:</label>
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            <button
                onClick={() => onStartGame(selectedMap, difficulty)}
                style={{
                    padding: '15px 40px',
                    fontSize: '24px',
                    backgroundColor: '#ff4444',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 0 15px #ff0000'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff6666'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
            >
                DEPLOY
            </button>
        </div>
    );
};
