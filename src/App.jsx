import { useState, useEffect } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import BattleScreen from './components/BattleScreen';
import GameBoyWrapper, { GB_COLORS, GBTextBox, GBMenuItem, GBHPBar, GBDivider } from './components/GameBoyWrapper';
import { processBarcode } from './engine/barcodeAlgorithm';
import { createMonster, getTypeColor, getMonsterRarity, getRarityColor, getMonsterName } from './engine/monsterData';
import { createItem, getItemColor } from './engine/itemData';
import { addMonster, loadMonsters, incrementStat, loadStats, updateMonster, saveMonsters, addItem, loadItems } from './engine/storage';
import { generateEnemyTeam, awardBattleRewards } from './engine/battleEngine';

function App() {
  const [currentScreen, setCurrentScreen] = useState('TITLE');
  const [collection, setCollection] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [battleTeam, setBattleTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);

  useEffect(() => {
    // Load monsters and fix any with placeholder names
    let monsters = loadMonsters();
    let needsSave = false;
    
    monsters = monsters.map(monster => {
      if (monster.name.startsWith('Monster #') || monster.name.startsWith('Unknown #')) {
        needsSave = true;
        return { ...monster, name: getMonsterName(monster.id) };
      }
      return monster;
    });
    
    if (needsSave) {
      saveMonsters(monsters);
    }
    
    setCollection(monsters);
    setItems(loadItems());
    setStats(loadStats());
  }, []);

  const handleBarcodeScan = (barcodeString) => {
    const result = processBarcode(barcodeString);
    incrementStat('totalScans');

    if (result.type === 'MONSTER') {
      const monster = createMonster(result.id, barcodeString);
      const addResult = addMonster(monster);
      
      if (addResult.success) {
        incrementStat('monstersCollected');
        setCollection(loadMonsters());
        setStats(loadStats());
      }

      setLastScanResult({
        type: 'MONSTER',
        monster,
        isNew: addResult.success,
        isDuplicate: !addResult.success
      });
    } else if (result.type === 'ITEM') {
      const item = createItem(result.id, barcodeString);
      
      if (item) {
        addItem(item);
        incrementStat('itemsCollected');
        setItems(loadItems());
        setStats(loadStats());
        
        setLastScanResult({
          type: 'ITEM',
          item,
          isNew: true
        });
      } else {
        setLastScanResult({
          type: 'ERROR',
          error: 'Failed to create item'
        });
      }
    } else {
      setLastScanResult({
        type: 'ERROR',
        error: result.error
      });
    }

    setCurrentScreen('RESULT');
  };

  const startBattle = (team) => {
    setBattleTeam(team);
    const enemies = generateEnemyTeam(team);
    setEnemyTeam(enemies);
    setCurrentScreen('BATTLE');
  };

  const handleBattleEnd = (result) => {
    const { winner, playerMonsters, knockoutTracker = {} } = result;
    const rewards = awardBattleRewards(playerMonsters, winner === 'PLAYER', knockoutTracker);
    
    const updatedCollection = loadMonsters().map(m => {
      const reward = rewards.find(r => r.monster.id === m.id);
      return reward ? reward.monster : m;
    });
    
    saveMonsters(updatedCollection);
    setCollection(updatedCollection);
    
    if (winner === 'PLAYER') {
      incrementStat('battlesWon');
    } else {
      incrementStat('battlesLost');
    }
    setStats(loadStats());
    
    setCurrentScreen('HOME');
  };

  const handleRest = () => {
    const healedCollection = collection.map(monster => ({
      ...monster,
      currentHP: monster.maxHP
    }));
    
    saveMonsters(healedCollection);
    setCollection(healedCollection);
    setCurrentScreen('HOME');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'TITLE':
        return <TitleScreen onStart={() => setCurrentScreen('HOME')} />;
      
      case 'HOME':
        return <HomeScreen 
          collection={collection}
          items={items}
          stats={stats}
          onNavigate={setCurrentScreen}
          onStartBattle={startBattle}
        />;
      
      case 'SCAN':
        return (
          <ScanScreen 
            onBack={() => setCurrentScreen('HOME')}
            onScan={handleBarcodeScan}
          />
        );
      
      case 'COLLECTION':
        return <CollectionScreen 
          collection={collection}
          onBack={() => setCurrentScreen('HOME')}
        />;
      
      case 'RESULT':
        return <ScanResultScreen 
          result={lastScanResult}
          onContinue={() => setCurrentScreen('HOME')}
        />;
      
      case 'TEAM_SELECT':
        return <TeamSelectScreen 
          collection={collection}
          onBack={() => setCurrentScreen('HOME')}
          onConfirm={startBattle}
        />;
      
      case 'REST':
        return <RestScreen 
          collection={collection}
          onRest={handleRest}
          onBack={() => setCurrentScreen('HOME')}
        />;
      
      case 'ITEMS':
        return <ItemsScreen 
          items={items}
          onBack={() => setCurrentScreen('HOME')}
        />;
      
      case 'GUIDE':
        return <GuideScreen 
          onBack={() => setCurrentScreen('HOME')}
        />;
      
      case 'BATTLE':
        return <BattleScreen 
          playerTeam={battleTeam}
          enemyTeam={enemyTeam}
          playerItems={items}
          onBattleEnd={handleBattleEnd}
          onItemUsed={() => setItems(loadItems())}
        />;
      
      default:
        return <div>Unknown screen</div>;
    }
  };

  return (
    <GameBoyWrapper>
      {renderScreen()}
    </GameBoyWrapper>
  );
}

// ============================================
// TITLE SCREEN - Bigger logo, simpler design
// ============================================
function TitleScreen({ onStart }) {
  const [blink, setBlink] = useState(true);
  
  useEffect(() => {
    const blinkInterval = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div 
      onClick={onStart}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: GB_COLORS.lightest,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: '15px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Top decorative border */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        height: '4px',
        backgroundColor: GB_COLORS.dark,
      }} />

      {/* BIG Logo area */}
      <div style={{
        border: `6px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
        padding: '20px 35px',
        marginBottom: '20px',
        boxShadow: `6px 6px 0 ${GB_COLORS.dark}`,
      }}>
        <div style={{
          fontSize: '18px',
          color: GB_COLORS.darkest,
          textAlign: 'center',
          letterSpacing: '3px',
          marginBottom: '5px',
        }}>
          BARCODE
        </div>
        <div style={{
          fontSize: '26px',
          color: GB_COLORS.darkest,
          textAlign: 'center',
          letterSpacing: '4px',
        }}>
          BATTLER
        </div>
      </div>

      {/* Type symbols display (static) */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '15px',
        fontSize: '24px',
        color: GB_COLORS.darkest,
      }}>
        <span>◆</span>
        <span>▲</span>
        <span>★</span>
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: '8px',
        color: GB_COLORS.dark,
        marginBottom: '8px',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        SCAN TO CATCH!
      </div>

      {/* Version text */}
      <div style={{
        fontSize: '7px',
        color: GB_COLORS.dark,
        marginBottom: '25px',
      }}>
        Ver 1.0
      </div>

      {/* Press Start */}
      <div style={{
        fontSize: '11px',
        color: GB_COLORS.darkest,
        opacity: blink ? 1 : 0,
      }}>
        PRESS START
      </div>

      {/* Copyright */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '7px',
        color: GB_COLORS.dark,
      }}>
        ©2025 LARS
      </div>

      {/* Bottom decorative border */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        right: '10px',
        height: '4px',
        backgroundColor: GB_COLORS.dark,
      }} />
    </div>
  );
}

// ============================================
// HOME SCREEN - Pokemon style menu
// ============================================
function HomeScreen({ collection, items, stats, onNavigate }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const healthyCount = collection.filter(m => m.currentHP > 0).length;
  const canBattle = healthyCount >= 3;
  const needsHealing = collection.length > 0 && collection.some(m => m.currentHP < m.maxHP);

  const menuItems = [
    { id: 'SCAN', label: 'SCAN', enabled: true },
    { id: 'COLLECTION', label: 'MONSTERS', sublabel: `${collection.length}/126`, enabled: true },
    { id: 'ITEMS', label: 'ITEMS', sublabel: `${items.length}`, enabled: true },
    { id: 'TEAM_SELECT', label: 'BATTLE', enabled: canBattle },
    { id: 'REST', label: 'REST', enabled: needsHealing },
    { id: 'GUIDE', label: 'GUIDE', enabled: true },
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'ArrowDown') {
      setSelectedIndex(i => Math.min(menuItems.length - 1, i + 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      const item = menuItems[selectedIndex];
      if (item.enabled) {
        onNavigate(item.id);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      padding: '10px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <GBTextBox style={{ marginBottom: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', marginBottom: '4px' }}>BARCODE BATTLER</div>
        <div style={{ fontSize: '8px', color: GB_COLORS.dark }}>
          What would you like to do?
        </div>
      </GBTextBox>

      {/* Main Menu */}
      <GBTextBox style={{ flex: 1, marginBottom: '10px' }}>
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => item.enabled && onNavigate(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 4px',
              cursor: item.enabled ? 'pointer' : 'not-allowed',
              opacity: item.enabled ? 1 : 0.4,
              backgroundColor: selectedIndex === index ? GB_COLORS.light : 'transparent',
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                width: '14px', 
                fontSize: '10px',
                color: GB_COLORS.darkest,
              }}>
                {selectedIndex === index ? '▶' : ''}
              </span>
              <span style={{ fontSize: '10px', color: GB_COLORS.darkest }}>
                {item.label}
              </span>
            </div>
            {item.sublabel && (
              <span style={{ fontSize: '8px', color: GB_COLORS.dark }}>
                {item.sublabel}
              </span>
            )}
          </div>
        ))}
      </GBTextBox>

      {/* Stats Box */}
      {stats && (
        <GBTextBox>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '4px',
            fontSize: '8px',
          }}>
            <div>SCANS: {stats.totalScans}</div>
            <div>CAUGHT: {stats.monstersCollected}</div>
            <div style={{ color: GB_COLORS.dark }}>WON: {stats.battlesWon}</div>
            <div style={{ color: GB_COLORS.dark }}>LOST: {stats.battlesLost}</div>
          </div>
        </GBTextBox>
      )}
    </div>
  );
}

// ============================================
// SCAN SCREEN
// ============================================
function ScanScreen({ onBack, onScan }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
        <div style={{ fontSize: '10px', color: GB_COLORS.darkest }}>
          SCANNER
        </div>
      </div>

      {/* Scanner area - takes remaining space */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <BarcodeScanner onScan={onScan} />
      </div>
    </div>
  );
}

// ============================================
// COLLECTION SCREEN
// ============================================
function CollectionScreen({ collection, onBack }) {
  const [selectedMonster, setSelectedMonster] = useState(null);

  if (selectedMonster) {
    return (
      <MonsterDetailScreen 
        monster={selectedMonster} 
        onBack={() => setSelectedMonster(null)} 
      />
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
        <div style={{ fontSize: '10px', color: GB_COLORS.darkest }}>
          MONSTERS {collection.length}/126
        </div>
      </div>

      {/* Monster List */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '5px',
      }}>
        {collection.length === 0 ? (
          <GBTextBox style={{ margin: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px' }}>No monsters yet!</div>
            <div style={{ fontSize: '8px', marginTop: '8px', color: GB_COLORS.dark }}>
              Scan barcodes to catch monsters!
            </div>
          </GBTextBox>
        ) : (
          collection.map(monster => (
            <MonsterListItem 
              key={monster.id} 
              monster={monster}
              onClick={() => setSelectedMonster(monster)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MonsterListItem({ monster, onClick }) {
  const rarity = getMonsterRarity(monster.id);
  const isKO = monster.currentHP <= 0;
  
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        marginBottom: '2px',
        backgroundColor: isKO ? GB_COLORS.light : GB_COLORS.lightest,
        border: `2px solid ${GB_COLORS.darkest}`,
        cursor: 'pointer',
        opacity: isKO ? 0.6 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '9px', 
          color: GB_COLORS.darkest,
          marginBottom: '2px',
        }}>
          {monster.name}
        </div>
        <div style={{ 
          fontSize: '7px', 
          color: GB_COLORS.dark,
        }}>
          {monster.type} · {rarity} · LV{monster.level}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <GBHPBar current={monster.currentHP} max={monster.maxHP} width={50} />
      </div>
    </div>
  );
}

function MonsterDetailScreen({ monster, onBack }) {
  const rarity = getMonsterRarity(monster.id);
  const expToNext = getExpToNextLevel(monster.level);
  const expProgress = monster.level >= 10 ? 100 : (monster.exp / expToNext) * 100;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
      </div>

      {/* Monster Info */}
      <div style={{ flex: 1, padding: '10px' }}>
        <GBTextBox style={{ marginBottom: '10px' }}>
          <div style={{ 
            fontSize: '12px', 
            marginBottom: '4px',
            color: GB_COLORS.darkest,
          }}>
            {monster.name}
          </div>
          <div style={{ 
            fontSize: '8px', 
            color: GB_COLORS.dark,
            marginBottom: '8px',
          }}>
            No.{String(monster.id).padStart(3, '0')} · {monster.type} · {rarity}
          </div>
          <GBDivider />
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginTop: '8px',
            fontSize: '9px',
          }}>
            <div>LV: {monster.level}{monster.level >= 10 ? ' MAX' : ''}</div>
            <div>HP: {monster.currentHP}/{monster.maxHP}</div>
            <div>ATK: {monster.baseStats.attack}</div>
            <div>DEF: {monster.baseStats.defense}</div>
            <div>SPD: {monster.baseStats.speed}</div>
            <div>CLASS: {monster.class}</div>
          </div>
        </GBTextBox>

        {/* EXP Bar */}
        {monster.level < 10 && (
          <GBTextBox>
            <div style={{ fontSize: '8px', marginBottom: '4px' }}>
              EXP: {monster.exp}/{expToNext}
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: GB_COLORS.light,
              border: `2px solid ${GB_COLORS.darkest}`,
            }}>
              <div style={{
                width: `${expProgress}%`,
                height: '100%',
                backgroundColor: GB_COLORS.dark,
              }} />
            </div>
          </GBTextBox>
        )}
      </div>
    </div>
  );
}

// Helper function for EXP
function getExpToNextLevel(level) {
  const thresholds = [0, 10, 35, 85, 185, 335, 535, 785, 1085, 1435];
  if (level >= 10) return 9999;
  return thresholds[level] || 10;
}

// ============================================
// SCAN RESULT SCREEN
// ============================================
function ScanResultScreen({ result, onContinue }) {
  if (!result) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: GB_COLORS.lightest,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <GBTextBox>Loading...</GBTextBox>
      </div>
    );
  }

  if (result.type === 'ERROR') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: GB_COLORS.lightest,
        padding: '10px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <GBTextBox style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>ERROR</div>
          <div style={{ fontSize: '8px', color: GB_COLORS.dark }}>
            {result.error || 'Unknown error'}
          </div>
        </GBTextBox>
        <GBButton onClick={onContinue}>OK</GBButton>
      </div>
    );
  }

  if (result.type === 'MONSTER') {
    const { monster, isNew } = result;
    const rarity = getMonsterRarity(monster.id);

    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: GB_COLORS.lightest,
        padding: '10px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <GBTextBox style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px' }}>
            {isNew ? 'NEW MONSTER!' : 'ALREADY CAUGHT'}
          </div>
        </GBTextBox>

        <GBTextBox style={{ flex: 1, marginBottom: '10px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ 
              fontSize: '12px', 
              marginBottom: '4px',
              color: GB_COLORS.darkest,
            }}>
              {monster.name}
            </div>
            <div style={{ fontSize: '8px', color: GB_COLORS.dark }}>
              No.{String(monster.id).padStart(3, '0')} · {monster.type} · {rarity}
            </div>
          </div>
          
          <GBDivider />
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            marginTop: '8px',
            fontSize: '9px',
          }}>
            <div>HP: {monster.maxHP}</div>
            <div>ATK: {monster.baseStats.attack}</div>
            <div>DEF: {monster.baseStats.defense}</div>
            <div>SPD: {monster.baseStats.speed}</div>
          </div>
        </GBTextBox>

        <GBButton onClick={onContinue}>
          {isNew ? 'AWESOME!' : 'OK'}
        </GBButton>
      </div>
    );
  }

  if (result.type === 'ITEM') {
    const { item } = result;

    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: GB_COLORS.lightest,
        padding: '10px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <GBTextBox style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px' }}>ITEM FOUND!</div>
        </GBTextBox>

        <GBTextBox style={{ flex: 1, marginBottom: '10px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: '12px', 
            marginBottom: '8px',
            color: GB_COLORS.darkest,
          }}>
            {item.name}
          </div>
          <GBDivider />
          <div style={{ 
            fontSize: '9px', 
            marginTop: '8px',
            color: GB_COLORS.dark,
          }}>
            {item.description}
          </div>
        </GBTextBox>

        <GBButton onClick={onContinue}>ADDED TO BAG!</GBButton>
      </div>
    );
  }

  return null;
}

// ============================================
// TEAM SELECT SCREEN
// ============================================
function TeamSelectScreen({ collection, onBack, onConfirm }) {
  const [selected, setSelected] = useState([]);
  const available = collection.filter(m => m.currentHP > 0);

  const toggleSelection = (monster) => {
    if (selected.find(m => m.id === monster.id)) {
      setSelected(selected.filter(m => m.id !== monster.id));
    } else if (selected.length < 3) {
      setSelected([...selected, monster]);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
        <div style={{ fontSize: '10px', color: GB_COLORS.darkest }}>
          SELECT 3 ({selected.length}/3)
        </div>
      </div>

      {/* Monster selection list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '5px' }}>
        {available.map(monster => {
          const isSelected = selected.find(m => m.id === monster.id);
          return (
            <div 
              key={monster.id}
              onClick={() => toggleSelection(monster)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                marginBottom: '2px',
                backgroundColor: isSelected ? GB_COLORS.dark : GB_COLORS.lightest,
                border: `2px solid ${GB_COLORS.darkest}`,
                cursor: 'pointer',
                color: isSelected ? GB_COLORS.lightest : GB_COLORS.darkest,
              }}
            >
              <span style={{ width: '14px', fontSize: '10px' }}>
                {isSelected ? '●' : '○'}
              </span>
              <span style={{ flex: 1, fontSize: '9px' }}>
                {monster.name}
              </span>
              <span style={{ fontSize: '8px' }}>
                LV{monster.level}
              </span>
            </div>
          );
        })}
      </div>

      {/* Confirm button */}
      <div style={{ padding: '10px' }}>
        <GBButton 
          onClick={() => selected.length === 3 && onConfirm(selected)}
          disabled={selected.length !== 3}
        >
          GO TO BATTLE!
        </GBButton>
      </div>
    </div>
  );
}

// ============================================
// REST SCREEN
// ============================================
function RestScreen({ collection, onRest, onBack }) {
  const injured = collection.filter(m => m.currentHP < m.maxHP);
  const koCount = collection.filter(m => m.currentHP <= 0).length;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px' }}>
        <GBTextBox style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', marginBottom: '8px' }}>REST AREA</div>
          {injured.length === 0 ? (
            <div style={{ fontSize: '9px', color: GB_COLORS.dark }}>
              All monsters are healthy!
            </div>
          ) : (
            <div style={{ fontSize: '9px', color: GB_COLORS.dark }}>
              {koCount > 0 && `${koCount} KO'd · `}
              {injured.length} need healing
            </div>
          )}
        </GBTextBox>

        {/* Injured monsters list */}
        {injured.length > 0 && (
          <GBTextBox style={{ marginBottom: '10px', maxHeight: '150px', overflow: 'auto' }}>
            {injured.map(monster => (
              <div 
                key={monster.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  fontSize: '9px',
                  borderBottom: `1px solid ${GB_COLORS.light}`,
                }}
              >
                <span>{monster.name}</span>
                <span style={{ color: monster.currentHP <= 0 ? GB_COLORS.darkest : GB_COLORS.dark }}>
                  {monster.currentHP}/{monster.maxHP}
                </span>
              </div>
            ))}
          </GBTextBox>
        )}
      </div>

      {/* Heal button */}
      <div style={{ padding: '10px' }}>
        <GBButton 
          onClick={onRest}
          disabled={injured.length === 0}
        >
          HEAL ALL
        </GBButton>
      </div>
    </div>
  );
}

// ============================================
// ITEMS SCREEN
// ============================================
function ItemsScreen({ items, onBack }) {
  // Group items by type
  const itemCounts = items.reduce((acc, item) => {
    acc[item.id] = acc[item.id] || { item, count: 0 };
    acc[item.id].count++;
    return acc;
  }, {});

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
        <div style={{ fontSize: '10px', color: GB_COLORS.darkest }}>
          ITEMS ({items.length})
        </div>
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '5px' }}>
        {items.length === 0 ? (
          <GBTextBox style={{ margin: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px' }}>No items yet!</div>
            <div style={{ fontSize: '8px', marginTop: '8px', color: GB_COLORS.dark }}>
              Scan barcodes to find items!
            </div>
          </GBTextBox>
        ) : (
          Object.values(itemCounts).map(({ item, count }) => (
            <div 
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                marginBottom: '2px',
                backgroundColor: GB_COLORS.lightest,
                border: `2px solid ${GB_COLORS.darkest}`,
              }}
            >
              <div>
                <div style={{ fontSize: '9px', color: GB_COLORS.darkest }}>
                  {item.name} {count > 1 && `×${count}`}
                </div>
                <div style={{ fontSize: '7px', color: GB_COLORS.dark }}>
                  {item.description}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// GUIDE SCREEN - Manual/Tutorial
// ============================================
function GuideScreen({ onBack }) {
  const [page, setPage] = useState(0);
  
  const pages = [
    {
      title: 'SCANNING',
      content: [
        'Scan real barcodes to',
        'discover monsters & items!',
        '',
        '70% chance: ITEM',
        '30% chance: MONSTER',
        '',
        'Each barcode gives a',
        'unique creature or item.',
      ]
    },
    {
      title: 'TYPES',
      content: [
        'Three types exist:',
        '',
        '◆ ARCANE (Magic)',
        '  beats PRIMAL',
        '',
        '▲ PRIMAL (Nature)',
        '  beats DIVINE',
        '',
        '★ DIVINE (Holy)',
        '  beats ARCANE',
      ]
    },
    {
      title: 'BATTLING',
      content: [
        'Pick 3 monsters to',
        'fight wild enemies!',
        '',
        'Type advantage deals',
        'extra damage & accuracy.',
        '',
        'Use items in battle',
        'to heal or boost stats.',
      ]
    },
    {
      title: 'LEVELING',
      content: [
        'Win battles to gain EXP!',
        '',
        'KO enemies = +5 EXP',
        'Win bonus = +2 EXP',
        '',
        'Level up to increase',
        'HP, ATK, DEF, and SPD.',
        '',
        'Max level is 10.',
      ]
    },
    {
      title: 'RARITY',
      content: [
        'Monsters have rarity:',
        '',
        'C  = Common',
        'UC = Uncommon',
        'R  = Rare',
        'E  = Epic',
        'L  = Legendary',
        '',
        'Rarer = stronger stats!',
      ]
    },
  ];
  
  const currentPage = pages[page];
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB_COLORS.lightest,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px',
        borderBottom: `3px solid ${GB_COLORS.darkest}`,
        backgroundColor: GB_COLORS.light,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div 
          onClick={onBack}
          style={{ 
            fontSize: '10px', 
            color: GB_COLORS.darkest,
            cursor: 'pointer',
          }}
        >
          ◀ BACK
        </div>
        <div style={{ fontSize: '10px', color: GB_COLORS.darkest }}>
          GUIDE {page + 1}/{pages.length}
        </div>
      </div>

      {/* Page Title */}
      <div style={{
        padding: '10px',
        borderBottom: `2px solid ${GB_COLORS.dark}`,
        backgroundColor: GB_COLORS.light,
      }}>
        <div style={{ 
          fontSize: '12px', 
          color: GB_COLORS.darkest,
          textAlign: 'center',
        }}>
          {currentPage.title}
        </div>
      </div>

      {/* Page Content */}
      <div style={{ 
        flex: 1, 
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {currentPage.content.map((line, i) => (
          <div 
            key={i} 
            style={{ 
              fontSize: '9px', 
              color: GB_COLORS.darkest,
              lineHeight: 1.6,
              minHeight: '12px',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: `3px solid ${GB_COLORS.darkest}`,
      }}>
        <div
          onClick={() => page > 0 && setPage(page - 1)}
          style={{
            padding: '8px 16px',
            fontSize: '10px',
            color: page > 0 ? GB_COLORS.darkest : GB_COLORS.dark,
            cursor: page > 0 ? 'pointer' : 'not-allowed',
            opacity: page > 0 ? 1 : 0.4,
            border: `2px solid ${GB_COLORS.darkest}`,
            backgroundColor: GB_COLORS.light,
          }}
        >
          ◀ PREV
        </div>
        <div
          onClick={() => page < pages.length - 1 && setPage(page + 1)}
          style={{
            padding: '8px 16px',
            fontSize: '10px',
            color: page < pages.length - 1 ? GB_COLORS.darkest : GB_COLORS.dark,
            cursor: page < pages.length - 1 ? 'pointer' : 'not-allowed',
            opacity: page < pages.length - 1 ? 1 : 0.4,
            border: `2px solid ${GB_COLORS.darkest}`,
            backgroundColor: GB_COLORS.light,
          }}
        >
          NEXT ▶
        </div>
      </div>
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================
function GBButton({ onClick, children, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        backgroundColor: disabled ? GB_COLORS.light : GB_COLORS.dark,
        color: disabled ? GB_COLORS.dark : GB_COLORS.lightest,
        border: `3px solid ${GB_COLORS.darkest}`,
        padding: '10px',
        textAlign: 'center',
        fontSize: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </div>
  );
}

export default App;